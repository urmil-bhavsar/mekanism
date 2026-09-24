const express = require('express');
const router = express.Router();
const db = require('../models/index')
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

const EBook = db.EBook

/**
 * @openapi
 * /api/ebooks:
 *   post:
 *     summary: Create or draft a new e-book (Author Only)
 *     tags: [E-Books]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Node.js Advanced Guide
 *               content:
 *                 type: string
 *                 example: Initial book content draft...
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 example: draft
 *     responses:
 *       201:
 *         description: E-book successfully created
 *       403:
 *         description: Unauthorized or forbidden
 */
router.post('/', authenticateJWT, authorizeRoles('author'), async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const ebook = await EBook.create({
      title,
      content,
      status: status || 'draft',
      authorId: req.user.id
    });
    res.status(201).json(ebook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/ebooks/{id}:
 *   put:
 *     summary: Edit or change publication status of an e-book (Author Only)
 *     tags: [E-Books]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The e-book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 example: published
 *     responses:
 *       200:
 *         description: E-book successfully updated
 *       404:
 *         description: E-book not found or unauthorized
 */
router.put('/:id', authenticateJWT, authorizeRoles('author'), async (req, res) => {
  try {
    const { title, content, status } = req.body;

    
     const existingBook = await EBook.findOne({
      where: {
        title: { [Op.iLike]: title.trim() },
        authorId: authorId
      }
    });

    if (existingBook) {
      return res.status(400).json({ 
        message: `An e-book with the title "${title}" already exists in your library.` 
      });
    }
    const ebook = await EBook.findOne({ where: { id: req.params.id, authorId: req.user.id } });

    if (!ebook) return res.status(404).json({ message: 'E-Book not found or unauthorized' });

    await ebook.update({ title, content, status });
    res.json({ message: 'E-Book updated successfully', ebook });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/ebooks/{id}:
 *   delete:
 *     summary: Delete an e-book (Author Only)
 *     tags: [E-Books]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: E-book successfully deleted
 *       404:
 *         description: E-book not found or unauthorized
 */
router.delete('/:id', authenticateJWT, authorizeRoles('author'), async (req, res) => {
  try {
    const deletedCount = await EBook.destroy({ where: { id: req.params.id, authorId: req.user.id } });

    if (deletedCount === 0) return res.status(404).json({ message: 'E-Book not found or unauthorized' });
    res.json({ message: 'E-Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/ebooks/author:
 *   get:
 *     summary: Retrieve all drafts and published e-books belonging to the active author
 *     tags: [E-Books]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the author's e-books
 */
router.get('/author', authenticateJWT, authorizeRoles('author'), async (req, res) => {
  try {
    const ebooks = await EBook.findAll({ where: { authorId: req.user.id } });
    res.json(ebooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
