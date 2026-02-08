/**
 * シリーズナビゲーションスクリプトをHTMLファイルに自動挿入するツール
 * 
 * 使い方:
 *   node scripts/inject-series-nav.js
 * 
 * 機能:
 *   - articles/*.html の全ファイルをスキャン
 *   - </body> タグの直前にスクリプトタグを挿入
 *   - 既に挿入済みの場合はスキップ
 *   - バックアップを自動作成
 */

const fs = require('fs');
const path = require('path');

// 設定
const ARTICLES_DIR = path.join(__dirname, '..', 'articles');
const SCRIPT_TAG = '  <!-- Series Navigation -->\n  <script src="../js/series-navigation.js"></script>\n';
const BACKUP_SUFFIX = '.backup';

// 挿入済みかチェック
function hasSeriesNavScript(content) {
    return content.includes('series-navigation.js');
}

// スクリプトを挿入
function injectScript(content) {
    // </body> タグを探して、その直前に挿入
    const bodyCloseRegex = /(\s*)<\/body>/i;

    if (!bodyCloseRegex.test(content)) {
        throw new Error('</body> タグが見つかりません');
    }

    return content.replace(bodyCloseRegex, `\n${SCRIPT_TAG}$1</body>`);
}

// ファイルを処理
function processFile(filePath) {
    const fileName = path.basename(filePath);

    console.log(`\n処理中: ${fileName}`);

    try {
        // ファイルを読み込み
        const content = fs.readFileSync(filePath, 'utf8');

        // 既に挿入済みかチェック
        if (hasSeriesNavScript(content)) {
            console.log(`  ⏭️  スキップ: 既にスクリプトが含まれています`);
            return { status: 'skipped', file: fileName };
        }

        // バックアップを作成
        const backupPath = filePath + BACKUP_SUFFIX;
        fs.writeFileSync(backupPath, content, 'utf8');
        console.log(`  💾 バックアップ作成: ${fileName}${BACKUP_SUFFIX}`);

        // スクリプトを挿入
        const newContent = injectScript(content);
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`  ✅ 完了: スクリプトを挿入しました`);

        return { status: 'injected', file: fileName };

    } catch (error) {
        console.log(`  ❌ エラー: ${error.message}`);
        return { status: 'error', file: fileName, error: error.message };
    }
}

// メイン処理
function main() {
    console.log('='.repeat(60));
    console.log('シリーズナビゲーションスクリプト 一括挿入ツール');
    console.log('='.repeat(60));

    // articlesディレクトリの存在確認
    if (!fs.existsSync(ARTICLES_DIR)) {
        console.error(`\n❌ エラー: ${ARTICLES_DIR} が見つかりません`);
        process.exit(1);
    }

    // HTMLファイルを取得
    const files = fs.readdirSync(ARTICLES_DIR)
        .filter(file => file.endsWith('.html') && !file.endsWith(BACKUP_SUFFIX))
        .map(file => path.join(ARTICLES_DIR, file));

    console.log(`\n対象ファイル数: ${files.length}`);

    if (files.length === 0) {
        console.log('\n処理対象のHTMLファイルがありません');
        return;
    }

    // 各ファイルを処理
    const results = files.map(processFile);

    // サマリー表示
    console.log('\n' + '='.repeat(60));
    console.log('処理サマリー');
    console.log('='.repeat(60));

    const injected = results.filter(r => r.status === 'injected');
    const skipped = results.filter(r => r.status === 'skipped');
    const errors = results.filter(r => r.status === 'error');

    console.log(`\n✅ 挿入完了: ${injected.length}件`);
    injected.forEach(r => console.log(`   - ${r.file}`));

    console.log(`\n⏭️  スキップ: ${skipped.length}件`);
    skipped.forEach(r => console.log(`   - ${r.file}`));

    if (errors.length > 0) {
        console.log(`\n❌ エラー: ${errors.length}件`);
        errors.forEach(r => console.log(`   - ${r.file}: ${r.error}`));
    }

    console.log('\n処理が完了しました！');
    console.log('\n💡 ヒント:');
    console.log('   - バックアップファイル (*.backup) は手動で削除してください');
    console.log('   - 問題があれば、バックアップから復元できます');
}

// 実行
if (require.main === module) {
    main();
}

module.exports = { injectScript, hasSeriesNavScript };
