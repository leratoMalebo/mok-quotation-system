import { useState } from "react";
import QuoteForm from "./QuoteForm";
import QuotePreview from "./QuotePreview";
import Dashboard from "./Dashboard";
import QuoteHistory from "./Quotehistory";
import { saveQuote, updateQuote } from "./Quoteservice";
import "./style.css";

export default function App() {
  const [quote, setQuote]               = useState(null);
  const [quotes, setQuotes]             = useState([]);
  const [editingQuote, setEditingQuote] = useState(null);
  const [savingStatus, setSavingStatus] = useState(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [view, setView]                 = useState("form");

  async function handleNewQuote(q) {
    setSavingStatus("saving");

    let result;
    if (editingQuote) {
      result = await updateQuote(editingQuote.quoteNumber, {
        ...q,
        quoteNumber: editingQuote.quoteNumber,
      });
    } else {
      result = await saveQuote(q);
    }

    if (result.success) {
      setSavingStatus("saved");
      setEditingQuote(null);
      setHistoryRefresh(n => n + 1);
    } else {
      setSavingStatus("error");
    }

    setQuote(q);
    setQuotes(prev => {
      const idx = prev.findIndex(p => p.quoteNumber === q.quoteNumber);
      if (idx >= 0) { const u = [...prev]; u[idx] = q; return u; }
      return [...prev, q];
    });
    setView("preview");
    setTimeout(() => setSavingStatus(null), 3500);
  }

  function handleEditQuote(q) {
    setEditingQuote(q);
    setQuote(null);
    setView("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleViewQuote(q) {
    setQuote(q);
    setView("preview");
    setTimeout(() => window.scrollTo({ top: 500, behavior: "smooth" }), 100);
  }

  function handleNewQuoteClick() {
    setEditingQuote(null);
    setQuote(null);
    setView("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="container">

      {/* ── TOP BAR ── */}
      <div className="app-topbar">
        <img src="/logo.png" className="logo" alt="Mok Transports" />
        <div className="app-topbar-right">
          <h1>Mok Transports — Quotation System</h1>
          {view === "preview" && (
            <button className="new-quote-btn" onClick={handleNewQuoteClick}>
              + New Quote
            </button>
          )}
        </div>
      </div>

      {/* ── DASHBOARD ── */}
      <Dashboard quotes={quotes} />

      {/* ── QUOTE HISTORY ── */}
      <QuoteHistory
        onEditQuote={handleEditQuote}
        onViewQuote={handleViewQuote}
        refreshTrigger={historyRefresh}
      />

      {/* ── SAVE STATUS ── */}
      {savingStatus && (
        <div className={`save-banner save-${savingStatus}`}>
          {savingStatus === "saving" && "⏳ Saving quotation to database…"}
          {savingStatus === "saved"  && "✅ Quotation saved successfully"}
          {savingStatus === "error"  && "❌ Save failed — check your internet connection"}
        </div>
      )}

      {/* ── EDITING BANNER ── */}
      {editingQuote && view === "form" && (
        <div className="edit-banner">
          ✏️ Editing <strong>{editingQuote.quoteNumber}</strong> for {editingQuote.customer}
          <button
            className="edit-cancel-btn"
            onClick={() => { setEditingQuote(null); setView("form"); }}
          >
            ✕ Cancel Edit
          </button>
        </div>
      )}

      {/* ── FORM ── */}
      {view === "form" && (
        <QuoteForm
          setQuote={handleNewQuote}
          editingQuote={editingQuote}
        />
      )}

      {/* ── PREVIEW ── */}
      {view === "preview" && quote && (
        <QuotePreview quote={quote} />
      )}

    </div>
  );
}



