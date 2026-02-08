---
title: Quartz vs GitHub Pages：幽霊Jekyllと権限エラーの戦い
date: 2026-01-24
tags: [Quartz, Obsidian, GitHub, トラブルシューティング]
description: GitHub PagesでQuartzをデプロイしようとしたら「Liquid syntax error」や「Permission denied」が出た話。自動ビルドの罠と回避策。
---

# 👻 Jekyllの亡霊が出た

Windowsでの導入トラブル（前回の記事）を乗り越え、やっとGitHubにプッシュできた！と思ったら、今度はGitHub Pages側で謎のエラーが発生。

Actionsのログを見ると、真っ赤な文字でこう書かれていました。

```
Error: Liquid syntax error (line 256): Variable '{{ ... }}' was not properly terminated
```

### 原因：Jekyllがしゃしゃり出てくる
GitHub Pagesは、デフォルトで「Jekyll」というブログエンジンを使おうとします。
しかしQuartzはJekyllとは別の仕組みです。
JekyllがQuartzのファイル (`quartz.config.ts`) を無理やり読もうとして、「文法がおかしいぞ！」と怒っているわけです。

### ✅ 解決策：`.nojekyll` というお守り
「ここはJekyllの場所じゃない」と伝えるために、`.nojekyll` という名前の空ファイルをリポジトリのルートに置くだけで解決します。

```powershell
New-Item -ItemType File -Name ".nojekyll" -Force
git add .nojekyll
git commit -m "Begone Jekyll"
git push origin v4
```

---

# 🚫 権限がない！ (403 Forbidden)

Jekyllを追い払ったと思ったら、次はこんなエラー。

```
Error: Permission to mochipj2025/blog.site denied to github-actions[bot].
```

GitHub Actions（自動ビルドロボット）が、作ったサイトを公開しようとしたら「書き込み権限がないよ！」と門前払いされたようです。

### ✅ 解決策：Settingsで許可を出す
これはGitHubのセキュリティ設定によるものです。

1. リポジトリの **Settings** > **Actions** > **General** を開く。
2. **Workflow permissions** という項目を探す。
3. **`Read and write permissions`** にチェックを入れる。
4. **Save** を押す。

これでロボットに「書き込んでもいいよ」という許可が出ました。

---

# 🎉 ついに公開

これらの障害を乗り越え、ついに `gh-pages` ブランチが生成されました。
最後に **Settings** > **Pages** で、公開元を `gh-pages` に指定して完了！

エラーログは怖いけど、一つずつ潰していけば必ず動きますね。

---
*このブログ自体が、上記のエラーを乗り越えて表示されています👏*
