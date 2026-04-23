import jsPDF from "jspdf";

// Helper: extract the shortest meaningful place name from an address
function shortenAddress(addr) {
  if (!addr) return "";
  const parts = addr.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return addr;
  // Filter out parts that are just numbers or very short
  const meaningful = parts.filter(p => !/^\d+$/.test(p) && p.length > 2);
  if (meaningful.length === 0) return parts[0].slice(0, 18);
  // Prefer the shortest meaningful part (usually a city/town name)
  const shortest = meaningful.slice().sort((a, b) => a.length - b.length)[0];
  // Hard cap at 18 characters
  return shortest.length > 18 ? shortest.slice(0, 16) + "…" : shortest;
}

// Build a clean short route label
function buildShortRoute(quote) {
  if (quote.type === "National") {
    return `${shortenAddress(quote.pickup)} → ${shortenAddress(quote.delivery)}`;
  }
  if (quote.type === "Cross Border") {
    const origin = shortenAddress(quote.pickup) || "South Africa";
    const dest = quote.city ? `${quote.city}, ${quote.country}` : shortenAddress(quote.delivery);
    return `${origin} → ${dest}`;
  }
  // Local
  const from = shortenAddress(quote.pickup);
  const to = shortenAddress(quote.delivery);
  return from && to ? `${from} → ${to}` : (quote.route || "");
}

export function generatePDF(quote, includeTolls = true) {
  // Capture includeTolls immediately — do NOT let it be re-read from outer scope later
  const _includeTolls = !!includeTolls;

  return new Promise((resolve) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const M = 14;

    // Agent lookup
    const agentFull =
      quote.agent === "Neo"   ? { name: "Neo Lumkwana",  tel: "069 437 1308", email: "neo@moktransports.com" }  :
      quote.agent === "Mavis" ? { name: "Mavis Seloma",  tel: "011 834 6496", email: "mavis@moktransports.com" } :
                                { name: "Ryan Mokgethi", tel: "011 834 6496", email: "ryan@moktransports.com" };

    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = "/logo.png";

    const render = () => {

      // ── LOGO ──
      try { doc.addImage(logo, "PNG", M, 8, 40, 16); } catch (_) {}

      // ── HEADER RIGHT ──
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 70, 70);
      doc.text("Mok Transports PTY LTD",   130, 13);
      doc.text("Shop C01, 12 Jupiter Road", 130, 18);
      doc.text("Stellar Mall, Crown Mines", 130, 23);
      doc.text("Johannesburg, 2091",        130, 28);
      doc.text("info@moktransports.com",    130, 33);

      // ── DIVIDER ──
      doc.setDrawColor(10, 42, 67);
      doc.setLineWidth(0.6);
      doc.line(M, 37, W - M, 37);

      // ── FROM BOX ──
      doc.setFillColor(245, 247, 252);
      doc.roundedRect(M, 41, 90, 50, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(10, 42, 67);
      doc.text("FROM:", M + 3, 48);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text("Mok Transports PTY LTD",   M + 3, 54);
      doc.text("Reg No: 2015/162275/07",    M + 3, 60);
      doc.text(agentFull.name,              M + 3, 66);
      doc.text(`Tel: ${agentFull.tel}`,     M + 3, 72);
      doc.text(`Email: ${agentFull.email}`, M + 3, 78);

      // ── META BOX (top right) — professional label/value rows ──
      const metaLines = [
        { label: "Date:",         value: quote.date },
        { label: "Quotation #:",  value: quote.quoteNumber },
        ...(quote.clientRef ? [{ label: "Client Ref:", value: quote.clientRef }] : []),
      ];
      const metaH = 14 + metaLines.length * 8;
      doc.setFillColor(10, 42, 67);
      doc.roundedRect(108, 41, 88, metaH, 2, 2, "F");

      metaLines.forEach((row, i) => {
        const rowY = 51 + i * 8;
        // Label (lighter)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(160, 190, 220);
        doc.text(row.label, 111, rowY);
        // Value (bold white)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text(row.value, 138, rowY);
      });

      // ── TO BOX (bottom right) — pushed down if meta is taller ──
      const toBoxTop = 41 + metaH + 4;
      const toBoxH   = quote.company && quote.phone ? 28 : (quote.company || quote.phone ? 22 : 16);
      doc.setFillColor(245, 247, 252);
      doc.roundedRect(108, toBoxTop, 88, toBoxH, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(10, 42, 67);
      doc.text("TO:", 111, toBoxTop + 7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`Client: ${quote.customer}`, 111, toBoxTop + 13);
      if (quote.company) doc.text(`Company: ${quote.company}`, 111, toBoxTop + 19);
      if (quote.phone)   doc.text(`Tel: ${quote.phone}`,       111, toBoxTop + (quote.company ? 25 : 19));

      // ── QUOTATION DETAILS HEADER ──
      // Start below whichever right box is taller (FROM box ends at 41+50=91, right boxes end at toBoxTop+toBoxH)
      const rightBoxBottom = toBoxTop + toBoxH;
      const fromBoxBottom  = 91;
      let y = Math.max(rightBoxBottom, fromBoxBottom) + 6;

      doc.setFillColor(10, 42, 67);
      doc.rect(M, y, W - M * 2, 9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("QUOTATION DETAILS", M + 3, y + 6.5);
      y += 12;

      // ── TABLE COLUMN LAYOUT ──
      // Total printable width = 210 - 14 - 14 = 182mm
      // Columns:  Service=32 | Route=58 | Description=62 | Price=30
      // At fontSize 8, jsPDF renders ~0.28mm per point, so we keep text widths
      // conservatively smaller than column widths to prevent overflow.
      const tableLeft  = M;
      const tableRight = W - M;
      const tableW     = tableRight - tableLeft; // 182mm

      // Column LEFT-EDGE x positions (cumulative)
      const colX = {
        service: tableLeft,        // x=14
        route:   tableLeft + 32,   // x=46
        desc:    tableLeft + 90,   // x=104
        price:   tableLeft + 152,  // x=166
      };
      const pad = 2.5; // inner padding

      // MAX text wrap widths — intentionally narrower than column to guarantee no bleed
      const colW = {
        service: 26,  // col=32, wrap at 26
        route:   54,  // col=58, wrap at 54  ← key fix: was 60, now tighter
        desc:    56,  // col=62, wrap at 56
        price:   24,  // right-aligned, no wrap needed
      };

      // ── TABLE HEADER ROW ──
      doc.setFillColor(230, 235, 245);
      doc.rect(tableLeft, y, tableW, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(10, 42, 67);
      doc.text("Service",     colX.service + pad, y + 5);
      doc.text("Route",       colX.route   + pad, y + 5);
      doc.text("Description", colX.desc    + pad, y + 5);
      doc.text("Price",       tableRight   - pad, y + 5, { align: "right" });

      // Vertical dividers in header
      doc.setDrawColor(190, 200, 215);
      doc.setLineWidth(0.3);
      [colX.route, colX.desc, colX.price].forEach(x => {
        doc.line(x, y, x, y + 7);
      });
      y += 9;

      // ── DATA ROW ──
      const serviceLabel = quote.type === "Local(Weights)" ? quote.serviceType : quote.vehicle;
      const shortRoute   = buildShortRoute(quote);
      const description  =
        quote.type === "Local(Weights)"
          ? `${quote.weight}kg ${quote.parcelType}${quote.zone ? " — " + quote.zone : ""}`
          : (quote.commodity || "General Freight");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);

      // Split each cell to its max wrap width — this is what prevents bleed
      const serviceLines = doc.splitTextToSize(serviceLabel, colW.service);
      const routeLines   = doc.splitTextToSize(shortRoute,   colW.route);
      const descLines    = doc.splitTextToSize(description,  colW.desc);
      const priceStr     = `R${quote.price.toLocaleString()}`;

      const lineH = 4.8; // mm per line at fontSize 8
      const rowH  = Math.max(serviceLines.length, routeLines.length, descLines.length) * lineH + 7;

      // Row background
      doc.setFillColor(252, 253, 255);
      doc.rect(tableLeft, y - 1, tableW, rowH, "F");

      // Vertical dividers in data row
      doc.setDrawColor(220, 226, 234);
      doc.setLineWidth(0.25);
      [colX.route, colX.desc, colX.price].forEach(x => {
        doc.line(x, y - 1, x, y - 1 + rowH);
      });

      // Render each cell — text starts at column x + padding
      doc.text(serviceLines, colX.service + pad, y + 3);
      doc.text(routeLines,   colX.route   + pad, y + 3);
      doc.text(descLines,    colX.desc    + pad, y + 3);
      doc.text(priceStr,     tableRight   - pad, y + 3, { align: "right" });

      y += rowH;

      // Row bottom border
      doc.setDrawColor(210, 218, 228);
      doc.setLineWidth(0.35);
      doc.line(tableLeft, y, tableRight, y);
      y += 4;

      // ── TOLL ROW — National only, no breakdown, only if agent chose to include ──
      const hasTolls = quote.type === "National" && quote.tollCost > 0;
      const showTollsInPDF = hasTolls && _includeTolls;

      if (showTollsInPDF) {
        doc.setFillColor(250, 251, 254);
        doc.rect(tableLeft, y, tableW, 8, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const tollLabel = quote.tollEstimated ? "Toll Fees (estimated)" : "Toll Fees";
        doc.text(tollLabel, colX.service + pad, y + 5.5);
        doc.text(`R${quote.tollCost.toLocaleString()}`, tableRight - pad, y + 5.5, { align: "right" });
        doc.setDrawColor(210, 218, 228);
        doc.setLineWidth(0.35);
        doc.line(tableLeft, y + 8, tableRight, y + 8);
        y += 12;
      }

      // ── TOTALS ──
      const totX = 128;
      const effectiveTollCost = (hasTolls && _includeTolls) ? (quote.tollCost || 0) : 0;
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
      const totalLabel = (hasTolls && !_includeTolls) ? "Total Excl. Tolls:" : "Total Excl. VAT:";
      doc.text(totalLabel, totX, y);
      doc.text(`R${totalExclVat.toLocaleString()}`, tableRight - pad, y, { align: "right" });

      y += 16;

      // ── TERMS ──
      doc.setDrawColor(210, 215, 225);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
      y += 7;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(10, 42, 67);
      doc.text("Note:", M, y);
      y += 6;

      const terms = [
        "This estimate does not include storage, survey, customs inspection, or unforeseen expenses.",
        "Our offer is without commitment until a final transport agreement is reached.",
        "Subject to standard and unchanged conditions of transport.",
        "Orders are subject to Standard Trading Conditions of MTRS.",
        "Finance requires prior approval. Payment must be made in advance if no credit facility exists.",
      ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      for (const term of terms) {
        const lines = doc.splitTextToSize(`• ${term}`, W - M * 2);
        doc.text(lines, M, y);
        y += lines.length * 4.5;
      }

      // ── FOOTER BAR ──
      doc.setFillColor(10, 42, 67);
      doc.rect(0, 281, W, 16, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("Thank you for choosing Mok Transports Pty Ltd", W / 2, 291, { align: "center" });

      doc.save(`${quote.quoteNumber}.pdf`);
      resolve();
    };

    let rendered = false;
    const safeRender = () => {
      if (rendered) return;
      rendered = true;
      render();
    };

    logo.onload = safeRender;
    logo.onerror = safeRender;
    if (logo.complete) safeRender();
  });
}

