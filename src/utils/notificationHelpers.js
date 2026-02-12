const { createNotification } = require('../controllers/notificationController');

// Helper functions to create notifications for different events

exports.notifyCoursePurchase = async (userId, courseTitle, courseId) => {
  await createNotification({
    userId,
    type: 'purchase',
    title: 'Course Purchased Successfully!',
    message: `You've successfully enrolled in "${courseTitle}". Start learning now!`,
    link: `/student/learning?tab=courses`,
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

exports.notifyNewMessage = async (userId, senderName, messageId = null) => {
  await createNotification({
    userId,
    type: 'new_message',
    title: 'New Message',
    message: `You have a new message from ${senderName}`,
    link: `/student/messages`,
    metadata: { messageId, senderName }
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

exports.notifyNewReview = async (userId, reviewerName, courseTitle, courseId) => {
  await createNotification({
    userId,
    type: 'new_review',
    title: 'New Review on Your Course',
    message: `${reviewerName} left a review on "${courseTitle}"`,
    link: `/courses/${courseId}`,
    metadata: { courseId, reviewerName }
  });
};

exports.notifyCertificateIssued = async (userId, courseTitle, courseId, certificateUrl) => {
  await createNotification({
    userId,
    type: 'certificate_issued',
    title: 'Certificate Earned! 🎉',
    message: `Congratulations! You've earned a certificate for completing "${courseTitle}"`,
    link: `/student/certificates`,
    metadata: { courseId, certificateUrl }
  });
};

exports.notifyQuizGraded = async (userId, quizTitle, courseId, score) => {
  await createNotification({
    userId,
    type: 'quiz_graded',
    title: 'Quiz Graded',
    message: `Your quiz "${quizTitle}" has been graded. Score: ${score}%`,
    link: `/course/${courseId}/learn`,
    metadata: { courseId, quizTitle, score }
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
    link: link,
    metadata: {}
  });
};