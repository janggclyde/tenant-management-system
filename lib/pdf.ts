import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { getEmbeddedAfm } from "./afmFonts";

// Ensure PDFKit AFM fonts (Helvetica, Times, Courier, etc.) are always found in production serverless environments
const originalReadFileSync = fs.readFileSync;
if (!(fs as any).__pdfkitFontPatched) {
  (fs as any).__pdfkitFontPatched = true;
  (fs as any).readFileSync = function (file: any, options: any) {
    if (typeof file === "string" && file.endsWith(".afm")) {
      const filename = path.basename(file);

      // 1. If file actually exists on disk at requested path, read it
      try {
        if (fs.existsSync(file)) {
          return originalReadFileSync.call(fs, file, options);
        }
      } catch (e) {}

      // 2. Check embedded in-memory AFM font dictionary (works in Vercel/Lambda/serverless without disk files)
      const embedded = getEmbeddedAfm(filename);
      if (embedded) {
        if (
          typeof options === "string" &&
          (options === "utf8" || options === "utf-8")
        ) {
          return embedded;
        }
        if (
          typeof options === "object" &&
          (options?.encoding === "utf8" || options?.encoding === "utf-8")
        ) {
          return embedded;
        }
        return Buffer.from(embedded, "utf8");
      }

      // 3. Fallback to common disk paths
      const fallbacks = [
        path.join(process.cwd(), "assets/data", filename),
        path.join(process.cwd(), "public/data", filename),
        path.join(process.cwd(), "node_modules/pdfkit/js/data", filename),
        path.join(__dirname, "data", filename),
        path.join(process.cwd(), ".next/server/chunks/data", filename),
      ];

      for (const fb of fallbacks) {
        try {
          if (fs.existsSync(fb)) {
            return originalReadFileSync.call(fs, fb, options);
          }
        } catch (e) {}
      }
    }
    return originalReadFileSync.call(fs, file, options);
  };
}

export interface BillPDFData {
  id: number;
  invoice_no?: string;
  billing_type_name: string;
  tenant_name: string;
  tenant_email: string;
  unit_number: string;
  building_name: string;
  building_address?: string;
  base_amount: number;
  tax_percentage?: number;
  tax_amount?: number;
  transfer_fee?: number;
  late_fee_applied?: number;
  meter_readings_json?: {
    electricity?: {
      previous: number;
      current: number;
      consumption?: number;
      rate_per_unit?: number;
      rate?: number;
      amount?: number;
    };
    water?: {
      previous: number;
      current: number;
      consumption?: number;
      rate_per_unit?: number;
      rate?: number;
      amount?: number;
    };
  };
  extra_charges_json?: { name: string; amount: number }[];
  amount: number;
  due_date: string;
  billing_cycle?: string;
  status: string;
  created_at?: string;
  platform_name?: string;
  support_email?: string;
  support_phone?: string;
}

// Format Philippine Peso currency
function formatPHP(val: number | string | undefined | null): string {
  const num = Number(val || 0);
  return `PHP ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Draw Sylvia Geometric Logo Emblem
function drawSylviaLogo(doc: any, x: number, y: number, size = 36) {
  doc.save();

  // Outer rounded squircle container
  doc.roundedRect(x, y, size, size, 8).fill("#1d4ed8");

  // Subtle top-right sky sheen
  doc
    .path(
      `M ${x + size * 0.3} ${y} ` +
        `L ${x + size - 8} ${y} ` +
        `Q ${x + size} ${y} ${x + size} ${y + 8} ` +
        `L ${x + size} ${y + size * 0.6} ` +
        `Z`,
    )
    .fillOpacity(0.35)
    .fill("#38bdf8");

  // Architectural Building Outline (Crisp white vector lines)
  doc.fillOpacity(1);
  doc.strokeColor("#ffffff").lineWidth(1.5).lineCap("round").lineJoin("round");

  // Main high-rise building
  const bx = x + size * 0.22;
  const by = y + size * 0.24;
  const bw = size * 0.36;
  const bh = size * 0.54;
  doc.rect(bx, by, bw, bh).stroke();

  // Secondary building step
  const sx = bx + bw;
  const sy = y + size * 0.42;
  const sw = size * 0.2;
  const sh = size * 0.36;
  doc.rect(sx, sy, sw, sh).stroke();

  // Building interior window grid
  doc.lineWidth(1);
  doc
    .moveTo(bx + bw * 0.35, by + bh * 0.25)
    .lineTo(bx + bw * 0.35, by + bh * 0.45)
    .stroke();
  doc
    .moveTo(bx + bw * 0.65, by + bh * 0.25)
    .lineTo(bx + bw * 0.65, by + bh * 0.45)
    .stroke();
  doc
    .moveTo(bx + bw * 0.35, by + bh * 0.6)
    .lineTo(bx + bw * 0.35, by + bh * 0.8)
    .stroke();
  doc
    .moveTo(bx + bw * 0.65, by + bh * 0.6)
    .lineTo(bx + bw * 0.65, by + bh * 0.8)
    .stroke();

  // Golden Key Emblem badge at bottom-right (matching Sylvia login key)
  const kx = x + size - 3;
  const ky = y + size - 3;
  doc.circle(kx, ky, 6).fillAndStroke("#fbbf24", "#ffffff");

  // Key center dot
  doc.circle(kx, ky, 1.5).fill("#0f172a");

  doc.restore();
}

// Draw simulated PayMaya-style barcode pattern
function drawBarcode(
  doc: any,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  doc.save();
  const pattern = [
    2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1, 1, 1, 2,
    1, 3, 2, 1, 1, 2, 1, 1, 3, 2, 1, 2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1,
    3, 1, 2, 1, 1, 2, 3, 1, 1, 2,
  ];
  let curX = x;
  const totalSlots = pattern.reduce((a, b) => a + b, 0);
  const scale = width / totalSlots;

  doc.strokeColor("#1e293b");
  for (let i = 0; i < pattern.length; i++) {
    const barW = pattern[i] * scale;
    if (i % 2 === 0) {
      doc.lineWidth(barW);
      doc
        .moveTo(curX + barW / 2, y)
        .lineTo(curX + barW / 2, y + height)
        .stroke();
    }
    curX += barW;
  }
  doc.restore();
}

export async function generateBillPDF(billData: BillPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create Document with modern A4 dimensions (595.28 x 841.89)
      const doc = new PDFDocument({
        size: "A4",
        margin: 36,
        font: "Helvetica",
        info: {
          Title: `Billing Statement - #${billData.id}`,
          Author: billData.platform_name || "Sylvia v1.0",
          Subject: `Invoice #${billData.id} for Unit ${billData.unit_number}`,
          Keywords:
            "Invoice, PayMaya, Sylvia, PropTech, Statement of Account, Real Estate",
        },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      // =========================================================================
      // COLOR PALETTE — Matched with Sylvia Login & Liquid Loading Screens
      // =========================================================================
      const colors = {
        deepSlate: "#020617", // Deepest Slate 950 (Backdrop)
        slateDark: "#0f172a", // Slate 900 (High contrast text, dark containers)
        slateText: "#334155", // Slate 700 (Body text)
        slateMuted: "#64748b", // Slate 500 (Labels, secondary)
        slateLight: "#94a3b8", // Slate 400 (Subtle borders, meta)
        borderSubtle: "#e2e8f0", // Slate 200 (Clean divider lines)
        cardBg: "#f8fafc", // Slate 50 (Card backgrounds)
        iceBlue: "#f0f9ff", // Sky 50 (Hero and Ways-to-Pay tint)
        iceBorder: "#bae6fd", // Sky 200 (Hero card borders)

        // Sylvia Brand Gradients
        brandNavy: "#1e3a8a", // Base deep blue
        brandBlue: "#1d4ed8", // Sylvia Primary Blue (from button/logo)
        brandVibrant: "#2563eb", // Vibrant blue
        brandSky: "#0284c7", // Loader front wave blue
        brandCyan: "#38bdf8", // Loader crest highlight cyan
        cyanGlow: "#67e8f9", // Wave crest specular shine
        amberKey: "#f59e0b", // Sylvia logo golden key accent

        // Status Badges
        greenText: "#059669",
        greenBg: "#ecfdf5",
        greenBorder: "#a7f3d0",

        amberText: "#d97706",
        amberBg: "#fffbeb",
        amberBorder: "#fde68a",

        redText: "#dc2626",
        redBg: "#fef2f2",
        redBorder: "#fca5a5",
      };

      const pageWidth = 595.28;
      const contentLeft = 36;
      const contentWidth = 523.28;
      const contentRight = contentLeft + contentWidth;

      // =========================================================================
      // 1. TOP MULTI-TONE ACCENT RIBBON (Simulating Fluid Water Gradient)
      // =========================================================================
      doc.rect(0, 0, 340, 4).fill(colors.brandBlue);
      doc.rect(340, 0, 140, 4).fill(colors.brandSky);
      doc.rect(480, 0, pageWidth - 480, 4).fill(colors.brandCyan);

      // =========================================================================
      // 2. HEADER: SYLVIA BRANDING & DOCUMENT STATUS
      // =========================================================================
      const headerY = 28;

      // Brand Logo Emblem
      drawSylviaLogo(doc, contentLeft, headerY + 1, 38);

      // Platform Brand & PropTech Tag
      doc
        .fillColor(colors.slateDark)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("Sylvia", contentLeft + 48, headerY);

      // Brand Slogan / Subtitle
      doc
        .fillColor(colors.slateMuted)
        .font("Helvetica")
        .fontSize(8)
        .text(
          "Intelligent Property & Resident Management",
          contentLeft + 48,
          headerY + 23,
        );

      // Support line
      const supportEmail = billData.support_email || "support@sylvia.ph";
      const supportPhone = billData.support_phone || "+63 917 888 7958";
      doc
        .fillColor(colors.slateLight)
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          `Support: ${supportEmail}  •  ${supportPhone}`,
          contentLeft + 48,
          headerY + 34,
        );

      // Right Side Header: Document Title & Status Pill
      doc
        .fillColor(colors.slateDark)
        .font("Helvetica-Bold")
        .fontSize(13)
        .text("STATEMENT OF ACCOUNT", contentLeft + 250, headerY, {
          width: contentWidth - 250,
          align: "right",
        });

      doc
        .fillColor(colors.brandSky)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("OFFICIAL BILLING INVOICE", contentLeft + 250, headerY + 16, {
          width: contentWidth - 250,
          align: "right",
        });

      // // PayMaya-Style Status Chip
      const normalizedStatus = (billData.status || "posted").toLowerCase();
      let statusBg = colors.greenBg;
      let statusBorder = colors.greenBorder;
      let statusText = colors.greenText;
      let statusLabel = "PAID IN FULL";
      let pillWidth = 92;

      if (
        normalizedStatus === "paid" ||
        normalizedStatus === "settled" ||
        normalizedStatus === "completed"
      ) {
        statusBg = colors.greenBg;
        statusBorder = colors.greenBorder;
        statusText = colors.greenText;
        statusLabel = "PAID IN FULL";
        pillWidth = 88;
      } else if (normalizedStatus === "overdue") {
        statusBg = colors.redBg;
        statusBorder = colors.redBorder;
        statusText = colors.redText;
        statusLabel = "OVERDUE";
        pillWidth = 76;
      } else {
        // posted, pending, unpaid
        statusBg = colors.iceBlue;
        statusBorder = colors.iceBorder;
        statusText = colors.brandSky;
        statusLabel = "PAYMENT DUE";
        pillWidth = 96;
      }

      // const pillX = contentRight - pillWidth;
      // const pillY = headerY + 29;

      // doc
      //   .roundedRect(pillX, pillY, pillWidth, 18, 9)
      //   .fillAndStroke(statusBg, statusBorder);

      // // Status indicator dot and text centered together
      // doc.circle(pillX + 12, pillY + 9, 3).fill(statusText);

      // doc
      //   .fillColor(statusText)
      //   .font("Helvetica-Bold")
      //   .fontSize(7.5)
      //   .text(statusLabel, pillX + 18, pillY + 4.5, {
      //     width: pillWidth - 22,
      //     align: "center",
      //   });

      // =========================================================================
      // 3. PAYMAYA HERO TRANSACTION AMOUNT CARD
      // =========================================================================
      const heroY = 82;
      const heroHeight = 64;

      // Main Hero Container with Ice-Blue Fill
      doc
        .roundedRect(contentLeft, heroY, contentWidth, heroHeight, 8)
        .fillAndStroke(colors.iceBlue, colors.iceBorder);

      // Left Accent Strip (Sylvia Cobalt Blue)
      doc.save();
      doc
        .roundedRect(contentLeft, heroY, 6, heroHeight, 4)
        .fill(colors.brandBlue);
      doc.restore();

      // Vertical Subtle Divider inside Hero Card
      const heroDividerX = contentLeft + 310;
      doc
        .strokeColor("#e0f2fe")
        .lineWidth(1)
        .moveTo(heroDividerX, heroY + 10)
        .lineTo(heroDividerX, heroY + heroHeight - 10)
        .stroke();

      // --- Left Hero Block: Amount Payable ---
      doc
        .fillColor(colors.brandSky)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("TOTAL AMOUNT PAYABLE", contentLeft + 20, heroY + 11);

      doc
        .fillColor(colors.slateDark)
        .font("Helvetica-Bold")
        .fontSize(22)
        .text(formatPHP(billData.amount), contentLeft + 20, heroY + 23);

      const invNo =
        billData.invoice_no || `INV-${String(billData.id).padStart(5, "0")}`;
      let cycleLabel = "Monthly Statement";
      const rawCycle = (billData.billing_cycle || "").toLowerCase();
      if (rawCycle.includes("quarter")) cycleLabel = "Quarterly Statement";
      else if (rawCycle.includes("annual")) cycleLabel = "Annual Statement";
      else if (rawCycle.includes("one")) cycleLabel = "One-Time Billing";

      doc
        .fillColor(colors.slateMuted)
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          `Invoice No: ${invNo}   •   Billing Cycle: ${cycleLabel}`,
          contentLeft + 20,
          heroY + 48,
        );

      // --- Right Hero Block: Payment Due & Issue Date ---
      doc
        .fillColor(colors.slateMuted)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("PAYMENT DUE DATE", heroDividerX + 16, heroY + 11);

      const formattedDueDate = new Date(billData.due_date).toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
        },
      );

      doc
        .fillColor(
          normalizedStatus === "overdue" ? colors.redText : colors.slateDark,
        )
        .font("Helvetica-Bold")
        .fontSize(12.5)
        .text(formattedDueDate, heroDividerX + 16, heroY + 24);

      const formattedIssueDate = new Date(
        billData.created_at || Date.now(),
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      doc
        .fillColor(colors.slateMuted)
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          `Statement Issued: ${formattedIssueDate}`,
          heroDividerX + 16,
          heroY + 48,
        );

      // =========================================================================
      // 4. RESIDENT & PROPERTY DETAILS CARDS (Two Columns)
      // =========================================================================
      const infoY = 154;
      const cardHeight = 68;
      const cardGap = 13.28;
      const cardWidth = (contentWidth - cardGap) / 2; // 255pt each
      const rightCardX = contentLeft + cardWidth + cardGap;

      // Clean unit formatting (Avoid "Unit Unit 402-B")
      const cleanUnit = (billData.unit_number || "")
        .toLowerCase()
        .startsWith("unit")
        ? billData.unit_number
        : `Unit ${billData.unit_number || "N/A"}`;

      // --- Left Card: Billed To (Resident) ---
      doc
        .roundedRect(contentLeft, infoY, cardWidth, cardHeight, 6)
        .fillAndStroke(colors.cardBg, colors.borderSubtle);

      doc
        .fillColor(colors.brandBlue)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("BILLED TO (RESIDENT)", contentLeft + 12, infoY + 10);

      doc
        .fillColor(colors.slateDark)
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .text(
          billData.tenant_name || "Valued Resident",
          contentLeft + 12,
          infoY + 22,
          {
            width: cardWidth - 24,
            ellipsis: true,
          },
        );

      doc
        .fillColor(colors.slateText)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(`Assigned: ${cleanUnit}`, contentLeft + 12, infoY + 37);

      doc
        .fillColor(colors.slateMuted)
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          `Email: ${billData.tenant_email || "N/A"}`,
          contentLeft + 12,
          infoY + 50,
          {
            width: cardWidth - 24,
            ellipsis: true,
          },
        );

      // --- Right Card: Property & Management Entity ---
      doc
        .roundedRect(rightCardX, infoY, cardWidth, cardHeight, 6)
        .fillAndStroke(colors.cardBg, colors.borderSubtle);

      doc
        .fillColor(colors.brandBlue)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("PROPERTY DETAILS & LOCATION", rightCardX + 12, infoY + 10);

      doc
        .fillColor(colors.slateDark)
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .text(
          billData.building_name || "Sylvia Prime Residences",
          rightCardX + 12,
          infoY + 22,
          {
            width: cardWidth - 24,
            ellipsis: true,
          },
        );

      const buildingAddr =
        billData.building_address || "Metro Manila, Philippines";
      doc
        .fillColor(colors.slateText)
        .font("Helvetica")
        .fontSize(7.5)
        .text(buildingAddr, rightCardX + 12, infoY + 37, {
          width: cardWidth - 24,
          height: 18,
          ellipsis: true,
        });

      doc
        .fillColor(colors.slateMuted)
        .font("Helvetica")
        .fontSize(7)
        .text(
          `Managed via Sylvia Real Estate Platform`,
          rightCardX + 12,
          infoY + 53,
        );

      // =========================================================================
      // 5. ITEMIZED BREAKDOWN TABLE (PayMaya FinTech Style)
      // =========================================================================
      let tableY = 230;

      // Table Header Container
      doc
        .roundedRect(contentLeft, tableY, contentWidth, 22, 4)
        .fill(colors.slateDark);

      // Cyan wave accent line underneath header (Liquid loader signature wave crest)
      doc
        .strokeColor(colors.brandCyan)
        .lineWidth(1.5)
        .moveTo(contentLeft, tableY + 22)
        .lineTo(contentRight, tableY + 22)
        .stroke();

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("PARTICULARS & CHARGE DESCRIPTION", contentLeft + 12, tableY + 7)
        .text("DETAILS", contentLeft + 225, tableY + 7)
        .text("AMOUNT (PHP)", contentLeft + 410, tableY + 7, {
          width: contentWidth - 422,
          align: "right",
        });

      tableY += 24;

      // Helper function to render a table row
      let rowIndex = 0;
      const renderRow = (
        title: string,
        subtitle: string,
        computation: string,
        amount: number,
        tag?: { label: string; color: string; bg: string },
      ) => {
        const rowHeight = 28;
        const rowBg = rowIndex % 2 === 0 ? "#ffffff" : colors.cardBg;

        // Background & subtle divider
        doc.rect(contentLeft, tableY, contentWidth, rowHeight).fill(rowBg);
        doc
          .strokeColor("#f1f5f9")
          .lineWidth(0.75)
          .moveTo(contentLeft, tableY + rowHeight)
          .lineTo(contentRight, tableY + rowHeight)
          .stroke();

        // Title and optional badge tag
        doc
          .fillColor(colors.slateDark)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text(title, contentLeft + 12, tableY + 6);

        if (tag) {
          const tagW = doc.widthOfString(tag.label) + 8;
          const titleW = doc.widthOfString(title);
          const tX = contentLeft + 16 + titleW;
          doc.roundedRect(tX, tableY + 5.5, tagW, 11, 3).fill(tag.bg);
          doc
            .fillColor(tag.color)
            .font("Helvetica-Bold")
            .fontSize(6)
            .text(tag.label, tX, tableY + 7.5, {
              width: tagW,
              align: "center",
            });
        }

        doc
          .fillColor(colors.slateMuted)
          .font("Helvetica")
          .fontSize(7)
          .text(subtitle, contentLeft + 12, tableY + 17, {
            width: 200,
            ellipsis: true,
          });

        // Computation details
        doc
          .fillColor(colors.slateText)
          .font("Helvetica")
          .fontSize(7.5)
          .text(computation, contentLeft + 225, tableY + 9.5, {
            width: 180,
            ellipsis: true,
          });

        // Row Amount
        doc
          .fillColor(colors.slateDark)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text(formatPHP(amount), contentLeft + 410, tableY + 9, {
            width: contentWidth - 422,
            align: "right",
          });

        tableY += rowHeight;
        rowIndex++;
      };

      // --- Row 1: Base Rent / Dues ---
      renderRow(
        billData.billing_type_name || "Monthly Rental Dues",
        `${cycleLabel} • ${cleanUnit}`,
        `Base Lease Dues (${cleanUnit})`,
        billData.base_amount || 0,
      );

      // --- Row 2: Electricity Submeter (If present) ---
      if (billData.meter_readings_json?.electricity) {
        const elec = billData.meter_readings_json.electricity;
        const prev = Number(elec.previous || 0);
        const curr = Number(elec.current || 0);
        const diff = Math.max(0, curr - prev);
        const rate = Number(elec.rate_per_unit || elec.rate || 12.5);
        const cost = Number(elec.amount || diff * rate);

        renderRow(
          "Electricity Utility",
          `Submeter Reading • ${diff.toLocaleString()} kWh consumed`,
          `Prev: ${prev.toLocaleString()} | Curr: ${curr.toLocaleString()} | @ ${rate.toFixed(2)}/kWh`,
          cost,
          { label: "METERED", color: colors.brandSky, bg: "#eff6ff" },
        );
      }

      // --- Row 3: Water Submeter (If present) ---
      if (billData.meter_readings_json?.water) {
        const water = billData.meter_readings_json.water;
        const prev = Number(water.previous || 0);
        const curr = Number(water.current || 0);
        const diff = Math.max(0, curr - prev);
        const rate = Number(water.rate_per_unit || water.rate || 45.0);
        const cost = Number(water.amount || diff * rate);

        renderRow(
          "Water Utility",
          `Submeter Reading • ${diff.toLocaleString()} m³ consumed`,
          `Prev: ${prev.toLocaleString()} | Curr: ${curr.toLocaleString()} | @ ${rate.toFixed(2)}/m³`,
          cost,
          { label: "METERED", color: colors.greenText, bg: colors.greenBg },
        );
      }

      // --- Row 4: Extra Charges (If any) ---
      if (
        billData.extra_charges_json &&
        Array.isArray(billData.extra_charges_json)
      ) {
        billData.extra_charges_json.forEach((charge) => {
          const cost = Number(charge.amount || 0);
          renderRow(
            charge.name || "Additional Charge",
            "Property Assessment / Ancillary Service",
            "Fixed Statement Assessment",
            cost,
          );
        });
      }

      // --- Row 5: VAT (If applicable) ---
      if (billData.tax_amount && billData.tax_amount > 0) {
        renderRow(
          "Value-Added Tax (VAT)",
          `Applicable national tax rate (${billData.tax_percentage || 12}%)`,
          `Standard VAT Assessment`,
          Number(billData.tax_amount),
        );
      }

      // --- Row 6: Gateway / Transfer Fee (If applicable) ---
      if (billData.transfer_fee && billData.transfer_fee > 0) {
        renderRow(
          "Payment Processing / Gateway Fee",
          "Automated gateway handling charge",
          "Transaction Clearing Surcharge",
          Number(billData.transfer_fee),
        );
      }

      // --- Row 7: Late Payment Surcharge (If applicable) ---
      if (billData.late_fee_applied && billData.late_fee_applied > 0) {
        const lateCost = Number(billData.late_fee_applied);
        const rowHeight = 28;
        doc
          .rect(contentLeft, tableY, contentWidth, rowHeight)
          .fill(colors.redBg);
        doc
          .strokeColor(colors.redBorder)
          .lineWidth(0.75)
          .moveTo(contentLeft, tableY + rowHeight)
          .lineTo(contentRight, tableY + rowHeight)
          .stroke();

        doc
          .fillColor(colors.redText)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text("Late Payment Penalty Surcharge", contentLeft + 12, tableY + 6);

        doc
          .fillColor(colors.redText)
          .font("Helvetica")
          .fontSize(7)
          .text(
            "Past due compliance penalty applied to statement",
            contentLeft + 12,
            tableY + 17,
          );

        doc
          .fillColor(colors.redText)
          .font("Helvetica")
          .fontSize(7.5)
          .text("Late Settlement Penalty", contentLeft + 225, tableY + 9.5);

        doc
          .fillColor(colors.redText)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text(formatPHP(lateCost), contentLeft + 410, tableY + 9, {
            width: contentWidth - 422,
            align: "right",
          });

        tableY += rowHeight;
      }

      // =========================================================================
      // 6. TOTALS CONTAINER (Right-Aligned PayMaya Summary Bar)
      // =========================================================================
      tableY += 8;
      const totalsBoxWidth = 250;
      const totalsBoxX = contentRight - totalsBoxWidth;
      const totalsHeight = 44;

      // Dark Slate Card matching Login Theme
      doc
        .roundedRect(totalsBoxX, tableY, totalsBoxWidth, totalsHeight, 6)
        .fill(colors.slateDark);

      // Left Cyan Accent Line (Liquid glow highlight)
      doc
        .roundedRect(totalsBoxX, tableY, 4, totalsHeight, 2)
        .fill(colors.brandCyan);

      doc
        .fillColor(colors.slateLight)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("TOTAL AMOUNT DUE", totalsBoxX + 14, tableY + 10);

      doc
        .fillColor(colors.cyanGlow)
        .font("Helvetica")
        .fontSize(7)
        .text(`Due: ${formattedDueDate}`, totalsBoxX + 14, tableY + 24);

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(14.5)
        .text(formatPHP(billData.amount), totalsBoxX + 14, tableY + 13, {
          width: totalsBoxWidth - 26,
          align: "right",
        });

      // =========================================================================
      // 8. VERIFICATION BARCODE & FOOTER (Bottom of Statement)
      // =========================================================================
      const footerY = 744;

      // Simulated PayMaya Vector Barcode
      const barcodeW = 160;
      const barcodeX = contentLeft + (contentWidth - barcodeW) / 2;
      drawBarcode(doc, barcodeX, footerY, barcodeW, 18);

      // Barcode String
      doc
        .fillColor(colors.slateMuted)
        .font("Helvetica")
        .fontSize(7)
        .text(`* ${invNo}-TNT${billData.id} *`, contentLeft, footerY + 21, {
          width: contentWidth,
          align: "center",
        });

      // Digital Security Assurance
      doc
        .fillColor(colors.brandSky)
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .text(
          "OFFICIAL SYSTEM-GENERATED STATEMENT  •  256-BIT ENCRYPTION  •  SYLVIA v1.0",
          contentLeft,
          footerY + 31,
          { width: contentWidth, align: "center" },
        );

      // Bottom Divider Line
      doc
        .strokeColor(colors.borderSubtle)
        .lineWidth(0.75)
        .moveTo(contentLeft, footerY + 42)
        .lineTo(contentRight, footerY + 42)
        .stroke();

      // Generation Timestamp & Legal Note
      doc
        .fillColor(colors.slateLight)
        .font("Helvetica")
        .fontSize(7)
        .text(
          `Generated on ${new Date().toLocaleString()}  |  Thank you for being our valued resident.`,
          contentLeft,
          footerY + 47,
          { width: contentWidth, align: "center" },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Enhanced Official Receipt PDF
export async function generateReceiptPDF(receiptData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 36,
        font: "Helvetica",
        info: {
          Title: `Official Receipt - ${receiptData.receiptNo || "Receipt"}`,
          Author: receiptData.platformName || "Sylvia v1.0",
          Subject: `Payment Receipt for Unit ${receiptData.unitNumber || ""}`,
        },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      const colors = {
        deepSlate: "#020617",
        slateDark: "#0f172a",
        slateText: "#334155",
        slateMuted: "#64748b",
        slateLight: "#94a3b8",
        borderSubtle: "#e2e8f0",
        cardBg: "#f8fafc",
        iceBlue: "#f0f9ff",
        iceBorder: "#bae6fd",
        brandBlue: "#1d4ed8",
        brandSky: "#0284c7",
        brandCyan: "#38bdf8",
        greenText: "#059669",
        greenBg: "#ecfdf5",
        greenBorder: "#a7f3d0",
      };

      const pageWidth = 595.28;
      const contentLeft = 36;
      const contentWidth = 523.28;
      const contentRight = contentLeft + contentWidth;

      // Top multi-tone ribbon
      doc.rect(0, 0, 340, 4).fill(colors.brandBlue);
      doc.rect(340, 0, 140, 4).fill(colors.brandSky);
      doc.rect(480, 0, pageWidth - 480, 4).fill(colors.brandCyan);

      const headerY = 32;

      // Sylvia Logo Emblem
      drawSylviaLogo(doc, contentLeft, headerY, 38);

      // Brand Title
      doc
        .fillColor(colors.slateDark)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("Sylvia", contentLeft + 48, headerY);

      const tagX = contentLeft + 115;
      const tagY = headerY + 4;

      doc
        .fillColor(colors.slateMuted)
        .font("Helvetica")
        .fontSize(8)
        .text(
          "Official Payment Acknowledgement & Receipt",
          contentLeft + 48,
          headerY + 23,
        );

      // Right Header
      doc
        .fillColor(colors.slateDark)
        .font("Helvetica-Bold")
        .fontSize(13)
        .text("PAYMENT RECEIPT", contentLeft + 250, headerY, {
          width: contentWidth - 250,
          align: "right",
        });

      // Receipt Status Chip (Completed)
      const pillX = contentRight - 110;
      const pillY = headerY + 22;
      doc
        .roundedRect(pillX, pillY, 110, 18, 9)
        .fillAndStroke(colors.greenBg, colors.greenBorder);

      doc.circle(pillX + 11, pillY + 9, 3).fill(colors.greenText);

      doc
        .fillColor(colors.greenText)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("PAYMENT SETTLED", pillX + 18, pillY + 4.5, {
          width: 88,
          align: "center",
        });

      // Receipt Hero Card
      const heroY = 86;
      const heroHeight = 64;

      doc
        .roundedRect(contentLeft, heroY, contentWidth, heroHeight, 8)
        .fillAndStroke(colors.greenBg, colors.greenBorder);

      doc.save();
      doc
        .roundedRect(contentLeft, heroY, 6, heroHeight, 4)
        .fill(colors.greenText);
      doc.restore();

      doc
        .fillColor(colors.greenText)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("TOTAL AMOUNT RECEIVED", contentLeft + 20, heroY + 11);

      doc
        .fillColor(colors.slateDark)
        .font("Helvetica-Bold")
        .fontSize(22)
        .text(formatPHP(receiptData.amount), contentLeft + 20, heroY + 23);

      const rcpRef = receiptData.receiptNo || `RCP-${Date.now()}`;
      doc
        .fillColor(colors.slateMuted)
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          `Receipt Ref: ${rcpRef}  •  Method: ${(receiptData.paymentMethod || "Online Maya/HitPay").toUpperCase()}`,
          contentLeft + 20,
          heroY + 49,
        );

      // Receipt Details Card
      const detailsY = 164;
      const dHeight = 120;
      doc
        .roundedRect(contentLeft, detailsY, contentWidth, dHeight, 8)
        .fillAndStroke(colors.cardBg, colors.borderSubtle);

      doc
        .fillColor(colors.brandBlue)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("TRANSACTION PARTICULARS", contentLeft + 16, detailsY + 14);

      const addDetailLine = (label: string, value: string, yPos: number) => {
        doc
          .fillColor(colors.slateMuted)
          .font("Helvetica")
          .fontSize(8)
          .text(label, contentLeft + 16, yPos);

        doc
          .fillColor(colors.slateDark)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text(value, contentLeft + 180, yPos, {
            width: contentWidth - 200,
            align: "right",
          });
      };

      addDetailLine(
        "Tenant / Payer:",
        receiptData.tenantName || "Valued Resident",
        detailsY + 32,
      );
      addDetailLine(
        "Unit & Building:",
        `${receiptData.unitNumber || "N/A"} • ${receiptData.buildingName || "Sylvia Residences"}`,
        detailsY + 50,
      );
      addDetailLine(
        "Payment Channel:",
        (receiptData.paymentMethod || "Maya / HitPay Gateway").toUpperCase(),
        detailsY + 68,
      );
      addDetailLine(
        "Payment Date & Time:",
        new Date().toLocaleString(),
        detailsY + 86,
      );
      addDetailLine(
        "Transaction Status:",
        "SUCCESSFUL & CONFIRMED",
        detailsY + 104,
      );

      // Barcode & Footer
      const footerY = 744;
      const barcodeW = 160;
      const barcodeX = contentLeft + (contentWidth - barcodeW) / 2;
      drawBarcode(doc, barcodeX, footerY, barcodeW, 18);

      doc
        .fillColor(colors.slateMuted)
        .font("Helvetica")
        .fontSize(7)
        .text(`* ${rcpRef} *`, contentLeft, footerY + 21, {
          width: contentWidth,
          align: "center",
        });

      doc
        .fillColor(colors.brandSky)
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .text(
          "OFFICIAL RECEIPT CONFIRMATION  •  256-BIT ENCRYPTION  •  SYLVIA ENTERPRISE v2.4",
          contentLeft,
          footerY + 31,
          { width: contentWidth, align: "center" },
        );

      doc
        .strokeColor(colors.borderSubtle)
        .lineWidth(0.75)
        .moveTo(contentLeft, footerY + 42)
        .lineTo(contentRight, footerY + 42)
        .stroke();

      doc
        .fillColor(colors.slateLight)
        .font("Helvetica")
        .fontSize(7)
        .text(
          `Generated on ${new Date().toLocaleString()}  |  Official electronic receipt issued by Sylvia v1.0.`,
          contentLeft,
          footerY + 47,
          { width: contentWidth, align: "center" },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
