# ホテル運営データ管理システム | Hotel Operation Data Management System

これは、ホテル運営の主要な業績指標（KPI）を追跡、管理、視覚化するために設計されたフルスタックのWebアプリケーションです。

This is a full-stack web application designed to track, manage, and visualize key performance indicators (KPIs) for hotel operations.

---

## 技術スタック (Tech Stack)

- **バックエンド (Backend):** Node.js, Express, MongoDB (Mongoose), Socket.IO
- **フロントエンド (Frontend):** React, Ant Design, ECharts for React, Axios
- **認証 (Authentication):** JWT (JSON Web Tokens) with role-based access control

## 主な機能 (Key Features)

- **役割ベースのアクセス制御:** 管理者とメンバーで異なる権限。
- **リアルタイムデータ同期:** 管理者によるデータ更新が、すべてのクライアントに即時反映。
- **データ可視化:** EChartsを使用したインタラクティブなトレンドグラフ。
- **データ管理:** 管理者向けのデータ入力、編集機能。
- **Excelエクスポート:** 月次レポートを`.xlsx`形式でエクスポート。
- **レスポンシブデザイン:** PCとモバイルデバイスの両方で快適に利用可能。

---

## 起動手順 (Getting Started)

### 1. 前提条件 (Prerequisites)

- Node.js (v16以上を推奨)
- npm

### 2. インストール (Installation)

プロジェクトのルートディレクトリで、まずバックエンドとフロントエンドの依存関係をインストールします。

In the project root directory, first install the backend and frontend dependencies.

```bash
# バックエンドの依存関係をインストール (Install backend dependencies)
cd backend
npm install

# フロントエンドの依存関係をインストール (Install frontend dependencies)
cd ../frontend
npm install
```

### 3. 環境変数の設定 (Environment Variables)

`backend` ディレクトリに `.env` ファイルを作成し、MongoDB Atlas の接続文字列を設定します。

Create a `.env` file in the `backend` directory and set your MongoDB Atlas connection string.

```bash
# backend/.env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hotel-data?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
PORT=3009
```

### 4. データの移行 (Data Migration)

初回セットアップ時、またはデータベースを初期化したい場合は、移行スクリプトを実行します。

For initial setup or to reset the database, run the migration script.

```bash
cd backend
npm run migrate
```

これにより、デフォルトユーザーとサンプルデータがMongoDBに作成されます。

### 5. フロントエンドのビルド (Build the Frontend)

本番環境用にフロントエンドアプリケーションをビルドします。ビルドされた静的ファイルは `frontend/build` ディレクトリに生成されます。

Build the frontend application for production. The built static files will be generated in the `frontend/build` directory.

```bash
cd ../frontend
npm run build
```

### 6. アプリケーションの起動 (Start the Application)

バックエンドサーバーを起動します。これにより、APIサーバーが起動し、ビルドされたフロントエンドファイルが提供されます。

Start the backend server. This will launch the API server and serve the built frontend files.

```bash
cd ../backend
npm start
```

サーバーはデフォルトでポート `3009` で起動します。ブラウザで `http://localhost:3009` またはサーバーのIPアドレスにアクセスしてください。

The server will start on port `3009` by default. Open your browser and navigate to `http://localhost:3009` or the server's IP address.

---

## 初期ログインアカウント (Initial Login Accounts)

- **管理者 (Admin):**
  - **アカウント (Username):** `admin`
  - **パスワード (Password):** `hotel123`

- **マネージャー (Manager):**
  - **アカウント (Username):** `manager01`
  - **パスワード (Password):** `user123`

- **メンバー (Member):**
  - **アカウント (Username):** `staff01`
  - **パスワード (Password):** `user123`

---

## Render へのデプロイ (Deployment to Render)

### 環境変数 (Environment Variables)

Render のダッシュボードで以下の環境変数を設定してください:

| 変数名 | 値 |
|--------|----|
| `MONGO_URI` | MongoDB Atlas の接続文字列 |
| `JWT_SECRET` | JWT 署名用の秘密鍵 |
| `NODE_ENV` | `production` |

### ビルドコマンド (Build Command)

```bash
npm install && npm run build
```

### 開始コマンド (Start Command)

```bash
npm start
```
