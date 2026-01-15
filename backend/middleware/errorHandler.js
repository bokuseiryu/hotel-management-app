// ==================================================================
// グローバルエラーハンドリングミドルウェア
// Global Error Handling Middleware
// ==================================================================

const errorHandler = (err, req, res, next) => {
    console.error('エラーが発生しました:', err.stack);

    // エラーの種類に応じて適切なステータスコードとメッセージを設定
    // Set appropriate status code and message based on the error type
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        message: err.message || 'サーバー内部でエラーが発生しました。',
        // 本番環境ではスタックトレースを返さない
        // Do not return stack trace in production environment
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
};

module.exports = { errorHandler };
