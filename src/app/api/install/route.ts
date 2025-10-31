import { NextRequest, NextResponse } from "next/server";
import { checkInstallation, createInitialAdmin, testDatabaseConnection } from "@/lib/installation";
import { prisma } from "@/lib/prisma";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// GET /api/install - Check installation status
export async function GET() {
  try {
    const isInstalled = await checkInstallation();
    const dbConnected = await testDatabaseConnection();

    return NextResponse.json({
      isInstalled,
      dbConnected,
      envCheck: {
        databaseUrl: !!process.env.DATABASE_URL,
        nextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, isInstalled: false, dbConnected: false },
      { status: 500 }
    );
  }
}

// POST /api/install - Run installation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, data } = body;

    switch (step) {
      case "test-db":
        const dbConnected = await testDatabaseConnection();
        return NextResponse.json({ success: dbConnected });

      case "run-migration":
        try {
          // Run Prisma migration
          const { stdout, stderr } = await execAsync("npx prisma migrate deploy");
          return NextResponse.json({ success: true, output: stdout });
        } catch (error: any) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
          );
        }

      case "create-admin":
        // Check if any users exist
        const existingUsers = await prisma.user.count();
        if (existingUsers > 0) {
          return NextResponse.json(
            { success: false, error: "Admin user already exists" },
            { status: 400 }
          );
        }

        // Create admin user
        const admin = await createInitialAdmin({
          name: data.name,
          email: data.email,
          password: data.password,
        });

        return NextResponse.json({ success: true, user: { id: admin.id, email: admin.email } });

      case "complete":
        // Mark installation as complete (could write a flag file)
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Installation error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
