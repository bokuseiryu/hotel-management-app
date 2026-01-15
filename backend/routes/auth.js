// ==================================================================
// 認証ルート
// Authentication Routes
// ==================================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbManager = require('../src/utils/database');
require('dotenv').config();

const router = express.Router();

// JWTの秘密鍵
// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-that-is-long-and-secure';

// ==================================================================
// POST /api/auth/login - ユーザーログイン
// POST /api/auth/login - User Login
// ==================================================================
router.post('/login', (req, res, next) => {
    const { username, password } = req.body;

    // 入力検証
    // Input validation
    if (!username || !password) {
        return res.status(400).json({ message: 'ユーザー名とパスワードを入力してください。' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';

        const db = dbManager.getInstance().connection;
    db.get(sql, [username], async (err, user) => {
        if (err) {
            return next(err); // エラーハンドリングミドルウェアに渡す
        }

        // ユーザーが存在しない場合
        // If user does not exist
        if (!user) {
            return res.status(401).json({ message: 'アカウントまたはパスワードが間違っています。' });
        }

        // パスワードの比較
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'アカウントまたはパスワードが間違っています。' });
        }

        // JWTペイロードの作成
        // Create JWT payload
        const payload = {
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };

        // JWTの署名
        // Sign the JWT
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
    });
});

module.exports = router;
