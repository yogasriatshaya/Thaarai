/**
 * THAARAI — Premium Image Library
 * ─────────────────────────────────────────────────────────────────────────────
 * All image URLs are sourced from Unsplash with:
 *  - High resolution (w=1920 for hero, w=800 for sections, w=600 for cards)
 *  - WebP auto-conversion via `&fm=webp` and `&auto=format,compress`
 *  - Sharp cropping via `&fit=crop`
 *  - Quality optimized via `&q=85`
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE = 'https://images.unsplash.com';
const Q    = 'auto=format,compress&q=85&fm=webp&fit=crop';

// ── Hero ──────────────────────────────────────────────────────────────────────
export const HERO_BG = `${BASE}/photo-1469334031218-e382a71b716b?w=1920&h=1080&${Q}`;
export const HERO_2  = `${BASE}/photo-1490481651871-ab68de25d43d?w=1920&h=1080&${Q}`;
export const HERO_3  = `${BASE}/photo-1539109132271-383bc5374ce0?w=1920&h=1080&${Q}`;

// ── Category Feature Panels ───────────────────────────────────────────────────
export const CAT_COUTURE  = `${BASE}/photo-1490481651871-ab68de25d43d?w=900&h=1200&${Q}`;
export const CAT_HANDBAGS = `${BASE}/photo-1548036328-c9fa89d128fa?w=900&h=1200&${Q}`;
export const CAT_HERITAGE = `${BASE}/photo-1516762689617-e1cffcef479d?w=900&h=1200&${Q}`;
export const BANNER_SILK  = `${BASE}/photo-1469334031218-e382a71b716b?w=1600&h=500&${Q}`;

// ── Brand Story / Atelier ─────────────────────────────────────────────────────
export const BRAND_STORY = `${BASE}/photo-1441986300917-64674bd600d8?w=900&h=1100&${Q}`;

// ── Auth / Login / Register ───────────────────────────────────────────────────
export const AUTH_LOGIN    = `${BASE}/photo-1469334031218-e382a71b716b?w=900&h=1200&${Q}`;
export const AUTH_REGISTER = `${BASE}/photo-1558618666-fcd25c85cd64?w=900&h=1200&${Q}`;

// ── Newsletter Section ────────────────────────────────────────────────────────
export const NEWSLETTER_BG = `${BASE}/photo-1558769132-cb1aea458c5e?w=1920&h=600&${Q}`;

// ── Fallback Product Image ────────────────────────────────────────────────────
export const PRODUCT_FALLBACK = `${BASE}/photo-1558618666-fcd25c85cd64?w=600&h=750&${Q}`;
export const CART_FALLBACK    = `${BASE}/photo-1558618666-fcd25c85cd64?w=300&h=400&${Q}`;

// ── Demo / Placeholder Products ───────────────────────────────────────────────
export const DEMO_PRODUCTS = [
  {
    name: 'The Atelier Coat',
    category: 'Couture',
    price: 1850,
    label: 'NEW',
    image: `${BASE}/photo-1539533018447-63fcce2678e3?w=600&h=750&${Q}`,
  },
  {
    name: 'Signature Tote',
    category: 'Handbags',
    price: 3200,
    label: 'ICONIC',
    image: `${BASE}/photo-1548036328-c9fa89d128fa?w=600&h=750&${Q}`,
  },
  {
    name: 'Silk Radiance Wrap',
    category: 'Silk Scarves',
    price: 450,
    label: '',
    image: `${BASE}/photo-1551232864-3f0890e580d9?w=600&h=750&${Q}`,
  },
  {
    name: 'Heritage Blazer',
    category: 'Heritage',
    price: 2400,
    label: 'LIMITED EDITION',
    image: `${BASE}/photo-1487222477894-8943e31ef7b2?w=600&h=750&${Q}`,
  },
  {
    name: 'Velvet Evening Gown',
    category: 'Couture',
    price: 5800,
    label: 'EXCLUSIVE',
    image: `${BASE}/photo-1496747611176-843222e1e57c?w=600&h=750&${Q}`,
  },
  {
    name: 'Lambskin Mini Bag',
    category: 'Handbags',
    price: 1950,
    label: '',
    image: `${BASE}/photo-1584370848010-d7fe6bc767ec?w=600&h=750&${Q}`,
  },
];
