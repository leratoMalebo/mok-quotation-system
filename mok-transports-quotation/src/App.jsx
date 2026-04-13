import { useState } from "react";
import QuoteForm from "./QuoteForm";
import QuotePreview from "./QuotePreview";
import Dashboard from "./Dashboard";
import "./style.css";

export default function App() {
  const [quote, setQuote] = useState(null);
  const [quotes, setQuotes] = useState([]);

  function handleNewQuote(q) {
    setQuote(q);
    setQuotes(prev => [...prev, q]);
  }

  return (
    <div className="container">

      {/* Logo — place your logo.png in /public */}
      <img src="/logo.png" className="logo" alt="Mok Transports" />

      <h1>Mok Transports Quotation System</h1>

      <Dashboard quotes={quotes} />

      <QuoteForm setQuote={handleNewQuote} />

      {quote && <QuotePreview quote={quote} />}

    </div>
  );
}

