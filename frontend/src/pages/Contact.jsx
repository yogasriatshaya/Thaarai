import { useState } from 'react';
import { toast } from 'react-toastify';
import Newsletter from '../components/Newsletter';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="bg-white min-h-screen animate-fade-in">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-[#aba0e3]/10 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] mb-6" style={{ color: '#8b7fc0' }}>
              Get In Touch
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              We'd Love to <span className="italic" style={{ color: '#aba0e3' }}>Hear</span> From You
            </h1>
            <p className="text-gray-600 text-lg">
              Have questions about our products or need assistance? Reach out to us anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                Contact Information
              </h2>

              <div className="space-y-8">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(171, 160, 227, 0.1)' }}>
                    <svg className="w-5 h-5" style={{ color: '#aba0e3' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Email Us</h3>
                    <a href="mailto:aarathedesignerstudio@gmail.com" className="text-gray-600 hover:text-[#8b7fc0] transition-colors">
                      aarathedesignerstudio@gmail.com
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(171, 160, 227, 0.1)' }}>
                    <svg className="w-5 h-5" style={{ color: '#aba0e3' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Call Us</h3>
                    <a href="tel:+918072842781" className="text-gray-600 hover:text-[#aba0e3] transition-colors">
                      +91 80728 42781
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(171, 160, 227, 0.1)' }}>
                    <svg className="w-5 h-5" style={{ color: '#aba0e3' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">WhatsApp</h3>
                    <a href="https://wa.me/918072842781" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#aba0e3] transition-colors">
                      Chat with us on WhatsApp
                    </a>
                  </div>
                </div>

                {/* Social Media */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(171, 160, 227, 0.1)' }}>
                    <svg className="w-5 h-5" style={{ color: '#aba0e3' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Follow Us</h3>
                    <a href="https://instagram.com/aara_thedesignerstudio" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#8b7fc0] transition-colors">
                      @aara_thedesignerstudio
                    </a>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="mt-12 p-6 bg-gray-100 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-4">Business Hours</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Saturday</span>
                    <span className="font-medium text-gray-900">10:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium text-gray-900">11:00 AM - 6:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-100 p-8 md:p-10 rounded-2xl">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Send Us a Message
              </h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#aba0e3] transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#aba0e3] transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#aba0e3] transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#aba0e3] transition-colors bg-white"
                    >
                      <option value="">Select a subject</option>
                      <option value="product">Product Inquiry</option>
                      <option value="order">Order Status</option>
                      <option value="return">Returns & Exchange</option>
                      <option value="custom">Custom Order</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Your Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#aba0e3] transition-colors resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-300 disabled:opacity-50"
                  style={{ backgroundColor: '#aba0e3', color: 'white' }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#9a8fd2')}
                  onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#aba0e3')}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#8b7fc0' }}>FAQ</span>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mt-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'What are your shipping options?',
                a: 'We offer free shipping on orders over ₹500. Standard delivery takes 5-7 business days, and express delivery is available for an additional charge.',
              },
              {
                q: 'What is your return policy?',
                a: 'We offer a 14-day return policy for all unused items with original tags. Exchanges are accepted within 30 days of purchase.',
              },
              {
                q: 'Do you offer custom orders?',
                a: 'Yes! We accept custom orders for special occasions. Please contact us with your requirements and we\'ll be happy to assist.',
              },
              {
                q: 'How can I track my order?',
                a: 'Once your order is shipped, you\'ll receive a tracking link via email and SMS. You can also track your order from the "My Orders" section.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
}
