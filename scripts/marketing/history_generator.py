import os
import google.generativeai as genai
from datetime import datetime

def generate_history_article(era_name, context_topics, focus_philosophy=True, session_round=None):
    """
    歴史の特定の時代に関する詳細記事（HTML）を生成する。
    session_roundが指定されている場合、「月次セッション」としてのメタデータを付与する。
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return "Error: GOOGLE_API_KEY not set."

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')

    session_text = f"第 {session_round} 回セッション：" if session_round else ""
    
    philosophy_instruction = ""
    if focus_philosophy:
        philosophy_instruction = f"""
        【最重要：哲学特化セッション】
        {session_text}思想家たちの「智の爆発」に焦点を当ててください。
        当時の社会が直面していた矛盾や「問い」に対し、彼らがどのような新しい視座を提供したのか。
        そして、その「問い」が2,500年後の現在、AIを操る私たちにどう響いているのかを深く考察してください。
        """

    prompt = f"""
    あなたはMochisura Labの「歴史探究班・筆頭記録官」です。
    以下の時代・トピックについて、プロフェッショナルかつ叙情的な詳細記事をHTML形式で生成してください。

    【対象時代/トピック】
    {era_name}
    キーワード: {context_topics}

    {philosophy_instruction}

    【出力要件】
    1. デザインは既存の `blog/history/` のスタイルを継承し、没入感のあるダークモード構成にすること。
    2. 構成：
       - <div class="article-header">：壮大なタイトルとサブタイトル
       - <div class="cosmic-content">：本文（Shippori Minchoフォントを使用）
       - <div class="scene-box">：印象的な情景描写
       - <div class="fact-sidebar">：AI調査班による「哲学とテクノロジー」の視点での解説
    3. 記事内には、現在の閲覧者に語りかけるような、AI調査員からの「問い」を1つ配置してください。
    """

    try:
        response = model.generate_content(prompt)
        content = response.text
        
        # HTMLタグの抽出（もしGeminiがmarkdownの```htmlで囲んできた場合）
        if "```html" in content:
            content = content.split("```html")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()

        return content
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    # テスト実行例：枢軸時代の哲学
    # result = generate_history_article("枢軸時代（BC 500前後）", "ソクラテス、プラトン、アリストテレス、孔子、老子、ブッダ、思想の爆発")
    # print(result)
    pass
