import type { ZoneMetrics, CityMetrics, ZoneRiskMetrics, PortfolioPreset, PipelineProject, Listing } from "@/types/database";

// Mock data representing real Tijuana zones
export const TIJUANA_ZONES: ZoneMetrics[] = [
  {
    zone_id: "1",
    zone_name: "Zona Río",
    zone_slug: "zona-rio",
    avg_price_per_m2: 32500,
    price_trend_pct: 4.2,
    avg_ticket: 4800000,
    total_listings: 342,
    listings_by_type: { casa: 45, departamento: 210, terreno: 12, local: 55, oficina: 20 },
    avg_ticket_by_type: { casa: 6200000, departamento: 3800000, terreno: 5500000, local: 4200000, oficina: 3100000 },
  },
  {
    zone_id: "2",
    zone_name: "Playas de Tijuana",
    zone_slug: "playas-de-tijuana",
    avg_price_per_m2: 38200,
    price_trend_pct: 6.8,
    avg_ticket: 5200000,
    total_listings: 287,
    listings_by_type: { casa: 95, departamento: 150, terreno: 22, local: 12, oficina: 8 },
    avg_ticket_by_type: { casa: 7100000, departamento: 4200000, terreno: 6800000, local: 3500000, oficina: 2800000 },
  },
  {
    zone_id: "3",
    zone_name: "Otay",
    zone_slug: "otay",
    avg_price_per_m2: 18500,
    price_trend_pct: 2.1,
    avg_ticket: 2800000,
    total_listings: 198,
    listings_by_type: { casa: 110, departamento: 35, terreno: 28, local: 18, oficina: 7 },
    avg_ticket_by_type: { casa: 2900000, departamento: 2100000, terreno: 3200000, local: 2500000, oficina: 1800000 },
  },
  {
    zone_id: "4",
    zone_name: "Chapultepec",
    zone_slug: "chapultepec",
    avg_price_per_m2: 28900,
    price_trend_pct: 3.5,
    avg_ticket: 4100000,
    total_listings: 156,
    listings_by_type: { casa: 60, departamento: 72, terreno: 8, local: 10, oficina: 6 },
    avg_ticket_by_type: { casa: 5100000, departamento: 3200000, terreno: 4800000, local: 3800000, oficina: 2600000 },
  },
  {
    zone_id: "5",
    zone_name: "Hipódromo",
    zone_slug: "hipodromo",
    avg_price_per_m2: 26800,
    price_trend_pct: -1.2,
    avg_ticket: 3600000,
    total_listings: 134,
    listings_by_type: { casa: 48, departamento: 62, terreno: 5, local: 12, oficina: 7 },
    avg_ticket_by_type: { casa: 4500000, departamento: 2800000, terreno: 4200000, local: 3200000, oficina: 2200000 },
  },
  {
    zone_id: "6",
    zone_name: "Centro",
    zone_slug: "centro",
    avg_price_per_m2: 15200,
    price_trend_pct: -0.8,
    avg_ticket: 1900000,
    total_listings: 221,
    listings_by_type: { casa: 65, departamento: 85, terreno: 15, local: 42, oficina: 14 },
    avg_ticket_by_type: { casa: 2200000, departamento: 1500000, terreno: 2800000, local: 1800000, oficina: 1200000 },
  },
  {
    zone_id: "7",
    zone_name: "Residencial del Bosque",
    zone_slug: "residencial-del-bosque",
    avg_price_per_m2: 22100,
    price_trend_pct: 5.3,
    avg_ticket: 3200000,
    total_listings: 89,
    listings_by_type: { casa: 55, departamento: 22, terreno: 8, local: 3, oficina: 1 },
    avg_ticket_by_type: { casa: 3800000, departamento: 2400000, terreno: 3000000, local: 2100000, oficina: 1600000 },
  },
  {
    zone_id: "8",
    zone_name: "La Mesa",
    zone_slug: "la-mesa",
    avg_price_per_m2: 16800,
    price_trend_pct: 1.9,
    avg_ticket: 2400000,
    total_listings: 176,
    listings_by_type: { casa: 95, departamento: 40, terreno: 20, local: 15, oficina: 6 },
    avg_ticket_by_type: { casa: 2600000, departamento: 1800000, terreno: 2900000, local: 2100000, oficina: 1500000 },
  },
  // ─── Premium/Central ────────────────────────────────────────────────
  {
    zone_id: "9",
    zone_name: "Cacho",
    zone_slug: "cacho",
    avg_price_per_m2: 30200,
    price_trend_pct: 3.8,
    avg_ticket: 4500000,
    total_listings: 145,
    listings_by_type: { casa: 52, departamento: 68, terreno: 5, local: 14, oficina: 6 },
    avg_ticket_by_type: { casa: 5800000, departamento: 3500000, terreno: 5000000, local: 3900000, oficina: 2800000 },
  },
  {
    zone_id: "10",
    zone_name: "Agua Caliente",
    zone_slug: "agua-caliente",
    avg_price_per_m2: 28400,
    price_trend_pct: 2.9,
    avg_ticket: 4200000,
    total_listings: 168,
    listings_by_type: { casa: 42, departamento: 88, terreno: 6, local: 22, oficina: 10 },
    avg_ticket_by_type: { casa: 5500000, departamento: 3400000, terreno: 4800000, local: 3600000, oficina: 2700000 },
  },
  {
    zone_id: "11",
    zone_name: "Lomas de Agua Caliente",
    zone_slug: "lomas-de-agua-caliente",
    avg_price_per_m2: 25600,
    price_trend_pct: 4.1,
    avg_ticket: 3800000,
    total_listings: 112,
    listings_by_type: { casa: 68, departamento: 28, terreno: 10, local: 4, oficina: 2 },
    avg_ticket_by_type: { casa: 4200000, departamento: 3000000, terreno: 3600000, local: 2800000, oficina: 2200000 },
  },
  // ─── Frontera/Norte ─────────────────────────────────────────────────
  {
    zone_id: "12",
    zone_name: "Libertad",
    zone_slug: "libertad",
    avg_price_per_m2: 14800,
    price_trend_pct: 1.2,
    avg_ticket: 1800000,
    total_listings: 195,
    listings_by_type: { casa: 85, departamento: 55, terreno: 18, local: 28, oficina: 9 },
    avg_ticket_by_type: { casa: 2000000, departamento: 1400000, terreno: 2500000, local: 1600000, oficina: 1100000 },
  },
  {
    zone_id: "13",
    zone_name: "Soler",
    zone_slug: "soler",
    avg_price_per_m2: 13500,
    price_trend_pct: 0.8,
    avg_ticket: 1650000,
    total_listings: 88,
    listings_by_type: { casa: 42, departamento: 25, terreno: 8, local: 10, oficina: 3 },
    avg_ticket_by_type: { casa: 1800000, departamento: 1200000, terreno: 2200000, local: 1400000, oficina: 900000 },
  },
  {
    zone_id: "14",
    zone_name: "Federal",
    zone_slug: "federal",
    avg_price_per_m2: 12800,
    price_trend_pct: 0.5,
    avg_ticket: 1500000,
    total_listings: 72,
    listings_by_type: { casa: 35, departamento: 20, terreno: 6, local: 8, oficina: 3 },
    avg_ticket_by_type: { casa: 1700000, departamento: 1100000, terreno: 2000000, local: 1300000, oficina: 850000 },
  },
  // ─── Costa ──────────────────────────────────────────────────────────
  {
    zone_id: "15",
    zone_name: "Baja Malibú",
    zone_slug: "baja-malibu",
    avg_price_per_m2: 45200,
    price_trend_pct: 7.5,
    avg_ticket: 8500000,
    total_listings: 65,
    listings_by_type: { casa: 38, departamento: 22, terreno: 4, local: 1, oficina: 0 },
    avg_ticket_by_type: { casa: 10200000, departamento: 6500000, terreno: 9000000, local: 4500000, oficina: 0 },
  },
  {
    zone_id: "16",
    zone_name: "Real del Mar",
    zone_slug: "real-del-mar",
    avg_price_per_m2: 40800,
    price_trend_pct: 5.9,
    avg_ticket: 7200000,
    total_listings: 78,
    listings_by_type: { casa: 45, departamento: 25, terreno: 6, local: 2, oficina: 0 },
    avg_ticket_by_type: { casa: 8800000, departamento: 5200000, terreno: 7500000, local: 4000000, oficina: 0 },
  },
  {
    zone_id: "17",
    zone_name: "San Antonio del Mar",
    zone_slug: "san-antonio-del-mar",
    avg_price_per_m2: 35500,
    price_trend_pct: 8.2,
    avg_ticket: 6800000,
    total_listings: 52,
    listings_by_type: { casa: 30, departamento: 15, terreno: 5, local: 2, oficina: 0 },
    avg_ticket_by_type: { casa: 8200000, departamento: 4800000, terreno: 7000000, local: 3800000, oficina: 0 },
  },
  {
    zone_id: "18",
    zone_name: "Punta Bandera",
    zone_slug: "punta-bandera",
    avg_price_per_m2: 28000,
    price_trend_pct: 6.1,
    avg_ticket: 5500000,
    total_listings: 38,
    listings_by_type: { casa: 22, departamento: 10, terreno: 4, local: 2, oficina: 0 },
    avg_ticket_by_type: { casa: 6800000, departamento: 4000000, terreno: 5500000, local: 3200000, oficina: 0 },
  },
  {
    zone_id: "19",
    zone_name: "Costa Coronado",
    zone_slug: "costa-coronado",
    avg_price_per_m2: 32000,
    price_trend_pct: 5.5,
    avg_ticket: 6200000,
    total_listings: 45,
    listings_by_type: { casa: 28, departamento: 12, terreno: 3, local: 2, oficina: 0 },
    avg_ticket_by_type: { casa: 7500000, departamento: 4500000, terreno: 6000000, local: 3500000, oficina: 0 },
  },
  // ─── Este ───────────────────────────────────────────────────────────
  {
    zone_id: "20",
    zone_name: "Las Américas",
    zone_slug: "las-americas",
    avg_price_per_m2: 19200,
    price_trend_pct: 2.5,
    avg_ticket: 2600000,
    total_listings: 142,
    listings_by_type: { casa: 78, departamento: 35, terreno: 12, local: 12, oficina: 5 },
    avg_ticket_by_type: { casa: 2800000, departamento: 2000000, terreno: 3000000, local: 2200000, oficina: 1600000 },
  },
  {
    zone_id: "21",
    zone_name: "Villa Fontana",
    zone_slug: "villa-fontana",
    avg_price_per_m2: 17500,
    price_trend_pct: 1.8,
    avg_ticket: 2200000,
    total_listings: 98,
    listings_by_type: { casa: 62, departamento: 20, terreno: 8, local: 6, oficina: 2 },
    avg_ticket_by_type: { casa: 2400000, departamento: 1700000, terreno: 2600000, local: 1900000, oficina: 1300000 },
  },
  {
    zone_id: "22",
    zone_name: "Montecarlo",
    zone_slug: "montecarlo",
    avg_price_per_m2: 18800,
    price_trend_pct: 2.2,
    avg_ticket: 2500000,
    total_listings: 85,
    listings_by_type: { casa: 55, departamento: 18, terreno: 6, local: 4, oficina: 2 },
    avg_ticket_by_type: { casa: 2700000, departamento: 1900000, terreno: 2800000, local: 2100000, oficina: 1400000 },
  },
  {
    zone_id: "23",
    zone_name: "Otay Universidad",
    zone_slug: "otay-universidad",
    avg_price_per_m2: 20500,
    price_trend_pct: 3.2,
    avg_ticket: 2900000,
    total_listings: 115,
    listings_by_type: { casa: 48, departamento: 42, terreno: 10, local: 10, oficina: 5 },
    avg_ticket_by_type: { casa: 3200000, departamento: 2300000, terreno: 3100000, local: 2400000, oficina: 1700000 },
  },
  // ─── Sur/Residencial ───────────────────────────────────────────────
  {
    zone_id: "24",
    zone_name: "Santa Fe",
    zone_slug: "santa-fe",
    avg_price_per_m2: 15800,
    price_trend_pct: 3.0,
    avg_ticket: 2100000,
    total_listings: 128,
    listings_by_type: { casa: 75, departamento: 30, terreno: 12, local: 8, oficina: 3 },
    avg_ticket_by_type: { casa: 2300000, departamento: 1600000, terreno: 2400000, local: 1800000, oficina: 1200000 },
  },
  {
    zone_id: "25",
    zone_name: "Natura",
    zone_slug: "natura",
    avg_price_per_m2: 14200,
    price_trend_pct: 4.5,
    avg_ticket: 1900000,
    total_listings: 95,
    listings_by_type: { casa: 60, departamento: 22, terreno: 8, local: 3, oficina: 2 },
    avg_ticket_by_type: { casa: 2100000, departamento: 1500000, terreno: 2200000, local: 1600000, oficina: 1000000 },
  },
  {
    zone_id: "26",
    zone_name: "Colinas de California",
    zone_slug: "colinas-de-california",
    avg_price_per_m2: 16500,
    price_trend_pct: 2.8,
    avg_ticket: 2300000,
    total_listings: 82,
    listings_by_type: { casa: 52, departamento: 18, terreno: 6, local: 4, oficina: 2 },
    avg_ticket_by_type: { casa: 2500000, departamento: 1700000, terreno: 2600000, local: 1900000, oficina: 1300000 },
  },
  {
    zone_id: "27",
    zone_name: "Lomas Virreyes",
    zone_slug: "lomas-virreyes",
    avg_price_per_m2: 17200,
    price_trend_pct: 3.5,
    avg_ticket: 2400000,
    total_listings: 68,
    listings_by_type: { casa: 42, departamento: 15, terreno: 5, local: 4, oficina: 2 },
    avg_ticket_by_type: { casa: 2700000, departamento: 1800000, terreno: 2500000, local: 2000000, oficina: 1400000 },
  },
  {
    zone_id: "28",
    zone_name: "Insurgentes",
    zone_slug: "insurgentes",
    avg_price_per_m2: 13800,
    price_trend_pct: 1.5,
    avg_ticket: 1700000,
    total_listings: 105,
    listings_by_type: { casa: 58, departamento: 28, terreno: 8, local: 8, oficina: 3 },
    avg_ticket_by_type: { casa: 1900000, departamento: 1300000, terreno: 2100000, local: 1500000, oficina: 950000 },
  },
  // ─── Periférico ────────────────────────────────────────────────────
  {
    zone_id: "29",
    zone_name: "El Florido",
    zone_slug: "el-florido",
    avg_price_per_m2: 11500,
    price_trend_pct: 2.0,
    avg_ticket: 1400000,
    total_listings: 165,
    listings_by_type: { casa: 105, departamento: 30, terreno: 18, local: 8, oficina: 4 },
    avg_ticket_by_type: { casa: 1500000, departamento: 1000000, terreno: 1800000, local: 1200000, oficina: 800000 },
  },
  {
    zone_id: "30",
    zone_name: "Terrazas de la Presa",
    zone_slug: "terrazas-de-la-presa",
    avg_price_per_m2: 12200,
    price_trend_pct: 1.6,
    avg_ticket: 1500000,
    total_listings: 78,
    listings_by_type: { casa: 48, departamento: 15, terreno: 8, local: 5, oficina: 2 },
    avg_ticket_by_type: { casa: 1600000, departamento: 1100000, terreno: 1900000, local: 1300000, oficina: 850000 },
  },
];

// Weighted average price per m² (weighted by inventory per zone)
const _totalListings = TIJUANA_ZONES.reduce((s, z) => s + z.total_listings, 0);
const _weightedPrice = TIJUANA_ZONES.reduce(
  (s, z) => s + z.avg_price_per_m2 * z.total_listings, 0
) / _totalListings;

export const TIJUANA_CITY_METRICS: CityMetrics = {
  city: "Tijuana",
  avg_price_per_m2: Math.round(_weightedPrice),
  price_trend_pct: 3.1,
  total_listings: _totalListings,
  total_zones: TIJUANA_ZONES.length,
  top_zones: TIJUANA_ZONES.slice(0, 4),
  hottest_zones: [...TIJUANA_ZONES].sort((a, b) => b.total_listings - a.total_listings).slice(0, 4),
};

// Monthly trend data for charts (updated to current period)
export const PRICE_TREND_DATA = [
  { month: "Abr 25", avg_price_m2: 24100, listings: 1490 },
  { month: "May 25", avg_price_m2: 24500, listings: 1520 },
  { month: "Jun 25", avg_price_m2: 24300, listings: 1530 },
  { month: "Jul 25", avg_price_m2: 24600, listings: 1555 },
  { month: "Ago 25", avg_price_m2: 24700, listings: 1570 },
  { month: "Sep 25", avg_price_m2: 24875, listings: 1580 },
  { month: "Oct 25", avg_price_m2: 25050, listings: 1590 },
  { month: "Nov 25", avg_price_m2: 25200, listings: 1595 },
  { month: "Dic 25", avg_price_m2: 25100, listings: 1560 },
  { month: "Ene 26", avg_price_m2: 25400, listings: 1580 },
  { month: "Feb 26", avg_price_m2: 25650, listings: 1595 },
  { month: "Mar 26", avg_price_m2: Math.round(_weightedPrice), listings: _totalListings },
];

// ─── Risk Data ────────────────────────────────────────────────────────────────
// Risk scores are manually curated but plausible given the volatility and market context.
// When real data is available, risk.ts computes: riskScore = volatility*4 + vacancyProxy + 20
export const ZONE_RISK_DATA: ZoneRiskMetrics[] = [
  {
    zone_slug: "zona-rio", zone_name: "Zona Río",
    risk_score: 35, volatility: 3.2, cap_rate: 6.7, vacancy_rate: 6.1,
    liquidity_score: 88, market_maturity: "consolidado", avg_rent_per_m2: 245, risk_label: "Bajo",
  },
  {
    zone_slug: "playas-de-tijuana", zone_name: "Playas de Tijuana",
    risk_score: 52, volatility: 6.5, cap_rate: 5.8, vacancy_rate: 8.4,
    liquidity_score: 75, market_maturity: "en_desarrollo", avg_rent_per_m2: 310, risk_label: "Medio",
  },
  {
    zone_slug: "otay", zone_name: "Otay",
    risk_score: 28, volatility: 2.8, cap_rate: 8.5, vacancy_rate: 4.8,
    liquidity_score: 72, market_maturity: "consolidado", avg_rent_per_m2: 145, risk_label: "Bajo",
  },
  {
    zone_slug: "chapultepec", zone_name: "Chapultepec",
    risk_score: 38, volatility: 4.1, cap_rate: 6.9, vacancy_rate: 7.2,
    liquidity_score: 68, market_maturity: "maduro", avg_rent_per_m2: 220, risk_label: "Bajo",
  },
  {
    zone_slug: "hipodromo", zone_name: "Hipódromo",
    risk_score: 58, volatility: 7.2, cap_rate: 6.2, vacancy_rate: 11.3,
    liquidity_score: 55, market_maturity: "maduro", avg_rent_per_m2: 195, risk_label: "Medio",
  },
  {
    zone_slug: "centro", zone_name: "Centro",
    risk_score: 65, volatility: 6.8, cap_rate: 9.1, vacancy_rate: 14.6,
    liquidity_score: 82, market_maturity: "maduro", avg_rent_per_m2: 120, risk_label: "Alto",
  },
  {
    zone_slug: "residencial-del-bosque", zone_name: "Residencial del Bosque",
    risk_score: 45, volatility: 5.5, cap_rate: 7.8, vacancy_rate: 5.5,
    liquidity_score: 42, market_maturity: "emergente", avg_rent_per_m2: 175, risk_label: "Medio",
  },
  {
    zone_slug: "la-mesa", zone_name: "La Mesa",
    risk_score: 32, volatility: 2.5, cap_rate: 8.2, vacancy_rate: 6.8,
    liquidity_score: 65, market_maturity: "consolidado", avg_rent_per_m2: 130, risk_label: "Bajo",
  },
  // ─── Premium/Central ────────────────────────────────────────────────
  {
    zone_slug: "cacho", zone_name: "Cacho",
    risk_score: 33, volatility: 3.5, cap_rate: 6.5, vacancy_rate: 5.8,
    liquidity_score: 82, market_maturity: "consolidado", avg_rent_per_m2: 235, risk_label: "Bajo",
  },
  {
    zone_slug: "agua-caliente", zone_name: "Agua Caliente",
    risk_score: 36, volatility: 3.8, cap_rate: 6.8, vacancy_rate: 6.5,
    liquidity_score: 80, market_maturity: "consolidado", avg_rent_per_m2: 220, risk_label: "Bajo",
  },
  {
    zone_slug: "lomas-de-agua-caliente", zone_name: "Lomas de Agua Caliente",
    risk_score: 40, volatility: 4.3, cap_rate: 7.0, vacancy_rate: 6.0,
    liquidity_score: 70, market_maturity: "maduro", avg_rent_per_m2: 200, risk_label: "Bajo",
  },
  // ─── Frontera/Norte ─────────────────────────────────────────────────
  {
    zone_slug: "libertad", zone_name: "Libertad",
    risk_score: 60, volatility: 6.2, cap_rate: 9.0, vacancy_rate: 12.0,
    liquidity_score: 78, market_maturity: "maduro", avg_rent_per_m2: 115, risk_label: "Medio",
  },
  {
    zone_slug: "soler", zone_name: "Soler",
    risk_score: 62, volatility: 6.5, cap_rate: 8.8, vacancy_rate: 13.5,
    liquidity_score: 58, market_maturity: "maduro", avg_rent_per_m2: 105, risk_label: "Alto",
  },
  {
    zone_slug: "federal", zone_name: "Federal",
    risk_score: 64, volatility: 6.8, cap_rate: 9.2, vacancy_rate: 14.0,
    liquidity_score: 55, market_maturity: "maduro", avg_rent_per_m2: 100, risk_label: "Alto",
  },
  // ─── Costa ──────────────────────────────────────────────────────────
  {
    zone_slug: "baja-malibu", zone_name: "Baja Malibú",
    risk_score: 48, volatility: 5.8, cap_rate: 5.2, vacancy_rate: 7.5,
    liquidity_score: 60, market_maturity: "en_desarrollo", avg_rent_per_m2: 380, risk_label: "Medio",
  },
  {
    zone_slug: "real-del-mar", zone_name: "Real del Mar",
    risk_score: 44, volatility: 5.2, cap_rate: 5.5, vacancy_rate: 7.0,
    liquidity_score: 62, market_maturity: "en_desarrollo", avg_rent_per_m2: 340, risk_label: "Medio",
  },
  {
    zone_slug: "san-antonio-del-mar", zone_name: "San Antonio del Mar",
    risk_score: 55, volatility: 7.0, cap_rate: 5.0, vacancy_rate: 9.0,
    liquidity_score: 48, market_maturity: "emergente", avg_rent_per_m2: 290, risk_label: "Medio",
  },
  {
    zone_slug: "punta-bandera", zone_name: "Punta Bandera",
    risk_score: 58, volatility: 7.5, cap_rate: 5.3, vacancy_rate: 10.0,
    liquidity_score: 42, market_maturity: "emergente", avg_rent_per_m2: 250, risk_label: "Medio",
  },
  {
    zone_slug: "costa-coronado", zone_name: "Costa Coronado",
    risk_score: 50, volatility: 6.0, cap_rate: 5.4, vacancy_rate: 8.0,
    liquidity_score: 52, market_maturity: "en_desarrollo", avg_rent_per_m2: 270, risk_label: "Medio",
  },
  // ─── Este ───────────────────────────────────────────────────────────
  {
    zone_slug: "las-americas", zone_name: "Las Américas",
    risk_score: 34, volatility: 3.0, cap_rate: 8.0, vacancy_rate: 5.5,
    liquidity_score: 72, market_maturity: "consolidado", avg_rent_per_m2: 150, risk_label: "Bajo",
  },
  {
    zone_slug: "villa-fontana", zone_name: "Villa Fontana",
    risk_score: 38, volatility: 3.2, cap_rate: 7.8, vacancy_rate: 6.2,
    liquidity_score: 60, market_maturity: "consolidado", avg_rent_per_m2: 135, risk_label: "Bajo",
  },
  {
    zone_slug: "montecarlo", zone_name: "Montecarlo",
    risk_score: 36, volatility: 3.0, cap_rate: 7.5, vacancy_rate: 5.8,
    liquidity_score: 62, market_maturity: "consolidado", avg_rent_per_m2: 145, risk_label: "Bajo",
  },
  {
    zone_slug: "otay-universidad", zone_name: "Otay Universidad",
    risk_score: 30, volatility: 2.8, cap_rate: 8.5, vacancy_rate: 4.5,
    liquidity_score: 75, market_maturity: "consolidado", avg_rent_per_m2: 160, risk_label: "Bajo",
  },
  // ─── Sur/Residencial ───────────────────────────────────────────────
  {
    zone_slug: "santa-fe", zone_name: "Santa Fe",
    risk_score: 42, volatility: 4.0, cap_rate: 7.5, vacancy_rate: 7.0,
    liquidity_score: 58, market_maturity: "en_desarrollo", avg_rent_per_m2: 125, risk_label: "Medio",
  },
  {
    zone_slug: "natura", zone_name: "Natura",
    risk_score: 50, volatility: 5.5, cap_rate: 7.2, vacancy_rate: 8.5,
    liquidity_score: 45, market_maturity: "emergente", avg_rent_per_m2: 110, risk_label: "Medio",
  },
  {
    zone_slug: "colinas-de-california", zone_name: "Colinas de California",
    risk_score: 40, volatility: 3.8, cap_rate: 7.8, vacancy_rate: 6.5,
    liquidity_score: 55, market_maturity: "en_desarrollo", avg_rent_per_m2: 130, risk_label: "Bajo",
  },
  {
    zone_slug: "lomas-virreyes", zone_name: "Lomas Virreyes",
    risk_score: 44, volatility: 4.2, cap_rate: 7.3, vacancy_rate: 7.5,
    liquidity_score: 50, market_maturity: "en_desarrollo", avg_rent_per_m2: 135, risk_label: "Medio",
  },
  {
    zone_slug: "insurgentes", zone_name: "Insurgentes",
    risk_score: 56, volatility: 5.8, cap_rate: 8.5, vacancy_rate: 10.5,
    liquidity_score: 62, market_maturity: "maduro", avg_rent_per_m2: 108, risk_label: "Medio",
  },
  // ─── Periférico ────────────────────────────────────────────────────
  {
    zone_slug: "el-florido", zone_name: "El Florido",
    risk_score: 68, volatility: 7.5, cap_rate: 9.5, vacancy_rate: 15.0,
    liquidity_score: 70, market_maturity: "emergente", avg_rent_per_m2: 85, risk_label: "Alto",
  },
  {
    zone_slug: "terrazas-de-la-presa", zone_name: "Terrazas de la Presa",
    risk_score: 62, volatility: 6.5, cap_rate: 9.0, vacancy_rate: 12.5,
    liquidity_score: 48, market_maturity: "emergente", avg_rent_per_m2: 95, risk_label: "Alto",
  },
];

// ─── Portfolio Presets ────────────────────────────────────────────────────────
export const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  {
    id: "conservador",
    name: "Conservador",
    description: "Enfoque en zonas consolidadas con alta liquidez y bajo riesgo. Ideal para preservación de capital.",
    risk_level: "conservador",
    expected_return_pct: 5.8,
    risk_score: 30,
    allocations: [
      { zone_slug: "zona-rio", zone_name: "Zona Río", allocation_pct: 25 },
      { zone_slug: "cacho", zone_name: "Cacho", allocation_pct: 20 },
      { zone_slug: "otay", zone_name: "Otay", allocation_pct: 15 },
      { zone_slug: "agua-caliente", zone_name: "Agua Caliente", allocation_pct: 15 },
      { zone_slug: "la-mesa", zone_name: "La Mesa", allocation_pct: 15 },
      { zone_slug: "las-americas", zone_name: "Las Américas", allocation_pct: 10 },
    ],
  },
  {
    id: "balanceado",
    name: "Balanceado",
    description: "Mezcla de zonas consolidadas y emergentes. Balance entre retorno y estabilidad.",
    risk_level: "balanceado",
    expected_return_pct: 8.2,
    risk_score: 45,
    allocations: [
      { zone_slug: "zona-rio", zone_name: "Zona Río", allocation_pct: 20 },
      { zone_slug: "playas-de-tijuana", zone_name: "Playas de Tijuana", allocation_pct: 15 },
      { zone_slug: "chapultepec", zone_name: "Chapultepec", allocation_pct: 15 },
      { zone_slug: "cacho", zone_name: "Cacho", allocation_pct: 10 },
      { zone_slug: "real-del-mar", zone_name: "Real del Mar", allocation_pct: 10 },
      { zone_slug: "otay-universidad", zone_name: "Otay Universidad", allocation_pct: 10 },
      { zone_slug: "santa-fe", zone_name: "Santa Fe", allocation_pct: 10 },
      { zone_slug: "la-mesa", zone_name: "La Mesa", allocation_pct: 10 },
    ],
  },
  {
    id: "agresivo",
    name: "Agresivo",
    description: "Concentración en zonas de alto crecimiento. Máximo retorno potencial con mayor volatilidad.",
    risk_level: "agresivo",
    expected_return_pct: 12.5,
    risk_score: 62,
    allocations: [
      { zone_slug: "baja-malibu", zone_name: "Baja Malibú", allocation_pct: 20 },
      { zone_slug: "playas-de-tijuana", zone_name: "Playas de Tijuana", allocation_pct: 20 },
      { zone_slug: "san-antonio-del-mar", zone_name: "San Antonio del Mar", allocation_pct: 15 },
      { zone_slug: "zona-rio", zone_name: "Zona Río", allocation_pct: 15 },
      { zone_slug: "natura", zone_name: "Natura", allocation_pct: 10 },
      { zone_slug: "el-florido", zone_name: "El Florido", allocation_pct: 10 },
      { zone_slug: "centro", zone_name: "Centro", allocation_pct: 10 },
    ],
  },
];

// ─── Pipeline Projects (Extended) ─────────────────────────────────────────────
const IMG_BASE = "https://lh3.googleusercontent.com/aida-public";

export const PIPELINE_PROJECTS_EXTENDED: PipelineProject[] = [
  {
    id: "p1", zone_slug: "zona-rio", zone_name: "Zona Río",
    name: "Torre Sayan Rio", status: "construccion", status_label: "85% Vendido",
    badge_color: "bg-green-100 text-green-700",
    description: "Residencial de lujo · 24 pisos · Entrega Q3 2025",
    units_total: 120, units_sold: 102, price_range: "$3.2M - $8.5M MXN",
    delivery_date: "Sep 2025",
    img: `${IMG_BASE}/AB6AXuDcMvkGK2-c11oeRRT27nAuPCjwm12rEej1HNK4UFnpRUTWmJrA6DIIowr_mlFnzxYynfC0CQPtOJSSAYLjf-7NLbxQGd74blgo-94zbKEiQehwynoP_CyxSmdcmBVfHUpdcpswRbvNOW4jNSg8ZaVWbBGUv6euGbVwOXb7kgWWSqydwdmWgnBzBGupKS29TKrbLOIE4Uv0K5Ov6gqzPh5q6WqLxaz5a2RACwGMfHmo3SO2PAjPWx2AHx2MluOJgJDQlisGZwjF2INP`,
    investors: 12, investor_label: "12 Inversores activos",
  },
  {
    id: "p2", zone_slug: "zona-rio", zone_name: "Zona Río",
    name: "Paseo Global II", status: "preventa", status_label: "Pre-Venta",
    badge_color: "bg-blue-100 text-blue-700",
    description: "Corporativo Clase A · 12,000 m² GLA",
    units_total: 85, units_sold: 28, price_range: "$2.8M - $6.2M MXN",
    delivery_date: "Mar 2026",
    img: `${IMG_BASE}/AB6AXuDVY0onfjFdi7i2rOIIq99lJStUlitHgNl5nnTcte3my2Kxh3PweiUrfuDuS9XMHab8SIAUYfchcw5yyRd74cKU4Km2ox9bIKrtPiWh_GbivLDOPk0LB81dG_c9VYpKSqDJ-IZV2XjfDy2e6wRFxZV2-bfFgj0mIuzU-gIVIwPEhw2qbwAPnmu4ZnyZYOenj8OqVSdHdC0BoKrauiUAuPRnoN8wMRfEDDPvZiTx295lOBfShy4cqsUtc0NJHJfcoq_uVO6uyJ8d4CD7`,
    investors: 8, investor_label: "8 Inversores activos",
  },
  {
    id: "p3", zone_slug: "playas-de-tijuana", zone_name: "Playas de Tijuana",
    name: "The Icon District", status: "planificacion", status_label: "Planificación",
    badge_color: "bg-orange-100 text-orange-700",
    description: "Uso Mixto · Regeneración Urbana · 45,000 m²",
    units_total: 200, units_sold: 0, price_range: "$4.5M - $12M MXN",
    delivery_date: "Dic 2027",
    img: `${IMG_BASE}/AB6AXuAGavQbkoMgc-ZKnHyiazUbTRDiZh7xHoxjZpKstSdZylYchL1S6rkiJvByLlFuX-Ty_Kx-Z2ivNmF0XWms8FS3z6FSlQv335Ps2FhDyuZV2yijSjqpya5NaaqWrL5MCMhPBVnET19Ma1C0Y9livnsv4fuSHx4CWOGaH_O40MHZ1jiCqr0FFRti7qEcXANDArATvfmW1zYvPlHCI2W7ODoJ-GOOqKttwF4B7teWlPaLH9UN8OTn2yQgSCgk8j24ooKiKPQq8NR8Mmpq`,
    investors: 3, investor_label: "Iniciativa Privada",
  },
  {
    id: "p4", zone_slug: "playas-de-tijuana", zone_name: "Playas de Tijuana",
    name: "Oceana Residences", status: "construccion", status_label: "En Construcción",
    badge_color: "bg-green-100 text-green-700",
    description: "Residencial frente al mar · 18 pisos",
    units_total: 96, units_sold: 71, price_range: "$5.8M - $15M MXN",
    delivery_date: "Jun 2025",
    img: `${IMG_BASE}/AB6AXuDcMvkGK2-c11oeRRT27nAuPCjwm12rEej1HNK4UFnpRUTWmJrA6DIIowr_mlFnzxYynfC0CQPtOJSSAYLjf-7NLbxQGd74blgo-94zbKEiQehwynoP_CyxSmdcmBVfHUpdcpswRbvNOW4jNSg8ZaVWbBGUv6euGbVwOXb7kgWWSqydwdmWgnBzBGupKS29TKrbLOIE4Uv0K5Ov6gqzPh5q6WqLxaz5a2RACwGMfHmo3SO2PAjPWx2AHx2MluOJgJDQlisGZwjF2INP`,
    investors: 15, investor_label: "15 Inversores activos",
  },
  {
    id: "p5", zone_slug: "chapultepec", zone_name: "Chapultepec",
    name: "Parque Chapultepec Living", status: "preventa", status_label: "Pre-Venta Fase 2",
    badge_color: "bg-blue-100 text-blue-700",
    description: "Departamentos con amenidades premium · 8 pisos",
    units_total: 64, units_sold: 18, price_range: "$2.5M - $5.1M MXN",
    delivery_date: "Ago 2026",
    img: `${IMG_BASE}/AB6AXuDVY0onfjFdi7i2rOIIq99lJStUlitHgNl5nnTcte3my2Kxh3PweiUrfuDuS9XMHab8SIAUYfchcw5yyRd74cKU4Km2ox9bIKrtPiWh_GbivLDOPk0LB81dG_c9VYpKSqDJ-IZV2XjfDy2e6wRFxZV2-bfFgj0mIuzU-gIVIwPEhw2qbwAPnmu4ZnyZYOenj8OqVSdHdC0BoKrauiUAuPRnoN8wMRfEDDPvZiTx295lOBfShy4cqsUtc0NJHJfcoq_uVO6uyJ8d4CD7`,
    investors: 5, investor_label: "5 Inversores activos",
  },
  {
    id: "p6", zone_slug: "otay", zone_name: "Otay",
    name: "Otay Industrial Park III", status: "planificacion", status_label: "Planificación",
    badge_color: "bg-orange-100 text-orange-700",
    description: "Parque industrial · Naves y bodegas · 28,000 m²",
    units_total: 45, units_sold: 0, price_range: "$8M - $25M MXN",
    delivery_date: "2027",
    img: `${IMG_BASE}/AB6AXuAGavQbkoMgc-ZKnHyiazUbTRDiZh7xHoxjZpKstSdZylYchL1S6rkiJvByLlFuX-Ty_Kx-Z2ivNmF0XWms8FS3z6FSlQv335Ps2FhDyuZV2yijSjqpya5NaaqWrL5MCMhPBVnET19Ma1C0Y9livnsv4fuSHx4CWOGaH_O40MHZ1jiCqr0FFRti7qEcXANDArATvfmW1zYvPlHCI2W7ODoJ-GOOqKttwF4B7teWlPaLH9UN8OTn2yQgSCgk8j24ooKiKPQq8NR8Mmpq`,
    investors: 2, investor_label: "2 Fondos institucionales",
  },
  {
    id: "p7", zone_slug: "centro", zone_name: "Centro",
    name: "Centro Histórico Lofts", status: "preventa", status_label: "Pre-Venta",
    badge_color: "bg-blue-100 text-blue-700",
    description: "Reconversión de edificio histórico · Lofts urbanos",
    units_total: 32, units_sold: 8, price_range: "$1.2M - $2.8M MXN",
    delivery_date: "Nov 2026",
    img: `${IMG_BASE}/AB6AXuDcMvkGK2-c11oeRRT27nAuPCjwm12rEej1HNK4UFnpRUTWmJrA6DIIowr_mlFnzxYynfC0CQPtOJSSAYLjf-7NLbxQGd74blgo-94zbKEiQehwynoP_CyxSmdcmBVfHUpdcpswRbvNOW4jNSg8ZaVWbBGUv6euGbVwOXb7kgWWSqydwdmWgnBzBGupKS29TKrbLOIE4Uv0K5Ov6gqzPh5q6WqLxaz5a2RACwGMfHmo3SO2PAjPWx2AHx2MluOJgJDQlisGZwjF2INP`,
    investors: 4, investor_label: "4 Inversores activos",
  },
  {
    id: "p8", zone_slug: "residencial-del-bosque", zone_name: "Residencial del Bosque",
    name: "Bosque Sereno Villas", status: "construccion", status_label: "60% Vendido",
    badge_color: "bg-green-100 text-green-700",
    description: "Casas residenciales · Fraccionamiento cerrado",
    units_total: 48, units_sold: 29, price_range: "$3.5M - $5.8M MXN",
    delivery_date: "Dic 2025",
    img: `${IMG_BASE}/AB6AXuDVY0onfjFdi7i2rOIIq99lJStUlitHgNl5nnTcte3my2Kxh3PweiUrfuDuS9XMHab8SIAUYfchcw5yyRd74cKU4Km2ox9bIKrtPiWh_GbivLDOPk0LB81dG_c9VYpKSqDJ-IZV2XjfDy2e6wRFxZV2-bfFgj0mIuzU-gIVIwPEhw2qbwAPnmu4ZnyZYOenj8OqVSdHdC0BoKrauiUAuPRnoN8wMRfEDDPvZiTx295lOBfShy4cqsUtc0NJHJfcoq_uVO6uyJ8d4CD7`,
    investors: 7, investor_label: "7 Inversores activos",
  },
];

// Mock individual listings for development/fallback
export const MOCK_LISTINGS: Listing[] = [
  // Zona Río
  { id: "l1", zone_id: "1", title: "Departamento moderno en Torre Río", property_type: "departamento", listing_type: "venta", price: 3800000, area_m2: 85, price_per_m2: 44706, bedrooms: 2, bathrooms: 2, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l2", zone_id: "1", title: "Oficina corporativa en Zona Río", property_type: "oficina", listing_type: "renta", price: 35000, area_m2: 120, price_per_m2: 292, bedrooms: null, bathrooms: 2, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l3", zone_id: "1", title: "Casa residencial Zona Río", property_type: "casa", listing_type: "venta", price: 6500000, area_m2: 200, price_per_m2: 32500, bedrooms: 4, bathrooms: 3, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l4", zone_id: "1", title: "Local comercial frente avenida", property_type: "local", listing_type: "renta", price: 28000, area_m2: 60, price_per_m2: 467, bedrooms: null, bathrooms: 1, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l5", zone_id: "1", title: "Depto 3 recámaras vista al río", property_type: "departamento", listing_type: "venta", price: 5200000, area_m2: 140, price_per_m2: 37143, bedrooms: 3, bathrooms: 2, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Playas de Tijuana
  { id: "l6", zone_id: "2", title: "Casa frente al mar Playas", property_type: "casa", listing_type: "venta", price: 9500000, area_m2: 250, price_per_m2: 38000, bedrooms: 4, bathrooms: 3, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l7", zone_id: "2", title: "Departamento vista oceano", property_type: "departamento", listing_type: "venta", price: 4800000, area_m2: 110, price_per_m2: 43636, bedrooms: 2, bathrooms: 2, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l8", zone_id: "2", title: "Terreno Playas primera sección", property_type: "terreno", listing_type: "venta", price: 7200000, area_m2: 300, price_per_m2: 24000, bedrooms: null, bathrooms: null, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l9", zone_id: "2", title: "Depto 1 rec en renta Playas", property_type: "departamento", listing_type: "renta", price: 18000, area_m2: 55, price_per_m2: 327, bedrooms: 1, bathrooms: 1, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Otay
  { id: "l10", zone_id: "3", title: "Casa de interés social Otay", property_type: "casa", listing_type: "venta", price: 1800000, area_m2: 80, price_per_m2: 22500, bedrooms: 3, bathrooms: 2, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l11", zone_id: "3", title: "Bodega industrial Otay", property_type: "local", listing_type: "renta", price: 45000, area_m2: 500, price_per_m2: 90, bedrooms: null, bathrooms: 2, source: "mercadolibre", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l12", zone_id: "3", title: "Terreno uso mixto Otay", property_type: "terreno", listing_type: "venta", price: 3200000, area_m2: 400, price_per_m2: 8000, bedrooms: null, bathrooms: null, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Chapultepec
  { id: "l13", zone_id: "4", title: "Departamento lujo Chapultepec", property_type: "departamento", listing_type: "venta", price: 4200000, area_m2: 130, price_per_m2: 32308, bedrooms: 3, bathrooms: 2, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l14", zone_id: "4", title: "Casa familiar Chapultepec", property_type: "casa", listing_type: "venta", price: 5800000, area_m2: 190, price_per_m2: 30526, bedrooms: 4, bathrooms: 3, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l15", zone_id: "4", title: "Depto 2 rec en renta Chapultepec", property_type: "departamento", listing_type: "renta", price: 22000, area_m2: 75, price_per_m2: 293, bedrooms: 2, bathrooms: 1, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Hipódromo
  { id: "l16", zone_id: "5", title: "Departamento Hipódromo", property_type: "departamento", listing_type: "renta", price: 15000, area_m2: 65, price_per_m2: 231, bedrooms: 1, bathrooms: 1, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l17", zone_id: "5", title: "Casa Hipódromo 4 rec", property_type: "casa", listing_type: "venta", price: 4500000, area_m2: 180, price_per_m2: 25000, bedrooms: 4, bathrooms: 3, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Centro
  { id: "l18", zone_id: "6", title: "Local comercial Centro", property_type: "local", listing_type: "renta", price: 12000, area_m2: 45, price_per_m2: 267, bedrooms: null, bathrooms: 1, source: "mercadolibre", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l19", zone_id: "6", title: "Depto estudio Centro Histórico", property_type: "departamento", listing_type: "renta", price: 9500, area_m2: 40, price_per_m2: 238, bedrooms: 1, bathrooms: 1, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l20", zone_id: "6", title: "Edificio de oficinas Centro", property_type: "oficina", listing_type: "venta", price: 8500000, area_m2: 600, price_per_m2: 14167, bedrooms: null, bathrooms: 4, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Residencial del Bosque
  { id: "l21", zone_id: "7", title: "Villa Residencial del Bosque", property_type: "casa", listing_type: "venta", price: 5500000, area_m2: 280, price_per_m2: 19643, bedrooms: 4, bathrooms: 4, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l22", zone_id: "7", title: "Casa 3 rec Bosque con jardín", property_type: "casa", listing_type: "venta", price: 3800000, area_m2: 180, price_per_m2: 21111, bedrooms: 3, bathrooms: 2, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // La Mesa
  { id: "l23", zone_id: "8", title: "Casa La Mesa 3 rec", property_type: "casa", listing_type: "venta", price: 2400000, area_m2: 120, price_per_m2: 20000, bedrooms: 3, bathrooms: 2, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l24", zone_id: "8", title: "Depto La Mesa seminuevo", property_type: "departamento", listing_type: "venta", price: 1650000, area_m2: 70, price_per_m2: 23571, bedrooms: 2, bathrooms: 1, source: "mercadolibre", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l25", zone_id: "8", title: "Terreno La Mesa esquina", property_type: "terreno", listing_type: "venta", price: 950000, area_m2: 200, price_per_m2: 4750, bedrooms: null, bathrooms: null, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l26", zone_id: "8", title: "Casa La Mesa con alberca", property_type: "casa", listing_type: "renta", price: 25000, area_m2: 200, price_per_m2: 125, bedrooms: 4, bathrooms: 3, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Extra listings for variety
  { id: "l27", zone_id: "2", title: "Casa 5 rec Playas vista panorámica", property_type: "casa", listing_type: "venta", price: 12000000, area_m2: 400, price_per_m2: 30000, bedrooms: 5, bathrooms: 4, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l28", zone_id: "1", title: "Departamento estudio Zona Río", property_type: "departamento", listing_type: "renta", price: 12000, area_m2: 42, price_per_m2: 286, bedrooms: 1, bathrooms: 1, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l29", zone_id: "3", title: "Depto 2 rec Otay seminuevo", property_type: "departamento", listing_type: "venta", price: 1950000, area_m2: 72, price_per_m2: 27083, bedrooms: 2, bathrooms: 1, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l30", zone_id: "4", title: "Oficina boutique Chapultepec", property_type: "oficina", listing_type: "renta", price: 18000, area_m2: 50, price_per_m2: 360, bedrooms: null, bathrooms: 1, source: "mercadolibre", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // ─── New zones listings ─────────────────────────────────────────────
  // Cacho
  { id: "l31", zone_id: "9", title: "Casa estilo californiano Cacho", property_type: "casa", listing_type: "venta", price: 5200000, area_m2: 175, price_per_m2: 29714, bedrooms: 3, bathrooms: 2, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l32", zone_id: "9", title: "Depto moderno La Cacho", property_type: "departamento", listing_type: "renta", price: 20000, area_m2: 80, price_per_m2: 250, bedrooms: 2, bathrooms: 1, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Agua Caliente
  { id: "l33", zone_id: "10", title: "Depto torre Agua Caliente", property_type: "departamento", listing_type: "venta", price: 3600000, area_m2: 95, price_per_m2: 37895, bedrooms: 2, bathrooms: 2, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l34", zone_id: "10", title: "Local comercial Agua Caliente", property_type: "local", listing_type: "renta", price: 32000, area_m2: 85, price_per_m2: 376, bedrooms: null, bathrooms: 1, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Lomas de Agua Caliente
  { id: "l35", zone_id: "11", title: "Casa residencial Lomas AC", property_type: "casa", listing_type: "venta", price: 4800000, area_m2: 220, price_per_m2: 21818, bedrooms: 4, bathrooms: 3, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Libertad
  { id: "l36", zone_id: "12", title: "Casa Libertad cerca garita", property_type: "casa", listing_type: "venta", price: 1900000, area_m2: 100, price_per_m2: 19000, bedrooms: 3, bathrooms: 2, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l37", zone_id: "12", title: "Local comercial Libertad", property_type: "local", listing_type: "renta", price: 10000, area_m2: 40, price_per_m2: 250, bedrooms: null, bathrooms: 1, source: "mercadolibre", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Soler
  { id: "l38", zone_id: "13", title: "Casa Soler 3 rec", property_type: "casa", listing_type: "venta", price: 1600000, area_m2: 90, price_per_m2: 17778, bedrooms: 3, bathrooms: 2, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Federal
  { id: "l39", zone_id: "14", title: "Depto Federal seminuevo", property_type: "departamento", listing_type: "renta", price: 8500, area_m2: 55, price_per_m2: 155, bedrooms: 2, bathrooms: 1, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Baja Malibú
  { id: "l40", zone_id: "15", title: "Villa de lujo Baja Malibú", property_type: "casa", listing_type: "venta", price: 12500000, area_m2: 320, price_per_m2: 39063, bedrooms: 4, bathrooms: 4, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l41", zone_id: "15", title: "Depto vista al mar Baja Malibú", property_type: "departamento", listing_type: "venta", price: 7800000, area_m2: 150, price_per_m2: 52000, bedrooms: 3, bathrooms: 2, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Real del Mar
  { id: "l42", zone_id: "16", title: "Casa Real del Mar con club", property_type: "casa", listing_type: "venta", price: 9200000, area_m2: 280, price_per_m2: 32857, bedrooms: 4, bathrooms: 3, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // San Antonio del Mar
  { id: "l43", zone_id: "17", title: "Casa frente al mar San Antonio", property_type: "casa", listing_type: "venta", price: 8500000, area_m2: 240, price_per_m2: 35417, bedrooms: 3, bathrooms: 3, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Punta Bandera
  { id: "l44", zone_id: "18", title: "Terreno Punta Bandera", property_type: "terreno", listing_type: "venta", price: 4500000, area_m2: 350, price_per_m2: 12857, bedrooms: null, bathrooms: null, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Costa Coronado
  { id: "l45", zone_id: "19", title: "Casa Costa Coronado privada", property_type: "casa", listing_type: "venta", price: 7500000, area_m2: 200, price_per_m2: 37500, bedrooms: 3, bathrooms: 3, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Las Américas
  { id: "l46", zone_id: "20", title: "Casa Las Américas 3 rec", property_type: "casa", listing_type: "venta", price: 2500000, area_m2: 130, price_per_m2: 19231, bedrooms: 3, bathrooms: 2, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Villa Fontana
  { id: "l47", zone_id: "21", title: "Casa Villa Fontana privada", property_type: "casa", listing_type: "venta", price: 2200000, area_m2: 110, price_per_m2: 20000, bedrooms: 3, bathrooms: 2, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Montecarlo
  { id: "l48", zone_id: "22", title: "Casa Montecarlo seminueva", property_type: "casa", listing_type: "venta", price: 2700000, area_m2: 140, price_per_m2: 19286, bedrooms: 3, bathrooms: 2, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Otay Universidad
  { id: "l49", zone_id: "23", title: "Depto Otay Universidad CETYS", property_type: "departamento", listing_type: "renta", price: 12000, area_m2: 60, price_per_m2: 200, bedrooms: 2, bathrooms: 1, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Santa Fe
  { id: "l50", zone_id: "24", title: "Casa Santa Fe fraccionamiento", property_type: "casa", listing_type: "venta", price: 2100000, area_m2: 120, price_per_m2: 17500, bedrooms: 3, bathrooms: 2, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Natura
  { id: "l51", zone_id: "25", title: "Casa Natura nueva", property_type: "casa", listing_type: "venta", price: 1850000, area_m2: 100, price_per_m2: 18500, bedrooms: 3, bathrooms: 2, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Colinas de California
  { id: "l52", zone_id: "26", title: "Casa Colinas de California", property_type: "casa", listing_type: "venta", price: 2300000, area_m2: 130, price_per_m2: 17692, bedrooms: 3, bathrooms: 2, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Lomas Virreyes
  { id: "l53", zone_id: "27", title: "Casa Lomas Virreyes residencial", property_type: "casa", listing_type: "venta", price: 2800000, area_m2: 160, price_per_m2: 17500, bedrooms: 3, bathrooms: 2, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Insurgentes
  { id: "l54", zone_id: "28", title: "Casa Insurgentes 2 rec", property_type: "casa", listing_type: "venta", price: 1500000, area_m2: 85, price_per_m2: 17647, bedrooms: 2, bathrooms: 1, source: "mercadolibre", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // El Florido
  { id: "l55", zone_id: "29", title: "Casa El Florido económica", property_type: "casa", listing_type: "venta", price: 1200000, area_m2: 75, price_per_m2: 16000, bedrooms: 3, bathrooms: 1, source: "vivanuncios", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "l56", zone_id: "29", title: "Terreno El Florido", property_type: "terreno", listing_type: "venta", price: 650000, area_m2: 200, price_per_m2: 3250, bedrooms: null, bathrooms: null, source: "inmuebles24", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Terrazas de la Presa
  { id: "l57", zone_id: "30", title: "Casa Terrazas de la Presa", property_type: "casa", listing_type: "venta", price: 1350000, area_m2: 90, price_per_m2: 15000, bedrooms: 3, bathrooms: 2, source: "lamudi", source_url: "#", scraped_at: new Date().toISOString(), created_at: new Date().toISOString() },
];
