# さくらレンタルサーバーへのアップロード手順

## 📦 アップロードファイル

**ファイル名**: `dailyreport-upload.zip`  
**場所**: `frontend/dailyreport-upload.zip`

---

## 📋 アップロード手順

### ステップ1: さくらサーバーにログイン

1. さくらレンタルサーバーのコントロールパネルにログイン
   - URL: https://secure.sakura.ad.jp/rscontrol/
   - または、ファイルマネージャーを使用

2. **ファイルマネージャー**を開く

---

### ステップ2: dailyreportフォルダを作成

1. ドキュメントルート（通常は `www` または `public_html`）に移動
2. 新しいフォルダを作成: **`dailyreport`**

```
www/
├── index.html          （既存のiestate.co.jpサイト）
├── 他のファイル...
└── dailyreport/        ← ここに新規作成
```

---

### ステップ3: ファイルをアップロード

**方法A: ファイルマネージャーを使用**

1. `dailyreport` フォルダに入る
2. `dailyreport-upload.zip` をアップロード
3. ZIPファイルを解凍（展開）
4. 解凍後、以下のファイル構造になっていることを確認:

```
dailyreport/
├── index.html
├── manifest.json
├── icon.svg
├── logo192.png
├── logo512.png
├── sw.js
├── _headers
└── static/
    ├── css/
    │   └── main.xxxxx.css
    └── js/
        └── main.xxxxx.js
```

**方法B: FTPクライアントを使用**

1. FileZillaなどのFTPクライアントを使用
2. FTP接続情報:
   - ホスト: ftp.iestate.co.jp（または指定のFTPサーバー）
   - ユーザー名: さくらのアカウント名
   - パスワード: さくらのパスワード
3. `www/dailyreport/` に `build` フォルダの中身をすべてアップロード

---

### ステップ4: .htaccessファイルを作成（重要！）

`dailyreport` フォルダ内に `.htaccess` ファイルを作成し、以下の内容を記述:

```apache
# React SPA用のリダイレクト設定
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /dailyreport/
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /dailyreport/index.html [L]
</IfModule>

# CORS設定（APIへのアクセス許可）
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# キャッシュ設定
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

---

### ステップ5: 動作確認

1. ブラウザで以下のURLにアクセス:
   ```
   https://iestate.co.jp/dailyreport
   ```

2. ログイン画面が表示されることを確認

3. 既存のアカウントでログイン:
   - ユーザー名とパスワードを入力
   - ダッシュボードが表示されることを確認

---

## ⚠️ トラブルシューティング

### 問題1: 404エラーが表示される

**原因**: .htaccessが正しく設定されていない

**解決策**:
1. `.htaccess` ファイルが `dailyreport` フォルダ内にあることを確認
2. ファイルの内容が正しいことを確認
3. さくらサーバーで `mod_rewrite` が有効になっていることを確認

---

### 問題2: APIエラー（データが取得できない）

**原因**: CORS設定の問題

**解決策**:
1. ブラウザの開発者ツール（F12）でコンソールを確認
2. CORSエラーが表示されている場合、Render側の設定を確認

---

### 問題3: ログインできない

**原因**: APIサーバーへの接続問題

**解決策**:
1. Renderのサービスが稼働していることを確認
   - https://hotel-management-app-1-xh3z.onrender.com/api/health
2. 15分以上アクセスがないとRenderは休眠するため、初回アクセス時は30秒ほど待つ

---

## 📊 構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    ユーザーのブラウザ                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         https://iestate.co.jp/dailyreport                   │
│              さくらレンタルサーバー（日本）                    │
│                   [フロントエンド]                           │
│              HTML / CSS / JavaScript                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ API リクエスト
┌─────────────────────────────────────────────────────────────┐
│   https://hotel-management-app-1-xh3z.onrender.com/api      │
│                    Render（アメリカ）                        │
│                     [バックエンド]                           │
│                Node.js / Express.js                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas                            │
│                    [データベース]                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ 完了チェックリスト

- [ ] `dailyreport` フォルダを作成した
- [ ] すべてのファイルをアップロードした
- [ ] `.htaccess` ファイルを作成した
- [ ] https://iestate.co.jp/dailyreport にアクセスできる
- [ ] ログイン画面が表示される
- [ ] ログインしてダッシュボードが表示される
- [ ] データが正しく表示される

---

## 📞 サポート

問題が発生した場合は、以下の情報を確認してください:

1. ブラウザの開発者ツール（F12）→ コンソールタブ
2. ネットワークタブでAPIリクエストの状態
3. さくらサーバーのエラーログ

