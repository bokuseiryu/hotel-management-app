// ==================================================================
// 認証ルート (MongoDB)
// Authentication Routes (MongoDB)
// ==================================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Userモデルをインポート
require('dotenv').config();

const router = express.Router();

// JWTの秘密鍵
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-that-is-long-and-secure';

// ==================================================================
// POST /api/auth/login - ユーザーログイン
// ==================================================================
router.post('/login', async (req, res, next) => {
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
