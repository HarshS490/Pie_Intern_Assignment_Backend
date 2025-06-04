import { InteractionType, PrismaClient } from "@prisma/client";
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seed() {
  const user = await prisma.user.upsert({
    where: { username: "testUser" },
    update: {},
    create: {
      username: "testUser",
      avatarUrl: "https://avatar.iran.liara.run/public",
    },
  });

  const users = [user];
  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({
      data: {
        username: faker.internet.username() + faker.number.int(),
        avatarUrl: faker.image.avatar(),
      },
    });
    users.push(user);
  }

  // Create 10 videos, each linked to a random user
  const videos = [];
  for (let i = 0; i < 10; i++) {
    const user =
      users[Math.floor(Math.random()*(users.length))];
    const video = await prisma.video.create({
      data: {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        videoUrl: faker.internet.url(),
        userId: user.id,
        metadata: {
          create: {
            label: faker.lorem.word(),
            thumbnailUrl: faker.image.url(),
          },
        },
      },
    });
    videos.push(video);
  }

  // Create random interactions for videos by users
  for (let i = 0; i < 50; i++) {
    const user =
      users[Math.floor(Math.random()*(users.length))];
    const video =
      videos[Math.floor(Math.random()*(videos.length))];
    const interactionType = faker.helpers.arrayElement([
      InteractionType.like,
      InteractionType.comment,
      InteractionType.view,
    ]);

    await prisma.interaction.create({
      data: {
        userId: user.id,
        videoId: video.id,
        type: interactionType,
        content:
          interactionType === InteractionType.comment
            ? faker.lorem.sentence()
            : null,
      },
    });
  }

  console.log("Seeding complete!");
}

seed()
  .catch((e) => {
    console.error("Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
