import { useState, useEffect, useCallback } from "react";
import { searchQuotes, deleteQuote } from "./Quoteservice";
import { generatePDF } from "./pdfGenerator";

export default function QuoteHistory({ onEditQuote, onViewQuote, refreshTrigger }) {
  const [quotes, setQuotes]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearch]   = useState("");
  const [deleting, setDeleting]   = useState(null);
  const [filterType, setFilter]   = useState("All");
  const [filterAgent, setFilterAgent] = useState("All");
  const [expanded, setExpanded]   = useState(false);

  const load = useCallback(async (term = "") => {
    setLoading(true);
    const results = await searchQuotes(term);
    setQuotes(results);
    setLoading(false);
  }, []);

  useEffect(() => { load(searchTerm); }, [refreshTrigger]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => load(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function handleDelete(quoteNumber) {
    if (!window.confirm(`Delete ${quoteNumber}? This cannot be undone.`)) return;
    setDeleting(quoteNumber);
    await deleteQuote(quoteNumber);
    setDeleting(null);
    load(searchTerm);
  }

  // Filter client-side for type and agent
  const filtered = quotes.filter(q => {
    if (filterType  !== "All" && q.type  !== filterType)  return false;
    if (filterAgent !== "All" && q.agent !== filterAgent) return false;
    return true;
  });

  const typeOptions  = ["All", "National", "Cross Border", "Local(Weights)"];
  const agentOptions = ["All", "Neo", "Mavis", "Ryan"];

  const typeBadge = (type) => {
    if (type === "National")       return "badge-national";
    if (type === "Cross Border")   return "badge-cross";
    if (type === "Local(Weights)") return "badge-local";
    return "";
  };

  return (
    <div className="history-wrapper">

      {/* ── HEADER + TOGGLE ── */}
      <div className="history-header" onClick={() => setExpanded(e => !e)}>
        <div className="history-title">
          <span>🗂️ Quote History</span>
          <span className="history-count">{quotes.length} quotes</span>
        </div>
        <button className="history-toggle-btn">
          {expanded ? "▲ Collapse" : "▼ View All"}
        </button>
      </div>

      {expanded && (
        <div className="history-body">

          {/* ── SEARCH + FILTERS ── */}
          <div className="history-controls">
            <input
              className="history-search"
              placeholder="🔍 Search by client, company, quote #, agent, route..."
              value={searchTerm}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="history-filter"
              value={filterType}
              onChange={e => setFilter(e.target.value)}
            >
              {typeOptions.map(t => <option key={t}>{t}</option>)}
            </select>
            <select
              className="history-filter"
              value={filterAgent}
              onChange={e => setFilterAgent(e.target.value)}
            >
              {agentOptions.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          {/* ── TABLE ── */}
          {loading ? (
            <div className="history-loading">Loading quotes…</div>
          ) : filtered.length === 0 ? (
            <div className="history-empty">
              {searchTerm ? `No quotes found for "${searchTerm}"` : "No quotes yet."}
            </div>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Company</th>
                    <th>Agent</th>
                    <th>Type</th>
                    <th>Route</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(q => (
                    <tr key={q.quoteNumber} className="history-row">
                      <td className="qnum">{q.quoteNumber}</td>
                      <td className="qdate">{q.date}</td>
                      <td className="qclient"><strong>{q.customer}</strong></td>
                      <td className="qcompany">{q.company || "—"}</td>
                      <td className="qagent">{q.agent}</td>
                      <td>
                        <span className={`hbadge ${typeBadge(q.type)}`}>
                          {q.type === "Local(Weights)" ? "Local" : q.type}
                        </span>
                      </td>
                      <td className="qroute">
                        {q.route
                          ? q.route.replace(/(.{28}).+/, "$1…")
                          : "—"}
                      </td>
                      <td className="qprice">
                        R{(q.totalExclVat || q.price || 0).toLocaleString()}
                      </td>
                      <td className="qactions">
                        <button
                          className="hbtn view"
                          title="View & Download PDF"
                          onClick={() => onViewQuote(q)}
                        >
                          👁️
                        </button>
                        <button
                          className="hbtn edit"
                          title="Edit Quote"
                          onClick={() => onEditQuote(q)}
                        >
                          ✏️
                        </button>
                        <button
                          className="hbtn pdf"
                          title="Download PDF"
                          onClick={() => generatePDF(q, true)}
                        >
                          📄
                        </button>
                        <button
                          className="hbtn del"
                          title="Delete Quote"
                          disabled={deleting === q.quoteNumber}
                          onClick={() => handleDelete(q.quoteNumber)}
                        >
                          {deleting === q.quoteNumber ? "…" : "🗑️"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

