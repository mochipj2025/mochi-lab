import os
import sys
import google.generativeai as genai

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def fetch_and_curate_news(custom_topic=None):
    """
    最新のAIニュースを取得し、調査班のペルソナで要約・発信文を作成する
    """
    # --- 履歴・アーカイブ管理 ---
    import json
    from datetime import datetime
    archive_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "news_archive.json")
    archive = []
    if os.path.exists(archive_path):
        try:
            with open(archive_path, "r", encoding="utf-8") as f:
                archive = json.load(f)
        except:
            archive = []
    
    # 最近のタイトルを重複回避用に抽出
    history_titles = [item.get("summary", "")[:50] for item in archive[-20:]]
    history_context = "\n".join([f"- {t}" for t in history_titles])
    history_instruction = f"\n【重要: 回避すべき既知のトピック】\n以下のトピックは既に調査済みです。これらとは異なる、新しい「事件（ネタ）」を独自に選定してください：\n{history_context}" if history_titles else ""

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable is not set.")
        return None

    genai.configure(api_key=api_key)
    # Gemini 2.5 Flash を使用
    model = genai.GenerativeModel('gemini-2.5-flash')

    # 1. ニュースの検索とキュレーション
    # 検索範囲を「身体操作・セラピスト」に限定せず、AIの包括的なトレンド・経済・技術革新に広げる
    base_query = """
    (bleeding edge AI AND technology trends February 2026) 
    OR (latest LLM research AND robotics AND sensors AND future of work)
    OR (human performance enhancement AND AI AND bio-tech)
    OR (digital transformation AND individual productivity AND AI business)
    """
    
    if custom_topic:
        search_query = f"({custom_topic}) AND ({base_query})"
        topic_instruction = f"\n【最優先調査事項】\n特に以下のトピックに注目して調査してください：『{custom_topic}』"
    else:
        search_query = base_query
        topic_instruction = ""
    
    prompt = f"""
    あなたはMochisura Labの「調査班 (Mochisura Intelligence Division)」、あるいは「筆頭解析官」です。
    
    【ミッション】
    最新のAIニュースから、私たちの「仕事」や「生き方」、あるいは「人間の可能性」を拡張するような特異点を1つ抽出し、精密なプロファイリングを行ってください。
    {topic_instruction}

    これらを「個人のプロフェッショナルが、AI共生時代の荒波をどう戦略的に生き抜くか」という包括的な視点で読み解きます。
    {history_instruction}

    【出力要件】
    必ず以下の4つのタグをすべて使用し、その中に内容を記述してください。

    <Analysis>
    技術的・論理的な分析。個別のニュースであればその独自性を、包括的なトレンドであればその「構造的変化」を記述してください。
    </Analysis>
    
    <Summary>
    多忙な読者が30秒で「今何が起きているのか」を理解できる包括的な要約を記述してください。
    </Summary>
    
    <Source>
    具体的な情報元（メディア、論文、企業発表など）を記述してください。
    </Source>
    
    <Commentary>
    最も重要なセクションです。鋭い洞察力で、このトレンドが私たちの「専門性」や「個人の在り方」をどう変えるかを150文字以上で詳細に解説してください。
    </Commentary>

    【NG事項】
    - 「AIは便利だ」などの平凡な提案。
    - 既に知れ渡った古いニュース。
    - 上記の【既知のトピック】の再利用。

    最後に必ず「観測完了。未来は、あなたの手のひらの中に。 もちスララボ｜調査班」を添えてください。
    """

    try:
        response = model.generate_content([prompt, f"今日の最新ニュースを検索して: {search_query}"])
        text = response.text
        
        # タグによる解析（大文字小文字を区別しない）
        import re
        def extract(tag, text):
            match = re.search(f'<{tag}>(.*?)</{tag}>', text, re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(1).strip()
            # 簡易フォールバック
            match = re.search(f'{tag}[:：](.*?)(?=\\n[A-Z]|\\n<|$)', text, re.DOTALL | re.IGNORECASE)
            return match.group(1).strip() if match else ""

        results = {
            "analysis": extract("Analysis", text),
            "summary": extract("Summary", text),
            "source": extract("Source", text),
            "commentary": extract("Commentary", text),
            "raw": text
        }
        
        # アーカイブの保存 (詳細データをすべて保持)
        if results["summary"]:
            try:
                new_entry = {
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "analysis": results["analysis"],
                    "summary": results["summary"],
                    "source": results["source"],
                    "commentary": results["commentary"]
                }
                # タイトル的な部分で重複チェック
                if not any(item.get("summary", "")[:50] == results["summary"][:50] for item in archive):
                    archive.append(new_entry)
                    with open(archive_path, "w", encoding="utf-8") as f:
                        json.dump(archive, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Failed to save archive: {e}")

        # 必須項目が欠けている場合のチェック
        if not results["analysis"] and not results["summary"]:
            return text
        
        return results
    except Exception as e:
        print(f"Error during news curation: {e}")
        return None

if __name__ == "__main__":
    result = fetch_and_curate_news()
    if result:
        print(result)
