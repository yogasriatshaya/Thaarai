import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import ProductCard from '../components/ProductCard';
import heroImage from '../assets/hero1.jpg';
import Newsletter from '../components/Newsletter';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/products?limit=6').then(r => {
      setFeaturedProducts(r.data.products || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80 z-10" />
        <img
          src={heroImage}
          alt="The Royal Collection"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
          <p className="mb-5 text-[12px] md:text-[13px] tracking-[0.45em] uppercase font-semibold text-[#e5c76b] drop-shadow-md">New Arrival</p>
          <h1 className="font-serif text-[56px] md:text-[86px] text-white mb-6 leading-[0.95] drop-shadow-xl">
            <span className="block font-normal">The Royal</span>
            <span className="block italic font-normal">Collection</span>
          </h1>
          <p className="text-[17px] md:text-[18px] text-white/90 font-sans font-light max-w-4xl mb-12 leading-relaxed drop-shadow-sm">
            Experience the pinnacle of luxury with our hand-woven silk gowns and regal silhouettes designed for the modern monarch.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/collection" 
              className="px-8 py-3 text-white text-[12px] font-bold uppercase tracking-[0.1em] transition-all duration-300 rounded-lg shadow-lg hover:scale-105"
              style={{ backgroundColor: '#b08912' }}
            >
              Shop the Collection
            </Link>
            <Link 
              to="/collection?category=Co-ords" 
              className="inline-block border-2 border-white text-white px-8 py-3 text-xs tracking-[0.2em] uppercase font-sans font-medium hover:bg-white hover:text-charcoal transition-all duration-300 shadow-xl"
            >
              View Lookbook
            </Link>
          </div>
        </div>
      </section>

      {/* Artisanal Craftsmanship */}
      <section className="py-20 bg-ivory">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="section-label mb-3">The CubeAI Solutions Standard</p>
            <h2 className="section-title mb-4">Artisanal Craftsmanship</h2>
            <div className="w-12 h-px bg-gold-500 mx-auto mb-5" />
            <p className="text-sm text-muted font-sans max-w-xl mx-auto leading-relaxed italic">
              "Every stitch tells a story of heritage and precision. Discover our curated selection of tailored coats, hand-finished silks, and designer accessories."
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded" style={{ aspectRatio: '3/4' }} />
                  <div className="h-4 bg-gray-200 rounded mt-3 w-2/3" />
                  <div className="h-3 bg-gray-200 rounded mt-2 w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'Tailored Majesty', sub: 'Exquisite Merino Wool', price: '₹1,850', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4adc?w=400&h=500&fit=crop' },
                { name: 'The Signature Bag', sub: 'Pure Russian Calfskin', price: '₹3,200', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop', label: 'ICONIC' },
                { name: 'Silk Radiance', sub: 'Hand-painted Mulberry Silk', price: '₹450', img: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=400&h=500&fit=crop' }
              ].map(p => (
                <div key={p.name} className="product-card">
                  <div className="relative product-img-wrap bg-gray-50 mb-3" style={{ aspectRatio: '3/4' }}>
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                    {p.label && <span className="absolute top-3 left-3 bg-gold-600 text-white text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 font-sans">{p.label}</span>}
                  </div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted font-sans mb-1">{p.sub}</p>
                  <h3 className="font-serif text-base text-charcoal mb-1">{p.name}</h3>
                  <p className="text-sm font-sans font-medium">{p.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mastery in Every Detail */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=700&fit=crop"
                alt="The Atelier"
                className="w-full object-cover"
                style={{ aspectRatio: '5/6' }}
              />
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>
            </div>
            <div className="md:pl-8">
              <p className="section-label mb-5">The Atelier</p>
              <h2 className="font-serif text-4xl text-charcoal mb-2">Mastery in</h2>
              <h2 className="font-serif italic text-4xl text-gold-600 mb-8">every detail</h2>
              <p className="text-sm text-muted font-sans leading-relaxed mb-8">
                Founded on the principles of timeless elegance and unparalleled quality, CubeAI Solutions brings together the world's finest artisans to create pieces that transcend seasons. Our atelier in the heart of the heritage district remains committed to sustainable luxury and ethical sourcing.
              </p>
              <Link to="/collection" className="inline-flex items-center gap-3 text-xs tracking-[0.2em] uppercase font-sans text-charcoal hover:text-gold-600 transition-colors group">
                Discover Our Story
                <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
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
