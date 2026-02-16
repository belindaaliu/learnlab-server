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

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollments.findFirst({
      where: {
        user_id: Number(userId),
        course_id: Number(courseId)
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
        user_id: Number(userId),
        course_id: Number(courseId)
      }
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this course. You can edit your existing review.' 
      });
    }

    // Get course details for notification
    const course = await prisma.courses.findUnique({
      where: { id: Number(courseId) },
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
      where: { id: Number(userId) },
      select: {
        first_name: true,
        last_name: true
      }
    });

    // Create review
    const review = await prisma.reviews.create({
      data: {
        user_id: Number(userId),
        course_id: Number(courseId),
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
    const reviewerName = `${reviewer.first_name} ${reviewer.last_name}`;
    await notifyNewReview(
      Number(course.instructor_id), 
      reviewerName, 
      course.title, 
      courseId,
      rating
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        id: Number(review.id),
        user_id: Number(review.user_id),
        course_id: Number(review.course_id),
        rating: review.rating,
        review_text: review.review_text,
        comment: review.review_text, // Add alias for frontend
        created_at: review.created_at,
        student: {
          first_name: review.Users_Reviews_user_idToUsers.first_name,
          last_name: review.Users_Reviews_user_idToUsers.last_name,
          photo: review.Users_Reviews_user_idToUsers.photo_url,
          name: `${review.Users_Reviews_user_idToUsers.first_name} ${review.Users_Reviews_user_idToUsers.last_name}`
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

    // Check if review exists and belongs to user
    const existingReview = await prisma.reviews.findFirst({
      where: {
        id: BigInt(reviewId),
        user_id: Number(userId)
      }
    });

    if (!existingReview) {
      return res.status(404).json({ 
        message: 'Review not found or you do not have permission to edit it' 
      });
    }

    // Update review
    const updatedReview = await prisma.reviews.update({
      where: { id: BigInt(reviewId) },
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
        id: Number(updatedReview.id),
        user_id: Number(updatedReview.user_id),
        course_id: Number(updatedReview.course_id),
        rating: updatedReview.rating,
        review_text: updatedReview.review_text,
        comment: updatedReview.review_text, // Add alias for frontend
        created_at: updatedReview.created_at,
        student: {
          first_name: updatedReview.Users_Reviews_user_idToUsers.first_name,
          last_name: updatedReview.Users_Reviews_user_idToUsers.last_name,
          photo: updatedReview.Users_Reviews_user_idToUsers.photo_url,
          name: `${updatedReview.Users_Reviews_user_idToUsers.first_name} ${updatedReview.Users_Reviews_user_idToUsers.last_name}`
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

    // Check if review exists and belongs to user
    const existingReview = await prisma.reviews.findFirst({
      where: {
        id: BigInt(reviewId),
        user_id: Number(userId)
      }
    });

    if (!existingReview) {
      return res.status(404).json({ 
        message: 'Review not found or you do not have permission to delete it' 
      });
    }

    // Delete review
    await prisma.reviews.delete({
      where: { id: BigInt(reviewId) }
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
exports.getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId; // Get logged-in user ID
    const { page = 1, limit = 10, sort = 'recent' } = req.query;

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
      const userReviewData = await prisma.reviews.findFirst({
        where: {
          course_id: Number(courseId),
          user_id: Number(userId)
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

      if (userReviewData) {
        userReview = {
          id: Number(userReviewData.id),
          user_id: Number(userReviewData.user_id),
          rating: userReviewData.rating,
          review_text: userReviewData.review_text,
          comment: userReviewData.review_text, // Alias for frontend
          created_at: userReviewData.created_at,
          student: {
            first_name: userReviewData.Users_Reviews_user_idToUsers.first_name,
            last_name: userReviewData.Users_Reviews_user_idToUsers.last_name,
            photo: userReviewData.Users_Reviews_user_idToUsers.photo_url,
            name: `${userReviewData.Users_Reviews_user_idToUsers.first_name} ${userReviewData.Users_Reviews_user_idToUsers.last_name}`
          }
        };
      }
    }

    // Get all OTHER reviews (excluding user's own)
    const whereClause = {
      course_id: Number(courseId),
      ...(userId && { user_id: { not: Number(userId) } })
    };

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

    // Get total count (excluding user's own)
    const totalReviews = await prisma.reviews.count({
      where: whereClause
    });

    // Calculate average rating and rating distribution (ALL reviews including user's)
    const allReviews = await prisma.reviews.findMany({
      where: { course_id: Number(courseId) },
      select: { rating: true }
    });

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

    res.json({
      success: true,
      reviews: reviews.map(r => ({
        id: Number(r.id),
        user_id: Number(r.user_id),
        rating: r.rating,
        review_text: r.review_text,
        comment: r.review_text, // Alias for frontend
        created_at: r.created_at,
        student: {
          first_name: r.Users_Reviews_user_idToUsers.first_name,
          last_name: r.Users_Reviews_user_idToUsers.last_name,
          photo: r.Users_Reviews_user_idToUsers.photo_url,
          name: `${r.Users_Reviews_user_idToUsers.first_name} ${r.Users_Reviews_user_idToUsers.last_name}`
        }
      })),
      userReview: userReview, // User's own review
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / Number(limit))
      },
      stats: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: allReviews.length, // Total including user's review
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Get course reviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// Get user's review for a specific course
exports.getUserCourseReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;

    const review = await prisma.reviews.findFirst({
      where: {
        user_id: Number(userId),
        course_id: Number(courseId)
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
        id: Number(review.id),
        user_id: Number(review.user_id),
        course_id: Number(review.course_id),
        rating: review.rating,
        review_text: review.review_text,
        comment: review.review_text, // Alias for frontend
        created_at: review.created_at,
        student: {
          first_name: review.Users_Reviews_user_idToUsers.first_name,
          last_name: review.Users_Reviews_user_idToUsers.last_name,
          photo: review.Users_Reviews_user_idToUsers.photo_url,
          name: `${review.Users_Reviews_user_idToUsers.first_name} ${review.Users_Reviews_user_idToUsers.last_name}`
        }
      }
    });

  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({ message: 'Failed to fetch review' });
  }
};