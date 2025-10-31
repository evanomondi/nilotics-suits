import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// GET /api/work-orders
export async function GET(req: NextRequest) {
  const session = await requirePermission("work-orders:read");
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const stage = searchParams.get("stage");
    const tailorId = searchParams.get("tailorId");

    const where: any = { deletedAt: null };
    if (stage) where.currentStage = stage;
    if (tailorId) where.assignedEuTailorId = tailorId;

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          customer: true,
          assignedEuTailor: { select: { id: true, name: true, email: true } },
          tasks: { where: { deletedAt: null } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workOrder.count({ where }),
    ]);

    return NextResponse.json({
      workOrders,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get work orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch work orders" },
      { status: 500 }
    );
  }
}

// POST /api/work-orders
export async function POST(req: NextRequest) {
  const session = await requirePermission("work-orders:create");
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { customerData, priority, dueAt } = body;

    // Create or find customer
    let customer;
    if (customerData.id) {
      customer = await prisma.customer.findUnique({
        where: { id: customerData.id },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          country: customerData.country,
          city: customerData.city,
        },
      });
    }

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Create work order
    const workOrder = await prisma.workOrder.create({
      data: {
        customerId: customer.id,
        currentStage: "measurement_pending",
        priority: priority || 0,
        dueAt: dueAt ? new Date(dueAt) : null,
      },
      include: {
        customer: true,
      },
    });

    await logAudit({
      actorId: (session.user as any).id,
      action: "work_order_created",
      target: workOrder.id,
      diff: { customerId: customer.id },
    });

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Create work order error:", error);
    return NextResponse.json(
      { error: "Failed to create work order" },
      { status: 500 }
    );
  }
}
