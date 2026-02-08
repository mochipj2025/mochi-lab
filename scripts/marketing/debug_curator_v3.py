import os
import sys
import google.generativeai as genai

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_structured_curation():
    # Set the key manually for testing
    os.environ["GOOGLE_API_KEY"] = "AIzaSyD865_d5XzvsNotFBFi0K9DpgQAi7FQ7HY"
    
    from news_curator import fetch_and_curate_news
    
    print("Testing Structured Curation...")
    result = fetch_and_curate_news()
    
    if isinstance(result, dict):
        print("Success! Structured data received.")
        for key, value in result.items():
            if key != "raw":
                print(f"[{key.upper()}]:")
                print(value)
                print("-" * 10)
    else:
        print("Received raw string or failed.")
        print(result)

if __name__ == "__main__":
    test_structured_curation()
