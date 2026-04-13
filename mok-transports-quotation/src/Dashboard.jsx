export default function Dashboard({ quotes }) {
  const total       = quotes.length;
  const national    = quotes.filter(q => q.type === "National").length;
  const crossBorder = quotes.filter(q => q.type === "Cross Border").length;
  const local       = quotes.filter(q => q.type === "Local(Weights)").length;
  const totalValue  = quotes.reduce((sum, q) => sum + (q.totalExclVat || q.price || 0), 0);

  // Build per-agent stats
  const agentNames = ["Neo", "Mavis", "Ryan"];
  const agentData = agentNames.map(name => {
    const agentQuotes = quotes.filter(q => q.agent === name);
    if (agentQuotes.length === 0) return null;
    return {
      name: name === "Neo" ? "Neo Lumkwana" : name === "Mavis" ? "Mavis Seloma" : "Ryan Mokgethi",
      key: name,
      total:       agentQuotes.length,
      national:    agentQuotes.filter(q => q.type === "National").length,
      crossBorder: agentQuotes.filter(q => q.type === "Cross Border").length,
      local:       agentQuotes.filter(q => q.type === "Local(Weights)").length,
      value:       agentQuotes.reduce((s, q) => s + (q.totalExclVat || q.price || 0), 0),
    };
  }).filter(Boolean);

  const summaryCards = [
    { label: "Total Quotes",   value: total,                      icon: "📋" },
    { label: "National",       value: national,                   icon: "🚛" },
    { label: "Cross Border",   value: crossBorder,                icon: "🌍" },
    { label: "Local Courier",  value: local,                      icon: "📦" },
    { label: "Total Value",    value: `R${totalValue.toLocaleString()}`, icon: "💰" },
  ];

  return (
    <div className="dashboard-wrapper">

      {/* ── SUMMARY CARDS ── */}
      <div className="dashboard">
        {summaryCards.map((card, i) => (
          <div className="dashboard-card" key={i}>
            <h3>{card.icon} {card.label}</h3>
            <p>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── AGENT BREAKDOWN ── */}
      {agentData.length > 0 && (
        <div className="agent-breakdown">
          <h4 className="agent-breakdown-title">👤 Agent Activity</h4>
          <div className="agent-cards">
            {agentData.map(agent => (
              <div className="agent-card" key={agent.key}>
                <div className="agent-header">
                  <div className="agent-avatar">
                    {agent.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="agent-name">{agent.name}</p>
                    <p className="agent-total">{agent.total} quote{agent.total !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="agent-stats">
                  {agent.national > 0 && (
                    <span className="agent-stat national">
                      🚛 {agent.national} National
                    </span>
                  )}
                  {agent.crossBorder > 0 && (
                    <span className="agent-stat cross">
                      🌍 {agent.crossBorder} Cross Border
                    </span>
                  )}
                  {agent.local > 0 && (
                    <span className="agent-stat local">
                      📦 {agent.local} Local
                    </span>
                  )}
                </div>

                <div className="agent-value">
                  R{agent.value.toLocaleString()} <span>total quoted</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

