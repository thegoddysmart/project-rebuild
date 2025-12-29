import { PrismaClient } from "@prisma/client";

// Load environment variables (Node 20+)
try {
  process.loadEnvFile();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (e) {
  console.log("Could not load .env file directly (might already be loaded)");
}

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.event.count({
    where: {
      type: "VOTING",
    },
  });
  console.log(`\n\n>> VOTING EVENTS COUNT: ${count} <<\n\n`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
