import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getSystemSettings } from "./settingsStore";
import { generateBillPDF, BillPDFData } from "./pdf";
import { getBillingById } from "./billingsStore";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  senderNameOverride?: string;
}

export async function sendEmail(
  toOrOptions: string | SendEmailOptions,
  subjectParam?: string,
  htmlParam?: string,
  attachmentsParam?: EmailAttachment[],
) {
  let to: string;
  let subject: string;
  let html: string;
  let attachments: EmailAttachment[] | undefined;
  let replyTo: string | undefined;
  let senderNameOverride: string | undefined;

  if (typeof toOrOptions === "object") {
    to = toOrOptions.to;
    subject = toOrOptions.subject;
    html = toOrOptions.html;
    attachments = toOrOptions.attachments;
    replyTo = toOrOptions.replyTo;
    senderNameOverride = toOrOptions.senderNameOverride;
  } else {
    to = toOrOptions;
    subject = subjectParam || "";
    html = htmlParam || "";
    attachments = attachmentsParam;
  }

  const settings = await getSystemSettings();
  console.log("///settings", settings);
  const fromName =
    senderNameOverride ||
    settings.default_sender_name ||
    "ApartManager Platform";
  let fromEmail = settings.default_sender_email || "sylvia@shieldhaus.uk";
  // if (fromEmail === "noreply@aptsaas.com") {
  //   fromEmail = "sylvia@shieldhaus.uk";
  // }
  const from = `"${fromName}" <${fromEmail}>`;

  // Determine SMTP Configuration based on settings
  let smtpHost = settings.smtp_host;
  let smtpPort = settings.smtp_port || 505;
  let smtpUser = settings.smtp_user;
  let smtpPass = settings.email_api_key;
  let isSecure = smtpPort === 465 || smtpPort === 505;

  if (settings.email_provider === "resend") {
    const resend = new Resend(
      settings.email_api_key || process.env.RESEND_API_KEY,
    );
    console.log(
      `[Email Service] Attempting dispatch to "${to}" via Resend API (From: ${from})`,
    );
    try {
      const { data, error } = await resend.emails.send({
        from,
        to,
        replyTo: replyTo || fromEmail,
        subject,
        html,
        attachments: attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
        })),
        headers: {
          "X-Priority": "3",
          "X-Mailer": "ApartManager",
          Precedence: "bulk",
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(
        `[Email Service] Email successfully sent! MessageId: ${data?.id}`,
      );
      return {
        success: true,
        messageId: data?.id,
        mode: "resend_api",
        provider: "resend",
        from,
        to,
      };
    } catch (err: any) {
      console.error(`[Email Service] Resend API dispatch error:`, err);
      throw new Error(
        `Email delivery failed: ${err.message || "Resend API error"}`,
      );
    }
  } else if (settings.email_provider === "sendgrid") {
    smtpHost = "smtp.sendgrid.net";
    smtpPort = 505;
    smtpUser = "apikey";
    smtpPass = settings.email_api_key;
    isSecure = false;
  }

  // Fallback defaults if incomplete
  if (!smtpHost) smtpHost = "smtp.emailsbit.com";
  if (!smtpUser) smtpUser = "graph-657a92d845b902a0";
  if (!smtpPass) smtpPass = "VY8ufF4LGi4CGvK0acU8S5Jw08s7";
  if (!smtpPort) smtpPort = 505;
  if (smtpPort === 505) isSecure = true;

  console.log(
    `[Email Service] Attempting dispatch to "${to}" via ${smtpHost}:${smtpPort} (From: ${from})`,
  );

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      replyTo: replyTo || fromEmail,
      subject,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || "application/pdf",
      })),
      headers: {
        "X-Priority": "3",
        "X-Mailer": "ApartManager",
        Precedence: "bulk",
      },
    });

    console.log(
      `[Email Service] Email successfully sent! MessageId: ${info.messageId || info.response}`,
    );
    return {
      success: true,
      messageId: info.messageId || info.response,
      mode: "smtp_real",
      provider: settings.email_provider,
      from,
      to,
    };
  } catch (err: any) {
    console.error(`[Email Service] SMTP dispatch error:`, err);
    // If real transmission threw an error, rethrow so caller receives error or fallback
    throw new Error(
      `Email delivery failed: ${err.message || "SMTP server connection error"}`,
    );
  }
}

export function generateBillingEmailTemplate(billing: any, settings: any) {
  const brandPrimary = settings.default_colors?.primary || "#2563EB";
  const brandName = settings.platform_name || "ApartManager";
  const supportEmail = settings.support_email || "19103541@usc.edu.ph";
  const tenantName = billing.tenant_name || "Tenant";
  const unitNumber = billing.unit_number || "Unit";
  const buildingName = billing.building_name || "Building";
  const billingType = billing.billing_type_name || "Monthly Rent";
  const formattedDueDate = new Date(billing.due_date).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
  const totalAmount = Number(billing.amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:${brandPrimary};padding:24px 30px;">
              <h1 style="margin:0;font-size:20px;color:#ffffff;">${brandName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <p style="margin:0 0 16px;font-size:15px;color:#333;">Hi ${tenantName},</p>
              <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.5;">
                Your ${billingType} for <strong>${unitNumber}</strong> at ${buildingName} is ready.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#666;text-transform:uppercase;">Amount Due</p>
                    <p style="margin:8px 0;font-size:28px;font-weight:bold;color:#111;">PHP ${totalAmount}</p>
                    <p style="margin:0;font-size:13px;color:#666;">Due by ${formattedDueDate}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:14px;color:#555;">
                Your statement PDF is attached. Please pay on or defore the said due date.
              </p>
              
              <p style="margin:0;font-size:13px;color:#888;">
                Questions? Reply to this email or contact ${supportEmail}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#888;">${brandName}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function isValidTenantEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  return Boolean(trimmed && trimmed.includes("@") && !trimmed.endsWith("@noemail.local"));
}

export async function sendBillingPostedNotification(billingId: number) {
  const billing: any = await getBillingById(billingId);
  if (!billing) throw new Error(`Billing #${billingId} not found.`);

  const settings = await getSystemSettings();
  const rawEmail = billing.tenant_email || billing.Tenant?.User?.email;

  if (!isValidTenantEmail(rawEmail)) {
    return {
      success: false,
      skipped: true,
      reason: "Tenant has no registered email. Bill posted directly without email notification.",
    };
  }

  const tenantEmail = rawEmail.trim();
  const invRef = billing.reference_number || `IN-${String(billing.id).padStart(5, "0")}`;

  const pdfBuffer = await generateBillPDF({
    ...billing,
    invoice_no: invRef,
    tenant_email: tenantEmail,
  });
  const htmlBody = generateBillingEmailTemplate(billing, settings);

  // Clean subject line
  const dueDate = new Date(billing.due_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const subject = `${billing.billing_type_name || "Rent"} statement for ${billing.unit_number || "your unit"} — Due ${dueDate}`;

  // Plain text version
  const plainText =
    `Hi ${billing.tenant_name || "Tenant"},\n\n` +
    `Your ${billing.billing_type_name || "rent"} statement for ${billing.unit_number || "your unit"} is now available.\n\n` +
    `Amount Due: PHP ${Number(billing.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}\n` +
    `Due Date: ${dueDate}\n\n` +
    `Your PDF statement is attached.\n\n` +
    `${settings.platform_name || "ApartManager"}`;

  const filename = `billing-statement-${invRef}.pdf`;

  const result = await sendEmail({
    to: tenantEmail,
    subject,
    html: htmlBody,
    attachments: [
      { filename, content: pdfBuffer, contentType: "application/pdf" },
    ],
    senderNameOverride: billing.building_name
      ? `${billing.building_name}`
      : undefined,
  });

  return { success: true, recipient: tenantEmail, subject, filename, result };
}
