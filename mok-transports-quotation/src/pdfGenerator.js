import jsPDF from "jspdf";

// ================= ROUTE CLEANING =================
function extractCity(addr) {
  if (!addr) return "";
  const parts = addr.split(",").map(p => p.trim());
  return parts[0];
}

function buildCleanRoute(quote) {
  const from = extractCity(quote.pickup);
  const to = extractCity(quote.delivery);

  if (quote.distance) {
    return `${from} → ${to} (${quote.distance} km)`;
  }

  return `${from} → ${to}`;
}

export function generatePDF(quote) {

  const doc = new jsPDF();
  const W = 210;
  const M = 14;

  const CARD_BG = [245, 247, 252];
  const PRIMARY = [10, 42, 67];

  // ================= AGENT =================
  const agent =
    quote.agent === "Neo"
      ? { tel: "069 437 1308", email: "neo@moktransports.com" }
      : quote.agent === "Mavis"
        ? { tel: "011 834 6496", email: "mavis@moktransports.com" }
        : { tel: "011 834 6496", email: "ryan@moktransports.com" };

  // ================= HEADER =================
  const logo = new Image();
  logo.src = "/logo.png";

  logo.onload = () => {

    // LOGO
    doc.addImage(logo, "PNG", M, 10, 40, 16);

    // COMPANY INFO
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);

    doc.text("Mok Transports PTY LTD", 130, 15);
    doc.text("Shop C01, 12 Jupiter Road", 130, 20);
    doc.text("Stellar Mall, Crown Mines", 130, 25);
    doc.text("Johannesburg, 2091", 130, 30);
    doc.text("info@moktransports.com", 130, 35);

    // DIVIDER
    doc.setDrawColor(...PRIMARY);
    doc.line(M, 40, W - M, 40);

    // ================= FROM =================
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(M, 45, 90, 45, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(9);
    doc.text("From:", M + 4, 52);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);

    doc.text("Mok Transports PTY LTD", M + 4, 60);
    doc.text("Reg No: 2015/162275/07", M + 4, 66);
    doc.text(`Tel: ${agent.tel}`, M + 4, 72);
    doc.text(`Email: ${agent.email}`, M + 4, 78);

    // ================= META =================
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(108, 45, 88, 25, 3, 3, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PRIMARY);

    doc.text("Date:", 112, 54);
    doc.text("Quotation #:", 112, 60);
    doc.text("Client Ref:", 112, 66);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);

    doc.text(quote.date, 150, 54);
    doc.text(quote.quoteNumber, 150, 60);
    doc.text(quote.clientRef || "-", 150, 66);

    // ================= TO =================
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(108, 72, 88, 40, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(9);
    doc.text("To:", 112, 80);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);

    const cleanAddress = (quote.address || "-").split(",")[0];

    doc.text(`Client: ${quote.customer}`, 112, 88);
    doc.text(`Company: ${quote.company || "-"}`, 112, 94);
    doc.text(`Tel: ${quote.phone}`, 112, 100);
    doc.text(`Address: ${cleanAddress}`, 112, 106);

    // ================= TABLE =================
    let y = 120;

    const tableCol = {
      service: M,
      route: M + 45,
      desc: M + 115,
      price: W - M
    };

    // HEADER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY);

    doc.text("Service", tableCol.service, y);
    doc.text("Route", tableCol.route, y);
    doc.text("Description", tableCol.desc, y);
    doc.text("Price", tableCol.price, y, { align: "right" });

    // HEADER LINE
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(M, y + 2, W - M, y + 2);

    y += 10;

    // DATA
    const cleanRoute = buildCleanRoute(quote);

    const routeLines = doc.splitTextToSize(cleanRoute, 50);
    const descLines = doc.splitTextToSize(
      quote.commodity || "General Freight",
      50
    );

    const lineHeight = 5;
    const rowHeight =
      Math.max(routeLines.length, descLines.length) * lineHeight + 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    doc.text(quote.vehicle, tableCol.service, y);
    doc.text(routeLines, tableCol.route, y);
    doc.text(descLines, tableCol.desc, y);
    doc.text(`R${quote.price.toLocaleString()}`, tableCol.price, y, { align: "right" });

    // VERTICAL LINES (clean separation)
    doc.setDrawColor(210);
    doc.setLineWidth(0.3);

    doc.line(tableCol.route - 8, y - 6, tableCol.route - 8, y + rowHeight);
    doc.line(tableCol.desc - 8, y - 6, tableCol.desc - 8, y + rowHeight);

    // BOTTOM LINE
    y += rowHeight + 2;

    doc.setDrawColor(180);
    doc.setLineWidth(0.4);
    doc.line(M, y, W - M, y);

    y += 10;

    // ================= TOTALS =================
    // ── TOTALS ──
    const totX = 128;
    const effectiveTollCost = (hasTolls && includeTolls) ? (quote.tollCost || 0) : 0;
    const totalExclVat = quote.price + effectiveTollCost;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(70, 70, 70);

    doc.text("Subtotal:", totX, y);
    doc.text(`R${quote.price.toLocaleString()}`, tableRight - pad, y, { align: "right" });
    y += 7;

    if (showTollsInPDF) {
      doc.text("Tolls:", totX, y);
      doc.text(`R${quote.tollCost.toLocaleString()}`, tableRight - pad, y, { align: "right" });
      y += 7;
    }
    doc.setDrawColor(10, 42, 67);
    doc.setLineWidth(0.5);
    doc.line(totX, y, tableRight, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(10, 42, 67);
    const totalLabel = (hasTolls && !includeTolls) ? "Total Excl. Tolls:" : "Total Excl. VAT:";
    doc.text(totalLabel, totX, y);
    doc.text(`R${totalExclVat.toLocaleString()}`, tableRight - pad, y, { align: "right" });

    y += 16;

    // ================= NOTES =================
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("Note:", M, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 90);
    doc.setFontSize(8);

    const notes = doc.splitTextToSize(
      `The estimate does not include storage, survey, custom inspection, or any unforeseen expenses.

Our offer is without commitment until final agreement.

Subject to standard transport conditions.

Payment must be made in advance if no credit facility exists.`,
      W - M * 2
    );

    doc.text(notes, M, y + 5);

    // ================= FOOTER =================
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 285, W, 12, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.text(
      "Thank you for choosing Mok Transports",
      W / 2,
      292,
      { align: "center" }
    );

    // SAVE
    doc.save(`${quote.quoteNumber}.pdf`);
  };
}


