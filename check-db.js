const mongoose = require('mongoose');

// Use the value from .env.local usually, but here checking default local
const uri = 'mongodb://127.0.0.1:27017/test';

console.log('Attempting to connect to MongoDB at ' + uri);
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log('✅ Connected to MongoDB successfully!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });
