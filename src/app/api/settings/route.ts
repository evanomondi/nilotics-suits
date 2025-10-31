import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || "default-key-change-in-production";
const ALGORITHM = "aes-256-cbc";

function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// GET /api/settings
export async function GET(req: NextRequest) {
  const session = await requirePermission("settings:read");
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = req.nextUrl;
    const keys = searchParams.get("keys")?.split(",");

    const where = keys ? { key: { in: keys } } : {};

    const settings = await prisma.setting.findMany({
      where,
      select: {
        key: true,
        value: true,
        encrypted: true,
      },
    });

    // Decrypt encrypted values
    const decryptedSettings: Record<string, string> = {};
    for (const setting of settings) {
      decryptedSettings[setting.key] = setting.encrypted
        ? decrypt(setting.value)
        : setting.value;
    }

    return NextResponse.json(decryptedSettings);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  const session = await requirePermission("settings:update");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const user = session.user as any;

    // Define which keys should be encrypted
    const encryptedKeys = [
      "aramex_password",
      "aramex_account_pin",
      "smtp_password",
    ];

    // Upsert each setting
    for (const [key, value] of Object.entries(body)) {
      if (typeof value !== "string") continue;

      const shouldEncrypt = encryptedKeys.includes(key);
      const storedValue = shouldEncrypt ? encrypt(value) : value;

      await prisma.setting.upsert({
        where: { key },
        update: {
          value: storedValue,
          encrypted: shouldEncrypt,
        },
        create: {
          key,
          value: storedValue,
          encrypted: shouldEncrypt,
        },
      });
    }

    await logAudit({
      actorId: user.id,
      action: "settings_updated",
      target: "system",
      diff: { keys: Object.keys(body) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
