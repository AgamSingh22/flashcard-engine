import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load secrets
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

print("--- START OF MODELS ---")
for m in genai.list_models():
    print(f"Model: {m.name}")
print("--- END OF MODELS ---")
