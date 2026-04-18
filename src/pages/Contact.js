import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import AdBanner from '../components/AdBanner';
import toast from 'react-hot-toast';
import { SITE_CONFIG } from '../config/config';

const TOPICS = [
  { value: 'bug', label: '🐛 Bug Report' },
  { value: 'feature', label: '💡 Feature Request' },
  { value: 'business', label: '💼 Business / Partnership' },
  { value: 'other', label: '💬 Other' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', topic: 'bug', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Replace this with your actual form handler (Formspree, EmailJS, etc.)
  // See instructions below the component
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      return toast.error('Please fill in all fields');
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      return toast.error('Please enter a valid email');
    }
    setLoading(true);

    try {
      const res = await fetch('https://formspree.io/f/myklwgpn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      toast.error('Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }

    // ---- PLACEHOLDER (remove when you add real handler) ----
    // setTimeout(() => {
    //   setLoading(false);
    //   setSubmitted(true);
    // }, 1000);
  };

  if (submitted) {
    return (
      <PageLayout title="Contact Us">
        <div style={{ maxWidth: '520px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>✉️</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>Message Sent!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.7 }}>
            Thanks for reaching out, <strong>{form.name}</strong>. We'll get back to you at{' '}
            <strong>{form.email}</strong> as soon as possible.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: 'bug', message: '' }); }}
            style={{
              marginTop: '24px', padding: '12px 24px',
              background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.3)',
              borderRadius: '10px', color: '#ff4d6d', fontWeight: 700, fontSize: '14px',
            }}
          >
            Send Another Message
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Contact Us"
      subtitle="Have a bug report, feature idea, or just want to say hi? We'd love to hear from you."
    >
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px' }}>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '32px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <Field label="Your Name">
              <input value={form.name} onChange={set('name')} placeholder="Khushal" style={inputStyle} />
            </Field>
            <Field label="Email Address">
              <input value={form.email} onChange={set('email')} placeholder="you@example.com" type="email" style={inputStyle} />
            </Field>
          </div>

          <Field label="Topic" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TOPICS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, topic: t.value }))}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    background: form.topic === t.value ? 'rgba(255,77,109,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${form.topic === t.value ? 'rgba(255,77,109,0.35)' : 'var(--border)'}`,
                    color: form.topic === t.value ? '#ff4d6d' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Message" style={{ marginBottom: '24px' }}>
            <textarea
              value={form.message}
              onChange={set('message')}
              placeholder="Describe your issue or idea in detail..."
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </Field>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'rgba(255,77,109,0.4)' : 'linear-gradient(135deg, #ff4d6d, #ff8c42)',
              border: 'none', borderRadius: '12px',
              color: '#fff', fontWeight: 800, fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Sending...' : '📤 Send Message'}
          </button>
        </div>

        {/* <AdBanner slot="inline" style={{ marginTop: '32px' }} /> */}

        {/* Direct contact info */}
        <div style={{
          marginTop: '32px', padding: '20px 24px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border)', borderRadius: '12px',
          display: 'flex', gap: '32px', flexWrap: 'wrap',
        }}>
          <ContactItem label="Email" value={SITE_CONFIG.email} />
          <ContactItem label="Response Time" value="Usually within 48 hours" />
        </div>
      </div>
    </PageLayout>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <label style={{
        display: 'block', fontSize: '11px', fontWeight: 700,
        color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '7px',
      }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

function ContactItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', letterSpacing: '0.06em' }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: '10px', color: 'var(--text)',
  fontSize: '14px', fontFamily: 'var(--font-display)',
  transition: 'border-color 0.2s', outline: 'none',
  boxSizing: 'border-box',
};
