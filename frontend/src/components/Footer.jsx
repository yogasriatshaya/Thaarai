import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const footerSections = [
  {
    title: 'Collections',
    links: [
      { label: 'Kurti', href: '/collection?category=Kurti' },
      { label: 'Maxi', href: '/collection?category=Maxi' },
      { label: 'Co-ords', href: '/collection?category=Co-ords' },
      { label: 'Anarkali', href: '/collection?category=Anarkali' },
      { label: 'New Arrivals', href: '/collection' },
    ],
  },
  {
    title: 'Customer Service',
    links: [
      { label: 'Contact Us', href: '#' },
      { label: 'Shipping & Returns', href: '#' },
      { label: 'Size Guide', href: '#' },
      { label: 'Order Tracking', href: '#' },
      { label: 'FAQ', href: '#' },
    ],
  },
  {
    title: 'About Us',
    links: [
      { label: 'Our Story', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms & Conditions', href: '#' },
      { label: 'Returns + Exchanges', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-white text-gray-800 border-t border-gray-100">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">

          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center mb-6 group">
              <img src={logo} alt="Aara" className="h-12 w-auto object-contain transition-all duration-500 rounded-sm mix-blend-multiply" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6 font-light">
              Style, innovation, and individuality. We blend inspiration from culture and creativity with bold ideas and timeless aesthetics.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 mb-6">
              <p className="text-xs text-gray-500">
                <span className="font-bold">Email:</span> aarathedesignerstudio@gmail.com
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-bold">Phone:</span> +91 8072842781
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-bold">WhatsApp:</span> +91 8300519544
              </p>
            </div>

            {/* Social Placeholder Removed */}
          </div>

          {/* Nav Columns */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-10">
            {footerSections.map(section => (
              <div key={section.title}>
                <h5 className="text-[9px] font-bold uppercase tracking-[0.3em] mb-6 font-serif" style={{ color: '#8b7fc0' }}>
                  {section.title}
                </h5>
                <ul className="space-y-3">
                  {section.links.map(link => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-xs text-gray-500 transition-all duration-300 hover:translate-x-1 inline-block uppercase tracking-widest font-medium"
                        style={{ '--hover-color': '#aba0e3' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#aba0e3'}
                        onMouseLeave={e => e.currentTarget.style.color = ''}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[8px] text-gray-400 uppercase tracking-[0.3em] font-bold">
            © 2026 Aara Luxury E-commerce. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Use', 'Cookie Preferences'].map(item => (
              <Link key={item} to="#" className="text-[8px] text-gray-400 uppercase tracking-[0.2em] transition-colors font-bold"
                style={{ '--hover-color': '#aba0e3' }}
                onMouseEnter={e => e.currentTarget.style.color = '#aba0e3'}
                onMouseLeave={e => e.currentTarget.style.color = ''}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
