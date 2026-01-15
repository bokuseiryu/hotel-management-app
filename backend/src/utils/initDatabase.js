// ==================================================================
// データベース初期化スクリプト
// Database Initialization Script
// ==================================================================

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const dbManager = require('./database');

// メインの初期化処理
async function initializeDatabase() {
    console.log('データベース初期化プロセスを開始します...');
    const dbInstance = dbManager.getInstance(true); // isInit = true でインスタンスを取得
    const db = dbInstance.connection;

    try {
        // 1. SQLスクリプトの実行
        const sqlScriptPath = path.join(__dirname, '..', '..', 'sql', 'init.sql');
        const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
        
        await new Promise((resolve, reject) => {
            db.exec(sqlScript, (err) => {
                if (err) {
                    console.error('データベースのスキーマ作成/サンプルデータ挿入に失敗しました:', err.message);
                    return reject(err);
                }
                console.log('データベーススキーマが正常に作成/検証され、サンプルデータが挿入されました。');
                resolve();
            });
        });

        // 2. デフォルトユーザーの作成
        const users = [
            { username: 'admin', password: 'hotel123', role: 'admin' },
            { username: 'staff01', password: 'user123', role: 'member' }
        ];

        const insertUserSql = 'INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)';
        
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                const stmt = db.prepare(insertUserSql);
                users.forEach(user => {
                    const salt = bcrypt.genSaltSync(10);
                    const hashedPassword = bcrypt.hashSync(user.password, salt);
                    stmt.run(user.username, hashedPassword, user.role, function(err) {
                        if (err) {
                            console.error(`ユーザー「${user.username}」の挿入に失敗しました:`, err.message);
                        } else if (this.changes > 0) {
                            console.log(`ユーザー「${user.username}」が作成されました。`);
                        }
                    });
                });
                stmt.finalize(err => {
                    if (err) {
                        console.error('ステートメントのファイナライズに失敗しました。', err);
                        return reject(err);
                    }
                    console.log('ユーザーの挿入処理が完了しました。');
                    resolve();
                });
            });
        });

    } catch (error) {
        console.error('データベース初期化中にエラーが発生しました:', error);
    } finally {
        // 3. データベース接続のクローズ
        dbInstance.close();
        console.log('データベース初期化が完了し、接続がクローズされました。');
    }
}

initializeDatabase();
