const cartService = require("../services/cartService");

async function getCart(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const cart = await cartService.getCart(userId);
    res.json({ success: true, data: cart });
  } catch (err) {
    console.error("Get Cart Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
}

async function addToCart(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const { courseId } = req.body;
    
    const cartItem = await cartService.addToCart(userId, courseId);
    res.status(201).json({ success: true, data: cartItem });
  } catch (err) {
    console.error("Add to Cart Error:", err);
    res.status(400).json({ 
      success: false, 
      message: err.message || "Failed to add to cart" 
    });
  }
}

async function removeFromCart(req, res) {
  try {
    const userId = BigInt(req.user.userId);
    const cartItemId = req.params.id; 
    
    const deleted = await cartService.removeFromCart(cartItemId, userId);
    
    if (deleted.count === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, message: "Course removed from cart" });
  } catch (err) {
    console.error("Remove Error:", err);
    res.status(500).json({ success: false, message: "Failed to remove course" });
  }
}

module.exports = {
  getCart,
  addToCart,
  removeFromCart
};