
import jsPDF from "jspdf";
type QuoteLine = {
  name: string;
  sku: string;
  quantity: number;
  size: string;
  colour: string;
  unitPrice: number;
  gstRate: number;
  subtotal: number;
  gstAmount: number;
  total: number;
};

type QuoteData = {
  id: string;
  createdAt: string | Date;
  lines: QuoteLine[];
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
};

const BUSINESS = {
  name: "MANOJ ENTERPRISES",
  address:
    "PILLAR NO.101, BESIDE MALABAR GOLD, MEDIPALLY, MEDCHAL-MALKAJGIRI DIST, HYDERABAD, TELANGANA - 500098, INDIA",
  phone: "8978433246",
  email: "manojenterprisesinfo@gmail.com",
  gstin: "36BARPN0853J2Z8",
};

const inr = (amount: number) =>
  `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch("/images/manoj-enterprises-logo.png");
    if (!response.ok) return null;

    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadQuotePdf(quote: QuoteData) {
  const doc = new jsPDF();
  const logo = await loadLogo();

  if (logo) {
    doc.addImage(logo, "PNG", 15, 12, 35, 25);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(BUSINESS.name, 55, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(BUSINESS.address, 135), 55, 25);
  doc.text(`Phone: ${BUSINESS.phone}`, 55, 37);
  doc.text(`Email: ${BUSINESS.email}`, 55, 42);
  doc.text(`GSTIN: ${BUSINESS.gstin}`, 55, 47);

  doc.setDrawColor(100);
  doc.line(15, 53, 195, 53);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("QUOTATION", 105, 64, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Reference: ${quote.id}`, 15, 74);
  doc.text(
    `Date: ${new Date(quote.createdAt).toLocaleDateString("en-IN")}`,
    15,
    80,
  );

  let y = 94;

  const columns = {
  product: 15,
  quantity: 83,
  price: 101,
  gstRate: 119,
  gstAmount: 139,
  total: 159,
};
  const headers = ["Product", "Qty", "Price", "GST %", "GST Amt", "Total"];

  doc.setFillColor(235, 235, 235);
  doc.rect(15, y - 6, 180, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  headers.forEach((header, index) => {
  const x = [columns.product, columns.quantity, columns.price, columns.gstRate, columns.gstAmount, columns.total][index]!;
  doc.text(header, x, y, {
    align: index === 0 ? "left" : "right",
  });
});

  y += 11;
  doc.setFont("helvetica", "normal");

  for (const line of quote.lines) {
    const productText = [
      line.name,
      `SKU: ${line.sku}`,
      line.size ? `Size: ${line.size}` : "",
      line.colour ? `Colour: ${line.colour}` : "",
    ].filter(Boolean);

    const productLines = doc.splitTextToSize(productText.join("\n"), 64);
    const rowHeight = Math.max(10, productLines.length * 4 + 3);

    if (y + rowHeight > 265) {
      doc.addPage();
      y = 20;
    }

    doc.text(productLines, columns.product, y);
    doc.text(String(line.quantity), columns.quantity, y, { align: "right" });
doc.text(inr(line.unitPrice), columns.price, y, { align: "right" });
doc.text(`${line.gstRate}%`, columns.gstRate, y, { align: "right" });
doc.text(inr(line.gstAmount), columns.gstAmount, y, { align: "right" });
doc.text(inr(line.total), columns.total, y, { align: "right" });

    y += rowHeight;
    doc.setDrawColor(220);
    doc.line(15, y - 3, 195, y - 3);
  }

  y += 8;

  if (y > 255) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Subtotal: ${inr(quote.subtotal)}`, 195, y, {
    align: "right",
  });

  y += 8;
  doc.text(`Total GST: ${inr(quote.gstAmount)}`, 195, y, {
    align: "right",
  });

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Grand Total: ${inr(quote.grandTotal)}`, 195, y, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "This is a quotation, not a tax invoice. Prices and GST are shown separately.",
    15,
    282,
  );

  doc.save(`Manoj-Enterprises-Quotation-${quote.id.slice(0, 8)}.pdf`);
}
