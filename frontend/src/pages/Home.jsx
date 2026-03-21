import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import ProductCard from '../components/ProductCard';
import Newsletter from '../components/Newsletter';
import {
  HERO_BG,
  CAT_COUTURE, CAT_HANDBAGS, CAT_HERITAGE, CAT_ANARKALI,
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

      const localData = localStorage.getItem('aara_local_products');
      const localProducts = localData ? JSON.parse(localData) : [];
      let combined = [...localProducts, ...realFeatured];

      if (combined.length < 6) {
        const mocks = MOCK_PRODUCTS.filter(p => p.bestSeller && !combined.some(rp => rp.name === p.name)).slice(0, 6 - combined.length);
        setFeaturedProducts([...combined, ...mocks]);
      } else {
        setFeaturedProducts(combined.slice(0, 6));
      }
    }).catch(() => {
      const localData = localStorage.getItem('aara_local_products');
      const localProducts = localData ? JSON.parse(localData) : [];
      const mocks = MOCK_PRODUCTS.filter(p => p.bestSeller && !localProducts.some(lp => lp.name === p.name)).slice(0, 6 - localProducts.length);
      setFeaturedProducts([...localProducts, ...mocks]);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white min-h-screen text-gray-900 animate-fade-in">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* HERO — Full Width Background */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden" 
        style={{ 
          background: 'radial-gradient(at 100% 0%, rgba(255, 244, 248, 0.8) 0px, transparent 40%), radial-gradient(at 0% 100%, rgba(171, 160, 227, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(245, 233, 218, 0.45) 0px, transparent 50%), #fff' 
        }}>
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-100 mb-6 rounded-full">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#aba0e3' }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-700">
                New Collection 2026
              </p>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 font-bold leading-[1.1] mb-6">
              Best Quality<br />
              <span className="italic font-normal" style={{ color: '#8b7fc0' }}>Fabrics.</span>
            </h1>

            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-10 max-w-lg">
              Classy designs at affordable pricing. Discover our exclusive collection of Indian ethnic wear crafted with love and tradition.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <Link to="/collection" className="btn-primary text-sm px-8 py-4">
                Shop Collection
              </Link>
              <Link to="/collection?category=Kurti" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 group">
                Explore Kurtis
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Right side: Logo */}
          <div className="flex justify-center lg:justify-end">
            <img 
              src="/aara-logo.png" 
              alt="Aara Logo" 
              className="w-full max-w-[420px] h-auto object-contain scale-105"
            />
          </div>
        </div>

        {/* Scroll Cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em]">Scroll</p>
          <div className="w-px h-8 bg-gray-300 animate-pulse" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8">
            {[
              { value: '49+', label: 'Products' },
              { value: '100%', label: 'Quality' },
              { value: '98%', label: 'Happy Customers' },
              { value: '24/7', label: 'Support' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-serif text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
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
              <h2 className="section-title">The Aara Edit</h2>
              <p className="text-gray-600 leading-relaxed mt-6 text-sm font-light">
                Discover our signature pieces crafted with the finest fabrics. Curated for those who appreciate style and elegance.
              </p>
            </div>
            <Link to="/collection" className="btn-ghost mb-4 md:mb-0">
              View Collection
            </Link>
          </div>

          <div className="max-w-5xl mx-auto">
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
          </div>

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
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Kurti', title: 'Designer Kurtis', img: CAT_COUTURE, href: '/collection?category=Kurti', count: '34 Items' },
            { label: 'Maxi', title: 'Maxi Dresses', img: CAT_HANDBAGS, href: '/collection?category=Maxi', count: '10 Items' },
            { label: 'Co-ords', title: 'Co-ord Sets', img: CAT_HERITAGE, href: '/collection?category=Co-ords', count: '8 Items' },
            { label: 'Anarkali', title: 'Anarkali Suits', img: CAT_ANARKALI, href: '/collection?category=Anarkali', count: '6 Items' },
          ].map(cat => (
            <Link key={cat.label} to={cat.href} className="group relative overflow-hidden block rounded-xl shadow-xl" style={{ aspectRatio: '3/4' }}>
              <img
                src={cat.img}
                alt={cat.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gray-900/10 group-hover:bg-gray-900/5 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
                <p className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#aba0e3' }}>{cat.count}</p>
                <h3 className="font-serif text-sm md:text-lg text-white font-bold tracking-tight">{cat.title}</h3>
                <div className="w-0 h-px bg-white/50 mt-2 group-hover:w-full transition-all duration-700" />
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
                  src="/founder-subha.png"
                  alt="Aara Designer Studio"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover rounded-sm shadow-2xl"
                  style={{ aspectRatio: '4/4' }}
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-white border border-gray-100 p-10 hidden lg:block shadow-2xl">
                <p className="font-serif text-4xl font-bold text-gray-900 mb-1">Subha</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.4em]" style={{ color: '#aba0e3' }}>Founder</p>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-6 lg:pl-10 text-gray-900">
              <span className="section-label">Our Philosophy</span>
              <h2 className="section-title mt-6">
                Style, Innovation &<br />
                <em className="italic font-normal" style={{ color: '#8b7fc0' }}>Individuality</em>
              </h2>
              <div className="w-12 h-px my-10" style={{ backgroundColor: 'rgba(171, 160, 227, 0.2)' }} />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-12 italic">
                We blend inspiration from culture and creativity with bold ideas and timeless aesthetics — crafting pieces that are elegant and affordable.
              </p>
              <Link to="/collection" className="btn-primary">
                Explore Collection
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
