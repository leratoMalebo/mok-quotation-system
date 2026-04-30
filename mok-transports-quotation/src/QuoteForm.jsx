import { useState, useEffect, useRef } from "react";
import {
  nationalRates,
  getNationalRate,
  crossBorderRates,
  getCrossBorderPrice,
  localServices,
  getLocalPrice,
  getChargeableWeight,
  estimateTollFromRoute,
  suggestZone,
} from "./pricing";

export default function QuoteForm({ setQuote, editingQuote }) {

  // ── CLIENT ──
  const [customer, setCustomer]   = useState(editingQuote?.customer   || "");
  const [company, setCompany]     = useState(editingQuote?.company    || "");
  const [email, setEmail]         = useState(editingQuote?.email      || "");
  const [address, setAddress]     = useState(editingQuote?.address    || "");
  const [phone, setPhone]         = useState(editingQuote?.phone      || "");
  const [commodity, setCommodity] = useState(editingQuote?.commodity  || "");
  const [clientRef, setClientRef] = useState(editingQuote?.clientRef  || "");

  // ── STAFF ──
  const [agent, setAgent] = useState(editingQuote?.agent || "Neo");

  // ── JOB TYPE ──
  const [type, setType]               = useState(editingQuote?.type         || "National");
  const [vehicle, setVehicle]         = useState(editingQuote?.vehicle      || "1 Tonner");
  const [deliveryType, setDeliveryType] = useState(editingQuote?.deliveryType || "Standard");

  // ── NATIONAL ──
  const [pickup, setPickup]     = useState(editingQuote?.pickup   || "");
  const [delivery, setDelivery] = useState(editingQuote?.delivery || "");

  // ── CROSS BORDER ──
  const [country, setCountry]       = useState(editingQuote?.country     || "");
  const [city, setCity]             = useState(editingQuote?.city        || "");
  const [cbDirection, setCbDirection] = useState(editingQuote?.cbDirection || "SA_TO_ABROAD");

  // ── LOCAL ──
  const [serviceType, setServiceType] = useState(editingQuote?.serviceType || "SameDay Express Air");
  const [zone, setZone]               = useState(editingQuote?.zone        || "");
  const [weight, setWeight]           = useState(editingQuote?.actualWeight || editingQuote?.weight || "");
  const [volLength, setVolLength]     = useState("");
  const [volWidth, setVolWidth]       = useState("");
  const [volHeight, setVolHeight]     = useState("");
  const [parcelType, setParcelType]   = useState(editingQuote?.parcelType  || "Document");

  // ── CALCULATED ──
  const [distance, setDistance]               = useState(editingQuote?.distance    || null);
  const [tollCost, setTollCost]               = useState(editingQuote?.tollCost    || 0);
  const [tollBreakdown, setTollBreakdown]     = useState(editingQuote?.tollBreakdown || []);
  const [tollEstimated, setTollEstimated]     = useState(editingQuote?.tollEstimated || false);
  const [chargeableWeight, setChargeableWeight] = useState(editingQuote?.weight || null);
  const [crossBorderResult, setCrossBorderResult] = useState(null);
  const [distanceLoading, setDistanceLoading] = useState(false);

  // ── GOOGLE AUTOCOMPLETE ──
  const pickupRef   = useRef(null);
  const deliveryRef = useRef(null);

  useEffect(() => {
    if (!window.google?.maps?.places) return;
    if (pickupRef.current) {
      const ac = new window.google.maps.places.Autocomplete(pickupRef.current);
      ac.addListener("place_changed", () => setPickup(pickupRef.current.value));
    }
    if (deliveryRef.current) {
      const ac2 = new window.google.maps.places.Autocomplete(deliveryRef.current);
      ac2.addListener("place_changed", () => setDelivery(deliveryRef.current.value));
    }
  }, [type, cbDirection]);

  // Reset on type change
  useEffect(() => {
    setDistance(null); setTollCost(0); setTollBreakdown([]);
    setCrossBorderResult(null); setZone("");
    setPickup(""); setDelivery("");
    setCountry(""); setCity("");
  }, [type]);

  // Recalc cross border price whenever inputs change
  useEffect(() => {
    if (type === "Cross Border" && country && city && vehicle) {
      const result = getCrossBorderPrice(country, city, vehicle, distance);
      setCrossBorderResult(result);
    }
  }, [country, city, vehicle, distance, type]);

  // Chargeable weight
  useEffect(() => {
    if (weight) {
      setChargeableWeight(getChargeableWeight(
        Number(weight), Number(volLength), Number(volWidth), Number(volHeight)
      ));
    }
  }, [weight, volLength, volWidth, volHeight]);

  // ── DISTANCE CALC ──
  function calculateDistance() {
    const origin = pickup;
    const dest   = delivery;
    if (!origin || !dest) { alert("Enter both addresses"); return; }
    if (!window.google)   { alert("Google Maps not loaded"); return; }

    setDistanceLoading(true);
    new window.google.maps.DirectionsService().route({
      origin, destination: dest,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      setDistanceLoading(false);
      if (status === "OK") {
        const km = Math.round(result.routes[0].legs[0].distance.value / 1000);
        setDistance(km);
        // Tolls only calculated for National routes
        if (type === "National") {
          const t = estimateTollFromRoute(origin, dest, vehicle, km);
          setTollCost(Math.round(t.total));
          setTollBreakdown(t.breakdown || []);
          setTollEstimated(t.estimated || false);
        }
      } else {
        alert("Could not calculate route. Check addresses.");
      }
    });
  }

  // ── PRICE CALC ──
  function calculatePrice() {
    if (type === "Local(Weights)") {
      if (!chargeableWeight || !zone) return 0;
      return getLocalPrice(serviceType, zone, chargeableWeight);
    }
    if (type === "National") {
      if (!distance) return 0;
      let base = getNationalRate(vehicle, distance);
      if (deliveryType === "Dedicated") base = Math.round(base * 1.15);
      return base;
    }
    if (type === "Cross Border") {
      return crossBorderResult?.price || 0;
    }
    return 0;
  }

  // ── BUILD ROUTE STRING ──
  function buildRouteString() {
    if (type === "National") return `${pickup} → ${delivery}`;
    if (type === "Cross Border") {
      if (cbDirection === "SA_TO_ABROAD") {
        const origin = pickup || "South Africa";
        const dest   = delivery ? `${delivery}, ` : "";
        return `${origin} → ${dest}${city}, ${country}`;
      } else {
        const origin = pickup ? `${pickup}, ` : "";
        return `${origin}${city}, ${country} → ${delivery || "South Africa"}`;
      }
    }
    return `${pickup} → ${delivery}`;
  }

  // ── GENERATE QUOTE ──
  function generateQuote(e) {
    e.preventDefault();
    if (!customer || !phone) { alert("Enter client name and contact number"); return; }
    if (type === "National" && !distance) { alert("Calculate the distance first"); return; }
    if (type === "Cross Border" && (!country || !city)) { alert("Select country and city"); return; }
    if (type === "Local(Weights)" && (!weight || !zone)) { alert("Enter weight and select a zone"); return; }

    const price = calculatePrice();
    if (!price) { alert("Could not calculate price. Check all details."); return; }

    const vat        = type === "National" ? Math.round(price * 0.15) : 0;
    const totalExclVat = price + (type === "National" ? (tollCost || 0) : 0);

    let lastNumber = Number(localStorage.getItem("mokQuoteNumber") || 0);
    localStorage.setItem("mokQuoteNumber", lastNumber + 1);
    const quoteNumber = "MOK" + String(lastNumber + 1).padStart(3, "0");
    const today = new Date().toLocaleDateString("en-ZA");

    setQuote({
      customer, company, email, address, phone,
      agent, vehicle,
      route: buildRouteString(),
      pickup, delivery,
      distance,
      price, vat, totalWithVat: price + vat, totalExclVat,
      deliveryType, type, quoteNumber,
      date: today, clientRef,
      commodity, serviceType, zone,
      weight: chargeableWeight || weight,
      actualWeight: weight,
      parcelType,
      tollCost, tollBreakdown, tollEstimated,
      country, city, cbDirection,
      crossBorderNote: crossBorderResult?.note || "",
    });
  }

  const livePrice = calculatePrice();
  const zones = localServices[serviceType]?.zones || [];

  // ── Cross border address labels depend on direction ──
  const cbPickupLabel  = cbDirection === "SA_TO_ABROAD" ? "Pickup Address (South Africa)" : `Pickup Address (${city || country || "Abroad"})`;
  const cbDeliveryLabel = cbDirection === "SA_TO_ABROAD" ? `Delivery Address (${city || country || "Abroad"})` : "Delivery Address (South Africa)";

  return (
    <form className="quote-form" onSubmit={generateQuote}>
      <h2>Create Shipment Quote</h2>

      {/* ── CLIENT ── */}
      <h4>Client Information</h4>
      <div className="form-grid-2">
        <input placeholder="Client Name *"     value={customer}  onChange={e => setCustomer(e.target.value)} />
        <input placeholder="Company"           value={company}   onChange={e => setCompany(e.target.value)} />
        <input placeholder="Email Address"     value={email}     onChange={e => setEmail(e.target.value)} />
        <input placeholder="Contact Number *"  value={phone}     onChange={e => setPhone(e.target.value)} />
        <input placeholder="Client Address"    value={address}   onChange={e => setAddress(e.target.value)} />
        <input placeholder="Client Reference"  value={clientRef} onChange={e => setClientRef(e.target.value)} />
      </div>
      <input
        placeholder="Commodity / Description of Goods"
        value={commodity}
        onChange={e => setCommodity(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box" }}
      />

      {/* ── AGENT ── */}
      <h4>Processed By</h4>
      <select value={agent} onChange={e => setAgent(e.target.value)}>
        <option value="Neo">Neo Lumkwana</option>
        <option value="Mavis">Mavis Seloma</option>
        <option value="Ryan">Ryan Mokgethi</option>
      </select>

      {/* ── SHIPMENT TYPE ── */}
      <h4>Shipment Details</h4>
      <div className="form-grid-2">
        <select value={type} onChange={e => setType(e.target.value)}>
          <option>National</option>
          <option>Cross Border</option>
          <option>Local(Weights)</option>
        </select>

        {type !== "Local(Weights)" && (
          <select value={vehicle} onChange={e => setVehicle(e.target.value)}>
            {Object.keys(nationalRates).map(v => <option key={v}>{v}</option>)}
          </select>
        )}

        {type === "National" && (
          <select value={deliveryType} onChange={e => setDeliveryType(e.target.value)}>
            <option value="Standard">Standard Delivery</option>
            <option value="Dedicated">Urgent / Dedicated (+15%)</option>
          </select>
        )}
      </div>

      {/* ════════════════════════════════
          NATIONAL ROUTE
      ════════════════════════════════ */}
      {type === "National" && (
        <>
          <h4>Route Details</h4>
          <input
            placeholder="Pickup Address (South Africa)"
            ref={pickupRef}
            value={pickup}
            onChange={e => setPickup(e.target.value)}
          />
          <input
            placeholder="Delivery Address"
            ref={deliveryRef}
            value={delivery}
            onChange={e => setDelivery(e.target.value)}
          />
          <button type="button" onClick={calculateDistance} disabled={distanceLoading}>
            {distanceLoading ? "Calculating…" : "📍 Calculate Distance & Tolls"}
          </button>

          {distance && (
            <div className="info-box">
              <p>📏 <strong>Distance:</strong> {distance} km</p>
              <p>🛣️ <strong>Estimated Tolls:</strong> R{tollCost.toLocaleString()}
                {tollEstimated && <span className="badge">estimated</span>}
              </p>
              {tollBreakdown.length > 0 && (
                <details>
                  <summary>View toll breakdown ({tollBreakdown.length} plazas)</summary>
                  <table className="toll-table">
                    <thead><tr><th>Plaza</th><th>Amount</th></tr></thead>
                    <tbody>
                      {tollBreakdown.map((t, i) => (
                        <tr key={i}><td>{t.plaza}</td><td>R{t.cost.toFixed(2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════
          CROSS BORDER
      ════════════════════════════════ */}
      {type === "Cross Border" && (
        <>
          <h4>Cross Border Details</h4>

          {/* Direction toggle */}
          <div className="direction-toggle">
            <button
              type="button"
              className={cbDirection === "SA_TO_ABROAD" ? "dir-btn active" : "dir-btn"}
              onClick={() => setCbDirection("SA_TO_ABROAD")}
            >
              🇿🇦 SA → Abroad
            </button>
            <button
              type="button"
              className={cbDirection === "ABROAD_TO_SA" ? "dir-btn active" : "dir-btn"}
              onClick={() => setCbDirection("ABROAD_TO_SA")}
            >
              Abroad → 🇿🇦 SA
            </button>
          </div>

          <div className="form-grid-2">
            <select value={country} onChange={e => { setCountry(e.target.value); setCity(""); }}>
              <option value="">Select Country</option>
              {Object.entries(crossBorderRates).map(([c, data]) => (
                <option key={c} value={c}>{data.flag} {c}</option>
              ))}
            </select>

            <select value={city} onChange={e => setCity(e.target.value)} disabled={!country}>
              <option value="">Select City</option>
              {country && Object.keys(crossBorderRates[country].cities).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select value={vehicle} onChange={e => setVehicle(e.target.value)}>
              {Object.keys(nationalRates).map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          {/* Pickup address */}
          <input
            placeholder={cbPickupLabel}
            ref={pickupRef}
            value={pickup}
            onChange={e => setPickup(e.target.value)}
          />

          {/* Delivery address */}
          <input
            placeholder={cbDeliveryLabel}
            ref={deliveryRef}
            value={delivery}
            onChange={e => setDelivery(e.target.value)}
          />

          <button type="button" onClick={calculateDistance} disabled={distanceLoading}>
            {distanceLoading ? "Calculating…" : "📍 Get Exact Distance (Optional)"}
          </button>

          {crossBorderResult && crossBorderResult.price > 0 && (
            <div className="info-box">
              <p>💰 <strong>Base Rate:</strong> R{crossBorderResult.baseRate?.toLocaleString()}</p>
              <p>🛂 <strong>Border Fee:</strong> R{crossBorderResult.borderFee?.toLocaleString()}</p>
              {crossBorderResult.distanceSurcharge > 0 && (
                <p>📏 <strong>Distance Surcharge:</strong> R{crossBorderResult.distanceSurcharge.toLocaleString()}</p>
              )}
              {crossBorderResult.note && <p className="note-text">ℹ️ {crossBorderResult.note}</p>}
              {distance && <p>📏 <strong>Actual Distance:</strong> {distance} km</p>}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════
          LOCAL / WEIGHTS
      ════════════════════════════════ */}
      {type === "Local(Weights)" && (
        <>
          <h4>Courier Details</h4>
          <div className="form-grid-2">
            <select value={serviceType} onChange={e => { setServiceType(e.target.value); setZone(""); }}>
              {Object.keys(localServices).map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={zone} onChange={e => setZone(e.target.value)} disabled={!serviceType}>
              <option value="">Select Zone</option>
              {zones.map(z => <option key={z}>{z}</option>)}
            </select>
          </div>

          {/* Zone hint — only shown if zone not yet set AND suggestion exists AND delivery looks local (SA) */}
          {!zone && delivery && (() => {
            const isLikelyCrossBorder = /botswana|namibia|zimbabwe|kenya|mozambique|zambia|malawi|tanzania|lesotho|swaziland|eswatini|gaborone|windhoek|harare|bulawayo|nairobi|maputo|lusaka|lilongwe/i.test(delivery);
            if (isLikelyCrossBorder) return null;
            const suggested = suggestZone(serviceType, delivery);
            if (!suggested) return null;
            return (
              <div className="zone-hint">
                💡 Suggested zone for <strong>{delivery.split(",")[0]}</strong>:
                <button
                  type="button"
                  className="zone-hint-btn"
                  onClick={() => setZone(suggested)}
                >
                  {suggested} — Apply
                </button>
              </div>
            );
          })()}

          <div className="form-grid-2">
            <div>
              <label className="field-label">Parcel Type</label>
              <div className="radio-group">
                <label><input type="radio" value="Document" checked={parcelType === "Document"} onChange={e => setParcelType(e.target.value)} /> Document</label>
                <label><input type="radio" value="Parcel"   checked={parcelType === "Parcel"}   onChange={e => setParcelType(e.target.value)} /> Parcel</label>
              </div>
            </div>
            <input
              type="number" placeholder="Actual Weight (kg)"
              value={weight} min="0.1" step="0.1"
              onChange={e => setWeight(e.target.value)}
            />
          </div>

          <div className="vol-section">
            <p className="field-label">Volumetric Dimensions — optional (system uses higher of actual vs volumetric)</p>
            <div className="form-grid-3">
              <input type="number" placeholder="Length (cm)" value={volLength} onChange={e => setVolLength(e.target.value)} />
              <input type="number" placeholder="Width (cm)"  value={volWidth}  onChange={e => setVolWidth(e.target.value)} />
              <input type="number" placeholder="Height (cm)" value={volHeight} onChange={e => setVolHeight(e.target.value)} />
            </div>
            {chargeableWeight && (
              <p className="note-text">
                ⚖️ Chargeable weight: <strong>{chargeableWeight.toFixed(2)} kg</strong>
                {chargeableWeight > Number(weight) ? " (volumetric applies)" : " (actual weight applies)"}
              </p>
            )}
          </div>

          <input
            placeholder="Pickup Address"
            ref={pickupRef}
            value={pickup}
            onChange={e => setPickup(e.target.value)}
          />
          <input
            placeholder="Delivery Address"
            ref={deliveryRef}
            value={delivery}
            onChange={e => {
              const val = e.target.value;
              setDelivery(val);
              // Only auto-suggest zone for local SA addresses
              const isLikelyCrossBorder = /botswana|namibia|zimbabwe|kenya|mozambique|zambia|malawi|tanzania|lesotho|swaziland|eswatini|gaborone|windhoek|harare|bulawayo|nairobi|maputo|lusaka|lilongwe/i.test(val);
              if (!zone && !isLikelyCrossBorder) {
                const suggested = suggestZone(serviceType, val);
                if (suggested) setZone(suggested);
              }
            }}
          />

          {/* Distance calculation for Local — shown after addresses entered */}
          {pickup && delivery && (
            <button type="button" onClick={calculateDistance} disabled={distanceLoading}>
              {distanceLoading ? "Calculating…" : "📍 Calculate Distance"}
            </button>
          )}

          {/* Distance result for Local */}
          {distance && type === "Local(Weights)" && (
            <div className="info-box">
              <p>📏 <strong>Distance:</strong> {distance} km</p>
              <p className="note-text">Distance is for reference — local courier pricing is based on weight and zone, not distance.</p>
            </div>
          )}
        </>
      )}

      {/* ── LIVE PRICE PREVIEW ── */}
      {livePrice > 0 && (
        <div className="price-preview">
          <span>Estimated Price (Excl. VAT)</span>
          <strong>R{livePrice.toLocaleString()}</strong>
        </div>
      )}

      <button type="submit" className="submit-btn">Generate Quote</button>
    </form>
  );
}

