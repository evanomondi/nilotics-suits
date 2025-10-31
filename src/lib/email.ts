import nodemailer from "nodemailer";
import Handlebars from "handlebars";

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: parseInt(process.env.BREVO_PORT || "587"),
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

const templates = {
  measurementSubmitted: `
    <h2>Measurement Submitted</h2>
    <p>Hello,</p>
    <p>Measurements have been submitted for work order <strong>{{workOrderId}}</strong>.</p>
    <p>Customer: {{customerName}} ({{customerEmail}})</p>
    <p>Please review and approve.</p>
  `,
  measurementApproved: `
    <h2>Measurements Approved</h2>
    <p>Hello {{tailorName}},</p>
    <p>Measurements for work order <strong>{{workOrderId}}</strong> have been approved.</p>
    <p>Customer: {{customerName}}</p>
  `,
  productionStarted: `
    <h2>Production Started</h2>
    <p>Hello {{customerName}},</p>
    <p>Your order <strong>{{workOrderId}}</strong> is now in production.</p>
    <p>Estimated completion: {{dueDate}}</p>
  `,
  qcPassed: `
    <h2>QC Inspection Passed</h2>
    <p>Work order <strong>{{workOrderId}}</strong> passed quality control.</p>
    <p>Inspector: {{inspectorName}}</p>
    <p>Ready to ship.</p>
  `,
  qcFailed: `
    <h2>QC Inspection Failed</h2>
    <p>Work order <strong>{{workOrderId}}</strong> failed quality control.</p>
    <p>Inspector: {{inspectorName}}</p>
    <p>Rework task has been created.</p>
  `,
  shipmentCreated: `
    <h2>Your Order Has Been Shipped</h2>
    <p>Hello {{customerName}},</p>
    <p>Your order <strong>{{workOrderId}}</strong> has been shipped.</p>
    <p>Tracking number: <strong>{{waybill}}</strong></p>
    <p>Courier: {{courier}}</p>
  `,
  readyForPickup: `
    <h2>Order Ready for Pickup</h2>
    <p>Hello {{customerName}},</p>
    <p>Your order <strong>{{workOrderId}}</strong> is ready for pickup at our EU location.</p>
    <p>Please contact us to schedule pickup.</p>
  `,
  orderDelivered: `
    <h2>Order Delivered</h2>
    <p>Hello {{customerName}},</p>
    <p>Your order <strong>{{workOrderId}}</strong> has been delivered.</p>
    <p>Waybill: {{waybill}}</p>
    <p>Thank you for choosing Nilotic Suits!</p>
  `,
  taskDueSoon: `
    <h2>Task Reminder: Due Soon</h2>
    <p>Hello {{assigneeName}},</p>
    <p>Task "<strong>{{taskTitle}}</strong>" is due on {{dueAt}}.</p>
    {{#if workOrderId}}<p>Work Order: {{workOrderId}}</p>{{/if}}
    <p>Please complete this task on time.</p>
  `,
  taskOverdue: `
    <h2>Task Overdue</h2>
    <p>Hello {{assigneeName}},</p>
    <p>Task "<strong>{{taskTitle}}</strong>" was due on {{dueAt}}.</p>
    {{#if workOrderId}}<p>Work Order: {{workOrderId}}</p>{{/if}}
    <p>Please complete this task as soon as possible.</p>
  `,
};

export async function sendEmail({ to, subject, template, data }: EmailOptions) {
  try {
    const htmlTemplate = templates[template as keyof typeof templates];
    if (!htmlTemplate) {
      throw new Error(`Template ${template} not found`);
    }

    const compiled = Handlebars.compile(htmlTemplate);
    const html = compiled(data);

    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || "Nilotic Suits"}" <${
        process.env.BREVO_FROM_EMAIL
      }>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    // Don't throw - email failures shouldn't break the app
  }
}
