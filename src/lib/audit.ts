import { prisma } from "./prisma";

interface LogAuditOptions {
  actorId?: string;
  action: string;
  target: string;
  diff?: any;
}

export async function logAudit(options: LogAuditOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: options.actorId || null,
        action: options.action,
        target: options.target,
        diff: options.diff || null,
      },
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}
