// ==================================================================
// データベース接続モジュール (シングルトンパターン)
// Database Connection Module (Singleton Pattern)
// ==================================================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

// Renderの永続ディスクパスとローカルパスを定義
const RENDER_DB_PATH = '/var/data/hotel_data.db';
const LOCAL_DB_PATH = path.join(__dirname, '..', '..', '..', 'database', 'hotel_data.db');

// 環境に応じてデータベースパスを決定
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = isProduction ? RENDER_DB_PATH : LOCAL_DB_PATH;

// 本番環境の場合、データベースディレクトリが存在することを確認
if (isProduction) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
}

let instance = null;

class DatabaseConnection extends EventEmitter {
    constructor(isInit = false) {
        super();
        // 初期化スクリプトが実行されるときは、既存のファイルを削除して再作成
        if (isInit && fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('既存のデータベースファイルを削除しました。');
        }

        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('SQLiteデータベースへの接続に失敗しました:', err.message);
                throw err;
            } else {
                if (!isInit) {
                    console.log('SQLiteデータベースに正常に接続しました。');
                }
            }
        });
    }

    // データベースの更新を通知する関数
    notifyUpdate(data) {
        this.emit('update', data);
    }

    get connection() {
        return this.db;
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('データベース接続のクローズに失敗しました。', err.message);
            } else {
                // console.log('データベース接続が正常にクローズされました。');
            }
        });
    }
}

module.exports = {
    getInstance: (isInit = false) => {
        if (isInit) {
            // 初期化の場合は、既存のインスタンスを閉じて新しいインスタンスを作成
            if (instance) {
                instance.close();
                instance = null;
            }
            return new DatabaseConnection(true);
        }

        if (!instance) {
            // シングルトンインスタンスの作成
            instance = new DatabaseConnection();
        }
        return instance;
    }
};
