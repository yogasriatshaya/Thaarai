import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import { toast } from 'react-toastify';
import { Save, Mail, ShieldAlert, Globe } from 'lucide-react';

const DEFAULT_COUNTRY_CONFIG = {
  IN: {
    currency: 'INR', currencySymbol: '₹', taxName: 'GST', taxPercentage: 18,
    taxInclusive: false, shippingFee: 0, freeShippingThreshold: 500, codAvailable: true, paymentGateway: 'razorpay'
  },
  US: {
    currency: 'USD', currencySymbol: '$', taxName: 'Sales Tax', taxPercentage: 0,
    taxInclusive: false, shippingFee: 10, freeShippingThreshold: 50, codAvailable: false, paymentGateway: 'stripe'
  }
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: '',
    smtpConfig: { host: '', port: 465, secure: true, user: '', pass: '', from: '' },
    siteName: '',
    contactEmail: '',
    contactPhone: '',
    defaultCountry: 'IN',
    returnWindowDays: 7,
    countryConfig: DEFAULT_COUNTRY_CONFIG,
    socialLinks: { instagram: '', facebook: '', pinterest: '' },
    notifications: {
      adminNotificationEmail: '',
      orderConfirmation: true,
      returnRequest: true,
      lowStockAlert: true,
      dailyReport: false
    }
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await API.get('/settings');
        if (res.data.success) {
          const s = res.data.settings;
          const merged = {
            ...s,
            countryConfig: {
              IN: { ...DEFAULT_COUNTRY_CONFIG.IN, ...(s.countryConfig?.IN || {}) },
              US: { ...DEFAULT_COUNTRY_CONFIG.US, ...(s.countryConfig?.US || {}) }
            },
            notifications: {
              adminNotificationEmail: '',
              orderConfirmation: true,
              returnRequest: true,
              lowStockAlert: true,
              dailyReport: false,
              ...(s.notifications || {})
            }
          };
          setSettings(merged);
          setOriginalSettings(JSON.stringify(merged));
        }
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const isDirty = originalSettings !== JSON.stringify(settings);

  const switchTab = (tabId) => {
    if (isDirty) {
      toast.warning('Please click "Update Details" to save your changes before switching tabs.');
      return;
    }
    setActiveTab(tabId);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await API.put('/settings', settings);
      if (res.data.success) {
        toast.success(res.data.message || 'Settings updated');
        setOriginalSettings(JSON.stringify(settings));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) return toast.warning('Enter an email address to test');
    setSendingTest(true);
    try {
      const res = await API.post('/settings/test-email', { to: testEmail });
      if (res.data.success) toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test email failed');
    } finally { setSendingTest(false); }
  };

  const updateCountryConfig = (countryCode, field, value) => {
    setSettings(prev => ({
      ...prev,
      countryConfig: {
        ...prev.countryConfig,
        [countryCode]: {
          ...prev.countryConfig[countryCode],
          [field]: value
        }
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Save size={16} /> },
    { id: 'regional', label: 'Regional & Tax', icon: <Globe size={16} /> },
    { id: 'mail', label: 'Email Configuration', icon: <Mail size={16} /> },
    { id: 'maintenance', label: 'Maintenance Mode', icon: <ShieldAlert size={16} /> },
  ];

  if (loading) return (
    <Layout title="Settings">
      <div className="flex justify-center items-center h-64"><p className="text-gray-400">Loading settings...</p></div>
    </Layout>
  );

  const renderCountryConfigPanel = (code, label, flag) => {
    const config = settings.countryConfig?.[code] || {};
    return (
      <div className="border border-gray-100 rounded-lg p-5 space-y-4 bg-gray-50/30">
        <div className="flex items-center gap-2 border-b pb-3">
          <span className="text-xl">{flag}</span>
          <h4 className="font-serif text-sm font-bold text-charcoal">{label}</h4>
          <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">{config.currency || code}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-gray-400 mb-1">Tax Name</label>
            <input type="text" value={config.taxName || ''} onChange={e => updateCountryConfig(code, 'taxName', e.target.value)} className="input-field" placeholder="GST / Sales Tax" />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Tax Rate (%)</label>
            <input type="number" step="0.01" value={config.taxPercentage ?? ''} onChange={e => updateCountryConfig(code, 'taxPercentage', e.target.value)} className="input-field" placeholder="18" />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Shipping Fee ({config.currencySymbol})</label>
            <input type="number" value={config.shippingFee ?? ''} onChange={e => updateCountryConfig(code, 'shippingFee', e.target.value)} className="input-field" placeholder="0" />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Free Shipping Above ({config.currencySymbol})</label>
            <input type="number" value={config.freeShippingThreshold ?? ''} onChange={e => updateCountryConfig(code, 'freeShippingThreshold', e.target.value)} className="input-field" placeholder="500" />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-gray-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.taxInclusive || false} onChange={e => updateCountryConfig(code, 'taxInclusive', e.target.checked)} className="accent-gold-600 rounded" />
            <span className="text-gray-600">Prices include tax</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.codAvailable || false} onChange={e => updateCountryConfig(code, 'codAvailable', e.target.checked)} className="accent-gold-600 rounded" />
            <span className="text-gray-600">COD Available</span>
          </label>
          <div className="flex items-center gap-2 text-gray-400">
            <span>Payment:</span>
            <span className="font-bold text-charcoal">{config.paymentGateway || 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Settings">
      <div className="flex flex-col gap-6">
        {/* Top Tabs Navigation */}
        <div className="bg-white flex border-b border-gray-100 rounded-lg shadow-sm overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button 
              key={t.id} 
              onClick={() => switchTab(t.id)}
              className={`flex items-center gap-2 px-8 py-4 text-[10px] sm:text-xs font-sans tracking-[0.2em] uppercase transition-all border-b-2 whitespace-nowrap
                ${activeTab === t.id 
                  ? 'border-gold-600 text-charcoal font-bold bg-gold-50/20' 
                  : 'border-transparent text-gray-400 hover:text-charcoal hover:bg-gray-50'}`}
            >
              <span className={activeTab === t.id ? 'text-gold-600' : ''}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="card p-8 animate-fade-in min-h-[500px]">
          <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
            
            {activeTab === 'general' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-serif text-lg text-charcoal border-b pb-2 mb-4">General Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">Website Title</label>
                    <input type="text" value={settings.siteName || ''} onChange={e => setSettings({...settings, siteName: e.target.value})} className="input-field" placeholder="Thaarai Designers" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Default Country</label>
                    <select value={settings.defaultCountry || 'IN'} onChange={e => setSettings({...settings, defaultCountry: e.target.value})} className="input-field">
                      <option value="IN">🇮🇳 India</option>
                      <option value="US">🇺🇸 United States</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Support Email</label>
                    <input type="email" value={settings.contactEmail || ''} onChange={e => setSettings({...settings, contactEmail: e.target.value})} className="input-field" placeholder="support@thaarai.test" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Support Phone</label>
                    <input type="text" value={settings.contactPhone || ''} onChange={e => setSettings({...settings, contactPhone: e.target.value})} className="input-field" placeholder="+91 90000 00000" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Return Window (Days)</label>
                    <input type="number" min="0" value={settings.returnWindowDays ?? ''} onChange={e => setSettings({...settings, returnWindowDays: e.target.value})} className="input-field" placeholder="7" />
                  </div>
                </div>
                
                <h4 className="font-serif text-charcoal mt-6 border-b pb-1">Social Links</h4>
                <div className="grid grid-cols-1 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-400 mb-1">Instagram Profile URL</label>
                      <input type="text" value={settings.socialLinks?.instagram || ''} onChange={e => setSettings({...settings, socialLinks: {...settings.socialLinks, instagram: e.target.value}})} className="input-field" placeholder="https://instagram.com/thaarai" />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Facebook Page URL</label>
                      <input type="text" value={settings.socialLinks?.facebook || ''} onChange={e => setSettings({...settings, socialLinks: {...settings.socialLinks, facebook: e.target.value}})} className="input-field" placeholder="https://facebook.com/thaarai" />
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'regional' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="font-serif text-lg text-charcoal border-b pb-2 mb-4">Regional Pricing & Tax Configuration</h3>
                <p className="text-xs text-gray-400 -mt-2">Configure tax rates, shipping fees, and payment options for each country. These settings control how prices, taxes, and checkout options appear to customers in each region.</p>
                {renderCountryConfigPanel('IN', 'India', '🇮🇳')}
                {renderCountryConfigPanel('US', 'United States', '🇺🇸')}
              </div>
            )}

            {activeTab === 'mail' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-serif text-lg text-charcoal border-b pb-2 mb-4">Email Setup (SMTP)</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">SMTP Host</label>
                    <input type="text" value={settings.smtpConfig?.host || ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, host: e.target.value}})} className="input-field" placeholder="smtp.mailtrap.io" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">SMTP Port</label>
                    <input type="number" value={settings.smtpConfig?.port ?? ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, port: e.target.value}})} className="input-field" placeholder="465" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Auth Username</label>
                    <input type="text" value={settings.smtpConfig?.user || ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, user: e.target.value}})} className="input-field" placeholder="smtp_user" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Auth Password</label>
                    <input type="password" value={settings.smtpConfig?.pass || ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, pass: e.target.value}})} className="input-field" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">From Sender Address</label>
                    <input type="email" value={settings.smtpConfig?.from || ''} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, from: e.target.value}})} className="input-field" placeholder="no-reply@test.com" />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input type="checkbox" checked={settings.smtpConfig?.secure} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, secure: e.target.checked}})} className="rounded border-gray-300" id="secure" />
                    <label htmlFor="secure" className="text-gray-500 font-medium">Use Secure (SSL/TLS fully required ports: 465)</label>
                  </div>
                </div>

                {/* Email Notification Toggles */}
                <div className="border-t pt-6 mt-8">
                  <h3 className="font-serif text-sm text-charcoal mb-4 uppercase tracking-wider">Email Notification Presets</h3>
                  
                  <div className="mb-6">
                    <label className="block text-[10px] text-gray-400 uppercase mb-1 tracking-wider">Admin Notification Receiver Email</label>
                    <input 
                      type="email" 
                      value={settings.notifications?.adminNotificationEmail || ''} 
                      onChange={e => setSettings({...settings, notifications: {...settings.notifications, adminNotificationEmail: e.target.value}})} 
                      className="input-field max-w-sm" 
                      placeholder="admin-alerts@thaarai.test" 
                    />
                    <p className="text-[10px] text-gray-400 mt-1 italic">This email will receive all system alerts, daily reports, and order notifications.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                     <label className="flex items-center justify-between p-3 border border-gray-100 rounded hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="flex flex-col">
                           <span className="font-bold text-gray-700">Order & Confirmation</span>
                           <span className="text-[10px] text-gray-400">Send mail on order placement and shipping updates</span>
                        </div>
                        <input type="checkbox" 
                          checked={settings.notifications?.orderConfirmation ?? true} 
                          onChange={e => setSettings({...settings, notifications: {...settings.notifications, orderConfirmation: e.target.checked}})} 
                          className="w-4 h-4 accent-gold-600 rounded" />
                     </label>

                     <label className="flex items-center justify-between p-3 border border-gray-100 rounded hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="flex flex-col">
                           <span className="font-bold text-gray-700">Return & Requests</span>
                           <span className="text-[10px] text-gray-400">Receive alert when customer requests a product return</span>
                        </div>
                        <input type="checkbox" 
                          checked={settings.notifications?.returnRequest ?? true} 
                          onChange={e => setSettings({...settings, notifications: {...settings.notifications, returnRequest: e.target.checked}})} 
                          className="w-4 h-4 accent-gold-600 rounded" />
                     </label>

                     <label className="flex items-center justify-between p-3 border border-gray-100 rounded hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="flex flex-col">
                           <span className="font-bold text-gray-700">Low Stock Alarms</span>
                           <span className="text-[10px] text-gray-400">Inventory alerts when products are low or out of stock</span>
                        </div>
                        <input type="checkbox" 
                          checked={settings.notifications?.lowStockAlert ?? true} 
                          onChange={e => setSettings({...settings, notifications: {...settings.notifications, lowStockAlert: e.target.checked}})} 
                          className="w-4 h-4 accent-gold-600 rounded" />
                     </label>

                     <label className="flex items-center justify-between p-3 border border-gray-100 rounded hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="flex flex-col">
                           <span className="font-bold text-gray-700">Daily Sales Summary</span>
                           <span className="text-[10px] text-gray-400">Receive automated daily summary of sales and visitor traffic</span>
                        </div>
                        <input type="checkbox" 
                          checked={settings.notifications?.dailyReport ?? false} 
                          onChange={e => setSettings({...settings, notifications: {...settings.notifications, dailyReport: e.target.checked}})} 
                          className="w-4 h-4 accent-gold-600 rounded" />
                     </label>
                  </div>
                </div>

                {/* Test Email */}
                <div className="border-t pt-4 mt-8">
                  <h4 className="font-serif text-sm text-charcoal mb-2">Trigger Test Delivery</h4>
                  <div className="flex gap-2 text-xs">
                    <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} className="input-field flex-1" placeholder="Enter recipient email to verify connection" />
                    <button type="button" onClick={handleSendTestEmail} disabled={sendingTest}
                       className="btn-outline flex items-center justify-center min-w-[120px]">
                      {sendingTest ? 'Sending...' : 'Send Test Address'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-serif text-lg text-charcoal border-b pb-2 mb-4">Maintenance Mode Diagnostics</h3>
                <div className="flex items-center gap-3 bg-red-50 p-4 border border-red-100 rounded">
                  <input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} className="scale-125" id="maintenance" />
                  <div>
                    <label htmlFor="maintenance" className="text-sm font-bold text-red-800">Enable Maintenance Lockout Mode</label>
                    <p className="text-xs text-red-600 mt-0.5">Activating this will redirect all customer traffic downwards to maintenance status layouts.</p>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <label className="block text-gray-400">Offline Access Blocked Screen Message</label>
                  <textarea rows={4} value={settings.maintenanceMessage} onChange={e => setSettings({...settings, maintenanceMessage: e.target.value})} className="input-field" placeholder="Maintenance message content" />
                </div>
              </div>
            )}

            <div className="border-t pt-4 flex justify-end">
               <div className="flex items-center gap-4">
                  {isDirty && (
                    <span className="text-[10px] text-gold-600 font-bold uppercase tracking-widest animate-pulse flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-gold-600 rounded-full"></span>
                       Unsaved Changes
                    </span>
                  )}
                  <button type="submit" className="btn-primary flex items-center gap-2 px-6">
                    <Save size={16} /> Update Details
                  </button>
               </div>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
}
