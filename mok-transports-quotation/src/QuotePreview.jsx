import { useState } from "react";
import { generatePDF } from "./pdfGenerator";
import RouteMap from "./RouteMap";

// Shorten address for display
function shortAddr(addr) {
  if (!addr) return "";
  const parts = addr.split(",").map(p => p.trim()).filter(Boolean);
  const cityParts = parts.filter(p => !/^\d/.test(p)).slice(0, 2);
  return cityParts.length > 0 ? cityParts.join(", ") : parts.slice(0, 2).join(", ");
}

function buildDisplayRoute(quote) {
  if (quote.type === "National") {
    return `${shortAddr(quote.pickup)} → ${shortAddr(quote.delivery)}`;
  }
  if (quote.type === "Cross Border") {
    if (quote.cbDirection === "ABROAD_TO_SA") {
      const from = quote.pickup ? `${quote.pickup}, ` : "";
      return `${from}${quote.city}, ${quote.country} → ${shortAddr(quote.delivery) || "South Africa"}`;
    }
    const origin = shortAddr(quote.pickup) || "South Africa";
    const dest = quote.city ? `${quote.city}, ${quote.country}` : shortAddr(quote.delivery);
    return `${origin} → ${dest}`;
  }
  const from = shortAddr(quote.pickup);
  const to   = shortAddr(quote.delivery);
  return from && to ? `${from} → ${to}` : (quote.route || "");
}

export default function QuotePreview({ quote }) {
  // Agent toggle: include tolls in PDF or not
  const [includeTolls, setIncludeTolls] = useState(true);

  const showMap = (quote.type === "National" || quote.type === "Cross Border")
    && quote.pickup && quote.delivery;

  const agentFull =
    quote.agent === "Neo"   ? { name: "Neo Lumkwana",  tel: "069 437 1308", email: "neo@moktransports.com" }  :
    quote.agent === "Mavis" ? { name: "Mavis Seloma",  tel: "011 834 6496", email: "mavis@moktransports.com" } :
                              { name: "Ryan Mokgethi", tel: "011 834 6496", email: "ryan@moktransports.com" };

  const description =
    quote.type === "Local(Weights)"
      ? `${quote.weight}kg ${quote.parcelType}${quote.zone ? " — " + quote.zone : ""}`
      : (quote.commodity || "General Freight");

  const displayRoute = buildDisplayRoute(quote);

  // Toll values
  const hasTolls     = quote.type === "National" && quote.tollCost > 0;
  const tollAmt      = hasTolls ? (quote.tollCost || 0) : 0;
  const totalExclTolls = quote.price;                    // freight only
  const totalInclTolls = quote.price + tollAmt;          // freight + tolls

  return (
    <div className="quote-card">

      {/* ── HEADER ── */}
      <div className="preview-header">
        <img src="/logo.png" className="quote-logo" alt="Mok Transports" />
        <div className="company-info">
          <h2>Mok Transports PTY LTD</h2>
          <p>Professional Freight Solutions</p>
          <p>Reg No: 2015/162275/07</p>
        </div>
        <div className="quote-meta">
          <p><strong>Date:</strong> {quote.date}</p>
          <p><strong>Quote #:</strong> {quote.quoteNumber}</p>
          {quote.clientRef && <p><strong>Ref:</strong> {quote.clientRef}</p>}
        </div>
      </div>

      {/* ── FROM / TO ── */}
      <div className="preview-grid">
        <div className="box">
          <h4>From</h4>
          <p><strong>Mok Transports PTY LTD</strong></p>
          <p>Shop C01, 12 Jupiter Road, Crown Mines</p>
          <p><strong>{agentFull.name}</strong></p>
          <p>📞 {agentFull.tel}</p>
          <p>✉️ {agentFull.email}</p>
        </div>
        <div className="box">
          <h4>To</h4>
          <p><strong>{quote.customer}</strong></p>
          {quote.company && <p>{quote.company}</p>}
          {quote.address && <p>{quote.address}</p>}
          <p>📞 {quote.phone}</p>
          {quote.email && <p>✉️ {quote.email}</p>}
        </div>
      </div>

      {/* ── TABLE ── */}
      <table className="quote-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Route</th>
            <th>Description</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {quote.type === "Local(Weights)" ? quote.serviceType : quote.vehicle}
              {quote.type === "National" && quote.deliveryType === "Dedicated" && (
                <span className="badge urgent"> Urgent</span>
              )}
            </td>
            <td>
              {displayRoute}
              {quote.distance && <><br /><span className="small-text">{quote.distance} km</span></>}
            </td>
            <td>{description}</td>
            <td>R{quote.price.toLocaleString()}</td>
          </tr>

          {/* ── TOLL ROW — always shown on preview, with full breakdown ── */}
          {hasTolls ? (
            <tr className="toll-row">
              <td colSpan={3}>
                🛣️ {quote.tollEstimated ? "Toll Fees (estimated)" : "Toll Fees"}
                {quote.tollBreakdown?.length > 0 ? (
                  <details className="toll-details-block">
                    <summary>
                      {quote.tollBreakdown.length} plaza{quote.tollBreakdown.length !== 1 ? "s" : ""} — click to expand
                    </summary>
                    <div className="toll-detail">
                      {quote.tollBreakdown.map((t, i) => (
                        <span key={i} className="toll-chip">
                          <strong>{t.plaza}</strong> R{t.cost.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </details>
                ) : quote.tollEstimated ? (
                  <span className="toll-est-note"> — estimated based on {quote.distance} km at route rate</span>
                ) : null}
              </td>
              <td>R{tollAmt.toLocaleString()}</td>
            </tr>
          ) : (
            /* Route has no tolls — show clearly */
            quote.type === "National" && (
              <tr className="no-toll-row">
                <td colSpan={3}>🛣️ Tolls</td>
                <td className="no-toll-amount">No toll plazas on this route</td>
              </tr>
            )
          )}

          {/* Cross border note */}
          {quote.type === "Cross Border" && quote.crossBorderNote && (
            <tr>
              <td colSpan={4} className="note-row">ℹ️ {quote.crossBorderNote}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── DUAL TOTALS ── */}
      <div className="totals-section">
        <div className="totals-table">

          <div className="total-row">
            <span>Subtotal (Freight)</span>
            <span>R{quote.price.toLocaleString()}</span>
          </div>

          {hasTolls && (
            <div className="total-row">
              <span>Tolls</span>
              <span>R{tollAmt.toLocaleString()}</span>
            </div>
          )}

          {/* Divider */}
          <div className="total-divider" />

          {/* Total EXCL tolls */}
          <div className="total-row dual-total excl">
            <span>
              Total Excl. Tolls
              {!hasTolls && <span className="no-toll-label"> (no tolls on this route)</span>}
            </span>
            <span>R{totalExclTolls.toLocaleString()}</span>
          </div>

          {/* Total INCL tolls — only if there are tolls */}
          {hasTolls && (
            <div className="total-row dual-total incl grand-total">
              <span>Total Incl. Tolls</span>
              <span>R{totalInclTolls.toLocaleString()}</span>
            </div>
          )}

          {/* When no tolls — single grand total */}
          {!hasTolls && (
            <div className="total-row grand-total">
              <span>Total Excl. VAT</span>
              <span>R{totalExclTolls.toLocaleString()}</span>
            </div>
          )}

        </div>
      </div>

      {/* ── MAP ── */}
      {showMap && (
        <RouteMap pickup={quote.pickup} delivery={quote.delivery} />
      )}

      {/* ── NOTES ── */}
      <div className="quote-notes">
        <h4>Terms &amp; Conditions</h4>
        <ul>
          <li>This estimate does not include storage, survey, customs inspection, or unforeseen expenses.</li>
          <li>Our offer is without commitment until a final transport agreement is reached.</li>
          <li>Subject to standard and unchanged conditions of transport.</li>
          <li>Orders are subject to Standard Trading Conditions of MTRS.</li>
          <li>Finance requires prior approval. Payment must be made in advance if no credit facility exists.</li>
        </ul>
      </div>

      {/* ── PDF DOWNLOAD WITH TOLL TOGGLE ── */}
      <div className="quote-footer">
        <p>Thank you for choosing Mok Transports Pty Ltd</p>

        <div className="pdf-actions">
          {/* Toll toggle — only shown for National quotes with tolls */}
          {hasTolls && (
            <div className="toll-toggle">
              <span className="toll-toggle-label">Send PDF with tolls?</span>
              <div className="toggle-btns">
                <button
                  type="button"
                  className={includeTolls ? "toggle-opt active-yes" : "toggle-opt"}
                  onClick={() => setIncludeTolls(true)}
                >
                  ✅ Include Tolls
                </button>
                <button
                  type="button"
                  className={!includeTolls ? "toggle-opt active-no" : "toggle-opt"}
                  onClick={() => setIncludeTolls(false)}
                >
                  ❌ Exclude Tolls
                </button>
              </div>
              <p className="toll-toggle-note">
                {includeTolls
                  ? `PDF will show Total Excl. VAT: R${totalInclTolls.toLocaleString()} (freight + tolls)`
                  : `PDF will show Total Excl. Tolls: R${totalExclTolls.toLocaleString()} (freight only)`
                }
              </p>
            </div>
          )}

          <button className="pdf-btn" onClick={() => generatePDF(quote, includeTolls)}>
            📄 Download PDF
          </button>
        </div>
      </div>

    </div>
  );
}



