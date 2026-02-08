---
title: WindowsでQuartz (Obsidianパブリッシュ) がエラーまみれだった話と解決策
date: 2026-01-24
tags: [Quartz, Obsidian, トラブルシューティング, 開発ログ]
description: Windows環境でQuartzをセットアップしようとしたら「npm error」や「PowerShell実行ポリシー」でつまづいた記録と、その回避策（Git Clone法）。
---

# 🛑 npx quartz create が動かない！

「Obsidianのメモをブログにしたい！」と意気込んで **Quartz** の導入を試みたものの、Windows環境 (PowerShell) でドハマりしました。

同じように苦しんでいる人のために、私が直面したエラーと、最終的な **「最強の解決策」** を残しておきます。

---

## 💥 発生したエラーたち

### 1. PowerShellの実行ポリシーエラー
最初に `npx quartz create` を叩いた瞬間、真っ赤な文字が…。

```
CategoryInfo: SecurityError
FullyQualifiedErrorId: UnauthorizedAccess
```

Windowsのセキュリティ機能が、スクリプトの実行をブロックしていました。

**対処法:**
管理者権限でPowerShellを開き、以下を実行。
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. npm error "could not determine executable to run"
気を取り直して再度実行すると、今度は謎のnpmエラー。

```
npm error could not determine executable to run
```

キャッシュをクリア (`npm cache clean --force`) しても直らず…。
どうやら `npx` コマンドとWindowsの相性が悪いパターンがあるようです。

---

## ✅ 解決策：インストーラーを使わない！ (Plan B)

「自動インストーラー (`npx quartz create`) がダメなら、手動で入れればいいじゃない」

ということで、以下の **Git Clone法** を試したら一発で解決しました。

### 手順 1: リポジトリを直接クローン
フォルダを作って、GitHubから直接ソースコードを持ってきます。

```powershell
mkdir quartz-blog
cd quartz-blog
git clone https://github.com/jackyzha0/quartz.git .
```

### 手順 2: 依存関係をインストール
```powershell
npm install
```

これだけ！
あの苦労は何だったのかというくらい、あっさりと環境構築が完了しました。

---

## 🚀 学んだ教訓

1. **Windowsの `npx` はたまに反抗期がある**
   - うまくいかない時は、深追いせずに `git clone` を検討する。
2. **エラーログは裏切らない**
   - 真っ赤な画面にビビらず、一行ずつ読めばヒントがある（今回は `git` でいけることに気づいた）。

無事にブログが開設できたので、これからObsidianでバリバリ記事を書いていきます！

---
*この記事は Obsidian + Quartz で生成されています。*
