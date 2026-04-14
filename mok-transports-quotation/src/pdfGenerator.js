import jsPDF from "jspdf";

export function generatePDF(quote) {

const doc = new jsPDF();
const W = 210;
const M = 14;

// ================= BRAND COLOR =================
const PRIMARY = [10, 42, 67];

// ================= AGENT =================
const agent =
  quote.agent === "Neo"
    ? { tel: "069 437 1308", email: "neo@moktransports.com" }
    : quote.agent === "Mavis"
    ? { tel: "011 834 6496", email: "mavis@moktransports.com" }
    : { tel: "011 834 6496", email: "ryan@moktransports.com" };

// ================= LOGO =================
const logo = new Image();
logo.src = "/logo.png";

logo.onload = () => {

doc.addImage(logo, "PNG", M, 10, 40, 16);

// ================= HEADER RIGHT =================
doc.setFontSize(9);
doc.setTextColor(80,80,80);

doc.text("Mok Transports PTY LTD", 130, 15);
doc.text("Shop C01, 12 Jupiter Road", 130, 20);
doc.text("Stellar Mall, Crown Mines", 130, 25);
doc.text("Johannesburg, 2091", 130, 30);
doc.text("info@moktransports.com", 130, 35);

// LINE
doc.setDrawColor(...PRIMARY);
doc.line(M, 40, W - M, 40);

// ================= FROM =================
doc.setFillColor(245,247,252);
doc.roundedRect(M, 45, 90, 45, 2,2,"F");

doc.setTextColor(...PRIMARY);
doc.setFont("helvetica","bold");
doc.text("FROM:", M+3, 52);

doc.setFont("helvetica","normal");
doc.setTextColor(50,50,50);

doc.text("Mok Transports PTY LTD", M+3, 58);
doc.text("Reg No: 2015/162275/07", M+3, 64);
doc.text(`Tel: ${agent.tel}`, M+3, 70);
doc.text(`Email: ${agent.email}`, M+3, 76);

// ================= META =================
doc.setFillColor(...PRIMARY);
doc.roundedRect(108,45,88,28,2,2,"F");

doc.setFontSize(8);
doc.setTextColor(180,200,220);
doc.text("Date:", 112, 54);
doc.text("Quotation #:", 112, 60);
doc.text("Client Ref:", 112, 66);

doc.setFont("helvetica","bold");
doc.setTextColor(255,255,255);

doc.text(quote.date, 150, 54);
doc.text(quote.quoteNumber, 150, 60);
doc.text(quote.clientRef || "-", 150, 66);

// ================= TO =================
doc.setFillColor(245,247,252);
doc.roundedRect(108,75,88,40,2,2,"F");

doc.setFont("helvetica","bold");
doc.setTextColor(...PRIMARY);
doc.text("TO:", 112, 82);

doc.setFont("helvetica","normal");
doc.setTextColor(50,50,50);

let addressLines = doc.splitTextToSize(quote.address || "-", 80);

doc.text(`Client: ${quote.customer}`, 112, 88);
doc.text(`Company: ${quote.company || "-"}`, 112, 94);
doc.text(`Tel: ${quote.phone}`, 112, 100);
doc.text(addressLines, 112, 106);

// ================= TABLE HEADER =================
let y = 125;

doc.setFillColor(230,235,245);
doc.rect(M, y, W - M*2, 8, "F");

doc.setTextColor(...PRIMARY);
doc.setFont("helvetica","bold");

doc.text("Service", M+2, y+5);
doc.text("Route", M+35, y+5);
doc.text("Description", M+95, y+5);
doc.text("Price", W-M-2, y+5, { align:"right" });

y += 12;

// ================= DATA =================
doc.setFont("helvetica","normal");
doc.setTextColor(50,50,50);

// 🔥 STRICT WIDTH CONTROL (FIX OVERLAP)
const routeWidth = 50;
const descWidth = 55;

const routeText = doc.splitTextToSize(quote.route, routeWidth);
const descText = doc.splitTextToSize(quote.commodity || "-", descWidth);

const rowHeight = Math.max(routeText.length, descText.length) * 5 + 6;

// ROW BOX
doc.rect(M, y-2, W - M*2, rowHeight);

// TEXT
doc.text(quote.vehicle, M+2, y+2);
doc.text(routeText, M+35, y+2);
doc.text(descText, M+95, y+2);
doc.text(`R${quote.price.toLocaleString()}`, W-M-2, y+2, { align:"right" });

y += rowHeight + 10;

// ================= TOTAL =================
doc.setFont("helvetica","bold");
doc.setTextColor(...PRIMARY);

doc.text("Total:", 140, y);
doc.text(`R${quote.price.toLocaleString()}`, W-M-2, y, { align:"right" });

y += 15;

// ================= NOTES =================
doc.setFont("helvetica","bold");
doc.text("Note:", M, y);

doc.setFont("helvetica","normal");
doc.setTextColor(80,80,80);

const notes = doc.splitTextToSize(`
The estimate does not include storage, survey, custom inspection, or any unforeseen expenses.

Our offer is without commitment until final agreement.

Subject to standard transport conditions.

Payment must be made in advance if no credit facility exists.
`, W - M*2);

doc.text(notes, M, y+5);

// ================= FOOTER =================
doc.setFillColor(...PRIMARY);
doc.rect(0, 285, W, 12, "F");

doc.setTextColor(255,255,255);
doc.text("Thank you for choosing Mok Transports", W/2, 292, { align:"center" });

// SAVE
doc.save(`${quote.quoteNumber}.pdf`);

};

}

