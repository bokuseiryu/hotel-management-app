// ==================================================================
// 認証ミドルウェア
// Authentication Middleware
// ==================================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-that-is-long-and-secure';

// ==================================================================
// トークンを検証するミドルウェア
// Middleware to verify token
// ==================================================================
const protect = (req, res, next) => {
    const authHeader = req.header('Authorization');

    // ヘッダーにトークンが存在しない場合
    // Check if no token in header
    if (!authHeader) {
        return res.status(401).json({ message: '認証トークンがありません。アクセスが拒否されました。' });
    }

    // "Bearer "プレフィックスを確認
    // Check for "Bearer " prefix
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7, authHeader.length) : null;
    if (!token) {
        return res.status(401).json({ message: 'トークンの形式が正しくありません。' });
    }

    try {
        // トークンの検証
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'トークンが無効です。' });
    }
};

// ==================================================================
// 管理者権限を検証するミドルウェア
// Middleware to verify admin role
// ==================================================================
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'アクセス権限がありません。管理者権限が必要です。' });
    }
};

module.exports = { protect, isAdmin };
