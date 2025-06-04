import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { username: "testUser" },
    update: {},
    create: {
      username: "testUser",
      avatarUrl: "https://avatar.iran.liara.run/public",
    },
  });
}

main()
  .catch((e) => {
    console.error("Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
