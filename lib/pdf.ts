import PDFDocument from "pdfkit";

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
  status: string;
  created_at?: string;
  platform_name?: string;
  support_email?: string;
  support_phone?: string;
}

export async function generateBillPDF(billData: BillPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        font: "Times-Roman",
        info: {
          Title: `Billing Statement - #${billData.id}`,
          Author: billData.platform_name || "ApartManager SaaS",
          Subject: `Invoice #${billData.id} for Unit ${billData.unit_number}`,
        },
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const primaryColor = "#1e3a8a"; // Deep Navy Blue
      const secondaryColor = "#475569"; // Slate
      const lightBg = "#f8fafc"; // Slate 50
      const borderColor = "#e2e8f0"; // Slate 200

      // --- HEADER SECTION ---
      doc
        .fillColor(primaryColor)
        .font("Times-Bold")
        .fontSize(22)
        .text(billData.platform_name || "ApartManager SaaS", 50, 50);

      doc
        .fillColor(secondaryColor)
        .font("Times-Roman")
        .fontSize(9)
        .text("Residential Tenancy & Property Management Platform", 50, 75)
        .text(
          `Support: ${billData.support_email || "support@apartmanager.com"} | ${billData.support_phone || "+63 917 888 9999"}`,
          50,
          88,
        );

      // Document Title & Invoice Badge on Top Right
      // doc
      //   .fillColor(primaryColor)
      //   .font("Times-Bold")
      //   .fontSize(18)
      //   .text("STATEMENT OF ACCOUNT", 320, 50, { align: "right", width: 225 });

      doc
        .fillColor("#059669") // Emerald Green for Posted / Active
        .font("Times-Bold")
        .fontSize(10)
        .text(`STATUS: ${billData.status.toUpperCase()}`, 320, 75, {
          align: "right",
          width: 225,
        });

      doc
        .fillColor(secondaryColor)
        .font("Times-Roman")
        .fontSize(9)
        .text(
          `Invoice No: INV-${new Date().getFullYear()}-${String(billData.id).padStart(5, "0")}`,
          320,
          88,
          { align: "right", width: 225 },
        )
        .text(
          `Issue Date: ${new Date(billData.created_at || Date.now()).toLocaleDateString()}`,
          320,
          100,
          { align: "right", width: 225 },
        )
        .text(
          `Payment Due: ${new Date(billData.due_date).toLocaleDateString()}`,
          320,
          112,
          { align: "right", width: 225 },
        );

      // Horizontal Divider
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(50, 130)
        .lineTo(545, 130)
        .stroke();

      // --- BILL TO / PROPERTY DETAILS BOXES ---
      const boxY = 145;
      const boxHeight = 85;
      const boxWidth = 235;

      // Left Box: Tenant (Billed To)
      doc
        .rect(50, boxY, boxWidth, boxHeight)
        .fillAndStroke(lightBg, borderColor);

      doc
        .fillColor(primaryColor)
        .font("Times-Bold")
        .fontSize(10)
        .text("BILLED TO (TENANT):", 65, boxY + 12);

      doc
        .fillColor("#0f172a")
        .font("Times-Bold")
        .fontSize(11)
        .text(billData.tenant_name || "Valued Tenant", 65, boxY + 28);

      doc
        .fillColor(secondaryColor)
        .font("Times-Roman")
        .fontSize(9)
        .text(`Email: ${billData.tenant_email || "N/A"}`, 65, boxY + 44)
        .text(`Assigned Unit: ${billData.unit_number}`, 65, boxY + 58);

      // Right Box: Property / Building Details
      doc
        .rect(310, boxY, boxWidth, boxHeight)
        .fillAndStroke(lightBg, borderColor);

      doc
        .fillColor(primaryColor)
        .font("Times-Bold")
        .fontSize(10)
        .text("PROPERTY DETAILS:", 325, boxY + 12);

      doc
        .fillColor("#0f172a")
        .font("Times-Bold")
        .fontSize(11)
        .text(
          billData.building_name || "Main Apartment Building",
          325,
          boxY + 28,
        );

      doc
        .fillColor(secondaryColor)
        .font("Times-Roman")
        .fontSize(9)
        .text(`Unit: ${billData.unit_number}`, 325, boxY + 44)
        .text(
          `Address: ${billData.building_address || "Metro Manila, Philippines"}`,
          325,
          boxY + 58,
          { width: 205 },
        );

      // --- ITEMIZED BREAKDOWN TABLE ---
      let tableY = 250;

      // Table Header Bar
      doc.rect(50, tableY, 495, 24).fill(primaryColor);

      doc
        .fillColor("#ffffff")
        .font("Times-Bold")
        .fontSize(9)
        .text("DESCRIPTION / CHARGE TYPE", 65, tableY + 7)
        .text("DETAILS / COMPUTATION", 250, tableY + 7)
        .text("AMOUNT (PHP)", 440, tableY + 7, { align: "right", width: 90 });

      tableY += 24;

      // Row 1: Base Rent / Charge
      doc.rect(50, tableY, 495, 24).fillAndStroke("#ffffff", borderColor);

      doc
        .fillColor("#0f172a")
        .font("Times-Bold")
        .fontSize(9)
        .text(
          billData.billing_type_name || "Monthly Rental Dues",
          65,
          tableY + 7,
        );

      doc
        .fillColor(secondaryColor)
        .font("Times-Roman")
        .fontSize(9)
        .text(
          `Standard lease billing for ${billData.unit_number}`,
          250,
          tableY + 7,
        );

      doc
        .fillColor("#0f172a")
        .font("Times-Bold")
        .fontSize(9)
        .text(
          `PHP ${(billData.base_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          440,
          tableY + 7,
          { align: "right", width: 90 },
        );

      tableY += 24;

      // Row: Electricity Meter (If active)
      if (billData.meter_readings_json?.electricity) {
        const elec = billData.meter_readings_json.electricity;
        const prev = Number(elec.previous || 0);
        const curr = Number(elec.current || 0);
        const diff = Math.max(0, curr - prev);
        const rate = Number(elec.rate_per_unit || elec.rate || 12.5);
        const cost = Number(elec.amount || diff * rate);

        doc.rect(50, tableY, 495, 24).fillAndStroke(lightBg, borderColor);

        doc
          .fillColor("#0f172a")
          .font("Times-Bold")
          .fontSize(9)
          .text("Electricity Utility (Metered)", 65, tableY + 7);

        doc
          .fillColor(secondaryColor)
          .font("Times-Roman")
          .fontSize(8.5)
          .text(
            `Prev: ${prev} | Curr: ${curr} (${diff} kWh @ PHP ${rate}/kWh)`,
            250,
            tableY + 7,
          );

        doc
          .fillColor("#0f172a")
          .font("Times-Bold")
          .fontSize(9)
          .text(
            `PHP ${cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            440,
            tableY + 7,
            { align: "right", width: 90 },
          );

        tableY += 24;
      }

      // Row: Water Meter (If active)
      if (billData.meter_readings_json?.water) {
        const water = billData.meter_readings_json.water;
        const prev = Number(water.previous || 0);
        const curr = Number(water.current || 0);
        const diff = Math.max(0, curr - prev);
        const rate = Number(water.rate_per_unit || water.rate || 45.0);
        const cost = Number(water.amount || diff * rate);

        doc.rect(50, tableY, 495, 24).fillAndStroke("#ffffff", borderColor);

        doc
          .fillColor("#0f172a")
          .font("Times-Bold")
          .fontSize(9)
          .text("Water Utility (Metered)", 65, tableY + 7);

        doc
          .fillColor(secondaryColor)
          .font("Times-Roman")
          .fontSize(8.5)
          .text(
            `Prev: ${prev} | Curr: ${curr} (${diff} cu.m @ PHP ${rate}/cu.m)`,
            250,
            tableY + 7,
          );

        doc
          .fillColor("#0f172a")
          .font("Times-Bold")
          .fontSize(9)
          .text(
            `PHP ${cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            440,
            tableY + 7,
            { align: "right", width: 90 },
          );
      }

      // Rows: Extra Charges (If any)
      if (
        billData.extra_charges_json &&
        Array.isArray(billData.extra_charges_json)
      ) {
        billData.extra_charges_json.forEach((charge) => {
          const cost = Number(charge.amount || 0);

          doc.rect(50, tableY, 495, 24).fillAndStroke("#ffffff", borderColor);

          doc
            .fillColor("#0f172a")
            .font("Times-Bold")
            .fontSize(9)
            .text(charge.name || "Additional Charge", 65, tableY + 7);

          doc
            .fillColor(secondaryColor)
            .font("Times-Roman")
            .fontSize(8.5)
            .text("Additional Charge", 250, tableY + 7);

          doc
            .fillColor("#0f172a")
            .font("Times-Bold")
            .fontSize(9)
            .text(
              `PHP ${cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              440,
              tableY + 7,
              { align: "right", width: 90 },
            );

          tableY += 24;
        });
      }

      // Row: Taxes / VAT (If active)
      if (billData.tax_amount && billData.tax_amount > 0) {
        doc.rect(50, tableY, 495, 24).fillAndStroke(lightBg, borderColor);

        doc
          .fillColor("#0f172a")
          .font("Times-Roman")
          .fontSize(9)
          .text("Value-Added Tax (VAT)", 65, tableY + 7);

        doc
          .fillColor(secondaryColor)
          .font("Times-Roman")
          .fontSize(8.5)
          .text(
            `Applicable tax rate (${billData.tax_percentage || 12}%)`,
            250,
            tableY + 7,
          );

        doc
          .fillColor("#0f172a")
          .font("Times-Roman")
          .fontSize(9)
          .text(
            `PHP ${Number(billData.tax_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            440,
            tableY + 7,
            { align: "right", width: 90 },
          );

        tableY += 24;
      }

      // Row: Transfer Fee (If active)
      if (billData.transfer_fee && billData.transfer_fee > 0) {
        doc.rect(50, tableY, 495, 24).fillAndStroke("#ffffff", borderColor);

        doc
          .fillColor("#0f172a")
          .font("Times-Roman")
          .fontSize(9)
          .text("Processing / Gateway Transfer Fee", 65, tableY + 7);

        doc
          .fillColor(secondaryColor)
          .font("Times-Roman")
          .fontSize(8.5)
          .text("Payment gateway handling charge", 250, tableY + 7);

        doc
          .fillColor("#0f172a")
          .font("Times-Roman")
          .fontSize(9)
          .text(
            `PHP ${Number(billData.transfer_fee).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            440,
            tableY + 7,
            { align: "right", width: 90 },
          );

        tableY += 24;
      }

      // Row: Late Fee (If active)
      if (billData.late_fee_applied && billData.late_fee_applied > 0) {
        doc.rect(50, tableY, 495, 24).fillAndStroke("#fee2e2", "#fca5a5"); // Light red

        doc
          .fillColor("#991b1b")
          .font("Times-Bold")
          .fontSize(9)
          .text("Late Payment Surcharge / Penalty", 65, tableY + 7);

        doc
          .fillColor("#991b1b")
          .font("Times-Roman")
          .fontSize(8.5)
          .text("Penalty for past due statement", 250, tableY + 7);

        doc
          .fillColor("#991b1b")
          .font("Times-Bold")
          .fontSize(9)
          .text(
            `PHP ${Number(billData.late_fee_applied).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            440,
            tableY + 7,
            { align: "right", width: 90 },
          );

        tableY += 24;
      }

      // --- TOTAL SUMMARY BOX ---
      tableY += 10;
      doc.rect(310, tableY, 235, 45).fillAndStroke(primaryColor, primaryColor);

      doc
        .fillColor("#ffffff")
        .font("Times-Bold")
        .fontSize(10)
        .text("TOTAL AMOUNT DUE:", 325, tableY + 10);

      doc
        .fillColor("#ffffff")
        .font("Times-Bold")
        .fontSize(16)
        .text(
          `PHP ${Number(billData.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          325,
          tableY + 24,
        );

      // --- PAYMENT INSTRUCTIONS BOX ---
      const instY = tableY + 60;
      doc.rect(50, instY, 495, 110).fillAndStroke(lightBg, borderColor);

      doc
        .fillColor(primaryColor)
        .font("Times-Bold")
        .fontSize(10)
        .text("PAYMENT INSTRUCTIONS & REMITTANCE CHANNELS:", 65, instY + 12);

      doc
        .fillColor("#334155")
        .font("Times-Roman")
        .fontSize(8.5)
        .text(
          "1. Online Payment: Log in to your Tenant Portal and pay instantly via GCash, Maya, QR Ph, or Card through HitPay.",
          65,
          instY + 28,
          { width: 465 },
        )
        .text(
          "2. Bank Remittance / Over-the-Counter: Settle payment directly at the Property Management Office or authorized bank accounts.",
          65,
          instY + 44,
          { width: 465 },
        )
        .text(
          `3. Due Date Compliance: Please ensure full remittance on or before ${new Date(billData.due_date).toLocaleDateString()} to prevent automatic late penalty surcharges.`,
          65,
          instY + 60,
          { width: 465 },
        )
        .text(
          "4. Inquiries & Support: For billing adjustments or meter disputes, contact your property administrator immediately.",
          65,
          instY + 76,
          { width: 465 },
        );

      // --- FOOTER SECTION ---
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(50, 750)
        .lineTo(545, 750)
        .stroke();

      doc
        .fillColor(secondaryColor)
        .font("Times-Roman")
        .fontSize(8)
        .text(
          "This is an official system-generated electronic billing statement produced by ApartManager SaaS Platform.",
          50,
          760,
          { align: "center", width: 495 },
        )
        .text(
          `Generated on ${new Date().toLocaleString()} | Thank you for being our valued tenant.`,
          50,
          772,
          { align: "center", width: 495 },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateReceiptPDF(receiptData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50, font: "Times-Roman" });
      let buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const primaryColor = "#059669"; // Emerald

      doc
        .fillColor(primaryColor)
        .font("Times-Bold")
        .fontSize(22)
        .text("OFFICIAL PAYMENT RECEIPT", { align: "center" });

      doc.moveDown();
      doc
        .fillColor("#334155")
        .font("Times-Roman")
        .fontSize(10)
        .text(
          `Receipt Reference: ${receiptData.receiptNo || "RCP-" + Date.now()}`,
        )
        .text(`Payment Date: ${new Date().toLocaleDateString()}`)
        .text(
          `Amount Paid: PHP ${Number(receiptData.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        )
        .text(
          `Payment Method: ${(receiptData.paymentMethod || "Online").toUpperCase()}`,
        )
        .text(`Tenant: ${receiptData.tenantName || "Valued Tenant"}`)
        .text(`Unit: ${receiptData.unitNumber || "Assigned Unit"}`)
        .text(`Building: ${receiptData.buildingName || "Apartment"}`);

      doc.moveDown();
      doc
        .font("Times-Bold")
        .text("Status: COMPLETED / PAID IN FULL", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
