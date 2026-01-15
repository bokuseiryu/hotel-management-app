# ホテル運営データ管理システム | Hotel Operation Data Management System

これは、ホテル運営の主要な業績指標（KPI）を追跡、管理、視覚化するために設計されたフルスタックのWebアプリケーションです。

This is a full-stack web application designed to track, manage, and visualize key performance indicators (KPIs) for hotel operations.

---

## 技術スタック (Tech Stack)

- **バックエンド (Backend):** Node.js, Express, SQLite, Socket.IO
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

### 3. データベースの初期化 (Database Initialization)

バックエンドディレクトリで、データベースを初期化するスクリプトを実行します。これにより、`database/hotel_data.db`ファイルが作成され、テーブルスキーマと初期データが設定されます。

In the `backend` directory, run the script to initialize the database. This will create the `database/hotel_data.db` file and set up the table schema and initial data.

```bash
cd ../backend
npm run init-db
```

**注意:** このコマンドは一度だけ実行してください。データベースが既に存在する場合、スクリプトは自動的に停止します。

### 4. フロントエンドのビルド (Build the Frontend)

本番環境用にフロントエンドアプリケーションをビルドします。ビルドされた静的ファイルは `frontend/build` ディレクトリに生成されます。

Build the frontend application for production. The built static files will be generated in the `frontend/build` directory.

```bash
cd ../frontend
npm run build
```

### 5. アプリケーションの起動 (Start the Application)

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

- **メンバー (Member):**
  - **アカウント (Username):** `staff01`
  - **パスワード (Password):** `user123`
