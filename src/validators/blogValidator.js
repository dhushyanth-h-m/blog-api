const Joi = require('joi');
const { BLOG_STATUS } = require('../utils/constants');
const Blog = require('../models/Blog');

const createBlogSchema = Joi.object({
    title: Joi.string().min(5).max(200).required(),
    content: Joi.string().min(50).max(10000).required(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    status: Joi.string().valid(BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED).default(BLOG_STATUS.DRAFT)
});

const updateBlogSchema = Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    content: Joi.string().min(50).max(10000).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    status: Joi.string().valid(BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED, BLOG_STATUS.ARCHIVED).optional()
});

module.exports = { createBlogSchema, updateBlogSchema };