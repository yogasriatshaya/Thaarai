/**
 * AARA THE DESIGNER STUDIO — Premium Image Library
 * ─────────────────────────────────────────────────────────────────────────────
 * All image URLs are sourced from the official Aara Designer Studio website
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AARA_BASE = 'https://aaradesigner.com/wp-content/uploads';

// ── Hero / Banner ──────────────────────────────────────────────────────────────
export const HERO_BG = '/aara/hero-model.jpg';  // Local hero image
export const HERO_BG_REMOTE = `${AARA_BASE}/2025/10/backgrop.png`;
export const HERO_2  = `${AARA_BASE}/2025/08/IMG_0173-300x450.jpg`;
export const HERO_3  = `${AARA_BASE}/2025/07/AD004-White-flux-cotton-MAXI-1.webp`;

// ── Category Feature Panels ───────────────────────────────────────────────────
export const CAT_COUTURE  = `${AARA_BASE}/2026/02/exported_40865ED8-89E4-45A8-B54D-59B407302619-300x450.jpeg`; // Kurti
export const CAT_HANDBAGS = `${AARA_BASE}/2025/08/IMG_0173-300x450.jpg`; // Maxi - Golden Maxi
export const CAT_HERITAGE = `${AARA_BASE}/2025/08/SUMMER-CO-ORDS-RED-img-3-300x450.webp`; // Co-ords
export const CAT_ANARKALI = `${AARA_BASE}/2025/09/IMG_1225.jpeg`; // Anarkali
export const BANNER_SILK  = `${AARA_BASE}/2025/10/backgrop.png`;

// ── Brand Story / Atelier ─────────────────────────────────────────────────────
export const BRAND_STORY = `${AARA_BASE}/2025/07/aara-designer-studio-main-logo.jpg`;

// ── Auth / Login / Register ───────────────────────────────────────────────────
export const AUTH_LOGIN    = `${AARA_BASE}/2025/07/AD004-Raw-Silk-KURTI-img-1.webp`;
export const AUTH_REGISTER = `${AARA_BASE}/2025/07/Raw-Silk-KURTI-1.webp`;

// ── Newsletter Section ────────────────────────────────────────────────────────
export const NEWSLETTER_BG = `${AARA_BASE}/2025/10/backgrop.png`;

// ── Fallback Product Image ────────────────────────────────────────────────────
export const PRODUCT_FALLBACK = `${AARA_BASE}/2025/07/AD003-Black-Floral-MAXI-3.webp`;
export const CART_FALLBACK    = `${AARA_BASE}/2025/07/AD003-Black-Floral-MAXI-3.webp`;

// ── Demo / Placeholder Products ───────────────────────────────────────────────
export const DEMO_PRODUCTS = [
  {
    name: 'Chanderi Dress Suits',
    category: 'Kurti',
    price: 1699,
    label: 'NEW',
    image: `${AARA_BASE}/2026/02/exported_9F3B6D10-489F-45EF-B080-B039A4A30F67-300x450.jpeg`,
  },
  {
    name: 'Golden Maxi Dress',
    category: 'Maxi',
    price: 1899,
    label: 'BESTSELLER',
    image: `${AARA_BASE}/2025/08/IMG_0173-300x450.jpg`,
  },
  {
    name: 'Summer Co-Ords Red',
    category: 'Co-ords',
    price: 1199,
    label: '',
    image: `${AARA_BASE}/2025/08/SUMMER-CO-ORDS-RED-img-3-300x450.webp`,
  },
  {
    name: 'Narayanpet Anarkali',
    category: 'Anarkali',
    price: 2199,
    label: 'PONGAL SPECIAL',
    image: `${AARA_BASE}/2026/01/IMG_0761-300x450.jpeg`,
  },
  {
    name: 'Peacock Green Raw Silk',
    category: 'Kurti',
    price: 1899,
    label: 'EXCLUSIVE',
    image: `${AARA_BASE}/2026/02/exported_40865ED8-89E4-45A8-B54D-59B407302619-300x450.jpeg`,
  },
  {
    name: 'Ikkat Blue Maxi',
    category: 'Maxi',
    price: 1299,
    label: '',
    image: `${AARA_BASE}/2025/08/IKKAT-BLUE-img-3-300x450.webp`,
  },
];
