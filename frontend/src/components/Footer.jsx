import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpg';

const footerSections = [
  {
    title: 'Collections',
    links: [
      { label: 'Couture', href: '/collection?category=Couture' },
      { label: 'Handbags', href: '/collection?category=Handbags' },
      { label: 'Silk Scarves', href: '/collection?category=Silk+Scarves' },
      { label: 'Heritage', href: '/collection?category=Heritage' },
      { label: 'New Arrivals', href: '/collection' },
    ],
  },
  {
    title: 'Client Services',
    links: [
      { label: 'Contact Us', href: '#' },
      { label: 'Shipping & Returns', href: '#' },
      { label: 'Size Guide', href: '#' },
      { label: 'Care Instructions', href: '#' },
      { label: 'FAQ', href: '#' },
    ],
  },
  {
    title: 'The Maison',
    links: [
      { label: 'Our Story', href: '#' },
      { label: 'Sustainability', href: '#' },
      { label: 'The Atelier', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Careers', href: '#' },
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
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <img src={logo} alt="Thaarai" className="h-10 w-auto object-contain transition-all duration-500 rounded-sm" />
              <div>
                <span className="font-serif text-xl font-bold tracking-tight text-gray-900 block leading-none">THAARAI</span>
                <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-blue-600">Atelier de Luxe</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-8 font-light">
              Redefining luxury through artisanal craftsmanship and timeless design. Every piece is a testament to the pursuit of perfection.
            </p>
            {/* Social */}
            <div className="flex gap-2">
              {['In', 'Tw', 'Pt', 'Fb'].map((s, i) => (
                <a key={i} href="#"
                  className="w-10 h-10 border border-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-400 hover:border-blue-600/30 hover:text-blue-600 hover:bg-gray-50 transition-all duration-500 rounded-xl">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Nav Columns */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-10">
            {footerSections.map(section => (
              <div key={section.title}>
                <h5 className="text-[9px] font-bold uppercase tracking-[0.3em] text-blue-600 mb-6 font-serif">
                  {section.title}
                </h5>
                <ul className="space-y-3">
                  {section.links.map(link => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-xs text-gray-500 hover:text-blue-600 transition-all duration-300 hover:translate-x-1 inline-block uppercase tracking-widest font-medium"
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
            © 2025 Thaarai Atelier. Crafted for Distinction.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Use', 'Cookie Preferences'].map(item => (
              <Link key={item} to="#" className="text-[8px] text-gray-400 hover:text-blue-600 uppercase tracking-[0.2em] transition-colors font-bold">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
