// ============================================================
// MOK TRANSPORTS — PRICING DATA
// Source: Mok_Transports_National_Rates_Updated_.xlsx
//         JKJ_Rates_for_Moktransports__85__increase_.xlsx
//         Government Gazette No. 52072 & 52073 (March 2025)
// ============================================================

// ============================================================
// NATIONAL RATES — Distance Bracket Lookup
// Rates are inclusive of fuel surcharge base
// ============================================================
export const nationalRates = {
  "1 Tonner":   { 50: 3248,  100: 4524,  150: 5974,  200: 6786,  250: 7099 },
  "4 Tonner":   { 50: 4582,  100: 6728,  150: 8097,  200: 8410,  250: 8758 },
  "8 Tonner":   { 50: 6474,  100: 10205, 150: 12415, 200: 12805, 250: 13325 },
  "Tri-Axle":   { 50: 9018,  100: 11475, 150: 15525, 200: 17280, 250: 18225 },
  "Super Link":  { 50: 12320, 100: 16100, 150: 19530, 200: 20300, 250: 24500 },
};

// Get national rate from distance bracket
// Uses nearest bracket (rounds up to next bracket)
export function getNationalRate(vehicle, distanceKm) {
  const brackets = [50, 100, 150, 200, 250];
  const rates = nationalRates[vehicle];
  if (!rates) return 0;

  // Find the bracket that covers this distance
  for (const bracket of brackets) {
    if (distanceKm <= bracket) {
      return rates[bracket];
    }
  }
  // Over 250km — extrapolate from 250 bracket with per-km rate
  const base = rates[250];
  const extraKm = distanceKm - 250;
  const perKmRates = {
    "1 Tonner":  12,
    "4 Tonner":  18,
    "8 Tonner":  24,
    "Tri-Axle":  30,
    "Super Link": 38,
  };
  return Math.round(base + extraKm * (perKmRates[vehicle] || 20));
}

// ============================================================
// CROSS BORDER RATES — Flat rates per destination + vehicle
// Source: Crossborder sheet + Kenya placeholder
// ============================================================
export const crossBorderRates = {
  Botswana: {
    flag: "🇧🇼",
    expectedKm: { Gaborone: 360, Jwaneng: 450, Francistown: 620 },
    cities: {
      Gaborone:    { "1 Tonner": 9850,  "4 Tonner": 11850, "8 Tonner": 16850, "Tri-Axle": 22500, "Super Link": 26500 },
      Jwaneng:     { "1 Tonner": 11850, "4 Tonner": 14850, "8 Tonner": 19850, "Tri-Axle": 40850, "Super Link": 48250 },
      Francistown: { "1 Tonner": 11850, "4 Tonner": 16850, "8 Tonner": 19850, "Tri-Axle": 27850, "Super Link": 29850 },
    },
  },
  Namibia: {
    flag: "🇳🇦",
    expectedKm: { Windhoek: 1480, Swakopmund: 1700 },
    cities: {
      Windhoek:   { "1 Tonner": 11850, "4 Tonner": 16850, "8 Tonner": 21850, "Tri-Axle": 28500, "Super Link": 42850 },
      Swakopmund: { "1 Tonner": 13850, "4 Tonner": 17800, "8 Tonner": 25850, "Tri-Axle": 42800, "Super Link": 49850 },
    },
  },
  Zimbabwe: {
    flag: "🇿🇼",
    expectedKm: { Harare: 1200, Bulawayo: 900 },
    cities: {
      Harare:   { "1 Tonner": 14500, "4 Tonner": 18500, "8 Tonner": 24500, "Tri-Axle": 32000, "Super Link": 42000 },
      Bulawayo: { "1 Tonner": 12500, "4 Tonner": 16500, "8 Tonner": 21500, "Tri-Axle": 28000, "Super Link": 37000 },
    },
  },
  Kenya: {
    flag: "🇰🇪",
    expectedKm: { Nairobi: 3200, Mombasa: 3600 },
    cities: {
      Nairobi:  { "1 Tonner": 28000, "4 Tonner": 36000, "8 Tonner": 48000, "Tri-Axle": 62000, "Super Link": 78000 },
      Mombasa:  { "1 Tonner": 32000, "4 Tonner": 42000, "8 Tonner": 55000, "Tri-Axle": 70000, "Super Link": 88000 },
    },
  },
};

// Cross border surcharge constants
export const crossBorderSurcharges = {
  borderFee: 2500,       // fixed border crossing fee
  distanceSurchargeThreshold: 0.10, // 10% over expected km triggers surcharge
  distanceSurchargeRate: 8,         // R per extra km over threshold
};

// Calculate cross border price with hybrid logic
export function getCrossBorderPrice(country, city, vehicle, actualKm) {
  const countryData = crossBorderRates[country];
  if (!countryData) return { price: 0, surcharge: 0, note: "" };

  const baseRate = countryData.cities[city]?.[vehicle];
  if (!baseRate) return { price: 0, surcharge: 0, note: "" };

  const expectedKm = countryData.expectedKm[city] || 0;
  let distanceSurcharge = 0;
  let note = "";

  if (actualKm && expectedKm) {
    const overBy = actualKm - expectedKm;
    const threshold = expectedKm * crossBorderSurcharges.distanceSurchargeThreshold;
    if (overBy > threshold) {
      distanceSurcharge = Math.round(overBy * crossBorderSurcharges.distanceSurchargeRate);
      note = `Distance surcharge applied (${actualKm}km vs expected ${expectedKm}km)`;
    }
  }

  const total = baseRate + crossBorderSurcharges.borderFee + distanceSurcharge;
  return { price: total, baseRate, borderFee: crossBorderSurcharges.borderFee, distanceSurcharge, note };
}

// ============================================================
// LOCAL / COURIER RATES — JKJ × 1.85 markup
// Per kg pricing, 0.5kg to 70kg
// ============================================================

// Helper: build rate table from base values × 1.85
function r(base) { return Math.round(base * 1.85); }

// SameDay Express Air — per kg
// Columns: Major Centres | In-City JHB-JHB | In-City JHB-PTA
export const sameDayRates = {
  zones: ["Major Centres", "In-City JHB-JHB", "In-City JHB-PTA"],
  // [weight_kg]: [major, jhb_jhb, jhb_pta]
  table: [
    [0.5, r(750), r(400), r(500)],
    [1,   r(750), r(400), r(500)],
    [2,   r(750), r(400), r(500)],
    [3,   r(800), r(402), r(503)],
    [5,   r(900), r(406), r(509)],
    [10,  r(1150),r(416), r(524)],
    [15,  r(1400),r(426), r(539)],
    [20,  r(1650),r(436), r(554)],
    [25,  r(1900),r(446), r(569)],
    [30,  r(2150),r(456), r(584)],
    [40,  r(2650),r(476), r(614)],
    [50,  r(3150),r(496), r(644)],
    [60,  r(3650),r(516), r(674)],
    [70,  r(4150),r(536), r(704)],
  ],
};

// Overnight Express (ONX)
// Columns: In-City | Intra-Regional | Major to Regional | Reg-to-Reg
export const overnightRates = {
  zones: ["In-City", "Intra-Regional", "Major to Regional", "Reg-to-Reg"],
  table: [
    [0.5, r(60),  r(80),  r(190), r(290)],
    [1,   r(60),  r(80),  r(190), r(290)],
    [2,   r(60),  r(80),  r(190), r(290)],
    [5,   r(69),  r(125), r(370), r(500)],
    [10,  r(84),  r(200), r(670), r(850)],
    [15,  r(99),  r(275), r(970), r(1200)],
    [20,  r(114), r(350), r(1270),r(1550)],
    [30,  r(144), r(500), r(1870),r(2250)],
    [40,  r(174), r(650), r(2470),r(2950)],
    [50,  r(204), r(800), r(3070),r(3650)],
    [60,  r(234), r(950), r(3670),r(4350)],
    [70,  r(264), r(1100),r(4270),r(5050)],
  ],
};

// NextDay Express
// Columns: In-City | Major (DBN) | Intra-Regional | Inland Regional | Reg-to-Reg
export const nextDayRates = {
  zones: ["In-City", "Major (DBN)", "Intra-Regional", "Inland Regional", "Reg-to-Reg"],
  table: [
    [0.5, r(60),  r(90),  r(80),  r(190), r(290)],
    [1,   r(60),  r(90),  r(80),  r(190), r(290)],
    [5,   r(60),  r(90),  r(80),  r(190), r(290)],
    [10,  r(110), r(140), r(155), r(490), r(640)],
    [15,  r(160), r(190), r(230), r(790), r(990)],
    [20,  r(210), r(240), r(305), r(1090),r(1340)],
    [30,  r(310), r(340), r(455), r(1690),r(2040)],
    [40,  r(410), r(440), r(605), r(2290),r(2740)],
    [50,  r(510), r(540), r(755), r(2890),r(3440)],
    [60,  r(610), r(640), r(905), r(3490),r(4140)],
    [70,  r(710), r(740), r(1055),r(4090),r(8954)],
  ],
};

// Economy Service (ECO)
// Columns: In-City | Major-Major | Intra-Regional | Regional | Reg-to-Reg
export const economyRates = {
  zones: ["In-City", "Major-Major", "Intra-Regional", "Regional", "Reg-to-Reg"],
  table: [
    [0.5, r(80),  r(120), r(90),  r(150), r(200)],
    [1,   r(80),  r(120), r(90),  r(150), r(200)],
    [10,  r(80),  r(120), r(90),  r(150), r(200)],
    [15,  r(90),  r(150), r(125), r(185), r(250)],
    [20,  r(100), r(180), r(160), r(220), r(300)],
    [30,  r(120), r(240), r(230), r(290), r(400)],
    [40,  r(140), r(300), r(300), r(360), r(500)],
    [50,  r(160), r(360), r(370), r(430), r(600)],
    [60,  r(180), r(420), r(440), r(500), r(700)],
    [70,  r(200), r(480), r(510), r(570), r(800)],
  ],
};

// Economy Service Special — destination-based
// Columns: GRJ | CPT/PLZ | DUR/PMB | EL | BFN/NLP | PTG/RTB | REG-PTG | KIM
export const economySpecialRates = {
  zones: ["GRJ", "CPT/PLZ", "DUR/PMB", "EL", "BFN/NLP", "PTG/RTB", "REG-PTG", "KIM"],
  table: [
    [0.5, r(110),r(100),r(100),r(110),r(100),r(90), r(120),r(100)],
    [1,   r(110),r(100),r(100),r(110),r(100),r(90), r(120),r(100)],
    [10,  r(110),r(100),r(100),r(110),r(100),r(90), r(120),r(100)],
    [15,  r(145),r(125),r(115),r(140),r(112.5),r(100),r(135),r(120)],
    [20,  r(180),r(150),r(130),r(170),r(125),r(110),r(150),r(140)],
    [30,  r(250),r(200),r(160),r(230),r(150),r(130),r(180),r(180)],
    [40,  r(320),r(250),r(190),r(290),r(175),r(150),r(210),r(220)],
    [50,  r(390),r(300),r(220),r(350),r(200),r(170),r(240),r(260)],
    [60,  r(460),r(350),r(250),r(410),r(225),r(190),r(270),r(300)],
    [70,  r(530),r(400),r(280),r(470),r(250),r(210),r(300),r(340)],
  ],
};

// All local services map
export const localServices = {
  "SameDay Express Air": sameDayRates,
  "Overnight Express (ONX)": overnightRates,
  "NextDay Express": nextDayRates,
  "Economy Service (ECO)": economyRates,
  "Economy Service Special": economySpecialRates,
};

// Lookup local price from rate table
export function getLocalPrice(serviceKey, zone, weightKg) {
  const service = localServices[serviceKey];
  if (!service) return 0;

  const zoneIndex = service.zones.indexOf(zone);
  if (zoneIndex === -1) return 0;

  const table = service.table;
  // Find the row where weight <= bracket
  for (let i = 0; i < table.length; i++) {
    if (weightKg <= table[i][0]) {
      return table[i][zoneIndex + 1]; // +1 because col 0 is weight
    }
  }
  // Over max weight — use last row
  return table[table.length - 1][zoneIndex + 1];
}

// Volumetric weight calculation
export function getVolumetricWeight(lengthCm, widthCm, heightCm) {
  return (lengthCm * widthCm * heightCm) / 5000;
}

// Use higher of actual vs volumetric
export function getChargeableWeight(actualKg, lengthCm, widthCm, heightCm) {
  if (!lengthCm || !widthCm || !heightCm) return actualKg;
  const volumetric = getVolumetricWeight(lengthCm, widthCm, heightCm);
  return Math.max(actualKg, volumetric);
}

// ============================================================
// TOLL RATES — Government Gazette No. 52072 & 52073
// Effective 1 March 2025, incl. 15% VAT
// Vehicle class mapping:
//   1 Tonner  → Class 1
//   4 Tonner  → Class 2
//   8 Tonner  → Class 3
//   Tri-Axle  → Class 3
//   Super Link → Class 4
// ============================================================

export const vehicleTollClass = {
  "1 Tonner":  1,
  "4 Tonner":  2,
  "8 Tonner":  3,
  "Tri-Axle":  3,
  "Super Link": 4,
};

// Toll plazas indexed by route
// Each plaza: { name, type, class1, class2, class3, class4 }
export const tollPlazas = {
  N1: [
    { name: "Stormvoel",    type: "Ramp",     c1: 12,  c2: 30.50, c3: 35,   c4: 42   },
    { name: "Zambesi",      type: "Ramp",     c1: 14.50,c2: 36,   c3: 42,   c4: 51   },
    { name: "N1 Pumulani",  type: "Mainline", c1: 16,  c2: 40,   c3: 46,   c4: 55   },
    { name: "Wallmansthal", type: "Ramp",     c1: 7.20, c2: 18,   c3: 22,   c4: 25   },
    { name: "Murrayhill",   type: "Ramp",     c1: 14.50,c2: 36,   c3: 44,   c4: 50   },
    { name: "Hammanskraal", type: "Ramp",     c1: 34,  c2: 116,  c3: 126,  c4: 145  },
    { name: "Carousel",     type: "Mainline", c1: 73,  c2: 196,  c3: 216,  c4: 249  },
    { name: "Maubane",      type: "Ramp",     c1: 31.50,c2: 85,   c3: 94,   c4: 108  },
  ],
  N4: [
    { name: "N4 Doornpoort",type: "Mainline", c1: 19.50,c2: 49,   c3: 56,   c4: 68   },
    { name: "K99",          type: "Ramp",     c1: 19.50,c2: 49,   c3: 56,   c4: 68   },
    { name: "Brits",        type: "Mainline", c1: 19.50,c2: 68,   c3: 74,   c4: 87   },
    { name: "Buffelspoort", type: "Ramp",     c1: 19.50,c2: 47,   c3: 52,   c4: 62   },
    { name: "Marikana",     type: "Mainline", c1: 29,  c2: 70,   c3: 79,   c4: 93   },
    { name: "Kroondal",     type: "Ramp",     c1: 19.50,c2: 47,   c3: 52,   c4: 62   },
    { name: "Swartruggens", type: "Mainline", c1: 99,  c2: 249,  c3: 302,  c4: 355  },
    // Hans Strydom / Maputo Corridor (N4 East)
    { name: "Donkerhoek",   type: "Ramp",     c1: 16,  c2: 23,   c3: 33,   c4: 64   },
    { name: "Cullinan",     type: "Ramp",     c1: 20,  c2: 33,   c3: 49,   c4: 83   },
    { name: "Diamond Hill", type: "Mainline", c1: 49,  c2: 68,   c3: 128,  c4: 213  },
    { name: "Valtaki",      type: "Ramp",     c1: 38,  c2: 53,   c3: 78,   c4: 177  },
    { name: "Ekandustria",  type: "Ramp",     c1: 30,  c2: 45,   c3: 63,   c4: 126  },
    { name: "Middelburg",   type: "Mainline", c1: 81,  c2: 176,  c3: 268,  c4: 352  },
    { name: "Machado",      type: "Mainline", c1: 122, c2: 338,  c3: 493,  c4: 704  },
    { name: "Nkomazi",      type: "Mainline", c1: 92,  c2: 187,  c3: 271,  c4: 391  },
  ],
  N3: [
    { name: "Mooi",         type: "Mainline", c1: 67,  c2: 165,  c3: 231,  c4: 313  },
    { name: "Treverton",    type: "Ramp",     c1: 20,  c2: 49,   c3: 69,   c4: 94   },
    { name: "Bergville",    type: "Ramp",     c1: 29,  c2: 34,   c3: 63,   c4: 96   },
    { name: "Tugela",       type: "Mainline", c1: 96,  c2: 159,  c3: 251,  c4: 347  },
    { name: "Tugela East",  type: "Ramp",     c1: 60,  c2: 99,   c3: 147,  c4: 204  },
    { name: "Wilge",        type: "Mainline", c1: 90,  c2: 155,  c3: 207,  c4: 294  },
    { name: "De Hoek",      type: "Mainline", c1: 65,  c2: 101,  c3: 154,  c4: 222  },
  ],
  N1_NORTH: [
    { name: "Kranskop",     type: "Mainline", c1: 60,  c2: 152,  c3: 203,  c4: 249  },
    { name: "Nyl",          type: "Mainline", c1: 77,  c2: 144,  c3: 174,  c4: 233  },
    { name: "Sebetiela",    type: "Ramp",     c1: 24,  c2: 44,   c3: 56,   c4: 74   },
    { name: "Capricorn",    type: "Mainline", c1: 62,  c2: 170,  c3: 198,  c4: 248  },
    { name: "Baobab",       type: "Mainline", c1: 60,  c2: 163,  c3: 224,  c4: 269  },
  ],
  N2: [
    { name: "Tsitsikamma",  type: "Mainline", c1: 71,  c2: 178,  c3: 424,  c4: 600  },
    { name: "Oribi",        type: "Mainline", c1: 40,  c2: 70,   c3: 96,   c4: 157  },
    { name: "Umtentweni",   type: "Ramp",     c1: 17,  c2: 30,   c3: 41,   c4: 67   },
    { name: "oThongathi",   type: "Mainline", c1: 15,  c2: 31,   c3: 41,   c4: 59   },
    { name: "Mvoti",        type: "Mainline", c1: 18,  c2: 50,   c3: 67,   c4: 101  },
    { name: "Mtunzini",     type: "Mainline", c1: 62,  c2: 118,  c3: 141,  c4: 210  },
  ],
  N17: [
    { name: "Gosforth",     type: "Mainline", c1: 16,  c2: 44,   c3: 48,   c4: 67   },
    { name: "Dalpark",      type: "Mainline", c1: 15,  c2: 31,   c3: 41,   c4: 56   },
    { name: "Leandra",      type: "Mainline", c1: 49,  c2: 123,  c3: 184,  c4: 244  },
    { name: "Trichardt",    type: "Mainline", c1: 24,  c2: 61,   c3: 93,   c4: 122  },
    { name: "Ermelo",       type: "Mainline", c1: 44,  c2: 110,  c3: 164,  c4: 219  },
  ],
  N1_HUGUENOT: [
    { name: "Huguenot",     type: "Mainline", c1: 53,  c2: 146,  c3: 229,  c4: 371  },
  ],
  N1_VAAL: [
    { name: "Verkeerdevlei",type: "Mainline", c1: 76,  c2: 152,  c3: 229,  c4: 321  },
    { name: "Vaal",         type: "Mainline", c1: 89,  c2: 167,  c3: 200,  c4: 267  },
    { name: "Grasmere",     type: "Mainline", c1: 27,  c2: 80,   c3: 92,   c4: 122  },
  ],
  N3_MARIANNHILL: [
    { name: "Mariannhill",  type: "Mainline", c1: 16,  c2: 29,   c3: 35,   c4: 55   },
  ],
  N4_MAGALIES: [
    { name: "Pelindaba",    type: "Mainline", c1: 8,   c2: 15,   c3: 20,   c4: 26   },
    { name: "Quagga",       type: "Mainline", c1: 6,   c2: 11,   c3: 15,   c4: 20   },
  ],
};

// Route-to-toll mapping: which plazas are on common routes
export const routeTollMap = {
  "Johannesburg-Pretoria":    ["N1"],
  "Johannesburg-Rustenburg":  ["N4", "N4_MAGALIES"],
  "Johannesburg-Nelspruit":   ["N4"],
  "Johannesburg-Durban":      ["N3"],
  "Johannesburg-Cape Town":   ["N1_VAAL", "N1_HUGUENOT", "N3_MARIANNHILL"],
  "Johannesburg-Polokwane":   ["N1", "N1_NORTH"],
  "Johannesburg-East London":  ["N3"],
  "Johannesburg-Witbank":     ["N4"],
  "Johannesburg-Richards Bay": ["N3", "N2"],
};

// Calculate total toll cost for a vehicle on a given route list
export function calculateTollCost(routeKeys, vehicle) {
  const tollClass = vehicleTollClass[vehicle] || 1;
  const classKey = `c${tollClass}`;
  let total = 0;
  const breakdown = [];

  for (const routeKey of routeKeys) {
    const plazas = tollPlazas[routeKey] || [];
    for (const plaza of plazas) {
      const cost = plaza[classKey] || 0;
      total += cost;
      breakdown.push({ route: routeKey, plaza: plaza.name, cost });
    }
  }

  return { total: Math.round(total), breakdown };
}

// Smart toll estimator based on distance and detected route
// Uses Google Maps route text to identify likely toll routes
export function estimateTollFromRoute(pickup, delivery, vehicle, distanceKm) {
  const tollClass = vehicleTollClass[vehicle] || 1;
  const classKey = `c${tollClass}`;

  const text = `${pickup} ${delivery}`.toLowerCase();

  let routeKeys = [];

  if ((text.includes("durban") || text.includes("kwazulu") || text.includes("dbn")))
    routeKeys = ["N3"];
  else if (text.includes("cape town") || text.includes("western cape") || text.includes("cpt"))
    routeKeys = ["N1_VAAL", "N1_HUGUENOT"];
  else if (text.includes("nelspruit") || text.includes("mbombela") || text.includes("mozambique"))
    routeKeys = ["N4"];
  else if (text.includes("rustenburg") || text.includes("sun city"))
    routeKeys = ["N4_MAGALIES"];
  else if (text.includes("polokwane") || text.includes("limpopo") || text.includes("bela-bela"))
    routeKeys = ["N1", "N1_NORTH"];
  else if (text.includes("pretoria") || text.includes("tshwane") || text.includes("centurion"))
    routeKeys = ["N1"];
  else if (text.includes("witbank") || text.includes("emalahleni") || text.includes("secunda"))
    routeKeys = ["N4"];
  else if (text.includes("east london") || text.includes("eastern cape"))
    routeKeys = ["N3"];
  else if (text.includes("richardsbay") || text.includes("richards bay"))
    routeKeys = ["N3", "N2"];
  else {
    // Generic estimate: R2.50/km for Class 1, scaling by class
    const perKm = [2.5, 5.5, 7.5, 9.5];
    const estimate = Math.round(distanceKm * (perKm[tollClass - 1] || 2.5));
    return { total: estimate, breakdown: [], estimated: true };
  }

  const result = calculateTollCost(routeKeys, vehicle);
  return { ...result, estimated: false };
}

