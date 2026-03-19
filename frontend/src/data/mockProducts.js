/**
 * THAARAI — Professional Mock Product Data
 * ─────────────────────────────────────────────────────────────────────────────
 * Supplementing sparse API results with curated luxury pieces.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE = 'https://images.unsplash.com';
const Q = 'auto=format,compress&q=85&fm=webp&fit=crop';

export const MOCK_PRODUCTS = [
  // EVENING & RED CARPET (Couture)
  {
    _id: 'mock_c1',
    name: 'Midnight Velvet Gown',
    price: 14850,
    category: 'Couture',
    subcategory: 'Evening Wear',
    images: [
      '/generated/couture_gown_1_1773912946615.png',
      '/generated/couture_gown_1_1773912946615.png'
    ],
    description: 'A masterwork of midnight velvet, hand-tailored for the most prestigious galas. Featuring a floor-sweeping silhouette and delicate boning.',
    sizes: ['S', 'M', 'L'],
    colors: ['Midnight Blue', 'Signature Black'],
    bestSeller: true,
    relatedProductIds: ['mock_c2', 'mock_c3', 'mock_c4']
  },
  {
    _id: 'mock_c2',
    name: 'Atelier Silk Ensemble',
    price: 13200,
    category: 'Couture',
    subcategory: 'Luxury Sets',
    images: [
      `${BASE}/photo-1549433193-424a13824344?w=800&h=1000&${Q}`,
      `${BASE}/photo-1539106604051-bd128229b13c?w=800&h=1000&${Q}`
    ],
    description: 'Fluid silk movements captured in a two-piece ensemble that defines modern grace. Unlined for a natural, liquid-like drape.',
    sizes: ['M', 'L'],
    colors: ['Oatmeal', 'Pearl'],
    bestSeller: false,
    relatedProductIds: ['mock_c1', 'mock_c5', 'mock_he4']
  },
  {
    _id: 'mock_c3',
    name: 'Celestial Tulle Dress',
    price: 16400,
    category: 'Couture',
    subcategory: 'Evening Wear',
    images: [
      '/generated/couture_gown_2_1773912978718.png',
      '/generated/couture_gown_2_1773912978718.png'
    ],
    description: 'Ethereal layers of silk tulle embroidered with delicate glass beads, evoking a starlit night sky.',
    sizes: ['S', 'M'],
    colors: ['Pale Silver', 'Dusty Rose'],
    bestSeller: true,
    relatedProductIds: ['mock_c1', 'mock_c6', 'mock_c4']
  },
  {
    _id: 'mock_c4',
    name: 'Structured Satin Gown',
    price: 12100,
    category: 'Couture',
    subcategory: 'Evening Wear',
    images: [
      `${BASE}/photo-1566174053879-31528523f8ae?w=800&h=1000&${Q}`,
      `${BASE}/photo-1568252542512-9fe8fe9c87bb?w=800&h=1000&${Q}`
    ],
    description: 'Architectural precision meets high-shine satin. A landmark piece for modern silhouettes.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Emerald', 'Ruby'],
    bestSeller: false,
    relatedProductIds: ['mock_c3', 'mock_c6', 'mock_he3']
  },
  {
     _id: 'mock_c5',
     name: 'Liquid Gold Slip',
     price: 11450,
     category: 'Couture',
     subcategory: 'Evening Wear',
     images: [
       `${BASE}/photo-1496747611176-843222e1e57c?w=800&h=1000&${Q}`,
       `${BASE}/photo-1502429892517-9969c608447f?w=800&h=1000&${Q}`
     ],
     description: 'Bias-cut metallic silk that clings and flows with every movement. The ultimate statement in luxury.',
     sizes: ['S', 'M', 'L'],
     colors: ['Gold', 'Bronze'],
     bestSeller: true,
     relatedProductIds: ['mock_c1', 'mock_s6', 'mock_s2']
  },
  {
     _id: 'mock_c6',
     name: 'Opal Organza Column',
     price: 13800,
     category: 'Couture',
     subcategory: 'Red Carpet',
     images: [
       `${BASE}/photo-1533089860892-a7c6f0a88666?w=800&h=1000&${Q}`,
       `${BASE}/photo-1533089456534-192532454558?w=800&h=1000&${Q}`
     ],
     description: 'Luminous organza with a structured bodice and a sleek, modern column skirt.',
     sizes: ['S', 'M'],
     colors: ['Opal', 'Champagne'],
     bestSeller: false,
     relatedProductIds: ['mock_c1', 'mock_c4', 'mock_he4']
  },

  // HANDBAGS (Restored)
  {
    _id: 'mock_h1',
    name: 'Signature Box Bag',
    price: 34000,
    category: 'Handbags',
    subcategory: 'Clutches',
    images: [
      '/generated/handbag_leather_1_1773912993183.png',
      '/generated/handbag_leather_1_1773912993183.png'
    ],
    description: 'Crafted from full-grain calfskin with brushed gold hardware. A architectural masterpiece that defines evening elegance.',
    sizes: ['OS'],
    colors: ['Tan', 'Bordeaux'],
    bestSeller: true,
    relatedProductIds: ['mock_h3', 'mock_h4', 'mock_h6']
  },
  {
    _id: 'mock_h2',
    name: 'Lambskin Quilted Tote',
    price: 42000,
    category: 'Handbags',
    subcategory: 'Day Bags',
    images: [
      '/generated/handbag_shoulder_1_1773913011954.png',
      '/generated/handbag_shoulder_1_1773913011954.png'
    ],
    description: 'The ultimate daily companion, spacious yet impeccably elegant. Featuring the signature Thaarai quilting.',
    sizes: ['OS'],
    colors: ['Raven Black', 'Deep Forest'],
    bestSeller: true,
    relatedProductIds: ['mock_h5', 'mock_h4', 'mock_he1']
  },
  {
    _id: 'mock_h3',
    name: 'Miniature Jewel Pochette',
    price: 18500,
    category: 'Handbags',
    subcategory: 'Clutches',
    images: [
      `${BASE}/photo-1566150905458-1bf1fd111c36?w=800&h=1000&${Q}`,
      `${BASE}/photo-1566150905458-1bf1fd111c36?w=800&h=1000&${Q}`
    ],
    description: 'A compact masterpiece designed to carry only the essentials for the night. Adorned with hand-placed glass crystals.',
    sizes: ['OS'],
    colors: ['Emerald', 'Ruby Red'],
    bestSeller: false,
    relatedProductIds: ['mock_h1', 'mock_h4', 'mock_h5']
  },
  {
    _id: 'mock_h4',
    name: 'Exotic Skin Satchel',
    price: 89000,
    category: 'Handbags',
    subcategory: 'Luxury Edition',
    images: [
      `${BASE}/photo-1590739225287-bd26514ca929?w=800&h=1000&${Q}`,
      `${BASE}/photo-1548036328-c9fa89d128fa?w=800&h=1000&${Q}`
    ],
    description: 'Responsibly sourced exotic leather paired with heirloom-quality stitching. A true collector\'s piece.',
    sizes: ['OS'],
    colors: ['Cognac', 'Steel'],
    bestSeller: true,
    relatedProductIds: ['mock_h1', 'mock_h2', 'mock_h6']
  },
  {
    _id: 'mock_h5',
    name: 'Woven Leather Bucket',
    price: 24000,
    category: 'Handbags',
    subcategory: 'Summer Series',
    images: [
      `${BASE}/photo-1594223274512-ad4803739b7c?w=800&h=1000&${Q}`,
      `${BASE}/photo-1548861216-2092c7102008?w=800&h=1000&${Q}`
    ],
    description: 'Hand-woven strips of nappa leather create a flexible, textured masterpiece. Perfect for resort getaways.',
    sizes: ['OS'],
    colors: ['Cream', 'Tan'],
    bestSeller: false,
    relatedProductIds: ['mock_h1', 'mock_h2', 'mock_s6']
  },
  {
    _id: 'mock_h6',
    name: 'Structured Top Handle',
    price: 52000,
    category: 'Handbags',
    subcategory: 'Boardroom',
    images: [
      `${BASE}/photo-1564419323145-35c8402c7db4?w=800&h=1000&${Q}`,
      `${BASE}/photo-1564419323145-35c8402c7db4?w=800&h=1000&${Q}`
    ],
    description: 'A professional statement piece with hidden magnetic closures and a refined structured frame.',
    sizes: ['OS'],
    colors: ['Mahogany', 'Night Shade'],
    bestSeller: false,
    relatedProductIds: ['mock_h4', 'mock_h1', 'mock_he1']
  },

  // CLASSIC & WORKWEAR (Heritage)
  {
    _id: 'mock_he1',
    name: 'Wool Shift Dress',
    price: 8600,
    category: 'Heritage',
    subcategory: 'Workwear',
    images: [
      '/generated/couture_coat_1_1773912963302.png',
      '/generated/couture_coat_1_1773912963302.png'
    ],
    description: 'Tailored from the finest merino wool with a minimalist, clean-lined silhouette for the office.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Grey Marl', 'Navy'],
    bestSeller: true,
    relatedProductIds: ['mock_he3', 'mock_he6', 'mock_h6']
  },
  {
    _id: 'mock_he2',
    name: 'Classic Tweed Midi',
    price: 7200,
    category: 'Heritage',
    subcategory: 'Classics',
    images: [
      `${BASE}/photo-1539533018447-63fcce2678e3?w=800&h=1000&${Q}`,
      `${BASE}/photo-1539532918447-63fcce2678e3?w=800&h=1000&${Q}`
    ],
    description: 'Heirloom-quality tweed weave with fringed edges and antique gold buttons.',
    sizes: ['S', 'M', 'L'],
    colors: ['Black/White', 'Camel'],
    bestSeller: true,
    relatedProductIds: ['mock_he4', 'mock_he5', 'mock_c2']
  },
  {
    _id: 'mock_he3',
    name: 'Tailored Midi Sheath',
    price: 6900,
    category: 'Heritage',
    subcategory: 'Workwear',
    images: [
      `${BASE}/photo-1549060279-7e168fcee0c2?w=800&h=1000&${Q}`,
      `${BASE}/photo-1549060290-7e168fcee0c2?w=800&h=1000&${Q}`
    ],
    description: 'Polished tailoring with a flattering cinched waist and elegant split neckline.',
    sizes: ['38', '40', '42'],
    colors: ['Deep Forest', 'Noir'],
    bestSeller: false,
    relatedProductIds: ['mock_he1', 'mock_he6', 'mock_h6']
  },
  {
    _id: 'mock_he4',
    name: 'Heritage Wrap Gown',
    price: 11950,
    category: 'Heritage',
    subcategory: 'Classics',
    images: [
      `${BASE}/photo-1551488831-00ddcb6c6bd3?w=800&h=1000&${Q}`,
      `${BASE}/photo-155148841-00ddcb6c6bd3?w=800&h=1000&${Q}`
    ],
    description: 'A timeless silhouette that celebrates the female form in premium heavy silk.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Sand', 'Olive'],
    bestSeller: false,
    relatedProductIds: ['mock_he2', 'mock_he5', 'mock_c2']
  },
  {
    _id: 'mock_he5',
    name: 'Pleated A-Line Midi',
    price: 6650,
    category: 'Heritage',
    subcategory: 'Classics',
    images: [
      `${BASE}/photo-1581044777550-4cfa60707c03?w=800&h=1000&${Q}`,
      `${BASE}/photo-1581044799550-4cfa60707c03?w=800&h=1000&${Q}`
    ],
    description: 'Sharp knife pleats that maintain their shape, paired with a fitted bodice.',
    sizes: ['S', 'M', 'L'],
    colors: ['Crimson', 'Grey'],
    bestSeller: true,
    relatedProductIds: ['mock_he2', 'mock_he4', 'mock_h2']
  },
  {
    _id: 'mock_he6',
    name: 'Belted Shirtdress',
    price: 5850,
    category: 'Heritage',
    subcategory: 'Workwear',
    images: [
      `${BASE}/photo-1596462502278-27bfaf41011f?w=800&h=1000&${Q}`,
      `${BASE}/photo-1596462512278-27bfaf41011f?w=800&h=1000&${Q}`
    ],
    description: 'Supremely soft pima cotton with a structured belt for a professional finish.',
    sizes: ['30', '32', '34', '36'],
    colors: ['Navy', 'Khaki'],
    bestSeller: false,
    relatedProductIds: ['mock_he1', 'mock_he3', 'mock_h6']
  },

  // PARTY & COCKTAIL (Silk Scarves -> New Mapping)
  {
    _id: 'mock_s1',
    name: 'Sequin Mini Dress',
    price: 8550,
    category: 'Silk Scarves',
    subcategory: 'Party Wear',
    images: [
      `${BASE}/photo-1469334031218-e382a71b716b?w=800&h=1000&${Q}`,
      `${BASE}/photo-1469334031258-e382a71b716b?w=800&h=1000&${Q}`
    ],
    description: 'Hand-sewn micro sequins that catch the light from every angle. Guaranteed to turn heads.',
    sizes: ['S', 'M'],
    colors: ['Multi Platinum', 'Disco Noir'],
    bestSeller: true,
    relatedProductIds: ['mock_s2', 'mock_s3', 'mock_c5']
  },
  {
    _id: 'mock_s2',
    name: 'Asymmetric Satin Mini',
    price: 7280,
    category: 'Silk Scarves',
    subcategory: 'Cocktail',
    images: [
      `${BASE}/photo-1551232864-3f0890e580d9?w=800&h=1000&${Q}`,
      `${BASE}/photo-1551232874-3f0890e580d9?w=800&h=1000&${Q}`
    ],
    description: 'Contemporary draping meets high-shine satin in this statement-making mini dress.',
    sizes: ['S', 'M'],
    colors: ['Monochrome', 'Azure'],
    bestSeller: false,
    relatedProductIds: ['mock_s1', 'mock_s4', 'mock_c5']
  },
  {
    _id: 'mock_s3',
    name: 'Ruffled Tulle Party',
    price: 11200,
    category: 'Silk Scarves',
    subcategory: 'Party Wear',
    images: [
      `${BASE}/photo-1515886657613-9f3515b0c78f?w=800&h=1000&${Q}`,
      `${BASE}/photo-1515886667613-9f3515b0c78f?w=800&h=1000&${Q}`
    ],
    description: 'Playful ruffles and sheer panels create a light and lively party silhouette.',
    sizes: ['S', 'M'],
    colors: ['Sunset Pink', 'Cloud White'],
    bestSeller: true,
    relatedProductIds: ['mock_s1', 'mock_s4', 'mock_s6']
  },
  {
    _id: 'mock_s4',
    name: 'Lace Overlay Midi',
    price: 9580,
    category: 'Silk Scarves',
    subcategory: 'Cocktail',
    images: [
      `${BASE}/photo-1620799140408-edc6dcb6d633?w=800&h=1000&${Q}`,
      `${BASE}/photo-1620799130408-edc6dcb6d633?w=800&h=1000&${Q}`
    ],
    description: 'Intricate French lace meticulously layered over a nude silk lining.',
    sizes: ['S', 'M', 'L'],
    colors: ['Noir', 'Champagne'],
    bestSeller: false,
    relatedProductIds: ['mock_s2', 'mock_s5', 'mock_c4']
  },
  {
    _id: 'mock_s5',
    name: 'Velvet Devoré Wrap',
    price: 10490,
    category: 'Silk Scarves',
    subcategory: 'Cocktail',
    images: [
      `${BASE}/photo-1582142306909-195724d33ffc?w=800&h=1000&${Q}`,
      `${BASE}/photo-1582142316909-195724d33ffc?w=800&h=1000&${Q}`
    ],
    description: 'An archive paisley pattern burned into rich velvet for a textured, vintage feel.',
    sizes: ['S', 'M', 'L'],
    colors: ['Ochre', 'Crimson'],
    bestSeller: false,
    relatedProductIds: ['mock_s4', 'mock_s1', 'mock_c1']
  },
  {
    _id: 'mock_s6',
    name: 'Reversible Silk Stole Dress',
    price: 15800,
    category: 'Silk Scarves',
    subcategory: 'Party Wear',
    images: [
      `${BASE}/photo-1539106604051-bd128229b13c?w=800&h=1000&${Q}`,
      `${BASE}/photo-1539106614051-bd128229b13c?w=800&h=1000&${Q}`
    ],
    description: 'Two layers of heavy silk allow for multiple styling options and reversible colors.',
    sizes: ['S'],
    colors: ['Gold/Black', 'Silver/Grey'],
    bestSeller: true,
    relatedProductIds: ['mock_s1', 'mock_s3', 'mock_c1']
  }
];
