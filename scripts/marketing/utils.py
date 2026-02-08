import os
import re
import glob
from bs4 import BeautifulSoup

def get_article_data(file_path):
    """
    HTMLファイルからタイトルと本文を取得する
    """
    if not os.path.exists(file_path):
        return None, None

    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # 記事タイトルの取得
    title = soup.find('h1', class_='article-title')
    title_text = title.get_text().strip() if title else os.path.basename(file_path)
    
    # 本文テキストの抽出 (不要なタグを除去)
    content_div = soup.find('div', class_='content')
    body_text = ""
    if content_div:
        # 非表示要素やスクリプトを削除
        for s in content_div(["script", "style", "nav", "footer"]):
            s.decompose()
        body_text = content_div.get_text(separator='\n')
        # 余分な改行を整理
        body_text = re.sub(r'\n+', '\n', body_text).strip()
    
    return title_text, body_text

import json

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
ANALYSIS_FILE = os.path.join(DATA_DIR, 'analysis_data.json')

def load_analysis_data():
    """保存された解析結果を読み込む"""
    if os.path.exists(ANALYSIS_FILE):
        try:
            with open(ANALYSIS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_analysis_data(data):
    """解析結果を保存する"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    
    current_data = load_analysis_data()
    current_data.update(data)
    
    with open(ANALYSIS_FILE, 'w', encoding='utf-8') as f:
        json.dump(current_data, f, ensure_ascii=False, indent=2)

def list_articles(articles_dir):
    """ディレクトリ内のHTML記事を一覧取得する（解析済みデータも付与）"""
    html_files = glob.glob(os.path.join(articles_dir, "*.html"))
    articles = []
    
    analysis_data = load_analysis_data()
    
    for file_path in html_files:
        title, _ = get_article_data(file_path)
        mtime = os.path.getmtime(file_path)
        
        # 相対パスをキーにする
        rel_path = os.path.basename(file_path)
        
        articles.append({
            "title": title or os.path.basename(file_path),
            "path": os.path.abspath(file_path),
            "mtime": mtime,
            "is_analyzed": rel_path in analysis_data,
            "patterns": analysis_data.get(rel_path, [])
        })
    
    # 更新日時順（降順）
    articles.sort(key=lambda x: x['mtime'], reverse=True)
    return articles
