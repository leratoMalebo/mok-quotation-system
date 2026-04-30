import { supabase } from "./supabaseClient";

// ─────────────────────────────────────────────────
// SAVE a new quote
// ─────────────────────────────────────────────────
export async function saveQuote(quote) {
  const { data, error } = await supabase
    .from("quotes")
    .insert([mapQuoteToRow(quote)])
    .select()
    .single();

  if (error) {
    console.error("Save quote error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// ─────────────────────────────────────────────────
// UPDATE an existing quote by quote_number
// ─────────────────────────────────────────────────
export async function updateQuote(quoteNumber, quote) {
  const { data, error } = await supabase
    .from("quotes")
    .update({ ...mapQuoteToRow(quote), updated_at: new Date().toISOString() })
    .eq("quote_number", quoteNumber)
    .select()
    .single();

  if (error) {
    console.error("Update quote error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// ─────────────────────────────────────────────────
// FETCH all quotes (newest first)
// ─────────────────────────────────────────────────
export async function fetchAllQuotes() {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch quotes error:", error.message);
    return [];
  }
  return data.map(mapRowToQuote);
}

// ─────────────────────────────────────────────────
// SEARCH quotes by any keyword
// ─────────────────────────────────────────────────
export async function searchQuotes(keyword) {
  if (!keyword || keyword.trim().length < 2) return fetchAllQuotes();

  const q = keyword.trim().toLowerCase();

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .or(
      `customer.ilike.%${q}%,` +
      `company.ilike.%${q}%,` +
      `quote_number.ilike.%${q}%,` +
      `agent.ilike.%${q}%,` +
      `type.ilike.%${q}%,` +
      `route.ilike.%${q}%,` +
      `client_ref.ilike.%${q}%`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Search error:", error.message);
    return [];
  }
  return data.map(mapRowToQuote);
}

// ─────────────────────────────────────────────────
// DELETE a quote by quote_number
// ─────────────────────────────────────────────────
export async function deleteQuote(quoteNumber) {
  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("quote_number", quoteNumber);

  if (error) {
    console.error("Delete error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ─────────────────────────────────────────────────
// GET next quote number (reads last from DB)
// ─────────────────────────────────────────────────
export async function getNextQuoteNumber() {
  const { data, error } = await supabase
    .from("quotes")
    .select("quote_number")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    // Fallback to localStorage
    const last = Number(localStorage.getItem("mokQuoteNumber") || 0);
    return "MOK" + String(last + 1).padStart(3, "0");
  }

  const lastNum = parseInt(data[0].quote_number.replace("MOK", ""), 10) || 0;
  const next = lastNum + 1;
  localStorage.setItem("mokQuoteNumber", next);
  return "MOK" + String(next).padStart(3, "0");
}

// ─────────────────────────────────────────────────
// HELPERS: map between app quote object and DB row
// ─────────────────────────────────────────────────
function mapQuoteToRow(q) {
  return {
    quote_number:   q.quoteNumber,
    date:           q.date,
    customer:       q.customer       || "",
    company:        q.company        || "",
    email:          q.email          || "",
    phone:          q.phone          || "",
    address:        q.address        || "",
    client_ref:     q.clientRef      || "",
    agent:          q.agent          || "",
    type:           q.type           || "",
    vehicle:        q.vehicle        || "",
    route:          q.route          || "",
    pickup:         q.pickup         || "",
    delivery:       q.delivery       || "",
    distance:       q.distance       || null,
    commodity:      q.commodity      || "",
    service_type:   q.serviceType    || "",
    zone:           q.zone           || "",
    weight:         q.weight         || null,
    parcel_type:    q.parcelType     || "",
    country:        q.country        || "",
    city:           q.city           || "",
    cb_direction:   q.cbDirection    || "",
    price:          q.price          || 0,
    toll_cost:      q.tollCost       || 0,
    toll_estimated: q.tollEstimated  || false,
    toll_breakdown: JSON.stringify(q.tollBreakdown || []),
    total_excl_vat: q.totalExclVat   || q.price || 0,
    delivery_type:  q.deliveryType   || "",
    updated_at:     new Date().toISOString(),
  };
}

function mapRowToQuote(row) {
  return {
    quoteNumber:   row.quote_number,
    date:          row.date,
    customer:      row.customer,
    company:       row.company,
    email:         row.email,
    phone:         row.phone,
    address:       row.address,
    clientRef:     row.client_ref,
    agent:         row.agent,
    type:          row.type,
    vehicle:       row.vehicle,
    route:         row.route,
    pickup:        row.pickup,
    delivery:      row.delivery,
    distance:      row.distance,
    commodity:     row.commodity,
    serviceType:   row.service_type,
    zone:          row.zone,
    weight:        row.weight,
    parcelType:    row.parcel_type,
    country:       row.country,
    city:          row.city,
    cbDirection:   row.cb_direction,
    price:         row.price,
    tollCost:      row.toll_cost,
    tollEstimated: row.toll_estimated,
    tollBreakdown: (() => { try { return JSON.parse(row.toll_breakdown || "[]"); } catch { return []; } })(),
    totalExclVat:  row.total_excl_vat,
    deliveryType:  row.delivery_type,
    createdAt:     row.created_at,
    // Reconstruct totals
    vat:           row.type === "National" ? Math.round(row.price * 0.15) : 0,
    totalWithVat:  row.type === "National" ? Math.round(row.price * 1.15) : row.price,
  };
}




