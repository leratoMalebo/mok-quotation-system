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

    const addressLines = doc.splitTextToSize(quote.address || "-", 80);

    doc.text(`Client: ${quote.customer}`, 112, 88);
    doc.text(`Company: ${quote.company || "-"}`, 112, 94);
    doc.text(`Tel: ${quote.phone}`, 112, 100);
    doc.text(`Address:`, 112, 106);
    doc.text(addressLines, 112, 111, { maxWidth: 80 });

    // ================= TABLE =================
    let y = 120;

    const col = {
      service: M,
      route: M + 35,
      desc: M + 95,
      price: W - M
    };

    // HEADER (clean style)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY);

    doc.text("Service", col.service, y);
    doc.text("Route", col.route, y);
    doc.text("Description", col.desc, y);
    doc.text("Price", col.price, y, { align: "right" });

    doc.setDrawColor(200);
    doc.line(M, y + 2, W - M, y + 2);

    y += 10;

    // DATA
    const cleanRoute = buildCleanRoute(quote);

    const routeLines = doc.splitTextToSize(cleanRoute, 50);
    const descLines = doc.splitTextToSize(
      quote.commodity || "General Freight",
      55
    );

    const lineHeight = 5;
    const rowHeight =
      Math.max(routeLines.length, descLines.length) * lineHeight + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    doc.text(quote.vehicle, col.service, y);
    doc.text(routeLines, col.route, y);
    doc.text(descLines, col.desc, y);
    doc.text(`R${quote.price.toLocaleString()}`, col.price, y, { align: "right" });

    y += rowHeight + 6;

    doc.setDrawColor(220);
    doc.line(M, y, W - M, y);

    y += 10;

    // ================= TOTALS =================
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);

    doc.text("Subtotal:", 140, y);
    doc.text(`R${quote.price.toLocaleString()}`, 196, y, { align: "right" });

    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);

    doc.text("Total Excl. Tolls:", 140, y);
    doc.text(`R${quote.price.toLocaleString()}`, 196, y, { align: "right" });

    y += 15;

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

