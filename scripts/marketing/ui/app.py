import sys
import os
import re
import json

# 親ディレクトリ（scripts/marketing）をパスに追加して utils を読み込めるようにする
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from utils import get_article_data, list_articles
import news_curator

app = Flask(__name__)
CORS(app)
# キャッシュ無効化
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Configuration
BLOG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../blog/articles"))
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

# 使用可能なモデル
MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/articles')
def list_articles_api():
    # utils を使用してタイトル付き、日付順の記事リストを取得
    articles = list_articles(BLOG_DIR)
    return jsonify(articles)

@app.route('/api/generate', methods=['POST'])
def generate():
    """（オプション）手動で再解析を行う"""
    data = request.json
    file_path = data.get('path')
    
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    title, body = get_article_data(file_path)
    
    prompt = f"""
    あなたはMochisura Labの「データ解析官（Data Analyst Slime）」です。
    提供されたブログ記事（タイトル: {title}）から、読者が「結局何ができるようになるのか」というアウトカム（成果）を蒸留し、情報を欲しがらせる（憧れさせる）メッセージを3パターン生成してください。

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
    タイトル: {title}
    解析対象: {body[:1500]}
    """

    last_error = ""
    for model_name in MODELS:
        try:
            print(f"Trying model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            text = response.text
            
            # 抽出ロジック（柔軟に対応）
            patterns = re.split(r'パターン\d[:：]', text)
            patterns = [p.strip() for p in patterns if p.strip()]
            
            if len(patterns) < 3:
                # 抽出に失敗した場合はそのまま返す
                return jsonify({"raw": text, "patterns": [text], "model_used": model_name})
                
            return jsonify({"patterns": patterns[:3], "model_used": model_name})
        except Exception as e:
            last_error = str(e)
            print(f"Error with {model_name}: {last_error}")
            if "429" in last_error:
                continue
            else:
                break
                
    return jsonify({"error": f"全てのモデルで制限に達しました。 (Last Error: {last_error})"}), 500

@app.route('/api/curate-news', methods=['POST'])
def curate_news():
    """最新のAIニュースをキュレートする"""
    data = request.json or {}
    topic = data.get('topic')
    
    # news_curator.py から情報を取得
    result = news_curator.fetch_and_curate_news(custom_topic=topic)
    
    if result:
        # dict形式（成功）の場合、フロントエンドが期待する構造にラップする
        if isinstance(result, dict):
            return jsonify({
                "structured": True,
                "analysis": result.get("analysis", ""),
                "summary": result.get("summary", ""),
                "source": result.get("source", ""),
                "commentary": result.get("commentary", ""),
                "model_used": "gemini-2.5-flash"
            })
        else:
            # 文字列のみが返ってきた場合のフォールバック
            return jsonify({
                "patterns": [result],
                "model_used": "gemini-2.5-flash"
            })
    else:
        return jsonify({"error": "ニュースの取得または解析に失敗しました。"}), 500

@app.route('/api/save-to-archive', methods=['POST'])
def save_to_archive():
    """レポートを明示的にアーカイブに保存する"""
    data = request.json
    # scripts/marketing/news_archive.json
    archive_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "news_archive.json"))
    
    archive = []
    if os.path.exists(archive_path):
        try:
            with open(archive_path, "r", encoding="utf-8") as f:
                archive = json.load(f)
        except Exception as e:
            print(f"Error reading archive: {e}")
            archive = []
    
    # 既存の重複チェック（簡易）
    if not any(item.get("summary", "")[:50] == data.get("summary", "")[:50] for item in archive):
        from datetime import datetime
        new_entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "analysis": data.get("analysis"),
            "summary": data.get("summary"),
            "source": data.get("source"),
            "commentary": data.get("commentary")
        }
        archive.append(new_entry)
        try:
            with open(archive_path, "w", encoding="utf-8") as f:
                json.dump(archive, f, ensure_ascii=False, indent=2)
            print(f"Successfully saved to archive: {data.get('summary', '')[:20]}...")
            return jsonify({"success": True})
        except Exception as e:
            print(f"Failed to write to archive: {e}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    print(f"Archive entry already exists for: {data.get('summary', '')[:20]}...")
    return jsonify({"success": True, "message": "Already exist"})

@app.route('/api/news-archive', methods=['GET'])
def get_news_archive():
    """保存されたニュースアーカイブをすべて取得する"""
    archive_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "news_archive.json")
    if os.path.exists(archive_path):
        try:
            with open(archive_path, "r", encoding="utf-8") as f:
                archive = json.load(f)
            return jsonify({"archive": archive})
        except Exception as e:
            return jsonify({"error": f"Failed to load archive: {e}"}), 500
    return jsonify({"archive": []})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
