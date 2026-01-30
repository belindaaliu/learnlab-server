const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const { authMiddleware } = require('../middleware/authMiddleware')
const {
  addToCartValidator,
  removeFromCartValidator,
  updateQuantityValidator,
} = require("../validators/cart.validator");

// GET cart
router.get(
  "/",
  authMiddleware,
  cartController.getCart,
);

// ADD to cart
router.post(
  "/",
  authMiddleware,
  ...addToCartValidator,
  cartController.addToCart,
);

// UPDATE quantity
router.put(
  "/:id",
  authMiddleware,
  ...updateQuantityValidator,
  cartController.updateQuantity,
);

// REMOVE from cart
router.delete(
  "/:id",
  authMiddleware,
  ...removeFromCartValidator,
  cartController.removeFromCart,
);

module.exports = router;
