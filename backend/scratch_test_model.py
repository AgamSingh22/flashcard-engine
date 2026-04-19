import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load secrets
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

# Try with gemini-2.5-flash
print("Testing gemini-2.5-flash...")
try:
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content("Hello, say '2.5 works'")
    print("Response:", response.text)
except Exception as e:
    print("Failed with gemini-2.5-flash:", e)

# Try with gemini-2.0-flash
print("\nTesting gemini-2.0-flash...")
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content("Hello, say '2.0 works'")
    print("Response:", response.text)
except Exception as e:
    print("Failed with gemini-2.0-flash:", e)
