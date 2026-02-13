const prisma = require("../lib/prisma");

module.exports = async function requireApprovedInstructor(req, res, next) {
  try {
    const userId = BigInt(req.user.userId);
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true, instructor_application_status: true },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Only instructors can perform this action.",
      });
    }

    if (user.instructor_application_status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your instructor application is not approved yet. Please wait for admin approval or send your application if you have not applied.",
      });
    }

    next();
  } catch (err) {
    console.error("Instructor approval middleware error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
