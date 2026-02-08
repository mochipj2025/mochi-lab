import os
import sys

# 自身のディレクトリをパスに追加して utils を読み込めるようにする
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import google.generativeai as genai
from utils import get_article_data

def generate_tweets(html_path):
    # APIキーの取得（環境変数から）
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable is not set.")
        return

    genai.configure(api_key=api_key)
    # Gemini 2.5 Flash を使用
    model = genai.GenerativeModel('gemini-2.5-flash')

    # HTMLの共通解析
    title_text, body_text = get_article_data(html_path)
    if not body_text:
        print("Error: 記事の本文が見つかりませんでした。")
        return

    # AIへの指示（スキル定義に基づくプロンプト）
    prompt = f"""
    あなたはMochisura Labの「データ解析官（Data Analyst Slime）」です。
    提供されたブログ記事（タイトル: {title_text}）から、読者が「結局何ができるようになるのか」というアウトカム（成果）を蒸留し、情報を欲しがらせる（憧れさせる）メッセージを3パターン生成してください。

    【キャラクター・ミッション】
    - 専門的な「ラボの研究データ」を、一般ユーザー向けの「憧れの未来」へ論理的に翻訳する。
    - 煽りや商材言葉は一切使わず、知的で洗練された「凄み」を感じさせること。
    - 読者が「自分もそうなりたい（勉強したい）」と思う、具体的で達成可能な成果を提示すること。

    【出力パターンの構成】
    1. 【成果の提示】読者が手に入れる「能力」や「自由」を一言で明示。なぜそれが可能か（ラボのエビデンス）を添える。
    2. 【期待される未来】その技術を得た後の「サロンの日常」を情景描写。
    3. 【知的な動機付け】マニアックな知見のどの部分が「安心の根拠」なのかを論理的に解説。

    【重要事項】
    - 商材屋（「稼げる」「秒で」等）との差別化を徹底。
    - パターンごとに見出しをつけ、各パターンの末尾に必ず以下を添えること：
      解析完了。 もちスララボ｜近日公開予定

    【データ元：ラボの研究記事】
    タイトル: {title_text}
    解析対象: {body_text[:1500]}
    """

    response = model.generate_content(prompt)
    text = response.text
    print(text)

    # 抽出ロジック（簡易版）
    import re
    from utils import save_analysis_data
    
    patterns = re.split(r'パターン\d[:：]', text)
    patterns = [p.strip() for p in patterns if p.strip()]
    
    if len(patterns) >= 3:
        rel_path = os.path.basename(html_path)
        save_analysis_data({rel_path: patterns[:3]})
        print(f"\n[解析成功] 結果を保存しました: {rel_path}")
    else:
        print("\n[解析エラー] 出力形式が正規表現にマッチしませんでした。")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使い方: python scripts/marketing/bot_gen.py <記事のHTMLパス>")
    else:
        generate_tweets(sys.argv[1])
