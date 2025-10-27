export const validateEventData = (req, res, next) => {
  const { title, description, category, points } = req.body;

  if (!title || typeof title !== 'string' || title.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Invalid title: must be at least 3 characters',
    });
  }

  if (!description || typeof description !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid description',
    });
  }

  if (!category || typeof category !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid category',
    });
  }

  if (typeof points !== 'number' || points < 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid points: must be a positive number',
    });
  }

  next();
};

export const validateTransactionData = (req, res, next) => {
  const { userId, amount, points, type } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid userId',
    });
  }

  if (typeof amount !== 'number' || typeof points !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Invalid amount or points',
    });
  }

  if (!type || typeof type !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid transaction type',
    });
  }

  next();
};