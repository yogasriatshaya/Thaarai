import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export default function Footer() {
  const { categories } = useShop();

  const footerSections = [
    {
      title: 'Collections',
      links: [
        ...categories.map(cat => ({
          label: cat.name,
          href: `/collection?category=${cat.name}`
        })),
        { label: 'New Arrivals', href: '/collection' },
      ],
    },
    {
      title: 'Customer Service',
      links: [
        { label: 'Contact Us', href: '/contact' },
        { label: 'Shipping & Returns', href: '#' },
        { label: 'Size Guide', href: '#' },
        { label: 'Order Tracking', href: '/track-order' },
        { label: 'FAQ', href: '#' },
      ],
    },
    {
      title: 'About Us',
      links: [
        { label: 'Our Story', href: '/about' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms & Conditions', href: '#' },
        { label: 'Returns + Exchanges', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-white text-gray-800 border-t border-gray-100">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">

          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center mb-6 group">
              <img src="/tharrai-logo.png" alt="Thaarai" className="h-12 w-auto object-contain transition-all duration-500 rounded-sm mix-blend-multiply" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6 font-light">
              Style, innovation, and individuality. We blend inspiration from culture and creativity with bold ideas and timeless aesthetics.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 mb-6">
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-900">Email:</span> support@thaarai.test
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-900">Phone:</span> +91 9000000000
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-900">WhatsApp:</span> +91 90000 00001
              </p>
            </div>
          </div>

          {/* Nav Columns */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-10">
            {footerSections.map(section => (
              <div key={section.title}>
                <h5 className="text-[9px] font-bold uppercase tracking-[0.3em] mb-6 font-serif" style={{ color: '#000000' }}>
                  {section.title}
                </h5>
                <ul className="space-y-3">
                  {section.links.map((link, idx) => (
                    <li key={link.label + idx}>
                      <Link
                        to={link.href}
                        className="text-xs text-gray-500 transition-all duration-300 hover:translate-x-1 inline-block uppercase tracking-widest font-medium hover:text-black"
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
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[8px] text-gray-400 uppercase tracking-[0.3em] font-bold">
            © 2026 Thaarai Luxury E-commerce. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Use', 'Cookie Preferences'].map(item => (
              <Link key={item} to="#" className="text-[8px] text-gray-400 uppercase tracking-[0.2em] transition-colors font-bold hover:text-black">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

