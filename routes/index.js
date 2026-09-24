const express = require('express');
const router = express.Router();

// Import individual route files
const authRoutes = require('./auth.routes');
const ebookRoutes = require('./ebook.routes');
const readerRoutes = require('./reader.routes');
const commentRoutes = require('./comment.routes')


// Mount sub-routers onto the root router
router.use('/auth', authRoutes);
router.use('/ebooks', ebookRoutes);
router.use('/reader', readerRoutes);
router.use('/comments', commentRoutes)

module.exports = router;
