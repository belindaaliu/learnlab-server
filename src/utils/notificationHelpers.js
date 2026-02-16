const { createNotification } = require('../controllers/notificationController');

// Helper functions to create notifications for different events

exports.notifyCoursePurchase = async (userId, courseTitle, courseId) => {
  await createNotification({
    userId,
    type: 'purchase',
    title: 'Course Purchased Successfully!',
    message: `You've successfully enrolled in "${courseTitle}". Start learning now!`,
    link: `/course/${courseId}/learn`,
    metadata: { courseId }
  });
};

exports.notifyWishlistAdd = async (userId, courseTitle, courseId) => {
  await createNotification({
    userId,
    type: 'wishlist',
    title: 'Added to Wishlist',
    message: `"${courseTitle}" has been added to your wishlist.`,
    link: `/student/learning?tab=wishlist`,
    metadata: { courseId }
  });
};

exports.notifyNewMessage = async (userId, senderName, conversationId = null, messageId = null) => {
  await createNotification({
    userId,
    type: 'new_message',
    title: 'New Message',
    message: `You have a new message from ${senderName}`,
    link: conversationId ? `/student/messages?conversation=${conversationId}` : `/student/messages`,
    metadata: { messageId, senderName, conversationId }
  });
};

exports.notifyCourseEnrollment = async (userId, courseTitle, courseId) => {
  await createNotification({
    userId,
    type: 'course_enrollment',
    title: 'Successfully Enrolled!',
    message: `You're now enrolled in "${courseTitle}". Happy learning!`,
    link: `/course/${courseId}/learn`,
    metadata: { courseId }
  });
};

exports.notifyCourseUpdate = async (userId, courseTitle, courseId, updateDetails) => {
  await createNotification({
    userId,
    type: 'course_update',
    title: 'Course Updated',
    message: `"${courseTitle}" has new content: ${updateDetails}`,
    link: `/course/${courseId}/learn`,
    metadata: { courseId, updateDetails }
  });
};

exports.notifyNewReview = async (userId, reviewerName, courseTitle, courseId, rating) => {
  await createNotification({
    userId,
    type: 'new_review',
    title: 'New Review on Your Course',
    message: `${reviewerName} left a ${rating}-star review on "${courseTitle}"`,
    link: `/instructor/courses/${courseId}?tab=reviews`,
    metadata: { courseId, reviewerName, rating }
  });
};

exports.notifyCertificateIssued = async (userId, courseTitle, courseId) => {
  await createNotification({
    userId,
    type: 'certificate_issued',
    title: 'Certificate Earned! 🎉',
    message: `Congratulations! You've earned a certificate for completing "${courseTitle}"`,
    link: `/student/certificates/${courseId}`,
    metadata: { courseId }
  });
};

exports.notifyQuizGraded = async (userId, quizTitle, courseId, lessonId, score) => {
  await createNotification({
    userId,
    type: 'quiz_graded',
    title: 'Quiz Graded',
    message: `Your quiz "${quizTitle}" has been graded. Score: ${score}%`,
    link: `/course/${courseId}/learn?lesson=${lessonId}`,
    metadata: { courseId, lessonId, quizTitle, score }
  });
};

exports.notifySubscriptionExpiring = async (userId, planName, daysLeft) => {
  await createNotification({
    userId,
    type: 'subscription_expiring',
    title: 'Subscription Expiring Soon',
    message: `Your ${planName} subscription will expire in ${daysLeft} days. Renew to keep access to your courses.`,
    link: `/student/subscription`,
    metadata: { planName, daysLeft }
  });
};

exports.notifyAnnouncement = async (userId, announcementTitle, announcementMessage, link = null) => {
  await createNotification({
    userId,
    type: 'announcement',
    title: announcementTitle,
    message: announcementMessage,
    link: link || `/student/dashboard`,
    metadata: {}
  });
};

// Instructor-specific notifications

exports.notifyInstructorNewEnrollment = async (instructorId, studentName, courseTitle, courseId) => {
  await createNotification({
    userId: instructorId,
    type: 'new_enrollment',
    title: 'New Student Enrollment',
    message: `${studentName} enrolled in your course "${courseTitle}"`,
    link: `/instructor/courses/${courseId}?tab=students`,
    metadata: { courseId, studentName }
  });
};

exports.notifyInstructorCourseCompletion = async (instructorId, studentName, courseTitle, courseId) => {
  await createNotification({
    userId: instructorId,
    type: 'course_completion',
    title: 'Student Completed Course',
    message: `${studentName} completed your course "${courseTitle}"`,
    link: `/instructor/courses/${courseId}?tab=students`,
    metadata: { courseId, studentName }
  });
};

exports.notifyInstructorNewMessage = async (instructorId, senderName, conversationId = null) => {
  await createNotification({
    userId: instructorId,
    type: 'new_message',
    title: 'New Message',
    message: `You have a new message from ${senderName}`,
    link: conversationId ? `/instructor/messages?conversation=${conversationId}` : `/instructor/messages`,
    metadata: { senderName, conversationId }
  });
};