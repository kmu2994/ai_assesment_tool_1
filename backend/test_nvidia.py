from openai import OpenAI
import os
from dotenv import load_dotenv

# Path to .env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

api_key = os.getenv("NVIDIA_API_KEY")

if not api_key or api_key == "your_nvidia_api_key_here":
    print("ERROR: NVIDIA_API_KEY is not set or is still the placeholder in .env")
else:
    print(f"DEBUG: Found API Key (starts with): {api_key[:10]}...")
    
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )

    try:
        print("Testing connection to NVIDIA NIM...")
        completion = client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=[{"role":"user","content":"Hello, are you working?"}],
            temperature=0.2,
            top_p=0.7,
            max_tokens=10
        )
        print("SUCCESS: NVIDIA NIM responds successfully!")
        print(f"Response: {completion.choices[0].message.content}")
    except Exception as e:
        print(f"FAILED: NVIDIA NIM Error: {e}")
