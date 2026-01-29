const cartService = require("../services/cartService");

async function getCart(req, res) {
  try {
    const userId = req.user.id;
    const cart = await cartService.getCart(userId);
    res.json({ success: true, data: cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
}

async function addToCart(req, res) {
  try {
    const userId = req.user.id
    const { courseId } = req.body
    const cartItem = await cartService.addToCart(userId, courseId)
    res.status(201).json({ success: true, data: cartItem })
  } catch (err) {
    console.error(err)
    res.status(400).json({ 
      success: false, 
      message: err.message || 'Failed to add to cart' 
    })
  }
}


async function removeFromCart(req, res) {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;
    const deleted = await cartService.removeFromCart(cartItemId, userId);
    if (deleted.count === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }
    res.json({ success: true, message: "Cart item removed" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove cart item" });
  }
}

async function updateQuantity(req, res) {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    const updated = await cartService.updateQuantity(
      cartItemId,
      userId,
      quantity,
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    if (updated?.count === 1) {
      return res.json({
        success: true,
        message: "Cart item removed",
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to update cart quantity",
    });
  }
}

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateQuantity,
};
