import os

ARTICLES_DIR = r'd:\00000\mochisura-lab\blog\articles'
SEARCH_SCRIPT_TAG = '  <!-- Search Capability -->\n  <script src="../js/search.js"></script>\n'

def inject_search():
    for filename in os.listdir(ARTICLES_DIR):
        if filename.endswith('.html') and not filename.endswith('.backup'):
            filepath = os.path.join(ARTICLES_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Skip if already injected
            if 'js/search.js' in content:
                print(f"Skipping {filename} (already injected)")
                continue
            
            # Inject before </body>
            if '</body>' in content:
                new_content = content.replace('</body>', f'{SEARCH_SCRIPT_TAG}</body>')
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Injected search into {filename}")
            else:
                print(f"Warning: No </body> found in {filename}")

if __name__ == '__main__':
    inject_search()
