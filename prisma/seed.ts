import 'dotenv/config';
import { PrismaService } from '../src/prisma/prisma.service.js';

const prisma = new PrismaService();

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: 'default@example.com',
    },
    update: {},
    create: {
      name: 'Default User',
      email: 'default@example.com',
    },
  });
  console.log('Default User:', user);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
