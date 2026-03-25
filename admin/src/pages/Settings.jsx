import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import { toast } from 'react-toastify';
import { Save, Mail, ShieldAlert, Globe } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: '',
    smtpConfig: { host: '', port: 587, secure: false, user: '', pass: '', from: '' },
    siteName: '',
    contactEmail: '',
    contactPhone: '',
    currency: 'INR',
    taxPercentage: 0,
    shippingFee: 0,
    socialLinks: { instagram: '', facebook: '', pinterest: '' }
  });
  
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await API.get('/settings');
        if (res.data.success) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put('/settings', settings);
      if (res.data.success) {
        toast.success(res.data.message || 'Settings updated');
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
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test email failed');
    } finally {
      setSendingTest(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <globe size={16} /> },
    { id: 'mail', label: 'Email Configuration', icon: <mail size={16} /> },
    { id: 'maintenance', label: 'Maintenance Mode', icon: <shieldalert size={16} /> },
  ];

  if (loading) return (
    <Layout title="Settings">
      <div className="flex justify-center items-center h-64"><p className="text-gray-400">Loading settings...</p></div>
    </Layout>
  );

  return (
    <layout title="Settings">
      <div className="flex gap-6 items-start">
        {/* Sidebar Tabs */}
        <div className="w-64 flex flex-col gap-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded text-xs font-sans tracking-wider uppercase transition-all
                ${activeTab === t.id ? 'bg-charcoal text-white font-medium' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-charcoal'}`}>
              {t.id === 'general' && <Globe size={16} />}
              {t.id === 'mail' && <Mail size={16} />}
              {t.id === 'maintenance' && <ShieldAlert size={16} />}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 card p-6 font-sans">
          <form onSubmit={handleSave} className="space-y-6">
            
            {activeTab === 'general' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-serif text-lg text-charcoal border-b pb-2 mb-4">General Configuration</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">Website Title</label>
                    <input type="text" value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} className="input-field" placeholder="Thaarai Designers" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Currency Code</label>
                    <input type="text" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} className="input-field" placeholder="INR" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Support Email</label>
                    <input type="email" value={settings.contactEmail} onChange={e => setSettings({...settings, contactEmail: e.target.value})} className="input-field" placeholder="support@thaarai.test" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Support Phone</label>
                    <input type="text" value={settings.contactPhone} onChange={e => setSettings({...settings, contactPhone: e.target.value})} className="input-field" placeholder="+91 90000 00000" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Shipping Fee (₹)</label>
                    <input type="number" value={settings.shippingFee} onChange={e => setSettings({...settings, shippingFee: Number(e.target.value)})} className="input-field" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Tax Percentage (%)</label>
                    <input type="number" value={settings.taxPercentage} onChange={e => setSettings({...settings, taxPercentage: Number(e.target.value)})} className="input-field" placeholder="0" />
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
                    <input type="number" value={settings.smtpConfig?.port || 587} onChange={e => setSettings({...settings, smtpConfig: {...settings.smtpConfig, port: Number(e.target.value)}})} className="input-field" placeholder="587" />
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

                {/* Test Email Verification */}
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
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save size={16} /> Update Details
              </button>
            </div>

          </form>
        </div>
      </div>
    </layout>
  );
}
