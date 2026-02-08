import os
import sys
import glob
from bot_gen import generate_tweets

def batch_analyze():
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable is not set.")
        print("Please set it before running: set GOOGLE_API_KEY=your_key_here")
        return

    articles_dir = os.path.join(os.path.dirname(__file__), '../../blog/articles')
    html_files = glob.glob(os.path.join(articles_dir, "*.html"))
    
    print(f"解析対象の記事を {len(html_files)} 件検出しました。")
    
    for f in html_files:
        print(f"\n--- 解析開始: {os.path.basename(f)} ---")
        try:
            generate_tweets(f)
            print(f"成功: {os.path.basename(f)}")
        except Exception as e:
            print(f"失敗 ({os.path.basename(f)}): {e}")

if __name__ == "__main__":
    batch_analyze()
