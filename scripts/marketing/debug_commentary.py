import os
import sys
import google.generativeai as genai

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def debug_raw_output():
    # Set the key manually for testing
    os.environ["GOOGLE_API_KEY"] = "AIzaSyD865_d5XzvsNotFBFi0K9DpgQAi7FQ7HY"
    
    from news_curator import fetch_and_curate_news
    
    print("Testing Structured Curation (Raw Check)...")
    result = fetch_and_curate_news()
    
    if isinstance(result, dict):
        print("Raw Output from LLM:")
        print(result["raw"])
        print("-" * 20)
        print("Parsed Results:")
        for key in ["analysis", "summary", "source", "commentary"]:
            print(f"[{key.upper()}]: {result[key]}")
    else:
        print("Result is not a dict:")
        print(result)

if __name__ == "__main__":
    debug_raw_output()
