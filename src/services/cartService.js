const prisma = require("../lib/prisma");

async function getCart(userId) {
  const items = await prisma.ShoppingCart.findMany({
    where: { user_id: BigInt(userId) },
    include: {
      Courses: {
        select: {
          id: true,
          title: true,
          price: true,
          thumbnail_url: true,
          instructor_id: true, 
        },
      },
    },
    orderBy: { added_at: "desc" },
  });

  let total = 0;
  const cartItems = items.map((item) => {
    const price = Number(item.Courses.price);
    total += price;

    return {
      id: item.id.toString(),
      price,
      course: {
        ...item.Courses,
        id: item.Courses.id.toString(),
        image: item.Courses.thumbnail_url 
      }
    };
  });

  return {
    items: cartItems,
    total: Number(total.toFixed(2)),
    itemCount: cartItems.length
  };
}


async function addToCart(userId, courseId) {
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
      quantity: 1, 
    },
  })
}


async function removeFromCart(cartItemId, userId) {
  return prisma.ShoppingCart.deleteMany({
    where: {
      id: BigInt(cartItemId),
      user_id: BigInt(userId),
    },
  });
}

async function updateQuantity(cartItemId, userId, quantity) {
  if (quantity === 0) {
    return prisma.ShoppingCart.deleteMany({
      where: {
        id: BigInt(cartItemId),
        user_id: BigInt(userId),
      },
    });
  }

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
