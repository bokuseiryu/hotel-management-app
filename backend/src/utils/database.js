// ==================================================================
// データベース管理 (MongoDB)
// Database Management (MongoDB)
// ==================================================================

const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/db.config');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
