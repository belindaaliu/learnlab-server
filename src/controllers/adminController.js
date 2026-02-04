const prisma = require("../lib/prisma");

// --- DASHBOARD STATS ---
exports.getDashboardStats = async (req, res) => {
  try {
    // Core Metrics
    const totalStudents = await prisma.users.count({ where: { role: 'student' } });
    const totalInstructors = await prisma.users.count({ where: { role: 'instructor' } });
    const totalCourses = await prisma.courses.count();
    
    // Revenue 
    const revenueData = await prisma.payments.aggregate({
      _sum: { amount: true },
      where: { status: 'paid' }
    });

    // Pending Tasks (Quality Control)
    const pendingInstructors = await prisma.users.count({
      where: { instructor_application_status: 'pending' }
    });

    // Recent Enrollments (Activity Feed)
    const recentEnrollments = await prisma.enrollments.findMany({
      take: 5,
      orderBy: { enrolled_at: 'desc' },
      include: {
        Users: { select: { first_name: true, last_name: true, email: true } },
        Courses: { select: { title: true } }
      }
    });

    res.json({
      metrics: {
        students: totalStudents,
        instructors: totalInstructors,
        courses: totalCourses,
        revenue: revenueData._sum.amount || 0,
        pendingApprovals: pendingInstructors
      },
      recentEnrollments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- INSTRUCTOR MANAGEMENT ---

// List instructors with optional status filter
exports.getInstructors = async (req, res) => {
  try {
    const { status } = req.query;
    const instructors = await prisma.users.findMany({
      where: {
        role: 'instructor',
        ...(status && { instructor_application_status: status })
      },
      orderBy: { instructor_application_submitted_at: 'desc' }
    });
    res.json({ success: true, data: instructors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get specific instructor details for review
exports.getInstructorDetail = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const instructor = await prisma.users.findUnique({
      where: { id: BigInt(instructorId) }
    });
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });
    res.json({ success: true, data: instructor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve or Reject an instructor
exports.reviewInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { status, adminComment } = req.body;

    await prisma.users.update({
      where: { id: BigInt(instructorId) },
      data: {
        instructor_application_status: status,
        instructor_admin_comment: adminComment,
        instructor_reviewed_at: new Date(),
        // Only set to instructor role if approved
        role: status === 'approved' ? 'instructor' : 'student'
      }
    });

    res.json({ success: true, message: `Instructor ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- COURSE MANAGEMENT ---

// List all courses for the admin
exports.getCourses = async (req, res) => {
  try {
    const courses = await prisma.courses.findMany({
      include: {
        Users: { select: { first_name: true, last_name: true } },
        Categories: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stub for detailed course review (Videos/Lessons)
exports.getCourseReviewData = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      include: {
        CourseContent: {
          orderBy: { order_index: 'asc' }
        }
      }
    });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update course status (Publish/Flag/Draft)
exports.updateCourseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { level } = req.body; 

    const updatedCourse = await prisma.courses.update({
      where: { id: BigInt(courseId) },
      data: { level: level }
    });

    sendJson(res, { 
      success: true, 
      message: "Course level updated", 
      data: updatedCourse 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};