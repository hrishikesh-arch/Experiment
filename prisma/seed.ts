import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create Experiment
  const experiment = await prisma.experiment.upsert({
    where: { groupCode: "DEMO123" },
    update: {},
    create: {
      name: "Digital Bystander Demo",
      description: "Default demo experiment",
      groupCode: "DEMO123",
      status: "ACTIVE",
    },
  });

  // Create Condition
  await prisma.condition.create({
    data: {
      experimentId: experiment.id,
      name: "Condition 1 (10 Bystanders)",
      bystanderCount: 10,
      activityLevel: "MEDIUM",
      participantTargeting: "MEDIUM",
      scenarioType: "REQUEST_HELP",
      scenarioDelaySeconds: 60, // 1 minute for demo
    },
  });

  // Create Bots
  const bots = [
    { name: "Rahul", personality: "TALKATIVE", activityLevel: "HIGH" },
    { name: "Sarah", personality: "QUIET", activityLevel: "LOW" },
    { name: "Aman", personality: "HUMOROUS", activityLevel: "MEDIUM" },
    { name: "Priya", personality: "HELPFUL", activityLevel: "HIGH" },
    { name: "Arjun", personality: "DISTRACTED", activityLevel: "LOW" },
    { name: "Neha", personality: "CURIOUS", activityLevel: "MEDIUM" },
    { name: "Vikram", personality: "NEUTRAL", activityLevel: "MEDIUM" },
    { name: "Riya", personality: "SOCIAL", activityLevel: "HIGH" },
    { name: "Karan", personality: "TALKATIVE", activityLevel: "HIGH" },
    { name: "Meera", personality: "QUIET", activityLevel: "LOW" },
  ];

  for (const bot of bots) {
    await prisma.botProfile.create({
      data: {
        name: bot.name,
        personality: bot.personality,
        activityLevel: bot.activityLevel,
        participantInteraction: "MEDIUM",
        responseProbability: bot.activityLevel === "HIGH" ? 0.8 : bot.activityLevel === "MEDIUM" ? 0.5 : 0.2,
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
