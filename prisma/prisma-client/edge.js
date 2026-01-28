
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/edge.js')


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

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

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
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "C:\\Users\\USER\\Downloads\\Integration Project\\Project\\learnlab-server\\prisma\\prisma-client",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [],
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../.env"
  },
  "relativePath": "..",
  "clientVersion": "5.15.0",
  "engineVersion": "12e25d8d06f6ea5a0252864dd9a03b1bb51f3022",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "mysql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider = \"prisma-client-js\"\n  output   = \"./prisma-client\"\n}\n\ndatasource db {\n  provider = \"mysql\"\n  url      = env(\"DATABASE_URL\")\n}\n\nmodel AssessmentOptions {\n  id                  BigInt              @id @default(autoincrement())\n  question_id         BigInt\n  option_text         String?             @db.VarChar(255)\n  is_correct          Boolean?            @default(false)\n  AssessmentQuestions AssessmentQuestions @relation(fields: [question_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_option_question\")\n  UserAnswers         UserAnswers[]\n\n  @@index([question_id], map: \"fk_option_question\")\n}\n\nmodel AssessmentQuestions {\n  id                BigInt                            @id @default(autoincrement())\n  assessment_id     BigInt\n  question_text     String                            @db.Text\n  question_type     AssessmentQuestions_question_type\n  AssessmentOptions AssessmentOptions[]\n  Assessments       Assessments                       @relation(fields: [assessment_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_question_assessment\")\n  UserAnswers       UserAnswers[]\n\n  @@index([assessment_id], map: \"fk_question_assessment\")\n}\n\nmodel Assessments {\n  id                  BigInt                @id @default(autoincrement())\n  content_id          BigInt\n  title               String?               @db.VarChar(255)\n  instructions        String?               @db.Text\n  AssessmentQuestions AssessmentQuestions[]\n  CourseContent       CourseContent         @relation(fields: [content_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_assessment_content\")\n  QuizAttempts        QuizAttempts[]\n\n  @@index([content_id], map: \"fk_assessment_content\")\n}\n\nmodel Categories {\n  id      BigInt    @id @default(autoincrement())\n  name    String    @db.VarChar(255)\n  Courses Courses[]\n}\n\nmodel Certificates {\n  id              BigInt    @id @default(autoincrement())\n  user_id         BigInt\n  course_id       BigInt\n  certificate_url String?   @db.VarChar(500)\n  issued_at       DateTime? @default(now()) @db.Timestamp(0)\n  Courses         Courses   @relation(fields: [course_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_certificate_course\")\n  Users           Users     @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_certificate_user\")\n\n  @@index([course_id], map: \"fk_certificate_course\")\n  @@index([user_id], map: \"fk_certificate_user\")\n}\n\nmodel CourseContent {\n  id                  BigInt             @id @default(autoincrement())\n  course_id           BigInt\n  parent_id           BigInt?\n  title               String             @db.VarChar(255)\n  type                CourseContent_type\n  video_url           String?            @db.VarChar(500)\n  note_content        String?            @db.Text\n  duration_seconds    Int?\n  order_index         Int\n  Assessments         Assessments[]\n  Courses             Courses            @relation(fields: [course_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_content_course\")\n  CourseContent       CourseContent?     @relation(\"CourseContentToCourseContent\", fields: [parent_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_content_parent\")\n  other_CourseContent CourseContent[]    @relation(\"CourseContentToCourseContent\")\n  LessonProgress      LessonProgress[]\n\n  @@index([course_id], map: \"fk_content_course\")\n  @@index([parent_id], map: \"fk_content_parent\")\n}\n\nmodel CourseTags {\n  id        BigInt              @id @default(autoincrement())\n  course_id BigInt\n  tag_name  String              @db.VarChar(255)\n  tag_type  CourseTags_tag_type\n  Courses   Courses             @relation(fields: [course_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_coursetags_course\")\n\n  @@index([course_id], map: \"fk_coursetags_course\")\n}\n\nmodel Courses {\n  id                BigInt             @id @default(autoincrement())\n  instructor_id     BigInt\n  title             String             @db.VarChar(255)\n  subtitle          String?            @db.VarChar(255)\n  description       String?            @db.Text\n  category_id       BigInt\n  price             Decimal?           @db.Decimal(10, 2)\n  thumbnail_url     String?            @db.VarChar(500)\n  level             Courses_level      @default(beginner)\n  views             Int?               @default(0)\n  enrollments_count Int?               @default(0)\n  created_at        DateTime?          @default(now()) @db.Timestamp(0)\n  updated_at        DateTime?          @default(now()) @db.Timestamp(0)\n  Certificates      Certificates[]\n  CourseContent     CourseContent[]\n  CourseTags        CourseTags[]\n  Categories        Categories         @relation(fields: [category_id], references: [id], onUpdate: NoAction, map: \"fk_course_category\")\n  Users             Users              @relation(fields: [instructor_id], references: [id], onUpdate: NoAction, map: \"fk_course_instructor\")\n  Enrollments       Enrollments[]\n  Payments          Payments[]\n  Reviews           Reviews[]\n  ShoppingCart      ShoppingCart[]\n  UserSavedCourses  UserSavedCourses[]\n\n  @@index([category_id], map: \"fk_course_category\")\n  @@index([instructor_id], map: \"fk_course_instructor\")\n}\n\nmodel Enrollments {\n  id          BigInt    @id @default(autoincrement())\n  user_id     BigInt\n  course_id   BigInt\n  enrolled_at DateTime? @default(now()) @db.Timestamp(0)\n  Courses     Courses   @relation(fields: [course_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_enrollment_course\")\n  Users       Users     @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_enrollment_user\")\n\n  @@index([course_id], map: \"fk_enrollment_course\")\n  @@index([user_id], map: \"fk_enrollment_user\")\n}\n\nmodel LessonProgress {\n  id            BigInt        @id @default(autoincrement())\n  user_id       BigInt\n  content_id    BigInt\n  is_completed  Boolean?      @default(false)\n  completed_at  DateTime?     @db.Timestamp(0)\n  CourseContent CourseContent @relation(fields: [content_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_progress_content\")\n  Users         Users         @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_progress_user\")\n\n  @@index([content_id], map: \"fk_progress_content\")\n  @@index([user_id], map: \"fk_progress_user\")\n}\n\nmodel Messages {\n  id                                BigInt    @id @default(autoincrement())\n  sender_id                         BigInt\n  receiver_id                       BigInt\n  content                           String    @db.Text\n  created_at                        DateTime? @default(now()) @db.Timestamp(0)\n  Users_Messages_receiver_idToUsers Users     @relation(\"Messages_receiver_idToUsers\", fields: [receiver_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_message_receiver\")\n  Users_Messages_sender_idToUsers   Users     @relation(\"Messages_sender_idToUsers\", fields: [sender_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_message_sender\")\n\n  @@index([receiver_id], map: \"fk_message_receiver\")\n  @@index([sender_id], map: \"fk_message_sender\")\n}\n\nmodel MultiFactorAuth {\n  id         BigInt                   @id @default(autoincrement())\n  user_id    BigInt\n  mfa_type   MultiFactorAuth_mfa_type\n  secret_key String?                  @db.VarChar(255)\n  is_enabled Boolean?                 @default(false)\n  created_at DateTime?                @default(now()) @db.Timestamp(0)\n  Users      Users                    @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_mfa_user\")\n\n  @@index([user_id], map: \"fk_mfa_user\")\n}\n\nmodel Notifications {\n  id         BigInt              @id @default(autoincrement())\n  user_id    BigInt\n  message    String              @db.Text\n  type       Notifications_type?\n  is_read    Boolean?            @default(false)\n  created_at DateTime?           @default(now()) @db.Timestamp(0)\n  Users      Users               @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_notification_user\")\n\n  @@index([user_id], map: \"fk_notification_user\")\n}\n\nmodel Payments {\n  id                   BigInt             @id @default(autoincrement())\n  user_id              BigInt\n  course_id            BigInt?\n  subscription_plan_id BigInt?\n  amount               Decimal            @db.Decimal(10, 2)\n  currency             String             @db.VarChar(10)\n  method               Payments_method\n  status               Payments_status\n  transaction_id       String?            @db.VarChar(255)\n  created_at           DateTime?          @default(now()) @db.Timestamp(0)\n  updated_at           DateTime?          @default(now()) @db.Timestamp(0)\n  Courses              Courses?           @relation(fields: [course_id], references: [id], onUpdate: NoAction, map: \"fk_payment_course\")\n  SubscriptionPlans    SubscriptionPlans? @relation(fields: [subscription_plan_id], references: [id], onUpdate: NoAction, map: \"fk_payment_plan\")\n  Users                Users              @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_payment_user\")\n\n  @@index([course_id], map: \"fk_payment_course\")\n  @@index([subscription_plan_id], map: \"fk_payment_plan\")\n  @@index([user_id], map: \"fk_payment_user\")\n}\n\nmodel QuizAttempts {\n  id            BigInt        @id @default(autoincrement())\n  user_id       BigInt\n  assessment_id BigInt\n  score         Int?\n  started_at    DateTime?     @default(now()) @db.Timestamp(0)\n  completed_at  DateTime?     @db.Timestamp(0)\n  Assessments   Assessments   @relation(fields: [assessment_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_attempt_assessment\")\n  Users         Users         @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_attempt_user\")\n  UserAnswers   UserAnswers[]\n\n  @@index([assessment_id], map: \"fk_attempt_assessment\")\n  @@index([user_id], map: \"fk_attempt_user\")\n}\n\nmodel Reviews {\n  id                                 BigInt    @id @default(autoincrement())\n  user_id                            BigInt\n  course_id                          BigInt?\n  instructor_id                      BigInt?\n  rating                             Int\n  review_text                        String?   @db.Text\n  created_at                         DateTime? @default(now()) @db.Timestamp(0)\n  Courses                            Courses?  @relation(fields: [course_id], references: [id], onUpdate: NoAction, map: \"fk_review_course\")\n  Users_Reviews_instructor_idToUsers Users?    @relation(\"Reviews_instructor_idToUsers\", fields: [instructor_id], references: [id], onUpdate: NoAction, map: \"fk_review_instructor\")\n  Users_Reviews_user_idToUsers       Users     @relation(\"Reviews_user_idToUsers\", fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_review_user\")\n\n  @@index([course_id], map: \"fk_review_course\")\n  @@index([instructor_id], map: \"fk_review_instructor\")\n  @@index([user_id], map: \"fk_review_user\")\n}\n\nmodel ShoppingCart {\n  id        BigInt    @id @default(autoincrement())\n  user_id   BigInt\n  course_id BigInt\n  added_at  DateTime? @default(now()) @db.Timestamp(0)\n  Courses   Courses   @relation(fields: [course_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_cart_course\")\n  Users     Users     @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_cart_user\")\n\n  @@index([course_id], map: \"fk_cart_course\")\n  @@index([user_id], map: \"fk_cart_user\")\n}\n\nmodel SubscriptionPlans {\n  id            BigInt          @id @default(autoincrement())\n  name          String          @db.VarChar(255)\n  price         Decimal         @db.Decimal(10, 2)\n  duration_days Int\n  description   String?         @db.Text\n  Payments      Payments[]\n  Subscriptions Subscriptions[]\n}\n\nmodel Subscriptions {\n  id                BigInt               @id @default(autoincrement())\n  user_id           BigInt\n  plan_id           BigInt\n  status            Subscriptions_status\n  start_date        DateTime             @db.Date\n  end_date          DateTime             @db.Date\n  SubscriptionPlans SubscriptionPlans    @relation(fields: [plan_id], references: [id], onUpdate: NoAction, map: \"fk_sub_plan\")\n  Users             Users                @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_sub_user\")\n\n  @@index([plan_id], map: \"fk_sub_plan\")\n  @@index([user_id], map: \"fk_sub_user\")\n}\n\nmodel UserAnswers {\n  id                  BigInt              @id @default(autoincrement())\n  attempt_id          BigInt\n  question_id         BigInt\n  selected_option_id  BigInt?\n  answer_text         String?             @db.Text\n  QuizAttempts        QuizAttempts        @relation(fields: [attempt_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_answer_attempt\")\n  AssessmentOptions   AssessmentOptions?  @relation(fields: [selected_option_id], references: [id], onUpdate: NoAction, map: \"fk_answer_option\")\n  AssessmentQuestions AssessmentQuestions @relation(fields: [question_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_answer_question\")\n\n  @@index([attempt_id], map: \"fk_answer_attempt\")\n  @@index([selected_option_id], map: \"fk_answer_option\")\n  @@index([question_id], map: \"fk_answer_question\")\n}\n\nmodel UserSavedCourses {\n  id        BigInt  @id @default(autoincrement())\n  user_id   BigInt\n  course_id BigInt\n  Courses   Courses @relation(fields: [course_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_saved_course\")\n  Users     Users   @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction, map: \"fk_saved_user\")\n\n  @@index([course_id], map: \"fk_saved_course\")\n  @@index([user_id], map: \"fk_saved_user\")\n}\n\nmodel Users {\n  id                                   BigInt                              @id @default(autoincrement())\n  email                                String                              @unique(map: \"email\") @db.VarChar(255)\n  password_hash                        String                              @db.VarChar(255)\n  role                                 Users_role                          @default(student)\n  first_name                           String?                             @db.VarChar(100)\n  last_name                            String?                             @db.VarChar(100)\n  headline                             String?                             @db.VarChar(255)\n  biography                            String?                             @db.Text\n  photo_url                            String?                             @db.VarChar(500)\n  field_of_learning                    String?                             @db.VarChar(255)\n  occupation                           String?                             @db.VarChar(255)\n  skills                               Json?\n  interests                            Json?\n  resume_url                           String?                             @db.VarChar(500)\n  instructor_application_status        Users_instructor_application_status @default(none)\n  instructor_application_submitted_at  DateTime?                           @db.Timestamp(0)\n  instructor_reviewed_at               DateTime?                           @db.Timestamp(0)\n  instructor_admin_comment             String?                             @db.Text\n  created_at                           DateTime?                           @default(now()) @db.Timestamp(0)\n  updated_at                           DateTime?                           @default(now()) @db.Timestamp(0)\n  Certificates                         Certificates[]\n  Courses                              Courses[]\n  Enrollments                          Enrollments[]\n  LessonProgress                       LessonProgress[]\n  Messages_Messages_receiver_idToUsers Messages[]                          @relation(\"Messages_receiver_idToUsers\")\n  Messages_Messages_sender_idToUsers   Messages[]                          @relation(\"Messages_sender_idToUsers\")\n  MultiFactorAuth                      MultiFactorAuth[]\n  Notifications                        Notifications[]\n  Payments                             Payments[]\n  QuizAttempts                         QuizAttempts[]\n  Reviews_Reviews_instructor_idToUsers Reviews[]                           @relation(\"Reviews_instructor_idToUsers\")\n  Reviews_Reviews_user_idToUsers       Reviews[]                           @relation(\"Reviews_user_idToUsers\")\n  ShoppingCart                         ShoppingCart[]\n  Subscriptions                        Subscriptions[]\n  UserSavedCourses                     UserSavedCourses[]\n}\n\nenum MultiFactorAuth_mfa_type {\n  email\n  sms\n  authenticator\n}\n\nenum AssessmentQuestions_question_type {\n  mcq\n  truefalse\n  text\n}\n\nenum CourseTags_tag_type {\n  topic\n  keyword\n}\n\nenum Notifications_type {\n  course_enrollment\n  new_message\n  new_review\n  certificate_issued\n  course_update\n  announcement\n  quiz_graded\n  subscription_expiring\n}\n\nenum Subscriptions_status {\n  active\n  canceled\n  expired\n}\n\nenum Users_role {\n  student\n  instructor\n  admin\n}\n\nenum CourseContent_type {\n  section\n  video\n  note\n  assessment\n}\n\nenum Payments_method {\n  stripe\n  paypal\n}\n\nenum Payments_status {\n  paid\n  failed\n  refunded\n}\n\nenum Courses_level {\n  beginner\n  intermediate\n  advanced\n  all_levels\n}\n\nenum Users_instructor_application_status {\n  none\n  pending\n  approved\n  rejected\n}\n",
  "inlineSchemaHash": "7c7a940b8be6b497cdaf5d0f3d52977a13282781698b0fa45eca508f1d14a043",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"AssessmentOptions\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"question_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"option_text\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"is_correct\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"AssessmentQuestions\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AssessmentQuestions\",\"relationName\":\"AssessmentOptionsToAssessmentQuestions\",\"relationFromFields\":[\"question_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"UserAnswers\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"UserAnswers\",\"relationName\":\"AssessmentOptionsToUserAnswers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"AssessmentQuestions\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"assessment_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"question_text\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"question_type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AssessmentQuestions_question_type\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"AssessmentOptions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AssessmentOptions\",\"relationName\":\"AssessmentOptionsToAssessmentQuestions\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Assessments\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Assessments\",\"relationName\":\"AssessmentQuestionsToAssessments\",\"relationFromFields\":[\"assessment_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"UserAnswers\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"UserAnswers\",\"relationName\":\"AssessmentQuestionsToUserAnswers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Assessments\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"content_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"title\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"instructions\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"AssessmentQuestions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AssessmentQuestions\",\"relationName\":\"AssessmentQuestionsToAssessments\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"CourseContent\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CourseContent\",\"relationName\":\"AssessmentsToCourseContent\",\"relationFromFields\":[\"content_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"QuizAttempts\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"QuizAttempts\",\"relationName\":\"AssessmentsToQuizAttempts\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Categories\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Courses\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Courses\",\"relationName\":\"CategoriesToCourses\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Certificates\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"certificate_url\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"issued_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Courses\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Courses\",\"relationName\":\"CertificatesToCourses\",\"relationFromFields\":[\"course_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"CertificatesToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"CourseContent\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"parent_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"title\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CourseContent_type\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"video_url\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"note_content\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"duration_seconds\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"order_index\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Assessments\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Assessments\",\"relationName\":\"AssessmentsToCourseContent\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Courses\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Courses\",\"relationName\":\"CourseContentToCourses\",\"relationFromFields\":[\"course_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"CourseContent\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CourseContent\",\"relationName\":\"CourseContentToCourseContent\",\"relationFromFields\":[\"parent_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"other_CourseContent\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CourseContent\",\"relationName\":\"CourseContentToCourseContent\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"LessonProgress\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LessonProgress\",\"relationName\":\"CourseContentToLessonProgress\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"CourseTags\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tag_name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tag_type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CourseTags_tag_type\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Courses\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Courses\",\"relationName\":\"CourseTagsToCourses\",\"relationFromFields\":[\"course_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Courses\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"instructor_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"title\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"subtitle\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"category_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"price\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"thumbnail_url\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"level\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Courses_level\",\"default\":\"beginner\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"views\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"enrollments_count\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Certificates\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Certificates\",\"relationName\":\"CertificatesToCourses\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"CourseContent\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CourseContent\",\"relationName\":\"CourseContentToCourses\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"CourseTags\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CourseTags\",\"relationName\":\"CourseTagsToCourses\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Categories\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Categories\",\"relationName\":\"CategoriesToCourses\",\"relationFromFields\":[\"category_id\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"CoursesToUsers\",\"relationFromFields\":[\"instructor_id\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Enrollments\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Enrollments\",\"relationName\":\"CoursesToEnrollments\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Payments\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Payments\",\"relationName\":\"CoursesToPayments\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Reviews\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Reviews\",\"relationName\":\"CoursesToReviews\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"ShoppingCart\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ShoppingCart\",\"relationName\":\"CoursesToShoppingCart\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"UserSavedCourses\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"UserSavedCourses\",\"relationName\":\"CoursesToUserSavedCourses\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Enrollments\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"enrolled_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Courses\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Courses\",\"relationName\":\"CoursesToEnrollments\",\"relationFromFields\":[\"course_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"EnrollmentsToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"LessonProgress\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"content_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"is_completed\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"completed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"CourseContent\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CourseContent\",\"relationName\":\"CourseContentToLessonProgress\",\"relationFromFields\":[\"content_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"LessonProgressToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Messages\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sender_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"receiver_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"content\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users_Messages_receiver_idToUsers\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"Messages_receiver_idToUsers\",\"relationFromFields\":[\"receiver_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users_Messages_sender_idToUsers\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"Messages_sender_idToUsers\",\"relationFromFields\":[\"sender_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"MultiFactorAuth\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"mfa_type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"MultiFactorAuth_mfa_type\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"secret_key\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"is_enabled\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"MultiFactorAuthToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Notifications\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"message\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Notifications_type\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"is_read\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"NotificationsToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Payments\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"subscription_plan_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"amount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currency\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"method\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Payments_method\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Payments_status\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"transaction_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Courses\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Courses\",\"relationName\":\"CoursesToPayments\",\"relationFromFields\":[\"course_id\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"SubscriptionPlans\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"SubscriptionPlans\",\"relationName\":\"PaymentsToSubscriptionPlans\",\"relationFromFields\":[\"subscription_plan_id\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"PaymentsToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"QuizAttempts\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"assessment_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"score\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"started_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"completed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Assessments\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Assessments\",\"relationName\":\"AssessmentsToQuizAttempts\",\"relationFromFields\":[\"assessment_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"QuizAttemptsToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"UserAnswers\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"UserAnswers\",\"relationName\":\"QuizAttemptsToUserAnswers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Reviews\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"instructor_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"rating\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"review_text\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Courses\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Courses\",\"relationName\":\"CoursesToReviews\",\"relationFromFields\":[\"course_id\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users_Reviews_instructor_idToUsers\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"Reviews_instructor_idToUsers\",\"relationFromFields\":[\"instructor_id\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users_Reviews_user_idToUsers\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"Reviews_user_idToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ShoppingCart\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"added_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Courses\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Courses\",\"relationName\":\"CoursesToShoppingCart\",\"relationFromFields\":[\"course_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"ShoppingCartToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SubscriptionPlans\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"price\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"duration_days\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Payments\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Payments\",\"relationName\":\"PaymentsToSubscriptionPlans\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Subscriptions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Subscriptions\",\"relationName\":\"SubscriptionPlansToSubscriptions\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Subscriptions\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"plan_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Subscriptions_status\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"start_date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"end_date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"SubscriptionPlans\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"SubscriptionPlans\",\"relationName\":\"SubscriptionPlansToSubscriptions\",\"relationFromFields\":[\"plan_id\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"SubscriptionsToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"UserAnswers\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"attempt_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"question_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"selected_option_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"answer_text\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"QuizAttempts\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"QuizAttempts\",\"relationName\":\"QuizAttemptsToUserAnswers\",\"relationFromFields\":[\"attempt_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"AssessmentOptions\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AssessmentOptions\",\"relationName\":\"AssessmentOptionsToUserAnswers\",\"relationFromFields\":[\"selected_option_id\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"AssessmentQuestions\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AssessmentQuestions\",\"relationName\":\"AssessmentQuestionsToUserAnswers\",\"relationFromFields\":[\"question_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"UserSavedCourses\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"BigInt\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Courses\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Courses\",\"relationName\":\"CoursesToUserSavedCourses\",\"relationFromFields\":[\"course_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Users\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Users\",\"relationName\":\"UserSavedCoursesToUsers\",\"relationFromFields\":[\"user_id\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Users\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"email\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"password_hash\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"role\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Users_role\",\"default\":\"student\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"first_name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"last_name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"headline\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"biography\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"photo_url\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"field_of_learning\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"occupation\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"skills\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"interests\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resume_url\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"instructor_application_status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Users_instructor_application_status\",\"default\":\"none\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"instructor_application_submitted_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"instructor_reviewed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"instructor_admin_comment\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Certificates\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Certificates\",\"relationName\":\"CertificatesToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Courses\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Courses\",\"relationName\":\"CoursesToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Enrollments\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Enrollments\",\"relationName\":\"EnrollmentsToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"LessonProgress\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LessonProgress\",\"relationName\":\"LessonProgressToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Messages_Messages_receiver_idToUsers\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Messages\",\"relationName\":\"Messages_receiver_idToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Messages_Messages_sender_idToUsers\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Messages\",\"relationName\":\"Messages_sender_idToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"MultiFactorAuth\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"MultiFactorAuth\",\"relationName\":\"MultiFactorAuthToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Notifications\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Notifications\",\"relationName\":\"NotificationsToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Payments\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Payments\",\"relationName\":\"PaymentsToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"QuizAttempts\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"QuizAttempts\",\"relationName\":\"QuizAttemptsToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Reviews_Reviews_instructor_idToUsers\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Reviews\",\"relationName\":\"Reviews_instructor_idToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Reviews_Reviews_user_idToUsers\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Reviews\",\"relationName\":\"Reviews_user_idToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"ShoppingCart\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ShoppingCart\",\"relationName\":\"ShoppingCartToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"Subscriptions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Subscriptions\",\"relationName\":\"SubscriptionsToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"UserSavedCourses\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"UserSavedCourses\",\"relationName\":\"UserSavedCoursesToUsers\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false}},\"enums\":{\"MultiFactorAuth_mfa_type\":{\"values\":[{\"name\":\"email\",\"dbName\":null},{\"name\":\"sms\",\"dbName\":null},{\"name\":\"authenticator\",\"dbName\":null}],\"dbName\":null},\"AssessmentQuestions_question_type\":{\"values\":[{\"name\":\"mcq\",\"dbName\":null},{\"name\":\"truefalse\",\"dbName\":null},{\"name\":\"text\",\"dbName\":null}],\"dbName\":null},\"CourseTags_tag_type\":{\"values\":[{\"name\":\"topic\",\"dbName\":null},{\"name\":\"keyword\",\"dbName\":null}],\"dbName\":null},\"Notifications_type\":{\"values\":[{\"name\":\"course_enrollment\",\"dbName\":null},{\"name\":\"new_message\",\"dbName\":null},{\"name\":\"new_review\",\"dbName\":null},{\"name\":\"certificate_issued\",\"dbName\":null},{\"name\":\"course_update\",\"dbName\":null},{\"name\":\"announcement\",\"dbName\":null},{\"name\":\"quiz_graded\",\"dbName\":null},{\"name\":\"subscription_expiring\",\"dbName\":null}],\"dbName\":null},\"Subscriptions_status\":{\"values\":[{\"name\":\"active\",\"dbName\":null},{\"name\":\"canceled\",\"dbName\":null},{\"name\":\"expired\",\"dbName\":null}],\"dbName\":null},\"Users_role\":{\"values\":[{\"name\":\"student\",\"dbName\":null},{\"name\":\"instructor\",\"dbName\":null},{\"name\":\"admin\",\"dbName\":null}],\"dbName\":null},\"CourseContent_type\":{\"values\":[{\"name\":\"section\",\"dbName\":null},{\"name\":\"video\",\"dbName\":null},{\"name\":\"note\",\"dbName\":null},{\"name\":\"assessment\",\"dbName\":null}],\"dbName\":null},\"Payments_method\":{\"values\":[{\"name\":\"stripe\",\"dbName\":null},{\"name\":\"paypal\",\"dbName\":null}],\"dbName\":null},\"Payments_status\":{\"values\":[{\"name\":\"paid\",\"dbName\":null},{\"name\":\"failed\",\"dbName\":null},{\"name\":\"refunded\",\"dbName\":null}],\"dbName\":null},\"Courses_level\":{\"values\":[{\"name\":\"beginner\",\"dbName\":null},{\"name\":\"intermediate\",\"dbName\":null},{\"name\":\"advanced\",\"dbName\":null},{\"name\":\"all_levels\",\"dbName\":null}],\"dbName\":null},\"Users_instructor_application_status\":{\"values\":[{\"name\":\"none\",\"dbName\":null},{\"name\":\"pending\",\"dbName\":null},{\"name\":\"approved\",\"dbName\":null},{\"name\":\"rejected\",\"dbName\":null}],\"dbName\":null}},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

