/**
 * THAARAI THE DESIGNER STUDIO — Product Data
 * ─────────────────────────────────────────────────────────────────────────────
 * Products from the official Thaarai Designer Studio collection
 * ─────────────────────────────────────────────────────────────────────────────
 */

const THAARAI_BASE = 'https://aaradesigner.com/wp-content/uploads';

export const MOCK_PRODUCTS = [
  // KURTI COLLECTION
  {
    _id: 'mock_k1',
    name: 'Chanderi Dress Suits Readymades',
    price: 1699,
    category: 'Women',
    subcategory: 'Kurti',
    fabric: 'Chanderi',
    images: [
      `${THAARAI_BASE}/2026/02/exported_9F3B6D10-489F-45EF-B080-B039A4A30F67-300x450.jpeg`,
      `${THAARAI_BASE}/2026/02/exported_9F3B6D10-489F-45EF-B080-B039A4A30F67-300x450.jpeg`
    ],
    description: 'Elegant Chanderi dress suits in readymade format. Perfect blend of tradition and comfort.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blue', 'Pink'],
    bestSeller: true,
    relatedProductIds: ['mock_k2', 'mock_k3', 'mock_k4']
  },
  {
    _id: 'mock_k2',
    name: 'Peacock Green Raw Silk 3 Piece Set',
    price: 1899,
    category: 'Women',
    subcategory: 'Kurti',
    fabric: 'Raw Silk',
    images: [
      `${THAARAI_BASE}/2026/02/exported_40865ED8-89E4-45A8-B54D-59B407302619-300x450.jpeg`,
      `${THAARAI_BASE}/2026/02/exported_40865ED8-89E4-45A8-B54D-59B407302619-300x450.jpeg`
    ],
    description: 'Luxurious peacock green raw silk 3 piece set with exquisite detailing.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Peacock Green'],
    bestSeller: true,
    relatedProductIds: ['mock_k1', 'mock_k5', 'mock_m4']
  },
  {
    _id: 'mock_k3',
    name: 'Mangalagiri Cotton 3 Piece Set',
    price: 1699,
    category: 'Women',
    subcategory: 'Kurti',
    fabric: 'Cotton',
    images: [
      `${THAARAI_BASE}/2026/01/IMG_9685-300x450.jpeg`,
      `${THAARAI_BASE}/2026/01/IMG_9685-300x450.jpeg`
    ],
    description: 'Traditional Mangalagiri cotton 3 piece set with beautiful zari border.',
    sizes: ['S', 'M', 'L'],
    colors: ['Green', 'Cream'],
    bestSeller: true,
    relatedProductIds: ['mock_k1', 'mock_k6', 'mock_k4']
  },
  {
    _id: 'mock_k4',
    name: 'Chennuri Silk Nijam Border 2 Piece',
    price: 2299,
    category: 'Women',
    subcategory: 'Kurti',
    style: 'Silk',
    images: [
      `${THAARAI_BASE}/2026/02/exported_7555D2B7-195D-4DC8-9E27-204E29218C1E-300x450.jpeg`,
      `${THAARAI_BASE}/2026/02/exported_7555D2B7-195D-4DC8-9E27-204E29218C1E-300x450.jpeg`
    ],
    description: 'Premium Chennuri silk with signature Nijam border detailing.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Maroon', 'Navy Blue'],
    bestSeller: false,
    relatedProductIds: ['mock_k3', 'mock_k6', 'mock_a3']
  },
  {
    _id: 'mock_k5',
    name: 'PONGAL 2K25 Chettinadu Cotton',
    price: 2499,
    category: 'Kurti',
    subcategory: 'Cotton',
    images: [
      `${THAARAI_BASE}/2026/01/exported_0616C501-0F2C-4EDA-BB0E-0D51E818DE9F-300x450.jpeg`,
      `${THAARAI_BASE}/2026/01/exported_0616C501-0F2C-4EDA-BB0E-0D51E818DE9F-300x450.jpeg`
    ],
    description: 'Special Pongal collection - Authentic Chettinadu cotton with traditional design.',
    sizes: ['S', 'M', 'L'],
    colors: ['Red', 'Yellow'],
    bestSeller: true,
    relatedProductIds: ['mock_k1', 'mock_k2', 'mock_m2']
  },
  {
    _id: 'mock_k6',
    name: 'PONGAL 2K25 Red Raw Silk 3 Piece',
    price: 1899,
    category: 'Kurti',
    subcategory: 'Raw Silk',
    images: [
      `${THAARAI_BASE}/2026/01/exported_2A89B1B1-DCD6-40FB-ADD6-3C3C32A365F4-300x450.jpeg`,
      `${THAARAI_BASE}/2026/01/exported_2A89B1B1-DCD6-40FB-ADD6-3C3C32A365F4-300x450.jpeg`
    ],
    description: 'Festive red raw silk 3 piece set from Pongal special collection.',
    sizes: ['S', 'M'],
    colors: ['Red'],
    bestSeller: false,
    relatedProductIds: ['mock_k1', 'mock_k4', 'mock_a4']
  },
  {
    _id: 'mock_k7',
    name: 'PONGAL 2K25 Raw Silk Pink',
    price: 899,
    category: 'Kurti',
    subcategory: 'Raw Silk',
    images: [
      `${THAARAI_BASE}/2026/01/IMG_0753-300x450.jpeg`,
      `${THAARAI_BASE}/2026/01/IMG_0753-300x450.jpeg`
    ],
    description: 'Elegant pink raw silk kurti from Pongal collection at affordable price.',
    sizes: ['S', 'M', 'L'],
    colors: ['Pink'],
    bestSeller: true,
    relatedProductIds: ['mock_k1', 'mock_k2', 'mock_k3']
  },
  {
    _id: 'mock_k8',
    name: 'Pure Handloom Cotton 3 Piece Set',
    price: 1699,
    category: 'Kurti',
    subcategory: 'Cotton',
    images: [
      `${THAARAI_BASE}/2026/02/exported_C3402EFE-4C02-4D9F-A878-4681E257873F-300x450.jpeg`,
      `${THAARAI_BASE}/2026/02/exported_C3402EFE-4C02-4D9F-A878-4681E257873F-300x450.jpeg`
    ],
    description: 'Pure handloom cotton 3 piece set with traditional weaving patterns.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Cream', 'Beige'],
    bestSeller: false,
    relatedProductIds: ['mock_k3', 'mock_k5', 'mock_m2']
  },
  {
    _id: 'mock_k9',
    name: 'Jaipur Cotton 3 Piece Set Black',
    price: 1699,
    category: 'Kurti',
    subcategory: 'Cotton',
    images: [
      `${THAARAI_BASE}/2026/02/exported_C77D9D4A-379F-459A-B221-F5891DF41216-300x450.jpeg`,
      `${THAARAI_BASE}/2026/02/exported_C77D9D4A-379F-459A-B221-F5891DF41216-300x450.jpeg`
    ],
    description: 'Classic Jaipur cotton 3 piece set in elegant black color.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black'],
    bestSeller: true,
    relatedProductIds: ['mock_k8', 'mock_k3', 'mock_m1']
  },
  {
    _id: 'mock_k10',
    name: 'Pure Cotton Black Suits',
    price: 1699,
    category: 'Kurti',
    subcategory: 'Cotton',
    images: [
      `${THAARAI_BASE}/2026/02/exported_047EE1AA-660D-4926-A842-EE961A00E187-300x450.jpeg`,
      `${THAARAI_BASE}/2026/02/exported_047EE1AA-660D-4926-A842-EE961A00E187-300x450.jpeg`
    ],
    description: 'Pure cotton suits in classic black - perfect for any occasion.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Black'],
    bestSeller: false,
    relatedProductIds: ['mock_k9', 'mock_k8', 'mock_c1']
  },
  {
    _id: 'mock_k11',
    name: 'Mul Chanderi White Suits',
    price: 1899,
    category: 'Kurti',
    subcategory: 'Chanderi',
    images: [
      `${THAARAI_BASE}/2026/02/exported_3644AD40-0046-4E14-AF64-6E8522616926-300x450.jpeg`,
      `${THAARAI_BASE}/2026/02/exported_3644AD40-0046-4E14-AF64-6E8522616926-300x450.jpeg`
    ],
    description: 'Elegant Mul Chanderi suits in pristine white color.',
    sizes: ['S', 'M', 'L'],
    colors: ['White'],
    bestSeller: true,
    relatedProductIds: ['mock_k1', 'mock_k12', 'mock_a2']
  },
  {
    _id: 'mock_k12',
    name: 'Mul Chanderi Green Suits',
    price: 1699,
    category: 'Kurti',
    subcategory: 'Chanderi',
    images: [
      `${THAARAI_BASE}/2026/02/exported_AB2BDE39-A4F1-42FA-B3F6-A206DC1B0FF3-300x450.jpeg`,
      `${THAARAI_BASE}/2026/02/exported_AB2BDE39-A4F1-42FA-B3F6-A206DC1B0FF3-300x450.jpeg`
    ],
    description: 'Beautiful Mul Chanderi suits in vibrant green shade.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Green'],
    bestSeller: false,
    relatedProductIds: ['mock_k11', 'mock_k1', 'mock_m3']
  },

  // MAXI COLLECTION
  {
    _id: 'mock_m1',
    name: 'Golden Maxi Dress',
    price: 1899,
    category: 'Women',
    subcategory: 'Maxi',
    style: 'Party Wear',
    images: [
      `${THAARAI_BASE}/2025/08/IMG_0173-300x450.jpg`,
      `${THAARAI_BASE}/2025/08/IMG_0173-300x450.jpg`
    ],
    description: 'Stunning golden maxi dress perfect for parties and celebrations.',
    sizes: ['S', 'M', 'L'],
    colors: ['Golden'],
    bestSeller: true,
    relatedProductIds: ['mock_m3', 'mock_m4', 'mock_m6']
  },
  {
    _id: 'mock_m2',
    name: 'A Line Maxi with Dupatta',
    price: 1499,
    category: 'Women',
    subcategory: 'Maxi',
    style: 'Casual',
    images: [
      `${THAARAI_BASE}/2025/11/IMG_5375-300x450.jpeg`,
      `${THAARAI_BASE}/2025/11/IMG_5375-300x450.jpeg`
    ],
    description: 'Elegant A-line maxi dress with matching dupatta.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Blue', 'Green'],
    bestSeller: true,
    relatedProductIds: ['mock_m5', 'mock_m4', 'mock_k1']
  },
  {
    _id: 'mock_m3',
    name: 'White Flux Cotton Maxi',
    price: 1299,
    originalPrice: 1499,
    category: 'Maxi',
    subcategory: 'Cotton',
    images: [
      `${THAARAI_BASE}/2025/07/AD004-White-flux-cotton-MAXI-5-300x450.webp`,
      `${THAARAI_BASE}/2025/07/AD004-White-flux-cotton-MAXI-1.webp`
    ],
    description: 'Comfortable white flux cotton maxi for summer days.',
    sizes: ['S', 'M'],
    colors: ['White'],
    bestSeller: false,
    label: 'SALE',
    relatedProductIds: ['mock_m1', 'mock_m4', 'mock_a5']
  },
  {
    _id: 'mock_m4',
    name: 'Ikkat Blue Maxi',
    price: 1299,
    category: 'Maxi',
    subcategory: 'Printed',
    images: [
      `${THAARAI_BASE}/2025/08/IKKAT-BLUE-img-3-300x450.webp`,
      `${THAARAI_BASE}/2025/08/IKKAT-BLUE-img-3-300x450.webp`
    ],
    description: 'Traditional Ikkat print maxi in beautiful blue color.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blue'],
    bestSeller: true,
    relatedProductIds: ['mock_m1', 'mock_m2', 'mock_c6']
  },
  {
    _id: 'mock_m5',
    name: 'Black Floral Maxi',
    price: 1599,
    category: 'Maxi',
    subcategory: 'Printed',
    images: [
      `${THAARAI_BASE}/2025/07/AD003-Black-Floral-MAXI-3.webp`,
      `${THAARAI_BASE}/2025/07/AD003-Black-Floral-MAXI-3.webp`
    ],
    description: 'Elegant black maxi with beautiful floral prints.',
    sizes: ['S', 'M'],
    colors: ['Black'],
    bestSeller: false,
    relatedProductIds: ['mock_m1', 'mock_m2', 'mock_a6']
  },
  {
    _id: 'mock_m6',
    name: 'Brown Cotton Maxi',
    price: 1499,
    category: 'Maxi',
    subcategory: 'Cotton',
    images: [
      `${THAARAI_BASE}/2025/07/AD002-Brown-cotton-MAXI-3.webp`,
      `${THAARAI_BASE}/2025/07/AD002-Brown-cotton-MAXI-3.webp`
    ],
    description: 'Comfortable brown cotton maxi for casual outings.',
    sizes: ['M', 'L'],
    colors: ['Brown'],
    bestSeller: false,
    relatedProductIds: ['mock_m4', 'mock_m1', 'mock_k1']
  },

  // CO-ORDS COLLECTION
  {
    _id: 'mock_c1',
    name: 'CO-ORD SET (HA)',
    price: 1299,
    category: 'Women',
    subcategory: 'Co-ords',
    fabric: 'Cotton',
    images: [
      `${THAARAI_BASE}/2024/06/thaarai-designer-studio-product-img6-300x450.webp`,
      `${THAARAI_BASE}/2024/06/thaarai-designer-studio-product-img6-300x450.webp`
    ],
    description: 'Stylish co-ord set with matching top and bottom.',
    sizes: ['S', 'M', 'L'],
    colors: ['Multi'],
    bestSeller: true,
    relatedProductIds: ['mock_c3', 'mock_c6', 'mock_k6']
  },
  {
    _id: 'mock_c2',
    name: 'Onam Dress Kurti with Pant',
    price: 1199,
    category: 'Co-ords',
    subcategory: 'Festive',
    images: [
      `${THAARAI_BASE}/2025/08/Co-Ords-Set-all-sizes-img-3-300x450.webp`,
      `${THAARAI_BASE}/2025/08/Co-Ords-Set-all-sizes-img-3-300x450.webp`
    ],
    description: 'Special Onam collection co-ord set with kurti and pant.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Gold'],
    bestSeller: true,
    relatedProductIds: ['mock_c4', 'mock_c5', 'mock_k2']
  },
  {
    _id: 'mock_c3',
    name: 'Summer Co-Ords Coffee Brown',
    price: 1199,
    category: 'Co-ords',
    subcategory: 'Summer',
    images: [
      `${THAARAI_BASE}/2025/08/SUMMER-CO-ORDS-COFFE-BROWN-img-2-300x450.webp`,
      `${THAARAI_BASE}/2025/08/SUMMER-CO-ORDS-COFFE-BROWN-img-2-300x450.webp`
    ],
    description: 'Comfortable summer co-ords in rich coffee brown color.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Coffee Brown'],
    bestSeller: false,
    relatedProductIds: ['mock_c1', 'mock_c6', 'mock_m6']
  },
  {
    _id: 'mock_c4',
    name: 'Summer Co-Ords Red',
    price: 1199,
    category: 'Co-ords',
    subcategory: 'Summer',
    images: [
      `${THAARAI_BASE}/2025/08/SUMMER-CO-ORDS-RED-img-3-300x450.webp`,
      `${THAARAI_BASE}/2025/08/SUMMER-CO-ORDS-RED-img-3-300x450.webp`
    ],
    description: 'Vibrant red summer co-ords for a bold look.',
    sizes: ['S', 'M'],
    colors: ['Red'],
    bestSeller: true,
    relatedProductIds: ['mock_c2', 'mock_c5', 'mock_a2']
  },
  {
    _id: 'mock_c5',
    name: 'Summer Co-Ords Black',
    price: 1199,
    category: 'Co-ords',
    subcategory: 'Summer',
    images: [
      `${THAARAI_BASE}/2025/08/SUMMER-CO-ORDS-BLACK-img-1-300x450.webp`,
      `${THAARAI_BASE}/2025/08/SUMMER-CO-ORDS-BLACK-img-1-300x450.webp`
    ],
    description: 'Classic black summer co-ords for everyday elegance.',
    sizes: ['S', 'M', 'L'],
    colors: ['Black'],
    bestSeller: true,
    relatedProductIds: ['mock_c2', 'mock_c4', 'mock_a2']
  },
  {
    _id: 'mock_c6',
    name: 'Green Co-Ords Set',
    price: 1699,
    category: 'Co-ords',
    subcategory: 'Casual',
    images: [
      `${THAARAI_BASE}/2025/08/green-co-ords-img-2-300x450.webp`,
      `${THAARAI_BASE}/2025/08/green-co-ords-img-2-300x450.webp`
    ],
    description: 'Fresh green co-ords set perfect for casual occasions.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Green'],
    bestSeller: false,
    relatedProductIds: ['mock_c1', 'mock_c3', 'mock_k6']
  },
  {
    _id: 'mock_c7',
    name: 'Chettinadu 2-in-1 Ethnic Wear',
    price: 2999,
    category: 'Co-ords',
    subcategory: 'Premium',
    images: [
      `${THAARAI_BASE}/2026/03/collage_export_DEE40455-B925-4FC1-A549-08BA059913DC-300x450.jpeg`,
      `${THAARAI_BASE}/2026/03/collage_export_DEE40455-B925-4FC1-A549-08BA059913DC-300x450.jpeg`
    ],
    description: 'Premium Chettinadu 2-in-1 ethnic wear - versatile and elegant.',
    sizes: ['S', 'M', 'L'],
    colors: ['Multi'],
    bestSeller: true,
    label: 'NEW',
    relatedProductIds: ['mock_c1', 'mock_c2', 'mock_k5']
  },

  // ANARKALI COLLECTION
  {
    _id: 'mock_a1',
    name: 'PONGAL 2K25 Narayanpet Anarkali',
    price: 2199,
    category: 'Women',
    subcategory: 'Anarkali',
    style: 'Festive',
    images: [
      `${THAARAI_BASE}/2026/01/IMG_0761-300x450.jpeg`,
      `${THAARAI_BASE}/2026/01/IMG_0761-300x450.jpeg`
    ],
    description: 'Grand Narayanpet Anarkali from Pongal special collection.',
    sizes: ['S', 'M'],
    colors: ['Multi'],
    bestSeller: true,
    relatedProductIds: ['mock_a2', 'mock_a3', 'mock_k5']
  },
  {
    _id: 'mock_a2',
    name: 'PONGAL 2K25 Mangalagiri Anarkali',
    price: 1699,
    category: 'Anarkali',
    subcategory: 'Cotton',
    images: [
      `${THAARAI_BASE}/2026/02/IMG_0653-300x450.jpeg`,
      `${THAARAI_BASE}/2026/02/IMG_0653-300x450.jpeg`
    ],
    description: 'Beautiful Mangalagiri 3 piece Anarkali from Pongal collection.',
    sizes: ['S', 'M', 'L'],
    colors: ['Cream', 'Green'],
    bestSeller: true,
    relatedProductIds: ['mock_a1', 'mock_a4', 'mock_k3']
  },
  {
    _id: 'mock_a3',
    name: 'Raw Silk Kurti Anarkali Style',
    price: 1599,
    category: 'Anarkali',
    subcategory: 'Raw Silk',
    images: [
      `${THAARAI_BASE}/2025/07/AD004-Raw-Silk-KURTI-img-1.webp`,
      `${THAARAI_BASE}/2025/07/Raw-Silk-KURTI-1.webp`
    ],
    description: 'Elegant raw silk kurti in Anarkali style.',
    sizes: ['S', 'M'],
    colors: ['Pink', 'Purple'],
    bestSeller: false,
    relatedProductIds: ['mock_a1', 'mock_a4', 'mock_m6']
  },
  {
    _id: 'mock_a4',
    name: 'Vichitra Silk Mirror Work Anarkali',
    price: 1499,
    category: 'Anarkali',
    subcategory: 'Silk',
    images: [
      `${THAARAI_BASE}/2025/09/IMG_1867-1-300x450.jpg`,
      `${THAARAI_BASE}/2025/09/IMG_1867-1-300x450.jpg`
    ],
    description: 'Gorgeous Vichitra silk Anarkali with mirror work detailing.',
    sizes: ['S', 'M', 'L'],
    colors: ['Red'],
    bestSeller: false,
    relatedProductIds: ['mock_a2', 'mock_a5', 'mock_c4']
  },
  {
    _id: 'mock_a5',
    name: 'Classic Anarkali Set',
    price: 1799,
    category: 'Anarkali',
    subcategory: 'Traditional',
    images: [
      `${THAARAI_BASE}/2025/09/IMG_1225.jpeg`,
      `${THAARAI_BASE}/2025/09/IMG_1225.jpeg`
    ],
    description: 'Classic traditional Anarkali set for special occasions.',
    sizes: ['S', 'M'],
    colors: ['Yellow', 'Orange'],
    bestSeller: true,
    relatedProductIds: ['mock_a4', 'mock_a1', 'mock_k1']
  },
  {
    _id: 'mock_a6',
    name: 'Silk Cotton Green Anarkali',
    price: 1699,
    category: 'Anarkali',
    subcategory: 'Silk Cotton',
    images: [
      `${THAARAI_BASE}/2025/07/Silk-Cotton-with-Duppata-5-300x450.webp`,
      `${THAARAI_BASE}/2025/07/Silk-Cotton-with-Duppata-5-300x450.webp`
    ],
    description: 'Elegant silk cotton Anarkali in green with dupatta.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Green'],
    bestSeller: false,
    relatedProductIds: ['mock_a1', 'mock_a3', 'mock_k12']
  }
];
