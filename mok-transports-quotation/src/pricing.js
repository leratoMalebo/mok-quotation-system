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
// Source: JKJ_Rates_for_Moktransports__95__increase_.xlsx (×1.95 markup)
// ============================================================

// Helper: build rate from base × 1.95
function r(base) { return Math.round(base * 1.95); }

// ── ZONE → PLACES MAPPING (from JKJ Places file) ──
// Agents can type a destination and the system suggests the correct zone
export const zonePlacesMap = {
  // SameDay Express Air zones
  "Major Centres":     ["Johannesburg","Pretoria","Cape Town","Durban","Port Elizabeth","Bloemfontein","Nelspruit","Polokwane","East London","George","Kimberley","Rustenburg","Welkom","Pietermaritzburg","Witbank","Middelburg"],
  "In-City JHB-JHB":  ["Soweto","Randburg","Sandton","Roodepoort","Boksburg","Germiston","Edenvale","Benoni","Springs","Alberton","Midrand","Centurion","Kempton Park","Elandsfontein","Primrose","Florida","Krugersdorp","Brakpan"],
  "In-City JHB-PTA":  ["Pretoria","Tshwane","Akasia","Hatfield","Sunnyside","Mamelodi","Silverton","Atteridgeville","Lyttelton","Centurion","Midrand"],
  // Overnight Express zones
  "In-City":           ["Johannesburg","Pretoria","Sandton","Randburg","Centurion","Midrand","Kempton Park","Boksburg","Germiston","Cape Town","Durban","Bloemfontein","Port Elizabeth"],
  "Intra-Regional":    ["Soweto","Roodepoort","Brakpan","Springs","Benoni","Alberton","Edenvale","Elandsfontein","Vereeniging","Krugersdorp","Randfontein","Westonaria","Carletonville","Stellenbosch","Bellville","Parow","Pinetown","Queensburgh"],
  "Major to Regional": ["Rustenburg","Polokwane","Nelspruit","George","East London","Kimberley","Welkom","Upington","Pietermaritzburg","Richards Bay","Empangeni","Tzaneen","Phalaborwa","Potchefstroom","Klerksdorp"],
  "Reg-to-Reg":        ["Limpopo","Lephalale","Musina","Louis Trichardt","Tzaneen remote","Graskop","Hoedspruit","Standerton","Ermelo","Secunda","Bethal","Carolina","Volksrust","Piet Retief","Warden","Harrismith","Bethlehem","Sterkspruit"],
  // NextDay Express
  "Major (DBN)":       ["Durban","Pinetown","Umlazi","Chatsworth","Amanzimtoti","KwaMashu","Inanda","Tongaat","Ballito","Stanger"],
  "Inland Regional":   ["Polokwane","Nelspruit","Rustenburg","George","East London","Kimberley","Welkom","Pietermaritzburg","Witbank","Middelburg","Potchefstroom","Klerksdorp"],
  // Economy Special zones
  "GRJ":               ["George","Mossel Bay","Knysna","Plettenberg Bay","Wilderness","Sedgefield","Albertinia","Riversdale","Swellendam"],
  "CPT/PLZ":           ["Cape Town","Port Elizabeth","Gqeberha","Stellenbosch","Paarl","Worcester","Somerset West","Strand","Bellville","Parow","Mitchells Plain","Atlantis"],
  "DUR/PMB":           ["Durban","Pietermaritzburg","Pinetown","Amanzimtoti","Tongaat","Stanger","Greytown","Richmond","Estcourt","Ladysmith","Newcastle"],
  "EL":                ["East London","King Williams Town","Queenstown","Komani","Stutterheim","Cathcart","Mthatha","Umtata","Butterworth","Ngcobo"],
  "BFN/NLP":           ["Bloemfontein","Nelspruit","Mbombela","Botshabelo","Thaba Nchu","Sasolburg","Kroonstad","Welkom","Bethlehem","Harrismith"],
  "PTG/RTB":           ["Polokwane","Pietersburg","Rustenburg","Bela-Bela","Warmbaths","Mokopane","Mookgophong","Potgietersrus","Lephalale","Ellisras"],
  "REG-PTG":           ["Limpopo villages","Tzaneen","Phalaborwa","Louis Trichardt","Makhado","Musina","Venda","Thohoyandou","Giyani","Bochum"],
  "KIM":               ["Kimberley","Upington","Kuruman","Postmasburg","Douglas","Prieska","Carnarvon","Calvinia","Springbok","Port Nolloth"],
  // Economy ECO zones (same zone names as Overnight, reuse)
  "Major-Major":       ["Johannesburg CBD","Pretoria CBD","Cape Town CBD","Durban CBD","Port Elizabeth CBD","Bloemfontein CBD","All major city centres"],
  "Regional":          ["Witbank","Middelburg","Emalahleni","Standerton","Secunda","Ermelo","Bethal","Carolina","Potchefstroom","Klerksdorp","Vryburg","Kuruman"],
};

// Smart zone suggestion: given a destination string, guess most likely zone
// Returns empty string for cross-border addresses — those go through Cross Border type
export function suggestZone(serviceKey, destination) {
  if (!destination || !serviceKey) return "";

  // Do not suggest zones for clearly cross-border addresses
  const crossBorderPattern = /botswana|namibia|zimbabwe|kenya|mozambique|zambia|malawi|tanzania|lesotho|swaziland|eswatini|angola|drc|congo|rwanda|uganda|gaborone|windhoek|harare|bulawayo|nairobi|maputo|lusaka|lilongwe|luanda|kigali|kampala/i;
  if (crossBorderPattern.test(destination)) return "";

  const dest = destination.toLowerCase();
  const service = localServices[serviceKey];
  if (!service) return "";

  for (const zone of service.zones) {
    const places = zonePlacesMap[zone] || [];
    if (places.some(p => dest.includes(p.toLowerCase()) || p.toLowerCase().includes(dest.split(",")[0].trim()))) {
      return zone;
    }
  }
  return "";
}

// ── FULL RATE TABLES (all 71 rows, ×1.95) ──

// SameDay Express Air
// Zones: Major Centres | In-City JHB-JHB | In-City JHB-PTA
export const sameDayRates = {
  zones: ["Major Centres", "In-City JHB-JHB", "In-City JHB-PTA"],
  table: [
    [0.5, 1463, 780, 975],   [1, 1463, 780, 975],   [2, 1463, 780, 975],
    [3, 1560, 784, 981],     [4, 1658, 788, 987],    [5, 1755, 792, 992],
    [6, 1853, 796, 998],     [7, 1950, 800, 1004],   [8, 2048, 804, 1010],
    [9, 2145, 808, 1016],    [10, 2243, 811, 1021],  [11, 2340, 815, 1027],
    [12, 2438, 819, 1034],   [13, 2535, 823, 1040],  [14, 2633, 827, 1045],
    [15, 2730, 831, 1051],   [16, 2828, 835, 1057],  [17, 2925, 839, 1063],
    [18, 3023, 843, 1069],   [19, 3120, 846, 1074],  [20, 3218, 850, 1080],
    [21, 3315, 854, 1086],   [22, 3413, 858, 1092],  [23, 3510, 862, 1098],
    [24, 3608, 866, 1103],   [25, 3705, 870, 1109],  [26, 3803, 874, 1115],
    [27, 3900, 878, 1121],   [28, 3998, 882, 1127],  [29, 4095, 885, 1132],
    [30, 4193, 889, 1138],   [31, 4290, 893, 1144],  [32, 4388, 897, 1150],
    [33, 4485, 901, 1156],   [34, 4583, 905, 1162],  [35, 4680, 909, 1167],
    [36, 4778, 913, 1173],   [37, 4875, 917, 1179],  [38, 4973, 920, 1185],
    [39, 5070, 924, 1191],   [40, 5168, 928, 1196],  [41, 5265, 932, 1202],
    [42, 5363, 936, 1208],   [43, 5460, 940, 1214],  [44, 5558, 944, 1220],
    [45, 5655, 948, 1225],   [46, 5753, 952, 1231],  [47, 5850, 956, 1237],
    [48, 5948, 959, 1243],   [49, 6045, 963, 1249],  [50, 6143, 967, 1254],
    [51, 6240, 971, 1260],   [52, 6338, 975, 1268],  [53, 6435, 979, 1273],
    [54, 6533, 983, 1279],   [55, 6630, 987, 1285],  [56, 6728, 991, 1291],
    [57, 6825, 995, 1297],   [58, 6923, 998, 1302],  [59, 7020, 1002, 1308],
    [60, 7118, 1006, 1314],  [61, 7215, 1010, 1320], [62, 7313, 1014, 1326],
    [63, 7410, 1018, 1331],  [64, 7508, 1022, 1337], [65, 7605, 1026, 1343],
    [66, 7703, 1030, 1349],  [67, 7800, 1034, 1355], [68, 7898, 1037, 1361],
    [69, 7995, 1041, 1367],  [70, 8093, 1045, 1373],
  ],
};

// Overnight Express (ONX)
// Zones: In-City | Intra-Regional | Major to Regional | Reg-to-Reg
export const overnightRates = {
  zones: ["In-City", "Intra-Regional", "Major to Regional", "Reg-to-Reg"],
  table: [
    [0.5, 117, 156, 371, 566],   [1, 117, 156, 371, 566],   [2, 117, 156, 371, 566],
    [3, 123, 185, 488, 702],     [4, 129, 215, 605, 839],    [5, 135, 244, 722, 975],
    [6, 140, 273, 839, 1112],    [7, 146, 302, 956, 1248],   [8, 152, 332, 1073, 1385],
    [9, 158, 361, 1190, 1521],   [10, 164, 390, 1307, 1658], [11, 170, 419, 1424, 1794],
    [12, 176, 449, 1541, 1931],  [13, 181, 478, 1658, 2068], [14, 187, 507, 1775, 2204],
    [15, 193, 536, 1892, 2340],  [16, 199, 566, 2009, 2477], [17, 205, 595, 2126, 2613],
    [18, 211, 624, 2243, 2750],  [19, 216, 653, 2360, 2886], [20, 222, 683, 2477, 3023],
    [21, 228, 712, 2594, 3159],  [22, 234, 741, 2711, 3296], [23, 240, 770, 2828, 3433],
    [24, 246, 800, 2945, 3569],  [25, 252, 829, 3063, 3705], [26, 257, 858, 3180, 3842],
    [27, 263, 887, 3297, 3978],  [28, 269, 917, 3414, 4115], [29, 275, 946, 3531, 4251],
    [30, 281, 975, 3648, 4388],  [31, 287, 1004, 3765, 4524],[32, 293, 1034, 3882, 4661],
    [33, 298, 1063, 3999, 4798], [34, 304, 1092, 4116, 4934],[35, 310, 1121, 4233, 5070],
    [36, 316, 1151, 4350, 5207], [37, 322, 1180, 4467, 5343],[38, 328, 1209, 4584, 5480],
    [39, 333, 1238, 4701, 5616], [40, 339, 1268, 4818, 5753],[41, 345, 1297, 4935, 5890],
    [42, 351, 1326, 5053, 6026], [43, 357, 1355, 5170, 6162],[44, 363, 1385, 5287, 6299],
    [45, 369, 1414, 5404, 5435], [46, 374, 1443, 5521, 6572],[47, 380, 1472, 5638, 6708],
    [48, 386, 1502, 5755, 6845], [49, 392, 1531, 5872, 6981],[50, 398, 1560, 5989, 7118],
    [51, 404, 1589, 6106, 7254], [52, 410, 1619, 6223, 7391],[53, 415, 1648, 6341, 7527],
    [54, 421, 1677, 6458, 7664], [55, 427, 1706, 6575, 7800],[56, 433, 1736, 6692, 7937],
    [57, 439, 1765, 6809, 8073], [58, 445, 1794, 6926, 8210],[59, 450, 1823, 7043, 8347],
    [60, 456, 1853, 7160, 8483], [61, 462, 1882, 7277, 8619],[62, 468, 1911, 7394, 8756],
    [63, 474, 1940, 7511, 8892], [64, 480, 1970, 7628, 9029],[65, 485, 1999, 7745, 9165],
    [66, 491, 2028, 7863, 9302], [67, 497, 2057, 7980, 9438],[68, 503, 2087, 8093, 9575],
    [69, 509, 2116, 8210, 9712], [70, 515, 2145, 8327, 9848],
  ],
};

// NextDay Express
// Zones: In-City | Major (DBN) | Intra-Regional | Inland Regional | Reg-to-Reg
export const nextDayRates = {
  zones: ["In-City", "Major (DBN)", "Intra-Regional", "Inland Regional", "Reg-to-Reg"],
  table: [
    [0.5, 117, 176, 156, 371, 566],  [1, 117, 176, 156, 371, 566],
    [2, 117, 176, 156, 371, 566],    [3, 117, 176, 156, 371, 566],
    [4, 117, 176, 156, 371, 566],    [5, 117, 176, 156, 371, 566],
    [6, 137, 195, 185, 488, 702],    [7, 156, 215, 215, 605, 839],
    [8, 176, 234, 244, 722, 975],    [9, 195, 254, 273, 839, 1112],
    [10, 215, 273, 302, 956, 1248],  [11, 234, 293, 332, 1073, 1385],
    [12, 254, 312, 361, 1190, 1521], [13, 273, 332, 390, 1307, 1658],
    [14, 293, 351, 419, 1424, 1794], [15, 312, 371, 449, 1541, 1931],
    [16, 332, 390, 478, 1658, 2068], [17, 351, 410, 507, 1775, 2204],
    [18, 371, 429, 536, 1892, 2340], [19, 390, 449, 566, 2009, 2477],
    [20, 410, 468, 595, 2126, 2613], [21, 429, 488, 624, 2243, 2750],
    [22, 449, 507, 653, 2360, 2886], [23, 468, 527, 683, 2477, 3023],
    [24, 488, 546, 712, 2594, 3159], [25, 507, 566, 741, 2711, 3296],
    [26, 527, 585, 770, 2828, 3433], [27, 546, 605, 800, 2945, 3569],
    [28, 566, 624, 829, 3063, 3705], [29, 585, 644, 858, 3180, 3842],
    [30, 605, 663, 887, 3297, 3978], [31, 624, 683, 917, 3414, 4115],
    [32, 644, 702, 946, 3531, 4251], [33, 663, 722, 975, 3648, 4388],
    [34, 683, 741, 1004, 3765, 4524],[35, 702, 761, 1034, 3882, 4661],
    [36, 722, 780, 1063, 3999, 4798],[37, 741, 800, 1092, 4116, 4934],
    [38, 761, 819, 1121, 4233, 5070],[39, 780, 839, 1151, 4350, 5207],
    [40, 800, 858, 1180, 4467, 5343],[41, 819, 878, 1209, 4584, 5480],
    [42, 839, 897, 1238, 4701, 5616],[43, 858, 917, 1268, 4818, 5753],
    [44, 878, 936, 1297, 4935, 5890],[45, 897, 956, 1326, 5053, 6026],
    [46, 917, 975, 1355, 5170, 6162],[47, 936, 995, 1385, 5287, 6299],
    [48, 956, 1014, 1414, 5404, 6435],[49, 975, 1034, 1443, 5521, 6572],
    [50, 995, 1053, 1472, 5638, 6708],[51, 1014, 1073, 1502, 5755, 6845],
    [52, 1034, 1092, 1531, 5872, 6981],[53, 1053, 1112, 1560, 5989, 7118],
    [54, 1073, 1131, 1589, 6106, 7254],[55, 1092, 1151, 1619, 6223, 7391],
    [56, 1112, 1170, 1648, 6341, 7527],[57, 1131, 1190, 1677, 6458, 7664],
    [58, 1151, 1209, 1706, 6575, 7800],[59, 1170, 1229, 1736, 6692, 7937],
    [60, 1190, 1248, 1765, 6809, 8073],[61, 1209, 1268, 1794, 6926, 8210],
    [62, 1229, 1287, 1823, 7043, 8347],[63, 1248, 1307, 1853, 7160, 8483],
    [64, 1268, 1326, 1882, 7277, 8619],[65, 1287, 1346, 1911, 7394, 8756],
    [66, 1307, 1365, 1940, 7511, 8892],[67, 1326, 1385, 1970, 7628, 9029],
    [68, 1346, 1404, 1999, 7742, 9165],[69, 1365, 1424, 2028, 7859, 9302],
    [70, 1385, 1443, 2057, 7976, 9438],
  ],
};

// Economy Service (ECO)
// Zones: In-City | Major-Major | Intra-Regional | Regional | Reg-to-Reg
export const economyRates = {
  zones: ["In-City", "Major-Major", "Intra-Regional", "Regional", "Reg-to-Reg"],
  table: [
    [0.5, 156, 234, 176, 293, 390],  [1, 156, 234, 176, 293, 390],
    [2, 156, 234, 176, 293, 390],    [3, 156, 234, 176, 293, 390],
    [4, 156, 234, 176, 293, 390],    [5, 156, 234, 176, 293, 390],
    [6, 156, 234, 176, 293, 390],    [7, 156, 234, 176, 293, 390],
    [8, 156, 234, 176, 293, 390],    [9, 156, 234, 176, 293, 390],
    [10, 156, 234, 176, 293, 390],   [11, 160, 246, 189, 306, 410],
    [12, 164, 257, 203, 320, 429],   [13, 168, 269, 216, 333, 449],
    [14, 172, 281, 230, 347, 468],   [15, 176, 293, 244, 361, 488],
    [16, 179, 304, 257, 374, 507],   [17, 183, 316, 271, 388, 527],
    [18, 187, 328, 285, 402, 546],   [19, 191, 339, 298, 415, 566],
    [20, 195, 351, 312, 429, 585],   [21, 199, 363, 326, 443, 605],
    [22, 203, 374, 339, 456, 624],   [23, 207, 386, 353, 470, 644],
    [24, 211, 398, 366, 483, 663],   [25, 215, 410, 380, 497, 683],
    [26, 218, 421, 394, 511, 702],   [27, 222, 433, 407, 524, 722],
    [28, 226, 445, 421, 538, 741],   [29, 230, 456, 434, 551, 761],
    [30, 234, 468, 448, 565, 780],   [31, 238, 480, 462, 579, 800],
    [32, 242, 491, 475, 592, 819],   [33, 246, 503, 489, 606, 839],
    [34, 250, 515, 502, 619, 858],   [35, 254, 527, 516, 633, 878],
    [36, 257, 538, 530, 647, 897],   [37, 261, 550, 543, 660, 917],
    [38, 265, 562, 557, 674, 936],   [39, 269, 573, 570, 687, 956],
    [40, 273, 585, 585, 702, 975],   [41, 277, 597, 599, 715, 995],
    [42, 281, 608, 612, 729, 1014],  [43, 285, 620, 626, 743, 1034],
    [44, 289, 632, 639, 756, 1053],  [45, 293, 644, 653, 770, 1073],
    [46, 296, 655, 667, 783, 1092],  [47, 300, 667, 680, 797, 1112],
    [48, 304, 679, 694, 811, 1131],  [49, 308, 690, 707, 824, 1151],
    [50, 312, 702, 721, 838, 1170],  [51, 316, 714, 735, 851, 1190],
    [52, 320, 725, 748, 865, 1209],  [53, 324, 737, 762, 879, 1229],
    [54, 328, 749, 775, 892, 1248],  [55, 332, 761, 789, 906, 1268],
    [56, 335, 772, 803, 919, 1287],  [57, 339, 784, 816, 933, 1307],
    [58, 343, 796, 830, 947, 1326],  [59, 347, 807, 843, 960, 1346],
    [60, 351, 819, 858, 975, 1365],  [61, 355, 831, 872, 989, 1385],
    [62, 359, 842, 885, 1002, 1404], [63, 363, 854, 899, 1016, 1424],
    [64, 367, 866, 912, 1029, 1443], [65, 371, 878, 926, 1043, 1463],
    [66, 374, 889, 940, 1057, 1482], [67, 378, 901, 953, 1070, 1502],
    [68, 382, 913, 967, 1084, 1521], [69, 386, 924, 981, 1097, 1541],
    [70, 390, 936, 995, 1112, 1560],
  ],
};

// Economy Service Special — destination-based
// Zones: GRJ | CPT/PLZ | DUR/PMB | EL | BFN/NLP | PTG/RTB | REG-PTG | KIM
export const economySpecialRates = {
  zones: ["GRJ", "CPT/PLZ", "DUR/PMB", "EL", "BFN/NLP", "PTG/RTB", "REG-PTG", "KIM"],
  table: [
    [0, 215, 195, 195, 215, 195, 176, 234, 195],
    [1, 215, 195, 195, 215, 195, 176, 234, 195],
    [2, 215, 195, 195, 215, 195, 176, 234, 195],
    [3, 215, 195, 195, 215, 195, 176, 234, 195],
    [4, 215, 195, 195, 215, 195, 176, 234, 195],
    [5, 215, 195, 195, 215, 195, 176, 234, 195],
    [6, 215, 195, 195, 215, 195, 176, 234, 195],
    [7, 215, 195, 195, 215, 195, 176, 234, 195],
    [8, 215, 195, 195, 215, 195, 176, 234, 195],
    [9, 215, 195, 195, 215, 195, 176, 234, 195],
    [10, 215, 195, 195, 215, 195, 176, 234, 195],
    [11, 228, 205, 201, 226, 200, 179, 240, 203],
    [12, 242, 215, 207, 238, 205, 183, 246, 211],
    [13, 256, 224, 213, 250, 210, 187, 252, 218],
    [14, 269, 234, 218, 261, 215, 191, 257, 226],
    [15, 283, 244, 224, 273, 219, 195, 263, 234],
    [16, 296, 254, 230, 285, 224, 199, 269, 242],
    [17, 310, 263, 236, 296, 229, 203, 275, 250],
    [18, 324, 273, 242, 308, 234, 207, 281, 257],
    [19, 337, 283, 248, 320, 239, 211, 287, 265],
    [20, 351, 293, 254, 332, 244, 215, 293, 273],
    [21, 365, 302, 259, 343, 249, 218, 298, 281],
    [22, 378, 312, 265, 355, 254, 222, 304, 288],
    [23, 392, 322, 271, 366, 258, 226, 310, 296],
    [24, 406, 332, 277, 378, 263, 230, 316, 304],
    [25, 419, 341, 283, 390, 268, 234, 322, 312],
    [26, 433, 351, 289, 402, 273, 238, 328, 320],
    [27, 447, 361, 294, 413, 278, 242, 334, 328],
    [28, 460, 371, 300, 425, 283, 246, 339, 335],
    [29, 474, 380, 306, 437, 288, 250, 345, 343],
    [30, 488, 390, 312, 449, 293, 254, 351, 351],
    [31, 501, 400, 318, 460, 297, 257, 357, 359],
    [32, 515, 410, 324, 472, 302, 261, 363, 367],
    [33, 529, 419, 329, 484, 307, 265, 369, 374],
    [34, 542, 429, 335, 496, 312, 269, 374, 382],
    [35, 556, 439, 341, 507, 317, 273, 380, 390],
    [36, 570, 449, 347, 519, 322, 277, 386, 398],
    [37, 583, 458, 353, 531, 327, 281, 392, 406],
    [38, 597, 468, 359, 542, 332, 285, 398, 413],
    [39, 611, 478, 364, 554, 337, 289, 404, 421],
    [40, 624, 488, 370, 566, 341, 293, 410, 429],
    [41, 638, 497, 376, 578, 346, 296, 415, 437],
    [42, 652, 507, 382, 589, 351, 300, 421, 444],
    [43, 665, 517, 388, 601, 356, 304, 427, 452],
    [44, 679, 527, 394, 613, 361, 308, 433, 460],
    [45, 693, 536, 400, 624, 366, 312, 439, 468],
    [46, 706, 546, 405, 636, 371, 316, 445, 476],
    [47, 720, 556, 411, 648, 375, 320, 450, 483],
    [48, 734, 566, 417, 660, 380, 324, 456, 491],
    [49, 747, 575, 423, 671, 385, 328, 462, 499],
    [50, 761, 585, 429, 683, 390, 332, 468, 507],
    [51, 775, 595, 435, 695, 395, 336, 474, 515],
    [52, 788, 605, 440, 706, 400, 339, 480, 522],
    [53, 802, 614, 446, 718, 405, 343, 486, 530],
    [54, 816, 624, 452, 730, 410, 347, 491, 538],
    [55, 829, 634, 458, 742, 414, 351, 497, 546],
    [56, 843, 644, 464, 753, 419, 355, 503, 554],
    [57, 857, 653, 470, 765, 424, 359, 509, 562],
    [58, 870, 663, 475, 777, 429, 363, 515, 569],
    [59, 884, 673, 481, 788, 434, 367, 521, 577],
    [60, 898, 683, 488, 800, 439, 371, 527, 585],
    [61, 911, 693, 494, 812, 444, 374, 532, 593],
    [62, 925, 702, 499, 824, 449, 378, 538, 600],
    [63, 939, 712, 505, 835, 453, 382, 544, 608],
    [64, 952, 722, 511, 847, 458, 386, 550, 616],
    [65, 966, 732, 517, 859, 463, 390, 556, 624],
    [66, 980, 741, 523, 870, 468, 394, 562, 632],
    [67, 993, 751, 529, 882, 473, 398, 568, 640],
    [68, 1007, 761, 534, 894, 478, 402, 573, 647],
    [69, 1021, 771, 540, 906, 482, 406, 579, 655],
    [70, 1034, 780, 546, 917, 488, 410, 585, 663],
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

