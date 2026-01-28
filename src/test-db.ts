import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()


async function main() {
  console.log("Connecting to database...")

  const now = await prisma.$queryRaw`SELECT NOW() as currentTime`
  console.log("Database time:", now)

  const users = await prisma.users.findMany()
  console.log("Users:", users)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
  })
