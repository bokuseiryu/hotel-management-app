@echo off
setlocal

REM ==================================================================
REM ホテル運営データ管理システム ワンクリック起動スクリプト (改訂版)
REM Hotel Management System One-Click Start Script (Revised)
REM ==================================================================

REM ステップ 0: 文字コードをUTF-8に設定 (乱码対策)
chcp 65001 > nul

ECHO.
ECHO [STEP 1/6] 既存のサーバープロセスを停止しています...
ECHO [STEP 1/6] Stopping existing server process...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr ":3009"') DO (
    taskkill /F /PID %%P
)
ECHO 既存のプロセスの停止が完了しました。
ECHO.

REM プロセスが完全に終了するのを待つための短い遅延
timeout /t 2 /nobreak > nul

ECHO [STEP 2/6] データベースを初期化しています...
ECHO [STEP 2/6] Initializing the database...
cd backend
npm run init-db
IF %ERRORLEVEL% NEQ 0 (
    ECHO データベースの初期化に失敗しました。スクリプトを終了します。
    ECHO Failed to initialize the database. Aborting.
    goto :eof
)
ECHO データベースの初期化が完了しました。
ECHO.

ECHO [STEP 3/6] バックエンドの依存関係をインストールしています...
ECHO [STEP 3/6] Installing backend dependencies...
npm install
IF %ERRORLEVEL% NEQ 0 ( 
    ECHO バックエンドの依存関係のインストールに失敗しました。
    ECHO Failed to install backend dependencies.
    goto :eof
)
ECHO バックエンドの依存関係のインストールが完了しました。
ECHO.

ECHO [STEP 4/6] フロントエンドの依存関係をインストールしています...
ECHO [STEP 4/6] Installing frontend dependencies...
cd ..\frontend
npm install
IF %ERRORLEVEL% NEQ 0 ( 
    ECHO フロントエンドの依存関係のインストールに失敗しました。
    ECHO Failed to install frontend dependencies.
    goto :eof
)
ECHO フロントエンドの依存関係のインストールが完了しました。
ECHO.

ECHO [STEP 5/6] フロントエンドをビルドしています...
ECHO [STEP 5/6] Building the frontend...
npm run build
IF %ERRORLEVEL% NEQ 0 ( 
    ECHO フロントエンドのビルドに失敗しました。
    ECHO Failed to build the frontend.
    goto :eof
)
ECHO フロントエンドのビルドが完了しました。
ECHO.

ECHO [STEP 6/6] アプリケーションを起動しています...
ECHO [STEP 6/6] Starting the application...
cd ..\backend
ECHO サーバーはポート3009で起動します。ブラウザで http://localhost:3009 を開いてください。
ECHO Server will start on port 3009. Please open http://localhost:3009 in your browser.

REM 新しいウィンドウでサーバーを起動
start "Hotel Management Server" npm start

endlocal
