const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

const Comment = db.Comment;
const EBook = db.EBook;

// =========================================================================
// 1. READER ACTION: Submit a Review (Defaults to Pending)
// =========================================================================
/**
 * @openapi
 * /api/comments/ebooks/{ebookId}:
 *   post:
 *     summary: Reader leaves a rating and review for a published book (Pending Moderation)
 *     tags: [Comments & Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ebookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique UUID of the published e-book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, rating]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Incredible reading! Very advanced concepts.
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *     responses:
 *       201:
 *         description: Review submitted successfully and queued for moderation.
 *       400:
 *         description: Invalid payload or validation constraint failed.
 *       401:
 *         description: Missing or invalid JWT authorization token.
 *       403:
 *         description: Forbidden. Only users with a 'reader' role can perform this action.
 *       404:
 *         description: The targeted e-book does not exist or is not published.
 *       500:
 *         description: Internal server database error.
 */
router.post('/ebooks/:ebookId', authenticateJWT, authorizeRoles('reader'), async (req, res) => {
  try {
    const { ebookId } = req.params;
    const { content, rating } = req.body;

    const book = await EBook.findOne({ where: { id: ebookId, status: 'published' } });
    if (!book) return res.status(404).json({ message: 'E-Book not found or unavailable.' });

    const comment = await Comment.create({
      content,
      rating,
      ebookId,
      readerId: req.user.id,
      status: 'pending'
    });

    res.status(201).json({ 
      message: 'Review submitted successfully. It will display publicly once approved by the author.',
      comment 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// 2. PUBLIC/READER ACTION: View Approved Comments for a Book
// =========================================================================
/**
 * @openapi
 * /api/comments/ebooks/{ebookId}:
 *   get:
 *     summary: Get all approved comments for a specific e-book
 *     tags: [Comments & Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ebookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique UUID of the e-book
 *     responses:
 *       200:
 *         description: A collection array of approved book reviews with reader usernames.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   content:
 *                     type: string
 *                   rating:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   reader:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *       401:
 *         description: Missing or invalid JWT authorization token.
 *       500:
 *         description: Internal server error.
 */
router.get('/ebooks/:ebookId', authenticateJWT, authorizeRoles('reader', 'author'), async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { ebookId: req.params.ebookId, status: 'approved' },
      include: [{ model: db.User, as: 'reader', attributes: ['username'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// 3. AUTHOR ACTION: View Pending Reviews queue for their books
// =========================================================================
/**
 * @openapi
 * /api/comments/author/pending:
 *   get:
 *     summary: Author fetches all pending comments awaiting their moderation
 *     tags: [Comments & Moderation]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A collection array of unmoderated comments mapping to e-books owned by the active author.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Missing or invalid JWT authorization token.
 *       403:
 *         description: Forbidden. Access restricted strictly to users with the 'author' role.
 *       500:
 *         description: Internal server error.
 */
router.get('/author/pending', authenticateJWT, authorizeRoles('author'), async (req, res) => {
  try {
    const pendingComments = await Comment.findAll({
      where: { status: 'pending' },
      include: [{
        model: EBook,
        as: 'ebook',
        where: { authorId: req.user.id },
        attributes: ['title']
      }, {
        model: db.User,
        as: 'reader',
        attributes: ['username', 'email']
      }]
    });

    res.json(pendingComments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// 4. AUTHOR ACTION: Moderate (Approve / Reject) a review
// =========================================================================
/**
 * @openapi
 * /api/comments/{commentId}/moderate:
 *   patch:
 *     summary: Author approves or rejects a review
 *     tags: [Comments & Moderation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique UUID of the target comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *     responses:
 *       200:
 *         description: The review state has updated successfully, and the parent e-book rating average was refreshed.
 *       400:
 *         description: Invalid action provided. Must be 'approve' or 'reject'.
 *       401:
 *         description: Missing or invalid JWT authorization token.
 *       403:
 *         description: Forbidden. Restricted to authors.
 *       404:
 *         description: Target review was not found, or it belongs to a book written by a different author.
 *       500:
 *         description: Internal server error.
 */
router.patch('/:commentId/moderate', authenticateJWT, authorizeRoles('author'), async (req, res) => {
  try {
    const { commentId } = req.params;
    const { action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "Action must be either 'approve' or 'reject'." });
    }

    const comment = await Comment.findOne({
      where: { id: commentId },
      include: [{
        model: EBook,
        as: 'ebook',
        where: { authorId: req.user.id }
      }]
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or unauthorized moderation attempt.' });
    }

    comment.status = action === 'approve' ? 'approved' : 'rejected';
    await comment.save();

    if (comment.status === 'approved') {
      const stats = await Comment.findAll({
        where: { ebookId: comment.ebookId, status: 'approved' },
        attributes: [[db.sequelize.fn('AVG', db.sequelize.col('rating')), 'avgRating']],
        raw: true
      });
      
      const newAverage = parseFloat(stats[0].avgRating) || 0;
      await EBook.update({ rating: newAverage }, { where: { id: comment.ebookId } });
    }

    res.json({ message: `Comment has been successfully ${comment.status}.`, comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
