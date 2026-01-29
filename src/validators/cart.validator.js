const { body, param } = require('express-validator')

const addToCartValidator = [
  body('courseId')
    .exists().withMessage('courseId is required')
    .isInt({ min: 1 }).withMessage('courseId must be a positive integer'),
]

const removeFromCartValidator = [
  param('id')
    .exists().withMessage('Cart item id is required')
    .isInt({ min: 1 }).withMessage('Cart item id must be a positive integer'),
]

const updateQuantityValidator = [
  param('id')
    .exists().withMessage('Cart item id is required')
    .isInt({ min: 0 }).withMessage('quantity must be 0 or greater'),
    
  body('quantity')
    .exists().withMessage('quantity is required')
    .isInt({ min: 1 }).withMessage('quantity must be at least 1'),
]

module.exports = {
  addToCartValidator,
  removeFromCartValidator,
  updateQuantityValidator,
}
