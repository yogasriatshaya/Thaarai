import { Link } from 'react-router-dom';
import Newsletter from '../components/Newsletter';
import StatCounter from '../components/StatCounter';

export default function About() {
  return (
    <div className="bg-white min-h-screen animate-fade-in">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-b from-[#aba0e3]/10 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] mb-6" style={{ color: '#aba0e3' }}>
              Our Story
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Welcome to <span className="italic" style={{ color: '#8b7fc0' }}>Aara</span>
              <br />The Designer Studio
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              We're proud to introduce Aara - where style meets tradition, and elegance meets affordability.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="relative group">
              <div className="absolute inset-0 border-2 border-[#aba0e3]/20 -translate-x-6 -translate-y-6 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700 rounded-lg" />
              <div className="relative overflow-hidden rounded-lg shadow-2xl" style={{ aspectRatio: '4/4' }}>
                <img
                  src="/founder-subha.png"
                  alt="Subha Baskaran - Founder"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white border border-gray-100 p-8 shadow-xl rounded-lg">
                <p className="font-serif text-3xl font-bold text-gray-900">Subha Baskaran</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-1" style={{ color: '#aba0e3' }}>Founder & Designer</p>
              </div>
            </div>

            {/* Content */}
            <div className="lg:pl-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Meet The Founder</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-8">
                A Creative Force Driven by
                <span className="italic block" style={{ color: '#8b7fc0' }}>Passion & Innovation</span>
              </h2>
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>
                  Subha Baskaran is a creative force driven by a love for style, innovation, and individuality.
                  With a vision to redefine ethnic fashion, she founded Aara - The Designer Studio.
                </p>
                <p>
                  Drawing inspiration from her journey, culture, and innate creativity, Subha has built
                  a brand that blends traditional aesthetics with contemporary design sensibilities.
                </p>
                <p>
                  Every piece at Aara reflects her commitment to quality craftsmanship and timeless elegance,
                  making designer fashion accessible to all.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#8b7fc0' }}>Our Philosophy</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mt-4">
              More Than Just Apparel
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                ),
                title: 'Best Quality Fabrics',
                desc: 'We source only the finest fabrics to ensure comfort and durability in every piece.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                ),
                title: 'Classy Designs',
                desc: 'Each design is crafted with attention to detail, blending tradition with modern aesthetics.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Affordable Pricing',
                desc: 'Designer fashion shouldn\'t break the bank. We offer premium quality at accessible prices.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center group">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'rgba(171, 160, 227, 0.1)', color: '#aba0e3' }}>
                  {item.icon}
                </div>
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { target: 49, suffix: '+', label: 'Unique Designs' },
              { target: 1000, suffix: '+', label: 'Happy Customers' },
              { target: 100, suffix: '%', label: 'Quality Promise' },
              { target: 24, suffix: '/7', label: 'Customer Support' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-serif text-4xl md:text-5xl font-bold" style={{ color: '#aba0e3' }}>
                  <StatCounter target={stat.target} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-500 mt-2 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#aba0e3]/10 to-[#aba0e3]/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Explore Our Collection?
          </h2>
          <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
            Discover the perfect blend of tradition and modern style. Browse our curated collection of kurtis, maxis, co-ords, and more.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/collection" className="btn-primary px-8 py-4">
              Shop Now
            </Link>
            <Link to="/contact" className="btn-ghost px-8 py-4">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
}
