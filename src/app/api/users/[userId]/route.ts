import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// DELETE /api/users/[userId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requirePermission("users:delete");
  if (session instanceof NextResponse) return session;

  try {
    const { userId } = await params;
    const user = session.user as any;

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      actorId: user.id,
      action: "user_deleted",
      target: userId,
      diff: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
