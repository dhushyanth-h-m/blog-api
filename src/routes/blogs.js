const express = require('express');
const Blog = require('../models/Blog');
const { protect } = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');
const { clearAllBlogsCache, clearSingleBlogCache } = require('../utils/cacheInvalidator');
const router = express.Router();

// Get all blogs - Cache for 5 minutes
router.get('/', cacheMiddleware(300), async (req, res) => {
    try {
        const blogs = await Blog.find({status: 'published'}).populate('author', 'name');
        res.json({
            success: true,
            data: blogs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get single blog - Cache for 10 minutes
router.get('/:id', cacheMiddleware(600), async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'name');
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        res.json({ success: true, data: blog });
    } catch (error) {
        next(error);
    }
});

// Create Blog 
router.post('/', protect, async (req, res, next) => {
    try {
        req.body.author = req.user.id;
        const blog = await Blog.create(req.body);

        // Invalidate the cache for the list of all blogs
        await clearAllBlogsCache();

        res.status(201).json({
            success: true,
            data: blog
        });
    } catch (error) {
        next(error);
    }
});

// Update blog
router.put('/:id', protect, async (req, res, next) => {
    try {
        const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        // Invalidate cache for this specific blog AND the list of all blogs
        await clearSingleBlogCache(req.params.id);
        await clearAllBlogsCache();
        
        res.json({ success: true, data: blog });
    } catch (error) {
        next(error);
    }
});

// Delete blog
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        // Invalidate cache for the deleted blog AND the list of all blogs
        await clearSingleBlogCache(req.params.id);
        await clearAllBlogsCache();

        res.json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
});

module.exports = router;