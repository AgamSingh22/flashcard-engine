from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pdfplumber
import os
import tempfile
import json
import google.generativeai as genai
from supabase import create_client, Client
from pathlib import Path
from dotenv import load_dotenv
import asyncio
import time

# ==========================================
# 1. INITIALIZATION & CONFIGURATION
# ==========================================

# Robustly load secret keys from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Configure the AI Brain (Gemini)
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("Missing GEMINI_API_KEY. Please check your .env file.")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# Configure the Database (Supabase)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Please check your .env file.")

# Connect to the Database
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize the FastAPI App
app = FastAPI(title="Flashcard Engine API")

# ==========================================
# 2. SECURITY (CORS MIDDLEWARE)
# ==========================================
# Allow the React frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 3. CORE ENGINE FUNCTIONS
# ==========================================

def extract_and_chunk_pdf(file_path: str, chunk_size: int = 2000):
    """Reads PDF cleanly and breaks it into logical text chunks."""
    full_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
    except Exception as e:
        print(f"PDF Extraction Error: {e}")
        return []
    
    if not full_text:
        return []

    # Clean text: remove excessive whitespace
    clean_text = " ".join(full_text.split())
    
    # Break into chunks with 200 char overlap for context
    chunks = []
    step = chunk_size - 200
    for i in range(0, len(clean_text), step):
        chunks.append(clean_text[i:i+chunk_size])
    return chunks

async def generate_flashcards_from_chunk(text_chunk: str, chunk_index: int, total_chunks: int):
    """Passes text to Gemini and forces a perfect JSON array response."""
    system_prompt = """
    You are an elite tutor focused on long-term retention. 
    Transform the study material into high-impact spaced repetition flashcards.
    
    GUIDELINES:
    1. QUALITY: Don't just scrape. Synthesize concepts, relationships, and worked examples.
    2. ATOMICITY: Each card should focus on one specific idea.
    3. TYPES: 
       - CONCEPT: Core definitions or ideas.
       - RELATIONSHIP: How A affects B.
       - APPLICATION: A "worked example" or problem-solving step.
       - EDGE_CASE: Subtle details that often trip students up.
    4. CONCISION: Answers must be clear and readable in 5 seconds.
    """
    
    user_prompt = f"""
    MATERIAL (Chunk {chunk_index + 1} of {total_chunks}):
    ---
    {text_chunk}
    ---
    
    TASK: Generate 3-7 high-quality flashcards.
    OUTPUT: A JSON array of objects. Schema:
    [
      {{
        "card_type": "CONCEPT" | "RELATIONSHIP" | "APPLICATION" | "EDGE_CASE",
        "front": "Clear question or prompt",
        "back": "Concise, accurate answer",
        "tags": ["topic"]
      }}
    ]
    """

    try:
        # Respect Rate Limits: Stagger sequential calls
        if chunk_index > 0:
            await asyncio.sleep(1.5) 

        response = await model.generate_content_async(
            system_prompt + "\n" + user_prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"AI Generation Error (Chunk {chunk_index}): {e}")
        return []


# ==========================================
# 4. API ENDPOINTS
# ==========================================

@app.get("/api/classes")
async def get_classes(user_id: Optional[str] = None):
    """Retrieve all classes for the user."""
    try:
        query = supabase.table("classes").select("*").order("name")
        if user_id:
            query = query.eq("user_id", user_id)
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ClassCreate(BaseModel):
    name: str
    user_id: str

@app.post("/api/classes")
async def create_class(data: ClassCreate):
    """Create a new class/chapter folder."""
    try:
        response = supabase.table("classes").insert({
            "name": data.name,
            "user_id": data.user_id
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/classes/{class_id}")
async def delete_class(class_id: str):
    """Delete a class and all its decks."""
    try:
        # 1. Get all decks in this class
        decks = supabase.table("decks").select("id").eq("class_id", class_id).execute()
        for deck in decks.data:
            await delete_deck(deck['id'])
        
        # 2. Delete the class itself
        supabase.table("classes").delete().eq("id", class_id).execute()
        return {"message": "Class and all contained decks deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-pdf/")
async def upload_pdf(
    file: UploadFile = File(...), 
    class_id: str = Form(None),
    user_id: str = Form(None)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        # If no class_id, ensure a "General" class exists for this user
        if not class_id:
            gen_res = supabase.table("classes").select("id").eq("name", "General").eq("user_id", user_id).execute()
            if not gen_res.data:
                gen_new = supabase.table("classes").insert({
                    "name": "General",
                    "user_id": user_id
                }).execute()
                class_id = gen_new.data[0]['id']
            else:
                class_id = gen_res.data[0]['id']

        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
            
        # 1. Extract and Chunk
        text_chunks = extract_and_chunk_pdf(tmp_path)
        os.remove(tmp_path)
        
        if not text_chunks:
             raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        # 2. Sequential Generation
        all_generated_cards = []
        process_limit = min(len(text_chunks), 15)
        
        print(f"Starting Ingestion for {file.filename}: {len(text_chunks)} chunks found.")
        
        for i in range(process_limit):
            print(f"Processing chunk {i+1}/{process_limit}...")
            chunk_cards = await generate_flashcards_from_chunk(text_chunks[i], i, process_limit)
            if chunk_cards:
                all_generated_cards.extend(chunk_cards)
        
        # 3. Save to Database
        if all_generated_cards:
            deck_response = supabase.table("decks").insert({
                "title": file.filename,
                "class_id": class_id,
                "user_id": user_id
            }).execute()
            new_deck_id = deck_response.data[0]['id']
            
            final_cards = []
            for card in all_generated_cards:
                card['deck_id'] = new_deck_id
                if 'type' in card:
                    card['card_type'] = card.pop('type')
                
                # SR Defaults
                card['repetition'] = 0
                card['interval'] = 0
                card['easiness_factor'] = 2.5
                card['next_review'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                
                final_cards.append(card)
                
            supabase.table("cards").insert(final_cards).execute()
            
            return {
                "message": f"Success! {len(final_cards)} cards generated in {file.filename}.",
                "deck_id": new_deck_id,
                "cards_saved": len(final_cards)
            }
        else:
            raise HTTPException(status_code=500, detail="AI failed to generate flashcards.")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/decks/{deck_id}/stats")
async def get_deck_stats(deck_id: str):
    """Calculate mastery metrics for a deck."""
    try:
        response = supabase.table("cards").select("*").eq("deck_id", deck_id).execute()
        cards = response.data
        
        if not cards:
            return {"total": 0, "mastered": 0, "learning": 0, "new": 0, "progress": 0, "comfort_label": "Unstarted"}
            
        now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        total = len(cards)
        new_cards = len([c for c in cards if c['repetition'] == 0])
        due_cards = len([c for c in cards if c['next_review'] <= now])
        
        # Calculate Average Comfort Label
        efs = [c['easiness_factor'] for c in cards if c['repetition'] > 0]
        avg_ef = sum(efs) / len(efs) if efs else 2.5
        
        comfort_label = "Unstarted"
        if efs:
            if avg_ef >= 2.4: comfort_label = "Expert"
            elif avg_ef >= 2.1: comfort_label = "Solid"
            elif avg_ef >= 1.8: comfort_label = "Average"
            else: comfort_label = "Unsteady"

        stats = {
            "total": total,
            "due": due_cards,
            "mastered": len([c for c in cards if c['interval'] >= 14]),
            "learning": len([c for c in cards if 0 < c['interval'] < 14]),
            "new": new_cards,
            "progress": round(((total - new_cards) / total) * 100) if total > 0 else 0,
            "comfort_label": comfort_label
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/decks/{deck_id}")
async def delete_deck(deck_id: str):
    """Delete a deck and all its cards."""
    try:
        # 1. Delete associated cards first
        supabase.table("cards").delete().eq("deck_id", deck_id).execute()
        # 2. Delete the deck
        supabase.table("decks").delete().eq("id", deck_id).execute()
        return {"message": "Deck and associated cards deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/cards/{card_id}")
async def delete_card(card_id: str):
    """Delete a single card."""
    try:
        supabase.table("cards").delete().eq("id", card_id).execute()
        return {"message": "Card deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def health_check():
    return {"status": "Flashcard Engine 2026 is LIVE."}