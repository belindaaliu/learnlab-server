const prisma = require("../lib/prisma");

/**
 * Get all cart items for a user
 * @param {number} userId
 */
async function getCart(userId) {
  const items = await prisma.ShoppingCart.findMany({
    where: { user_id: BigInt(userId) },
    include: {
      Courses: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
    },
    orderBy: {
      added_at: "desc",
    },
  });

  let total = 0;
  let itemCount = 0;

  const cartItems = items.map((item) => {
    const price = Number(item.Courses.price);
    const quantity = item.quantity;
    const subtotal = price * quantity;

    total += subtotal;
    itemCount += quantity;

    return {
      id: item.id.toString(),
      quantity,
      price,
      subtotal,
      course: item.Courses,
    };
  });

  return {
    items: cartItems,
    total,
    itemCount,
  };
}

/**
 * Add a course to cart
 * @param {number} userId
 * @param {number} courseId
 */
async function addToCart(userId, courseId) {
  // Check if the course belongs to the user
  const course = await prisma.Courses.findUnique({
    where: { id: BigInt(courseId) },
    select: { instructor_id: true },
  })

  if (!course) {
    throw new Error('Course not found')
  }

  if (BigInt(userId) === course.instructor_id) {
    throw new Error('You cannot add your own course to the cart')
  }

  // Prevent duplicate cart items
  const existing = await prisma.ShoppingCart.findFirst({
    where: {
      user_id: BigInt(userId),
      course_id: BigInt(courseId),
    },
  })

  if (existing) return existing

  return prisma.ShoppingCart.create({
    data: {
      user_id: BigInt(userId),
      course_id: BigInt(courseId),
      quantity: 1, // default quantity
    },
  })
}


/**
 * Remove a course from cart
 * @param {number} cartItemId
 * @param {number} userId
 */
async function removeFromCart(cartItemId, userId) {
  return prisma.ShoppingCart.deleteMany({
    where: {
      id: BigInt(cartItemId),
      user_id: BigInt(userId),
    },
  });
}

async function updateQuantity(cartItemId, userId, quantity) {
  // If quantity is 0 → remove item
  if (quantity === 0) {
    return prisma.ShoppingCart.deleteMany({
      where: {
        id: BigInt(cartItemId),
        user_id: BigInt(userId),
      },
    });
  }

  // Otherwise update quantity
  const existing = await prisma.ShoppingCart.findFirst({
    where: {
      id: BigInt(cartItemId),
      user_id: BigInt(userId),
    },
  });

  if (!existing) return null;

  return prisma.ShoppingCart.update({
    where: { id: BigInt(cartItemId) },
    data: { quantity },
  });
}

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateQuantity,
};
