import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import ProductCard from '../components/ProductCard';
import Newsletter from '../components/Newsletter';
import {
  HERO_BG,
  CAT_COUTURE, CAT_HANDBAGS, CAT_HERITAGE,
  BRAND_STORY,
  DEMO_PRODUCTS,
} from '../assets/images';
import { MOCK_PRODUCTS } from '../data/mockProducts';

// Reusable fade-in hook
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/products?bestSeller=true&limit=6').then(r => {
      let realFeatured = r.data.products || [];
      
      const localData = localStorage.getItem('thaarai_local_products');
      const localProducts = localData ? JSON.parse(localData) : [];
      let combined = [...localProducts, ...realFeatured];

      if (combined.length < 6) {
        const mocks = MOCK_PRODUCTS.filter(p => p.bestSeller && !combined.some(rp => rp.name === p.name)).slice(0, 6 - combined.length);
        setFeaturedProducts([...combined, ...mocks]);
      } else {
        setFeaturedProducts(combined.slice(0, 6));
      }
    }).catch(() => {
      const localData = localStorage.getItem('thaarai_local_products');
      const localProducts = localData ? JSON.parse(localData) : [];
      const mocks = MOCK_PRODUCTS.filter(p => p.bestSeller && !localProducts.some(lp => lp.name === p.name)).slice(0, 6 - localProducts.length);
      setFeaturedProducts([...localProducts, ...mocks]);
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { value: '1987', label: 'Est.' },
    { value: '47+', label: 'Designers' },
    { value: '120+', label: 'Countries' },
    { value: '98%', label: 'Satisfaction' },
  ];

  return (
    <div className="bg-white min-h-screen text-gray-900 animate-fade-in">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* HERO — Full Screen Editorial */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden bg-gray-50">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt="Thaarai Luxury Collection"
            className="w-full h-full object-cover opacity-60 brightness-110"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/40 backdrop-blur-md border border-white mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-900">
                SS25 Collection Now Live
              </p>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-9xl text-gray-900 font-bold leading-[0.85] mb-6">
              L'Art de<br />
              <span className="italic text-blue-600 font-normal">Heritage.</span>
            </h1>
            <p className="text-gray-600 text-sm md:text-base font-light leading-relaxed mb-10 max-w-sm tracking-wide">
              Where ancestral craftsmanship meets the avant-garde spirit of modern luxury.
            </p>
            <div className="flex flex-wrap gap-6 items-center">
              <Link to="/collection" className="btn-primary">
                Shop The Collection
              </Link>
              <Link to="/collection?category=Heritage" className="btn-ghost text-gray-400 hover:text-gray-900">
                The Lookbook
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Cue */}
        <div className="absolute bottom-10 left-12 z-10 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[7px] uppercase tracking-[0.5em] text-white font-bold mb-2 [writing-mode:vertical-lr]">Scroll</span>
          <div className="w-px h-16 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* STATS BAR */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white py-16 px-6 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {stats.map(s => (
              <div key={s.label} className="text-center group">
                <p className="font-serif text-4xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{s.value}</p>
                <div className="w-4 h-px bg-blue-600/30 mx-auto mb-2" />
                <p className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* PRODUCT SHOWCASE */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div className="max-w-xl">
              <span className="section-label">Selected Works</span>
              <h2 className="section-title">The Thaarai Edit</h2>
              <p className="text-gray-600 leading-relaxed mt-6 text-sm font-light">
                Discover our signature pieces, where every stitch tells a story of heritage and precision. Curated for those who appreciate true distinction.
              </p>
            </div>
            <Link to="/collection" className="btn-ghost mb-4 md:mb-0">
              View Collection
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-xl" style={{ aspectRatio: '3/4' }} />
                  <div className="h-4 bg-gray-200 mt-4 w-2/3" />
                  <div className="h-3 bg-gray-200 mt-2 w-1/3" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {featuredProducts.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {DEMO_PRODUCTS.slice(0, 3).map(p => (
                <ProductCard key={p.name} product={{
                  _id: p.name, name: p.name, category: p.category,
                  price: p.price, label: p.label, images: [p.image]
                }} />
              ))}
            </div>
          )}

          <div className="mt-20 border-t border-white/5 pt-12 flex justify-center">
            <Link to="/collection" className="btn-secondary">
              View All Collections
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* CATEGORY FEATURE — GRID */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Couture', title: 'Ready-to-Wear', img: CAT_COUTURE, href: '/collection?category=Couture' },
            { label: 'Accessories', title: 'The Handbag Edit', img: CAT_HANDBAGS, href: '/collection?category=Handbags' },
            { label: 'Heritage', title: 'Atelier Artifacts', img: CAT_HERITAGE, href: '/collection?category=Heritage' },
          ].map(cat => (
            <Link key={cat.label} to={cat.href} className="group relative overflow-hidden block rounded-sm shadow-xl" style={{ aspectRatio: '4/5' }}>
              <img
                src={cat.img}
                alt={cat.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gray-900/10 group-hover:bg-gray-900/5 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80" />
              <div className="absolute inset-x-0 bottom-0 p-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-2">{cat.label}</p>
                <h3 className="font-serif text-2xl text-white font-bold tracking-tight">{cat.title}</h3>
                <div className="w-0 h-px bg-white/50 mt-4 group-hover:w-full transition-all duration-700" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* BRAND STORY */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 bg-white border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            {/* Image */}
            <div className="lg:col-span-6 relative">
              <div className="relative group">
                <div className="absolute inset-0 border border-gray-100 -translate-x-6 -translate-y-6 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-1000" />
                <img
                  src={BRAND_STORY}
                  alt="The Thaarai Atelier"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 rounded-sm shadow-2xl"
                  style={{ aspectRatio: '4/5' }}
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-white border border-gray-100 p-10 hidden lg:block shadow-2xl">
                <p className="font-serif text-4xl font-bold text-gray-900 mb-1">1987</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-blue-600">Est. Paris</p>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-6 lg:pl-10 text-gray-900">
              <span className="section-label">Our Philosophy</span>
              <h2 className="section-title mt-6">
                Mastery in Every<br />
                <em className="text-blue-600 italic font-normal">Single Detail</em>
              </h2>
              <div className="w-12 h-px bg-blue-600/20 my-10" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-12 italic">
                We remain committed to the preservation of artisanal heritage — crafting pieces that are not just beautiful, but inherently responsible.
              </p>
              <Link to="/collection" className="btn-primary">
                Explore Heritage
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
}
