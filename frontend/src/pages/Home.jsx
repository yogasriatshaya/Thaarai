import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import ProductCard from '../components/ProductCard';
import Newsletter from '../components/Newsletter';
import heroBg from '../assets/hero-bg2.png';
import springCollectionBg from '../assets/Spring Collection.jpg';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/products?limit=8').then(r => {
      setFeaturedProducts(r.data.products || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="-mt-[80px] md:-mt-[110px]">
      {/* ======================== LUXURY HERO ======================== */}
      <section className="relative h-[90vh] min-h-[600px] md:min-h-[800px] overflow-hidden bg-slate-950">
        {/* Background Image with Enhanced Overlay */}
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Tharai Luxury"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Minimal overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent md:from-black/40 md:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        </div>
        
        {/* Main Content Container */}
        <div className="relative z-10 h-full flex items-center">
          <div className="w-full grid grid-cols-1 gap-12 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
            
            {/* LEFT: Text Content */}
            <div className="flex flex-col justify-center pt-32 pb-16 md:py-12">
              {/* Top Accent Line */}
              <div className="mb-8 flex items-center justify-center md:justify-start gap-4">
                <div className="w-16 h-1 bg-gradient-to-r from-[#101e42] to-transparent" />
                <p className="text-[#101e42] text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase">Luxury Heritage</p>
              </div>
              
              {/* Left text alignment container shifted to center on mobile */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                {/* Main Heading */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light text-white mb-6 leading-none tracking-tighter drop-shadow-xl uppercase">
                  THAARAI
                </h1>
                
                {/* Decorative Element */}
                <div className="mb-8 w-12 h-1 bg-gradient-to-r from-[#101e42] to-transparent mx-auto md:mx-0" />
                
                {/* Tagline */}
                <p className="text-[15px] md:text-lg lg:text-xl text-white/90 font-light mb-10 leading-relaxed max-w-lg">
                  Where heritage meets contemporary elegance. Each piece tells a story of artisanal mastery and timeless sophistication.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center md:items-center gap-6 pt-4">
                  <Link 
                    to="/collection" 
                    className="group px-10 py-4 bg-[#101e42] text-white text-[11px] font-semibold uppercase tracking-widest hover:bg-[#1c3c7d] transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/30 transform hover:scale-105 rounded-sm"
                  >
                    Explore Collection
                  </Link>
                  <div className="hidden sm:block w-px h-10 bg-white/20 mx-2" />
                  <Link 
                    to="/collection" 
                    className="group text-white text-[11px] font-light uppercase tracking-widest hover:text-[#1c3c7d] transition-all duration-300 flex items-center gap-2 pb-2 border-b-2 border-white/30 hover:border-white"
                  >
                    Discover Now
                    <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </Link>
                </div>
              </div>


            </div>


          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-400 to-transparent opacity-100" />
      </section>

      {/* ======================== LUXURY INTRO ======================== */}
      <section className="relative py-24 md:py-40 overflow-hidden bg-gradient-to-b from-gray-200 via-gray-100/50 to-gray-200">
        {/* Premium Background with Subtle Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="luxury-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="#000" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#luxury-pattern)" />
          </svg>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-100/30 rounded-full blur-3xl" />
        
        <div className="max-w-5xl mx-auto px-8 md:px-16 relative z-10">
          <div className="text-center space-y-10">
            {/* Top Divider */}
            <div className="flex justify-center items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-400" />
              <div className="h-2 w-2 bg-slate-400 rounded-full" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-400" />
            </div>
            
            {/* Label */}
            <p className="text-amber-800 text-xs font-light uppercase tracking-[0.5em] letter-spacing-xl">
              Philosophy
            </p>
            
            {/* Main Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-black leading-tight">
              Crafted for those who understand the value of true quality
            </h2>
            
            {/* Description */}
            <p className="text-xl md:text-2xl text-gray-800 font-light leading-relaxed max-w-4xl mx-auto">
              Tharai represents the pinnacle of artisanal craftsmanship, where traditional Indian techniques meet contemporary design. Every piece is meticulously created to transcend trends and stand the test of time.
            </p>
            
            {/* Bottom Divider */}
            <div className="flex justify-center items-center gap-4 pt-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-600" />
              <div className="h-2 w-2 bg-amber-600 rounded-full" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-600" />
            </div>
          </div>
        </div>
      </section>

      {/* ======================== HERO BANNER WITH IMAGE ======================== */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden bg-gradient-to-r from-slate-800 to-slate-950">
        <img 
          src={springCollectionBg}
          alt="Spring Collection" 
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50" />
        
        <div className="absolute inset-0 flex items-center justify-center px-8 md:px-16 lg:px-24">
          <div className="text-center w-full max-w-3xl">
            <p className="text-slate-300 text-xs uppercase tracking-[0.3em] mb-6 font-light">New Arrivals</p>
            <h3 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white leading-tight mb-8 drop-shadow-lg">
              Spring Collection
            </h3>
            <p className="text-amber-100 text-lg md:text-xl font-light mb-12 drop-shadow-md leading-relaxed">
              Discover our exclusive 2026 spring collection with pieces inspired by timeless elegance
            </p>
            <Link 
              to="/collection" 
              className="inline-block px-10 py-3 border-2 border-slate-200 text-white text-xs font-light uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 drop-shadow-lg"
            >
              View Collection
            </Link>
          </div>
        </div>
      </section>

      {/* ======================== THREE PILLARS ======================== */}
      <section className="relative py-24 md:py-40 overflow-hidden bg-gradient-to-b from-[#0f2355] via-[#162e63] to-[#0a1a44]">
        {/* Premium Luxury Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=1920&h=800&fit=crop&q=80"
            alt="Luxury Background"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-amber-900/5 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 md:mb-28">
            {/* Top Divider */}
            <div className="flex justify-center items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-400" />
              <div className="h-2 w-2 bg-slate-400 rounded-full" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-400" />
            </div>
            
            <p className="text-slate-300 text-xs font-light uppercase tracking-[0.5em] mb-10">Our Foundation</p>
            
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-white mb-8 leading-tight">
              Three Pillars of Excellence
            </h3>
            
            <p className="text-white text-lg md:text-xl font-light max-w-3xl mx-auto leading-relaxed">
              The core principles that define our unwavering commitment to craftsmanship and shape every decision we make
            </p>
          </div>
          
          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            {/* Pillar 1 - Heritage */}
            <div className="group relative h-full">
              {/* Luxury Card with Glass Effect */}
              <div className="relative h-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl p-6 md:p-10 hover:border-amber-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-600/20">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-amber-600/0 group-hover:from-amber-600/10 group-hover:to-amber-600/5 transition-all duration-500 rounded-none" />
                
                {/* Top decoration */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon */}
                <div className="relative mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
                    <span className="text-white text-3xl font-serif">◊</span>
                  </div>
                </div>
                
                {/* Content */}
                <h4 className="relative text-[1.2rem] min-[400px]:text-3xl font-serif font-light text-white mb-6 uppercase tracking-widest leading-none break-words">Heritage</h4>
                <p className="relative text-white font-light leading-relaxed text-lg">
                  Centuries of Indian craftsmanship refined through modern design sensibilities and contemporary artistry
                </p>
              </div>
            </div>

            {/* Pillar 2 - Sustainability */}
            <div className="group relative h-full md:translate-y-8">
              {/* Luxury Card with Glass Effect */}
              <div className="relative h-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl p-6 md:p-10 hover:border-amber-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-600/20">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-amber-600/0 group-hover:from-amber-600/10 group-hover:to-amber-600/5 transition-all duration-500 rounded-none" />
                
                {/* Top decoration */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon */}
                <div className="relative mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
                    <span className="text-white text-3xl font-serif">※</span>
                  </div>
                </div>
                
                {/* Content */}
                <h4 className="relative text-[1.2rem] min-[400px]:text-3xl font-serif font-light text-white mb-6 uppercase tracking-widest leading-none break-words">Sustainability</h4>
                <p className="relative text-white font-light leading-relaxed text-lg">
                  Ethically sourced materials and fair-trade practices at every step of creation and distribution
                </p>
              </div>
            </div>

            {/* Pillar 3 - Timelessness */}
            <div className="group relative h-full">
              {/* Luxury Card with Glass Effect */}
              <div className="relative h-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl p-6 md:p-10 hover:border-amber-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-600/20">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-amber-600/0 group-hover:from-amber-600/10 group-hover:to-amber-600/5 transition-all duration-500 rounded-none" />
                
                {/* Top decoration */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon */}
                <div className="relative mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
                    <span className="text-white text-3xl font-serif">◈</span>
                  </div>
                </div>
                
                {/* Content */}
                <h4 className="relative text-[1.2rem] min-[400px]:text-3xl font-serif font-light text-white mb-6 uppercase tracking-widest leading-none break-words">Timelessness</h4>
                <p className="relative text-white font-light leading-relaxed text-lg">
                  Designs that transcend seasons and trends for lasting elegance and enduring value
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== HERITAGE SECTION ======================== */}
      <section className="relative py-24 md:py-40 overflow-hidden bg-gradient-to-b from-white via-yellow-50/20 to-white">
        {/* Premium Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="heritage-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="10" y2="10" stroke="#000" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#heritage-pattern)" />
          </svg>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-100/40 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1 space-y-10">
              {/* Header Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-amber-600 to-transparent" />
                <div className="h-2 w-2 bg-amber-600 rounded-full" />
              </div>
              
              {/* Label */}
              <p className="text-amber-800 text-xs font-light uppercase tracking-[0.5em]">Our Story</p>
              
              {/* Heading */}
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-light text-black leading-tight">
                Legacy of Excellence
              </h2>
              
              {/* Divider */}
              <div className="w-20 h-1 bg-gradient-to-r from-amber-600 to-yellow-500" />
              
              {/* Content */}
              <p className="text-xl text-gray-800 font-light leading-relaxed">
                Founded on the belief that true luxury is timeless, Tharai celebrates the sophistication of restraint and the elegance of simplicity. Our pieces are not mere garments—they are investments in your personal narrative.
              </p>
              
              <p className="text-lg text-gray-700 font-light leading-relaxed">
                Each collection reflects our unwavering commitment to artisanal quality and innovative design, creating pieces that honor tradition while embracing the future.
              </p>
              
              {/* CTA */}
              <div className="pt-6">
                <Link 
                  to="/about" 
                  className="group inline-flex items-center gap-3 text-black text-xs font-light uppercase tracking-[0.3em] border-b-2 border-black hover:border-amber-600 hover:text-amber-600 transition-all duration-300 pb-3"
                >
                  Read Our Full Story
                  <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                </Link>
              </div>
            </div>
            
            {/* Logo Section */}
            <div className="order-1 lg:order-2 relative flex items-center justify-center">
              {/* Premium Logo Display */}
              <div className="relative group">
                {/* Background glow effect */}
                <div className="absolute -inset-12 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full blur-2xl group-hover:from-amber-500/40 group-hover:to-yellow-500/40 transition-all duration-500" />
                
                {/* Decorative Frame */}
                <div className="absolute -inset-6 border-2 border-amber-600/30 group-hover:border-amber-600/60 transition-all duration-500 rounded-full" />
                <div className="absolute inset-0 border border-amber-400/20 group-hover:border-amber-400/40 transition-all duration-500 rounded-full" />
                
                {/* Tharai Logo */}
                <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                  <img 
                    src="/tharrai-logo.png" 
                    alt="Tharai Logo" 
                    className="w-full h-full object-contain drop-shadow-2xl group-hover:drop-shadow-[0_0_30px_rgba(217,119,6,0.5)] transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== SUBSCRIPTION ======================== */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-white to-gray-50">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-100/30 rounded-full blur-3xl" />
        
        {/* Premium Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="vip-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="#000" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#vip-pattern)" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-12">
          <div className="bg-gradient-to-br from-[#101e42] via-[#1c3c7d] to-[#101e42] rounded-2xl p-8 sm:p-16 md:p-20 text-center border border-amber-600/20 backdrop-blur">
            {/* Top Divider */}
            <div className="flex justify-center items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-200" />
              <div className="h-2 w-2 bg-slate-200 rounded-full" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-200" />
            </div>
            
            {/* Label */}
            <p className="text-slate-100 text-xs font-light uppercase tracking-[0.5em] mb-8">
              Exclusive Access
            </p>
            
            {/* Main Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-white mb-8 leading-tight">
              Join The Inner Circle
            </h2>
            
            {/* Subheading */}
            <p className="text-white text-[15px] md:text-lg lg:text-xl font-light mb-14 leading-relaxed max-w-3xl mx-auto">
              Become a member and unlock exclusive access to limited collections, private salon experiences, and personalized styling from our master artisans.
            </p>
            
            {/* Newsletter Form */}
            <div className="mb-12">
              <Newsletter />
            </div>
            
            {/* Benefits List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/10">
              <div className="text-center">
                <p className="text-white text-2xl mb-2">✦</p>
                <h4 className="text-white text-sm font-light uppercase tracking-widest mb-1">First Access</h4>
                <p className="text-slate-200 text-xs font-light">New collections before anyone</p>
              </div>
              <div className="text-center">
                <p className="text-white text-2xl mb-2">✦</p>
                <h4 className="text-white text-sm font-light uppercase tracking-widest mb-1">Private Events</h4>
                <p className="text-slate-200 text-xs font-light">Exclusive salon gatherings</p>
              </div>
              <div className="text-center">
                <p className="text-white text-2xl mb-2">✦</p>
                <h4 className="text-white text-sm font-light uppercase tracking-widest mb-1">VIP Treatment</h4>
                <p className="text-slate-200 text-xs font-light">Personal styling & consults</p>
              </div>
            </div>
            
            {/* Bottom Divider */}
            <div className="flex justify-center items-center gap-4 mt-12">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-200" />
              <div className="h-2 w-2 bg-slate-200 rounded-full" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-200" />
            </div>
          </div>
        </div>
      </section>


      <section className="bg-gradient-to-b from-white via-gray-50 to-white py-20 md:py-32 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-100/20 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-0.5 bg-gradient-to-r from-amber-600 to-yellow-500" />
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-black mb-8 leading-tight">
            Discover Luxury Redefined
          </h2>
          
          <p className="text-gray-700 text-lg md:text-xl font-light mb-14 max-w-2xl mx-auto leading-relaxed">
            Experience the collection that celebrates the art of living beautifully, where every detail matters and quality is paramount
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              to="/collection" 
              className="group px-12 py-4 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-amber-600 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-600/50 transform hover:scale-105"
            >
              Shop Exclusively
            </Link>
            <Link 
              to="/collection" 
              className="group px-12 py-4 border-2 border-black text-black text-xs font-semibold uppercase tracking-widest hover:bg-black hover:text-white hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              View Collections
            </Link>
          </div>
          
          <div className="flex justify-center mt-12">
            <div className="w-16 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-600" />
          </div>
        </div>
      </section>

    </div>
  );
}
