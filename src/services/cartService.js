const prisma = require("../lib/prisma");

async function getCart(userId) {
  try {
    const items = await prisma.ShoppingCart.findMany({
      where: { user_id: BigInt(userId) },
      include: {
        Courses: true, 
      },
    });

    let total = 0;
    const cartItems = items.map((item) => {
      if (!item.Courses) return null;

      const coursePrice = item.Courses.price ? Number(item.Courses.price) : 0;
      total += coursePrice;

      return {
        id: item.id.toString(),
        user_id: item.user_id.toString(),
        course_id: item.course_id.toString(),
        added_at: item.added_at,
        course: {
          id: item.Courses.id.toString(),
          title: item.Courses.title,
          price: coursePrice,
          thumbnail_url: item.Courses.thumbnail_url,
          image: item.Courses.thumbnail_url, 
          instructor_id: item.Courses.instructor_id.toString(),
          level: item.Courses.level
        }
      };
    }).filter(Boolean);

    return {
      items: cartItems,
      total: Number(total.toFixed(2)),
      itemCount: cartItems.length
    };
  } catch (err) {
    console.error("❌ Cart Service Get Error:", err);
    throw err;
  }
}

async function addToCart(userId, courseId) {
  const course = await prisma.Courses.findUnique({
    where: { id: BigInt(courseId) },
    select: { instructor_id: true },
  });

  if (!course) throw new Error("Course not found");

  if (BigInt(userId) === course.instructor_id) {
    throw new Error("You cannot add your own course to the cart");
  }

  const existing = await prisma.ShoppingCart.findFirst({
    where: {
      user_id: BigInt(userId),
      course_id: BigInt(courseId),
    },
  });

  if (existing) return existing;

  return prisma.ShoppingCart.create({
    data: {
      user_id: BigInt(userId),
      course_id: BigInt(courseId),
    },
  });
}

async function removeFromCart(cartItemId, userId) {
  return prisma.ShoppingCart.deleteMany({
    where: {
      id: BigInt(cartItemId),
      user_id: BigInt(userId),
    },
  });
}

module.exports = {
  getCart,
  addToCart,
  removeFromCart
};