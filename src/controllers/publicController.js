const prisma = require('../lib/prisma');
const { generateSocialShareImage } = require('../utils/imageGenerator');

// ==========================================
// 1. Get homepage statistics
// ==========================================
exports.getHomeStats = async (req, res) => {
  try {

    const [studentsCount, instructorsCount, coursesCount, reviewsAgg] = await Promise.all([

      prisma.users.count({
        where: { role: 'student' }
      }),
      

      prisma.users.count({
        where: { role: 'instructor' }
      }),


      prisma.courses.count({
        where: { 
          is_deleted: false,
          // If we want to count only approved courses, uncomment the following line:
          // approval_status: 'approved'
        } 
      }),

      // Average overall site scores
      prisma.reviews.aggregate({
        _avg: {
          rating: true
        }
      })
    ]);

    // Calculate average (if no score, default to 5.0)
    const avgRating = reviewsAgg._avg.rating 
      ? reviewsAgg._avg.rating.toFixed(1) 
      : "4.9"; 

    res.json({
      success: true,
      students: studentsCount,
      instructors: instructorsCount,
      courses: coursesCount,
      rating: avgRating
    });

  } catch (error) {
    console.error("Home Stats Error:", error);
    res.status(500).json({ success: false, message: "Error fetching stats" });
  }
};

// ==========================================
// 2. Certificate verification
// ==========================================
exports.verifyCertificate = async (req, res) => {
  try {
    const { certId } = req.params;

    const cert = await prisma.certificates.findUnique({
      where: { id: BigInt(certId) },
      include: {
        Users: {
          select: { 
            first_name: true, 
            last_name: true,
            photo_url: true 
          }
        },
        Courses: {
          select: { 
            title: true,
            instructor_id: true,
            Users: { 
               select: { first_name: true, last_name: true }
            }
          }
        }
      }
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    res.json({
      success: true,
      data: {
        id: cert.id.toString(), // Convert BigInt to String to avoid JSON error
        studentName: `${cert.Users.first_name} ${cert.Users.last_name}`,
        studentPhoto: cert.Users.photo_url,
        courseTitle: cert.Courses.title,
        instructorName: `${cert.Courses.Users.first_name} ${cert.Courses.Users.last_name}`,
        issuedAt: cert.issued_at
      }
    });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// 3. Document image for sharing
// ==========================================
exports.certificateImage = async (req, res)=> {
  try {
    const cert = await prisma.certificates.findUnique({
      where: { id: BigInt(req.params.certId) },
      include: { Users: true, Courses: true }
    });

    if (!cert) return res.status(404).send('Not found');

    const studentName = `${cert.Users.first_name} ${cert.Users.last_name}`;
    const imageBuffer = await generateSocialShareImage(studentName, cert.Courses.title);

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=604800'); 
    res.send(imageBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};