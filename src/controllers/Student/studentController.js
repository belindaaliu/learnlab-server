import prisma from "../lib/prisma.js";

// ---------------- GET CURRENT USER ----------------
export const getCurrentUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        first_name: true,
        occupation: true,
        skills: true,
        interests: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ---------------- GET PURCHASED COURSES ----------------
export const getPurchasedCourses = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const enrollments = await prisma.enrollments.findMany({
      where: { user_id: userId },
      include: {
        Courses: true,
      },
    });

    const courses = enrollments.map(e => e.Courses);

    res.json(courses);

  } catch (error) {
    console.error("Error fetching purchased courses:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ---------------- GET WISHLIST COURSES ----------------
export const getWishlistCourses = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const saved = await prisma.userSavedCourses.findMany({
      where: { user_id: userId },
      include: {
        Courses: true,
      },
    });

    const courses = saved.map(s => s.Courses);

    res.json(courses);

  } catch (error) {
    console.error("Error fetching wishlist courses:", error);
    res.status(500).json({ message: "Server error" });
  }
};
