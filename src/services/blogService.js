const Blog = require('../models/Blog');
const AppError = require('../utils/AppError');

class BlogService {
    /**
     * Create a new blog post
     * @param {Object} blogData - Blog post data
     * @param {string} blogData.authorId - Author's user ID
     * @param {string} blogData.title - Blog post title
     * @param {string} blogData.content - Blog post content
     * @param {Array} blogData.tags - Blog post tags (optional)
     * @param {string} blogData.status - Blog post status ('draft' or 'published')
     * @returns {Object} Created blog object
     */
    static async create(blogData) {
        const { authorId, title, content, tags, status = 'published' } = blogData;
        
        // Validate required fields
        if (!authorId || !title || !content) {
            throw new AppError('Author ID, title, and content are required', 400);
        }
        
        // Create new blog post
        // Note: The model expects 'author' field, but test passes 'authorId'
        const blog = await Blog.create({
            author: authorId,  // Map authorId to author field
            title,
            content,
            tags,
            status
        });
        
        return blog;
    }
    
    /**
     * Get paginated list of blog posts
     * @param {Object} options - Pagination options
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.limit - Number of items per page (default: 10)
     * @param {string} options.status - Filter by status (optional)
     * @returns {Object} Paginated blog posts with pagination metadata
     */
    static async list(options = {}) {
        const { page = 1, limit = 10, status } = options;
        
        // Build query filter
        const filter = {};
        if (status) {
            filter.status = status;
        }
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get total count for pagination
        const total = await Blog.countDocuments(filter);
        
        // Get paginated results
        const data = await Blog.find(filter)
            .populate('author', 'name email')  // Include author info
            .sort({ createdAt: -1 })  // Newest first
            .skip(skip)
            .limit(limit);
        
        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        };
    }
}

module.exports = BlogService;
