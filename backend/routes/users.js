// ==================================================================
// ユーザー管理APIルート (admin専用)
// User Management API Routes (Admin only)
// ==================================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const dbManager = require('../src/utils/database');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users - 全ユーザーリストを取得（adminのみ）
router.get('/', protect, isAdmin, (req, res, next) => {
    const db = dbManager.getInstance().connection;
    const sql = 'SELECT id, username, role, created_at FROM users ORDER BY role, username';
    
    db.all(sql, [], (err, rows) => {
        if (err) return next(err);
        res.json(rows);
    });
});

// POST /api/users - 新しいユーザーを作成（adminのみ）
router.post('/', protect, isAdmin, async (req, res, next) => {
    const { username, password, role } = req.body;
    
    if (!username || !password || !role) {
        return res.status(400).json({ message: 'ユーザー名、パスワード、役割を入力してください。' });
    }
    
    const validRoles = ['admin', 'manager', 'member'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: '無効な役割です。admin, manager, member のいずれかを指定してください。' });
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const db = dbManager.getInstance().connection;
        const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        
        db.run(sql, [username, hashedPassword, role], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'このユーザー名は既に使用されています。' });
                }
                return next(err);
            }
            res.status(201).json({ 
                id: this.lastID, 
                username, 
                role,
                message: 'ユーザーが正常に作成されました。' 
            });
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/users/:id - ユーザー情報を更新（adminのみ）
router.put('/:id', protect, isAdmin, async (req, res, next) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    
    if (!username && !password && !role) {
        return res.status(400).json({ message: '更新する情報を入力してください。' });
    }
    
    const db = dbManager.getInstance().connection;
    
    // 現在のユーザー情報を取得
    db.get('SELECT * FROM users WHERE id = ?', [id], async (err, user) => {
        if (err) return next(err);
        if (!user) {
            return res.status(404).json({ message: 'ユーザーが見つかりません。' });
        }
        
        try {
            let updateFields = [];
            let params = [];
            
            if (username && username !== user.username) {
                updateFields.push('username = ?');
                params.push(username);
            }
            
            if (password) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                updateFields.push('password = ?');
                params.push(hashedPassword);
            }
            
            if (role && role !== user.role) {
                const validRoles = ['admin', 'manager', 'member'];
                if (!validRoles.includes(role)) {
                    return res.status(400).json({ message: '無効な役割です。' });
                }
                updateFields.push('role = ?');
                params.push(role);
            }
            
            if (updateFields.length === 0) {
                return res.json({ message: '変更はありません。' });
            }
            
            params.push(id);
            const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
            
            db.run(sql, params, function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ message: 'このユーザー名は既に使用されています。' });
                    }
                    return next(err);
                }
                res.json({ message: 'ユーザー情報が正常に更新されました。' });
            });
        } catch (error) {
            next(error);
        }
    });
});

// DELETE /api/users/:id - ユーザーを削除（adminのみ）
router.delete('/:id', protect, isAdmin, (req, res, next) => {
    const { id } = req.params;
    const db = dbManager.getInstance().connection;
    
    // 自分自身は削除できない
    if (req.user.id === parseInt(id)) {
        return res.status(400).json({ message: '自分自身を削除することはできません。' });
    }
    
    const sql = 'DELETE FROM users WHERE id = ?';
    
    db.run(sql, [id], function(err) {
        if (err) return next(err);
        if (this.changes === 0) {
            return res.status(404).json({ message: 'ユーザーが見つかりません。' });
        }
        res.json({ message: 'ユーザーが正常に削除されました。' });
    });
});

// PUT /api/users/change-password - 自分のパスワードを変更
router.put('/change-password/me', protect, async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: '現在のパスワードと新しいパスワードを入力してください。' });
    }
    
    const db = dbManager.getInstance().connection;
    
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], async (err, user) => {
        if (err) return next(err);
        if (!user) {
            return res.status(404).json({ message: 'ユーザーが見つかりません。' });
        }
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: '現在のパスワードが正しくありません。' });
        }
        
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id], function(err) {
                if (err) return next(err);
                res.json({ message: 'パスワードが正常に変更されました。' });
            });
        } catch (error) {
            next(error);
        }
    });
});

module.exports = router;
