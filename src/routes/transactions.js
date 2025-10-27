import express from 'express';
import { TransactionService } from '../services/transactionService.js';
import { verifyToken } from '../middleware/auth.js';
import { validateTransactionData } from '../middleware/validator.js';

const router = express.Router();
const transactionService = new TransactionService();

// GET /api/transactions
router.get('/', verifyToken, async (req, res, next) => {
  try {
const { limit } = req.query;
    const userId = req.user.uid;

    const transactions = await transactionService.getUserTransactions(
      userId,
      limit ? parseInt(limit) : 50
    );

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/transactions
router.post('/', verifyToken, validateTransactionData, async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(req.body);

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

export default router;