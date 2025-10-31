import { prisma } from "./prisma";

export async function checkInstallation(): Promise<boolean> {
  try {
    // Check if database is accessible and has tables
    const userCount = await prisma.user.count();
    
    // If there are users, installation is complete
    return userCount > 0;
  } catch (error) {
    // Database not accessible or tables don't exist
    return false;
  }
}

export async function createInitialAdmin(data: {
  name: string;
  email: string;
  password: string;
}) {
  const bcrypt = require("bcrypt");
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: "OWNER",
      verified: true,
      // Note: NextAuth doesn't store passwords in User model by default
      // You'll need to handle this based on your auth setup
    },
  });

  return user;
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch (error) {
    return false;
  }
}
