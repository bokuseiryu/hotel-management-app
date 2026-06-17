// ==================================================================
// 認証ルート (MongoDB)
// Authentication Routes (MongoDB)
// ==================================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/userModel'); // Userモデルをインポート
require('dotenv').config();

const router = express.Router();

// JWT秘密鍵 - 環境変数から必ず取得する（デフォルト値なし）
if (!process.env.JWT_SECRET) {
    console.error('致命的エラー: JWT_SECRETが設定されていません。');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// ログイン試行回数を制限するレートリミッター
// 15分間に10回まで試行可能
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'ログイン試行回数が上限に達しました。15分後に再試行してください。' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ==================================================================
// POST /api/auth/login - ユーザーログイン
// ==================================================================
router.post('/login', loginLimiter, async (req, res, next) => {
    const { username, password } = req.body;

    // 入力検証
    if (!username || !password) {
        return res.status(400).json({ message: 'ユーザー名とパスワードを入力してください。' });
    }

    try {
        // ユーザーを検索
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'アカウントまたはパスワードが間違っています。' });
        }

        // パスワードの比較
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'アカウントまたはパスワードが間違っています。' });
        }

        // JWTペイロードの作成
        const payload = {
            user: {
                id: user._id, // MongoDBのIDは `_id`
                username: user.username,
                role: user.role
            }
        };

        // JWTの署名
        jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                user: {
                    username: user.username,
                    role: user.role
                }
            });
        });

    } catch (error) {
        next(error); // エラーハンドリングミドルウェアに渡す
    }
});

module.exports = router;
