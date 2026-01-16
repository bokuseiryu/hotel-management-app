// ==================================================================
// ユーザー管理APIルート (MongoDB)
// User Management API Routes (MongoDB)
// ==================================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/users - 全ユーザーリストを取得（adminのみ）
router.get('/', protect, isAdmin, async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password').sort({ role: 1, username: 1 });
        res.json(users);
    } catch (error) {
        next(error);
    }
});

// POST /api/users - 新しいユーザーを作成（adminのみ）
router.post('/', protect, isAdmin, async (req, res, next) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'ユーザー名、パスワード、役割を入力してください。' });
    }

    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(409).json({ message: 'このユーザー名は既に使用されています。' });
        }

        const user = await User.create({
            username,
            password, // パスワードはモデルのpre-saveフックでハッシュ化
            role
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            message: 'ユーザーが正常に作成されました。'
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/users/:id - ユーザー情報を更新（adminのみ）
router.put('/:id', protect, isAdmin, async (req, res, next) => {
    const { id } = req.params;
    const { username, password, role } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'ユーザーが見つかりません。' });
        }

        // adminユーザーの役割とユーザー名は変更不可
        if (user.username === 'admin') {
            if (role && role !== 'admin') {
                return res.status(400).json({ message: 'adminの役割は変更できません。' });
            }
            if (username && username !== 'admin') {
                return res.status(400).json({ message: 'adminのユーザー名は変更できません。' });
            }
        }

        user.username = username || user.username;
        user.role = role || user.role;
        if (password) {
            user.password = password; // pre-saveフックでハッシュ化
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            role: updatedUser.role,
            message: 'ユーザー情報が正常に更新されました。'
        });
    } catch (error) {
        // 重複キーエラーのハンドリング
        if (error.code === 11000) {
            return res.status(409).json({ message: 'このユーザー名は既に使用されています。' });
        }
        next(error);
    }
});

// DELETE /api/users/:id - ユーザーを削除（adminのみ）
router.delete('/:id', protect, isAdmin, async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'ユーザーが見つかりません。' });
        }

        // 自分自身とadminユーザーは削除できない
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: '自分自身を削除することはできません。' });
        }
        if (user.username === 'admin') {
            return res.status(400).json({ message: 'adminユーザーは削除できません。' });
        }

        await user.deleteOne();
        res.json({ message: 'ユーザーが正常に削除されました。' });
    } catch (error) {
        next(error);
    }
});

// PUT /api/users/change-password/me - 自分のパスワードを変更 (この機能はusers.jsから削除し、個別のプロフィール管理ルートに移行するのが望ましいが、今回はここに残す)
// This function is better suited for a separate profile management route, but will be kept here for now.
router.put('/change-password/me', protect, async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: '現在のパスワードと新しいパスワードを入力してください。' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'ユーザーが見つかりません。' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: '現在のパスワードが正しくありません。' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'パスワードが正常に変更されました。' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
