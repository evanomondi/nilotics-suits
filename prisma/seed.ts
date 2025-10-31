import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Owner user
  const owner = await prisma.user.upsert({
    where: { email: "owner@niloticsuits.com" },
    update: {},
    create: {
      email: "owner@niloticsuits.com",
      name: "System Owner",
      role: "OWNER",
      verified: true,
    },
  });
  console.log("✓ Created owner user:", owner.email);

  // Create sample EU Tailor
  const euTailor = await prisma.user.upsert({
    where: { email: "tailor.eu@niloticsuits.com" },
    update: {},
    create: {
      email: "tailor.eu@niloticsuits.com",
      name: "Jean-Pierre Dubois",
      role: "EU_TAILOR",
      region: "EU",
      verified: true,
      skills: ["measurement", "fitting", "alterations"],
    },
  });
  console.log("✓ Created EU tailor:", euTailor.email);

  // Create sample KE Tailors
  const keTailor1 = await prisma.user.upsert({
    where: { email: "tailor.ke1@niloticsuits.com" },
    update: {},
    create: {
      email: "tailor.ke1@niloticsuits.com",
      name: "James Kamau",
      role: "KE_TAILOR",
      region: "KE",
      verified: true,
      skills: ["cutting", "sewing", "finishing"],
    },
  });
  console.log("✓ Created KE tailor:", keTailor1.email);

  const keTailor2 = await prisma.user.upsert({
    where: { email: "tailor.ke2@niloticsuits.com" },
    update: {},
    create: {
      email: "tailor.ke2@niloticsuits.com",
      name: "Grace Wanjiru",
      role: "KE_TAILOR",
      region: "KE",
      verified: true,
      skills: ["sewing", "embroidery"],
    },
  });
  console.log("✓ Created KE tailor:", keTailor2.email);

  // Create QC Inspector
  const qcInspector = await prisma.user.upsert({
    where: { email: "qc@niloticsuits.com" },
    update: {},
    create: {
      email: "qc@niloticsuits.com",
      name: "Sarah Mwangi",
      role: "QC",
      verified: true,
    },
  });
  console.log("✓ Created QC inspector:", qcInspector.email);

  // Create Ops user
  const ops = await prisma.user.upsert({
    where: { email: "ops@niloticsuits.com" },
    update: {},
    create: {
      email: "ops@niloticsuits.com",
      name: "Operations Manager",
      role: "OPS",
      verified: true,
    },
  });
  console.log("✓ Created ops user:", ops.email);

  // Create sample QC Form
  const qcForm = await prisma.qCForm.upsert({
    where: { id: "default-qc-form" },
    update: {},
    create: {
      id: "default-qc-form",
      name: "Standard Suit QC",
      active: true,
      steps: [
        {
          name: "Fabric Quality",
          checkpoints: [
            "No loose threads",
            "Even stitching",
            "Proper seam alignment",
          ],
        },
        {
          name: "Measurements",
          checkpoints: [
            "Sleeve length matches spec",
            "Jacket length matches spec",
            "Trouser inseam matches spec",
          ],
        },
        {
          name: "Finishing",
          checkpoints: [
            "Buttons securely attached",
            "Lining properly fixed",
            "Press and clean",
          ],
        },
      ],
    },
  });
  console.log("✓ Created QC form:", qcForm.name);

  // Create sample customer and work order
  const customer = await prisma.customer.create({
    data: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+33612345678",
      country: "France",
      city: "Paris",
    },
  });
  console.log("✓ Created sample customer:", customer.email);

  const workOrder = await prisma.workOrder.create({
    data: {
      customerId: customer.id,
      currentStage: "measurement_pending",
      priority: 1,
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      assignedEuTailorId: euTailor.id,
    },
  });
  console.log("✓ Created sample work order:", workOrder.id);

  // Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        workOrderId: workOrder.id,
        type: "cutting",
        status: "pending",
      },
      {
        workOrderId: workOrder.id,
        type: "sewing_coat",
        status: "pending",
      },
      {
        workOrderId: workOrder.id,
        type: "sewing_trouser",
        status: "pending",
      },
      {
        workOrderId: workOrder.id,
        type: "finishing",
        status: "pending",
      },
    ],
  });
  console.log("✓ Created sample tasks");

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
