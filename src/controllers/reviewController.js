const prisma = require('../lib/prisma');
const { notifyNewReview } = require('../utils/notificationHelpers');

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId, rating, reviewText } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Convert to BigInt for Prisma (using BigInt constructor)
    const userIdBigInt = BigInt(userId);
    const courseIdBigInt = BigInt(courseId);

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollments.findFirst({
      where: {
        user_id: userIdBigInt,
        course_id: courseIdBigInt
      }
    });

    if (!enrollment) {
      return res.status(403).json({ 
        message: 'You must be enrolled in this course to leave a review' 
      });
    }

    // Check if user already reviewed this course
    const existingReview = await prisma.reviews.findFirst({
      where: {
        user_id: userIdBigInt,
        course_id: courseIdBigInt
      }
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this course. You can edit your existing review.' 
      });
    }

    // Get course details for notification
    const course = await prisma.courses.findUnique({
      where: { id: courseIdBigInt },
      select: {
        title: true,
        instructor_id: true
      }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get reviewer name
    const reviewer = await prisma.users.findUnique({
      where: { id: userIdBigInt },
      select: {
        first_name: true,
        last_name: true
      }
    });

    // Create review
    const review = await prisma.reviews.create({
      data: {
        user_id: userIdBigInt,
        course_id: courseIdBigInt,
        instructor_id: course.instructor_id,
        rating: Number(rating),
        review_text: reviewText || null
      },
      include: {
        Users_Reviews_user_idToUsers: {
          select: {
            first_name: true,
            last_name: true,
            photo_url: true
          }
        }
      }
    });

    // Send notification to instructor
    const reviewerName = reviewer ? `${reviewer.first_name} ${reviewer.last_name}` : 'Student';
    await notifyNewReview(
      Number(course.instructor_id), 
      reviewerName, 
      course.title, 
      courseId,
      rating
    );

    // Convert BigInt fields to strings/numbers for JSON response
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        id: review.id.toString(),
        user_id: Number(review.user_id),
        course_id: Number(review.course_id),
        rating: review.rating,
        review_text: review.review_text,
        comment: review.review_text,
        created_at: review.created_at,
        student: {
          first_name: review.Users_Reviews_user_idToUsers?.first_name || '',
          last_name: review.Users_Reviews_user_idToUsers?.last_name || '',
          photo: review.Users_Reviews_user_idToUsers?.photo_url || null,
          name: review.Users_Reviews_user_idToUsers 
            ? `${review.Users_Reviews_user_idToUsers.first_name} ${review.Users_Reviews_user_idToUsers.last_name}`
            : 'Student'
        }
      }
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Failed to submit review' });
  }
};

// Update an existing review
exports.updateReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const userIdBigInt = BigInt(userId);
    const reviewIdBigInt = BigInt(reviewId);

    // Check if review exists and belongs to user
    const existingReview = await prisma.reviews.findFirst({
      where: {
        id: reviewIdBigInt,
        user_id: userIdBigInt
      }
    });

    if (!existingReview) {
      return res.status(404).json({ 
        message: 'Review not found or you do not have permission to edit it' 
      });
    }

    // Update review
    const updatedReview = await prisma.reviews.update({
      where: { id: reviewIdBigInt },
      data: {
        rating: rating ? Number(rating) : existingReview.rating,
        review_text: reviewText !== undefined ? reviewText : existingReview.review_text
      },
      include: {
        Users_Reviews_user_idToUsers: {
          select: {
            first_name: true,
            last_name: true,
            photo_url: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: {
        id: updatedReview.id.toString(),
        user_id: Number(updatedReview.user_id),
        course_id: Number(updatedReview.course_id),
        rating: updatedReview.rating,
        review_text: updatedReview.review_text,
        comment: updatedReview.review_text,
        created_at: updatedReview.created_at,
        student: {
          first_name: updatedReview.Users_Reviews_user_idToUsers?.first_name || '',
          last_name: updatedReview.Users_Reviews_user_idToUsers?.last_name || '',
          photo: updatedReview.Users_Reviews_user_idToUsers?.photo_url || null,
          name: updatedReview.Users_Reviews_user_idToUsers 
            ? `${updatedReview.Users_Reviews_user_idToUsers.first_name} ${updatedReview.Users_Reviews_user_idToUsers.last_name}`
            : 'Student'
        }
      }
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Failed to update review' });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;

    const userIdBigInt = BigInt(userId);
    const reviewIdBigInt = BigInt(reviewId);

    // Check if review exists and belongs to user
    const existingReview = await prisma.reviews.findFirst({
      where: {
        id: reviewIdBigInt,
        user_id: userIdBigInt
      }
    });

    if (!existingReview) {
      return res.status(404).json({ 
        message: 'Review not found or you do not have permission to delete it' 
      });
    }

    // Delete review
    await prisma.reviews.delete({
      where: { id: reviewIdBigInt }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Failed to delete review' });
  }
};

// Get all reviews for a course (split user's review from others)
// Get all reviews for a course (split user's review from others)
exports.getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;

    console.log('========== GET COURSE REVIEWS DEBUG ==========');
    console.log('Raw courseId:', courseId, 'Type:', typeof courseId);
    console.log('Raw userId from request:', userId, 'Type:', typeof userId);
    console.log('Request user object:', req.user);

    // Handle potential undefined or null values
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Convert to BigInt safely
    let courseIdBigInt;
    try {
      courseIdBigInt = BigInt(courseId);
      console.log('courseIdBigInt:', courseIdBigInt.toString(), 'Type:', typeof courseIdBigInt);
    } catch (error) {
      console.error('Error converting courseId to BigInt:', error);
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Determine sort order
    let orderBy;
    switch (sort) {
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      case 'recent':
      default:
        orderBy = { created_at: 'desc' };
    }

    // Get user's own review separately
    let userReview = null;
    if (userId) {
      let userIdBigInt;
      try {
        userIdBigInt = BigInt(userId);
        console.log('userIdBigInt:', userIdBigInt.toString(), 'Type:', typeof userIdBigInt);
        
        // First, let's check all reviews for this course to debug
        const allReviewsForCourse = await prisma.reviews.findMany({
          where: {
            course_id: courseIdBigInt
          },
          select: {
            id: true,
            user_id: true,
            rating: true
          }
        });
        
        console.log('All reviews for this course (IDs):', allReviewsForCourse.map(r => ({
          id: r.id.toString(),
          user_id: r.user_id.toString(),
          rating: r.rating
        })));

        // Now try to find the specific user's review
        const userReviewData = await prisma.reviews.findFirst({
          where: {
            course_id: courseIdBigInt,
            user_id: userIdBigInt
          },
          include: {
            Users_Reviews_user_idToUsers: {
              select: {
                first_name: true,
                last_name: true,
                photo_url: true
              }
            }
          }
        });

        console.log('User review query result:', userReviewData ? 'Found' : 'Not found');
        
        if (userReviewData) {
          console.log('User review data:', {
            id: userReviewData.id.toString(),
            user_id: userReviewData.user_id.toString(),
            rating: userReviewData.rating
          });
          
          userReview = {
            id: userReviewData.id.toString(),
            user_id: Number(userReviewData.user_id),
            rating: userReviewData.rating,
            review_text: userReviewData.review_text,
            comment: userReviewData.review_text,
            created_at: userReviewData.created_at,
            student: {
              first_name: userReviewData.Users_Reviews_user_idToUsers?.first_name || '',
              last_name: userReviewData.Users_Reviews_user_idToUsers?.last_name || '',
              photo: userReviewData.Users_Reviews_user_idToUsers?.photo_url || null,
              name: userReviewData.Users_Reviews_user_idToUsers 
                ? `${userReviewData.Users_Reviews_user_idToUsers.first_name} ${userReviewData.Users_Reviews_user_idToUsers.last_name}`
                : 'Student'
            }
          };
        } else {
          console.log('No review found for user:', userIdBigInt.toString());
        }
      } catch (error) {
        console.error('Error converting userId to BigInt:', error);
        // Continue without user review if there's an error with userId
      }
    } else {
      console.log('No userId provided in request');
    }

    // Get all OTHER reviews (excluding user's own)
    let whereClause = {
      course_id: courseIdBigInt
    };
    
    if (userId && userReview) {
      // If we found the user's review, exclude it
      whereClause.user_id = { not: BigInt(userId) };
    } else if (userId) {
      // If we didn't find user's review but userId exists, don't exclude anything
      console.log('User has no review for this course, showing all reviews');
    }

    console.log('Where clause for other reviews:', JSON.stringify(whereClause, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));

    const reviews = await prisma.reviews.findMany({
      where: whereClause,
      include: {
        Users_Reviews_user_idToUsers: {
          select: {
            first_name: true,
            last_name: true,
            photo_url: true
          }
        }
      },
      orderBy,
      skip,
      take: Number(limit)
    });

    console.log(`Found ${reviews.length} other reviews`);

    // Get total count (may include or exclude user's own based on whereClause)
    const totalReviews = await prisma.reviews.count({
      where: whereClause
    });

    // Calculate average rating and rating distribution (ALL reviews including user's)
    const allReviews = await prisma.reviews.findMany({
      where: { course_id: courseIdBigInt },
      select: { rating: true }
    });

    console.log(`Total reviews in course (including user's): ${allReviews.length}`);

    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    const ratingDistribution = {
      5: allReviews.filter(r => r.rating === 5).length,
      4: allReviews.filter(r => r.rating === 4).length,
      3: allReviews.filter(r => r.rating === 3).length,
      2: allReviews.filter(r => r.rating === 2).length,
      1: allReviews.filter(r => r.rating === 1).length
    };

    console.log('Final userReview being sent:', userReview);
    console.log('=============================================');

    res.json({
      success: true,
      reviews: reviews.map(r => ({
        id: r.id.toString(),
        user_id: Number(r.user_id),
        rating: r.rating,
        review_text: r.review_text,
        comment: r.review_text,
        created_at: r.created_at,
        student: {
          first_name: r.Users_Reviews_user_idToUsers?.first_name || '',
          last_name: r.Users_Reviews_user_idToUsers?.last_name || '',
          photo: r.Users_Reviews_user_idToUsers?.photo_url || null,
          name: r.Users_Reviews_user_idToUsers 
            ? `${r.Users_Reviews_user_idToUsers.first_name} ${r.Users_Reviews_user_idToUsers.last_name}`
            : 'Student'
        }
      })),
      userReview: userReview,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / Number(limit))
      },
      stats: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: allReviews.length,
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Get course reviews error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message 
    });
  }
};

// Get user's review for a specific course
exports.getUserCourseReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;

    const userIdBigInt = BigInt(userId);
    const courseIdBigInt = BigInt(courseId);

    const review = await prisma.reviews.findFirst({
      where: {
        user_id: userIdBigInt,
        course_id: courseIdBigInt
      },
      include: {
        Users_Reviews_user_idToUsers: {
          select: {
            first_name: true,
            last_name: true,
            photo_url: true
          }
        }
      }
    });

    if (!review) {
      return res.json({
        success: true,
        review: null
      });
    }

    res.json({
      success: true,
      review: {
        id: review.id.toString(),
        user_id: Number(review.user_id),
        course_id: Number(review.course_id),
        rating: review.rating,
        review_text: review.review_text,
        comment: review.review_text,
        created_at: review.created_at,
        student: {
          first_name: review.Users_Reviews_user_idToUsers?.first_name || '',
          last_name: review.Users_Reviews_user_idToUsers?.last_name || '',
          photo: review.Users_Reviews_user_idToUsers?.photo_url || null,
          name: review.Users_Reviews_user_idToUsers 
            ? `${review.Users_Reviews_user_idToUsers.first_name} ${review.Users_Reviews_user_idToUsers.last_name}`
            : 'Student'
        }
      }
    });

  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({ message: 'Failed to fetch review' });
  }
};