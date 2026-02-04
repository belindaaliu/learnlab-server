const prisma = require("../../lib/prisma");
const crypto = require("crypto");
const s3 = require("../../lib/s3");

// ---------------- GET CURRENT USER ----------------
const getCurrentUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        first_name: true,
        last_name: true,
        headline: true,
        biography: true,
        occupation: true,
        field_of_learning: true,
        skills: true,
        interests: true,
        resume_url: true,
        photo_url: true,
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
const getPurchasedCourses = async (req, res) => {
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
const getWishlistCourses = async (req, res) => {
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

// ---------------- UPDATE CURRENT USER ----------------
const updateCurrentUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const {
      first_name,
      last_name,
      headline,
      biography,
      occupation,
      field_of_learning,
      skills,
      interests,
      resume_url,
    } = req.body;

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        first_name,
        last_name,
        headline,
        biography,
        occupation,
        field_of_learning,
        skills,
        interests,
        resume_url,
      },
      select: {
        first_name: true,
        last_name: true,
        headline: true,
        biography: true,
        occupation: true,
        field_of_learning: true,
        skills: true,
        interests: true,
        resume_url: true,
      }
    });

    res.json(updatedUser);

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- UPLOAD PHOTO ----------------
const uploadPhoto = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext = req.file.originalname.split(".").pop();
    const randomName = crypto.randomBytes(16).toString("hex");

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `profile_photos/${randomName}.${ext}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      // ACL: "public-read",
    };

    const uploadResult = await s3.upload(params).promise();

    const updated = await prisma.users.update({
      where: { id: userId },
      data: { photo_url: uploadResult.Location },
    });

    res.json(updated);
  } catch (error) {
    console.error("Photo upload error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================================
// Search Courses
// ==========================================

const searchCourses = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const query = q.trim().toLowerCase();

    // Fetch all courses with related fields
    const courses = await prisma.courses.findMany({
      include: {
        Categories: true,
        Users: {
          select: { first_name: true, last_name: true },
        },
        CourseTags: true,
      },
    });

    // Filter in JS for title, description, teacher, category, tags
    const filteredCourses = courses.filter((course) => {
      const titleMatch = course.title?.toLowerCase().includes(query);
      const subtitleMatch = course.subtitle?.toLowerCase().includes(query);
      const descriptionMatch = course.description?.toLowerCase().includes(query);
      const categoryMatch = course.Categories?.name?.toLowerCase().includes(query);
      const teacherMatch =
        (course.Users?.first_name?.toLowerCase().includes(query) ||
         course.Users?.last_name?.toLowerCase().includes(query));
      const tagMatch =
        course.CourseTags?.some(tag => tag.tag_name?.toLowerCase().includes(query));

      return titleMatch || subtitleMatch || descriptionMatch || categoryMatch || teacherMatch || tagMatch;
    });

    // Format response
    const formattedCourses = filteredCourses.map((course) => ({
      id: course.id,
      title: course.title,
      price: course.price,
      image: course.thumbnail_url || "https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      category: course.Categories ? course.Categories.name : "Uncategorized",
      instructor: course.Users ? `${course.Users.first_name} ${course.Users.last_name}` : "Unknown Instructor",
      tags: course.CourseTags?.map(tag => tag.tag_name) || [],
      rating: 4.8, // placeholder
      reviews: course.views,
      level: course.level,
    }));

    res.json(formattedCourses);
  } catch (error) {
    console.error("Error searching courses:", error);
    res.status(500).json({ message: "Server error searching courses" });
  }
};


// ---------------- EXPORT ALL CONTROLLERS ----------------
module.exports = {
  getCurrentUser,
  getPurchasedCourses,
  getWishlistCourses,
  updateCurrentUser,
  uploadPhoto,
  searchCourses,
};
