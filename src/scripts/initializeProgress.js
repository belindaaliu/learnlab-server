// scripts/initializeProgress.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeAllProgress() {
  try {
    console.log("Starting progress initialization...");
    
    // Get all users
    const users = await prisma.users.findMany();
    console.log(`Found ${users.length} users`);
    
    // Get all courses
    const courses = await prisma.courses.findMany();
    console.log(`Found ${courses.length} courses`);

    let totalProgressCreated = 0;
    let totalEnrollmentsProcessed = 0;

    for (const user of users) {
      for (const course of courses) {
        // Check if user is enrolled in course
        const enrollment = await prisma.enrollments.findFirst({
          where: {
            user_id: user.id,
            course_id: course.id
          }
        });

        if (enrollment) {
          totalEnrollmentsProcessed++;
          
          // Get all non-section content for this course
          const allContent = await prisma.courseContent.findMany({
            where: { 
              course_id: course.id,
              type: { not: "section" }
            }
          });

          console.log(`User ${user.id} enrolled in course ${course.id}, found ${allContent.length} lessons`);

          for (const content of allContent) {
            // Check if progress record exists
            const existingProgress = await prisma.lessonProgress.findFirst({
              where: {
                user_id: user.id,
                content_id: content.id
              }
            });

            // If no progress record exists, create one
            if (!existingProgress) {
              await prisma.lessonProgress.create({
                data: {
                  user_id: user.id,
                  content_id: content.id,
                  is_completed: false,
                  completed_at: null
                }
              });
              totalProgressCreated++;
              console.log(`  Created progress for content ${content.id} (${content.title})`);
            } else {
              console.log(`  Progress already exists for content ${content.id}`);
            }
          }
        }
      }
    }

    console.log("\n==========================================");
    console.log("Progress initialization complete!");
    console.log(`Processed ${totalEnrollmentsProcessed} enrollments`);
    console.log(`Created ${totalProgressCreated} new progress records`);
    console.log("==========================================");

  } catch (error) {
    console.error("Error initializing progress:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  process.exit(1);
});

// Run the initialization
initializeAllProgress();