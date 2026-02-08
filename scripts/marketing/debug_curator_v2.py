import os
import sys
import google.generativeai as genai

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_curation():
    # Set the key manually for testing
    os.environ["GOOGLE_API_KEY"] = "AIzaSyD865_d5XzvsNotFBFi0K9DpgQAi7FQ7HY"
    
    from news_curator import fetch_and_curate_news
    
    print("Testing Refined Curation...")
    result = fetch_and_curate_news()
    
    if result:
        print("Success!")
        print("-" * 20)
        print(result)
        print("-" * 20)
    else:
        print("Failed to curate news.")

if __name__ == "__main__":
    test_curation()
