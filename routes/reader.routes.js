const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const EBook = db.EBook;
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

/**
 * @openapi
 * /api/reader/ebooks:
 *   get:
 *     summary: Retrieve published e-books with optional filters, ratings, and popularity sorting
 *     tags: [Reader Actions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter books by a specific category
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           format: float
 *         description: Filter books with a minimum rating (e.g., 4.0)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [popularity, rating, recent]
 *         description: Sort criteria for the book listing
 *     responses:
 *       200:
 *         description: List of books matching criteria retrieved successfully
 *       403:
 *         description: Forbidden (Readers or Authors only)
 */
router.get('/ebooks', authenticateJWT, authorizeRoles('reader', 'author'), async (req, res) => {
  try {
    const { category, minRating, sortBy } = req.query;

    // Base conditions: Readers can ONLY view published books
    let whereClause = { status: 'published' };

    // Filter by Category
    if (category) {
      whereClause.category = category;
    }

    // Filter by Minimum Rating
    if (minRating) {
      whereClause.rating = { [Op.gte]: parseFloat(minRating) };
    }

    // Handle Sorting Rules
    let orderClause = [['createdAt', 'DESC']]; // Default fallback: Recent
    if (sortBy === 'popularity') {
      orderClause = [['viewsCount', 'DESC']];
    } else if (sortBy === 'rating') {
      orderClause = [['rating', 'DESC']];
    }

    const books = await EBook.findAll({
      where: whereClause,
      order: orderClause
    });
    
    if(!books || books.length === 0){
      res.status(404).json({message:"No books found"})
    }

    res.json({books:books, message: "Books fetched successfully"});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/reader/ebooks/{id}:
 *   get:
 *     summary: Read a specific published e-book details (Increments popularity views)
 *     tags: [Reader Actions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique UUID of the book
 *     responses:
 *       200:
 *         description: Complete book payload
 *       404:
 *         description: Book not found or not published yet
 */
router.get('/ebooks/:id', authenticateJWT, authorizeRoles('reader', 'author'), async (req, res) => {
  try {
    const book = await EBook.findOne({
      where: { id: req.params.id, status: 'published' }
    });

    if (!book) {
      return res.status(404).json({ message: 'E-Book not found or unavailable' });
    }

    // Increment popularity views counter every time a reader opens the book
    await book.increment('viewsCount', { by: 1 });

    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
