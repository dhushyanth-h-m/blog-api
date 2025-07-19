const BlogService = require('../../src/services/blogService');
const Blog = require('../../src/models/Blog');
const User = require('../../src/models/User');

describe('BlogService', () => {
    let author;
    beforeAll(async () => {
        await User.deleteMany({});
        author = await User.create({ name: 'Author', email: 'auth@x.com', password: 'Pass123!', role: 'user'});
    });

    afterEach(async () => {
        await Blog.deleteMany({});
    });

    it('create() should save and return a blog', async () => {
        const blog = await BlogService.create({
            authorId: author.id,
            title: 'Test title',
            content: 'Test Content',
            tags: ['test'],
            status: 'published'
        });
        
        expect(blog).toHaveProperty('_id');
        expect(blog.title).toBe('Test title');
        expect(blog.content).toBe('Test Content');
        expect(blog.author.toString()).toBe(author.id);
        expect(blog.status).toBe('published');
        expect(blog).toHaveProperty('createdAt');
    });

    it('list() should return paginated blogs', async () => {
        for (let i = 0; i < 12; i++) {
            await Blog.create({
                author: author.id,
                title: `Title${i}`,
                content: 'C',
                tags: ['t'],
                status: 'published'
            });
        }
        const { data, pagination } = await BlogService.list({ page: 2, limit: 5 });
        expect(data.length).toBe(5);
        expect(pagination.total).toBe(12);
        expect(pagination.totalPages).toBe(3);
        expect(pagination.page).toBe(2);
        expect(pagination.limit).toBe(5);
        expect(pagination.hasNextPage).toBe(true);
        expect(pagination.hasPrevPage).toBe(true);
    });

    it('create() should throw error for missing required fields', async () => {
        await expect(
            BlogService.create({
                title: 'Test title'
                // Missing authorId and content
            })
        ).rejects.toThrow('Author ID, title, and content are required');
    });
});