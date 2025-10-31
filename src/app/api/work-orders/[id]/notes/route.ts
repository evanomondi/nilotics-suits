import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// POST /api/work-orders/[id]/notes
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const body = await req.json();
    const user = session.user as any;

    // Validate work order exists
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    // Create note
    const note = await prisma.note.create({
      data: {
        workOrderId: id,
        authorId: user.id,
        body: body.body,
        visibility: body.visibility || "internal",
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logAudit({
      actorId: user.id,
      action: "note_created",
      target: id,
      diff: { noteId: note.id, visibility: note.visibility },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
