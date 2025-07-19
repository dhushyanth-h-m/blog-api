const express = require('express');
const Blog = require('../models/Blog');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get all blogs
router.get('/', async (req, res) => {
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

// Create Blog 
router.post('/', protect, async (req, res) => {
    try {
        req.body.author = req.user.id;
        const blog = await Blog.create(req.body);

        res.status(201).json({
            success: true,
            data: blog
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;