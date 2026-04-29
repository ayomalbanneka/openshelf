const prisma = require('./src/config/prisma')

async function main() {
  const row = await prisma.user.findFirst({
    select: { id: true, isEmailVerified: true },
  })
  console.log('OK', row)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
