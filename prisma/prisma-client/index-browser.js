
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.15.0
 * Query Engine version: 12e25d8d06f6ea5a0252864dd9a03b1bb51f3022
 */
Prisma.prismaVersion = {
  client: "5.15.0",
  engine: "12e25d8d06f6ea5a0252864dd9a03b1bb51f3022"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AssessmentOptionsScalarFieldEnum = {
  id: 'id',
  question_id: 'question_id',
  option_text: 'option_text',
  is_correct: 'is_correct'
};

exports.Prisma.AssessmentQuestionsScalarFieldEnum = {
  id: 'id',
  assessment_id: 'assessment_id',
  question_text: 'question_text',
  question_type: 'question_type'
};

exports.Prisma.AssessmentsScalarFieldEnum = {
  id: 'id',
  content_id: 'content_id',
  title: 'title',
  instructions: 'instructions'
};

exports.Prisma.CategoriesScalarFieldEnum = {
  id: 'id',
  name: 'name'
};

exports.Prisma.CertificatesScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  course_id: 'course_id',
  certificate_url: 'certificate_url',
  issued_at: 'issued_at'
};

exports.Prisma.CourseContentScalarFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  parent_id: 'parent_id',
  title: 'title',
  type: 'type',
  video_url: 'video_url',
  note_content: 'note_content',
  duration_seconds: 'duration_seconds',
  order_index: 'order_index'
};

exports.Prisma.CourseTagsScalarFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  tag_name: 'tag_name',
  tag_type: 'tag_type'
};

exports.Prisma.CoursesScalarFieldEnum = {
  id: 'id',
  instructor_id: 'instructor_id',
  title: 'title',
  subtitle: 'subtitle',
  description: 'description',
  category_id: 'category_id',
  price: 'price',
  thumbnail_url: 'thumbnail_url',
  level: 'level',
  views: 'views',
  enrollments_count: 'enrollments_count',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.EnrollmentsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  course_id: 'course_id',
  enrolled_at: 'enrolled_at'
};

exports.Prisma.LessonProgressScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  content_id: 'content_id',
  is_completed: 'is_completed',
  completed_at: 'completed_at'
};

exports.Prisma.MessagesScalarFieldEnum = {
  id: 'id',
  sender_id: 'sender_id',
  receiver_id: 'receiver_id',
  content: 'content',
  created_at: 'created_at'
};

exports.Prisma.MultiFactorAuthScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  mfa_type: 'mfa_type',
  secret_key: 'secret_key',
  is_enabled: 'is_enabled',
  created_at: 'created_at'
};

exports.Prisma.NotificationsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  message: 'message',
  type: 'type',
  is_read: 'is_read',
  created_at: 'created_at'
};

exports.Prisma.PaymentsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  course_id: 'course_id',
  subscription_plan_id: 'subscription_plan_id',
  amount: 'amount',
  currency: 'currency',
  method: 'method',
  status: 'status',
  transaction_id: 'transaction_id',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.QuizAttemptsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  assessment_id: 'assessment_id',
  score: 'score',
  started_at: 'started_at',
  completed_at: 'completed_at'
};

exports.Prisma.ReviewsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  course_id: 'course_id',
  instructor_id: 'instructor_id',
  rating: 'rating',
  review_text: 'review_text',
  created_at: 'created_at'
};

exports.Prisma.ShoppingCartScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  course_id: 'course_id',
  added_at: 'added_at'
};

exports.Prisma.SubscriptionPlansScalarFieldEnum = {
  id: 'id',
  name: 'name',
  price: 'price',
  duration_days: 'duration_days',
  description: 'description'
};

exports.Prisma.SubscriptionsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  plan_id: 'plan_id',
  status: 'status',
  start_date: 'start_date',
  end_date: 'end_date'
};

exports.Prisma.UserAnswersScalarFieldEnum = {
  id: 'id',
  attempt_id: 'attempt_id',
  question_id: 'question_id',
  selected_option_id: 'selected_option_id',
  answer_text: 'answer_text'
};

exports.Prisma.UserSavedCoursesScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  course_id: 'course_id'
};

exports.Prisma.UsersScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password_hash: 'password_hash',
  role: 'role',
  first_name: 'first_name',
  last_name: 'last_name',
  headline: 'headline',
  biography: 'biography',
  photo_url: 'photo_url',
  field_of_learning: 'field_of_learning',
  occupation: 'occupation',
  skills: 'skills',
  interests: 'interests',
  resume_url: 'resume_url',
  instructor_application_status: 'instructor_application_status',
  instructor_application_submitted_at: 'instructor_application_submitted_at',
  instructor_reviewed_at: 'instructor_reviewed_at',
  instructor_admin_comment: 'instructor_admin_comment',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.AssessmentQuestions_question_type = exports.$Enums.AssessmentQuestions_question_type = {
  mcq: 'mcq',
  truefalse: 'truefalse',
  text: 'text'
};

exports.CourseContent_type = exports.$Enums.CourseContent_type = {
  section: 'section',
  video: 'video',
  note: 'note',
  assessment: 'assessment'
};

exports.CourseTags_tag_type = exports.$Enums.CourseTags_tag_type = {
  topic: 'topic',
  keyword: 'keyword'
};

exports.Courses_level = exports.$Enums.Courses_level = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
  all_levels: 'all_levels'
};

exports.MultiFactorAuth_mfa_type = exports.$Enums.MultiFactorAuth_mfa_type = {
  email: 'email',
  sms: 'sms',
  authenticator: 'authenticator'
};

exports.Notifications_type = exports.$Enums.Notifications_type = {
  course_enrollment: 'course_enrollment',
  new_message: 'new_message',
  new_review: 'new_review',
  certificate_issued: 'certificate_issued',
  course_update: 'course_update',
  announcement: 'announcement',
  quiz_graded: 'quiz_graded',
  subscription_expiring: 'subscription_expiring'
};

exports.Payments_method = exports.$Enums.Payments_method = {
  stripe: 'stripe',
  paypal: 'paypal'
};

exports.Payments_status = exports.$Enums.Payments_status = {
  paid: 'paid',
  failed: 'failed',
  refunded: 'refunded'
};

exports.Subscriptions_status = exports.$Enums.Subscriptions_status = {
  active: 'active',
  canceled: 'canceled',
  expired: 'expired'
};

exports.Users_role = exports.$Enums.Users_role = {
  student: 'student',
  instructor: 'instructor',
  admin: 'admin'
};

exports.Users_instructor_application_status = exports.$Enums.Users_instructor_application_status = {
  none: 'none',
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected'
};

exports.Prisma.ModelName = {
  AssessmentOptions: 'AssessmentOptions',
  AssessmentQuestions: 'AssessmentQuestions',
  Assessments: 'Assessments',
  Categories: 'Categories',
  Certificates: 'Certificates',
  CourseContent: 'CourseContent',
  CourseTags: 'CourseTags',
  Courses: 'Courses',
  Enrollments: 'Enrollments',
  LessonProgress: 'LessonProgress',
  Messages: 'Messages',
  MultiFactorAuth: 'MultiFactorAuth',
  Notifications: 'Notifications',
  Payments: 'Payments',
  QuizAttempts: 'QuizAttempts',
  Reviews: 'Reviews',
  ShoppingCart: 'ShoppingCart',
  SubscriptionPlans: 'SubscriptionPlans',
  Subscriptions: 'Subscriptions',
  UserAnswers: 'UserAnswers',
  UserSavedCourses: 'UserSavedCourses',
  Users: 'Users'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
