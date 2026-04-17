import React from 'react';
import PageLayout from '../components/PageLayout';
import { SITE_CONFIG } from '../config/config';

const LAST_UPDATED = 'January 1, 2025';

const SECTIONS = [
  {
    title: 'Information We Collect',
    content: [
      `${SITE_CONFIG.app_name_without_space} does not require you to create an account. You provide a display name when joining a game room — this name is temporary and is only used for the duration of your game session.`,
      'We do not collect, store, or process any personally identifiable information such as your real name, email address, or phone number during normal gameplay.',
      'Your browser may store a randomly generated player ID in localStorage to maintain session continuity. This ID does not identify you personally and is not transmitted to any third party.',
    ],
  },
  {
    title: 'Cookies and Local Storage',
    content: [
      `We use localStorage (a browser storage mechanism) to remember your session player ID so you remain connected when navigating between pages. No cookies are set by ${SITE_CONFIG.app_name_without_space} itself.`,
      'Third-party advertising services (such as Google AdSense) may set their own cookies on your device when displaying ads. These cookies are governed by the respective third-party privacy policies. You can opt out of personalized advertising via Google\'s Ad Settings.',
    ],
  },
  {
    title: 'Advertising',
    content: [
      `${SITE_CONFIG.app_name_without_space} may display advertisements served by Google AdSense and similar advertising networks. These services may use cookies and similar tracking technologies to serve personalized ads based on your browsing behavior.`,
      'We do not share any personally identifiable information with advertisers.',
      'To opt out of personalized advertising, visit: https://www.google.com/settings/ads',
    ],
  },
  {
    title: 'Data Storage',
    content: [
      `${SITE_CONFIG.app_name_without_space} room data (room codes, player names, game state) is stored temporarily on our servers and is automatically deleted within 24 hours of creation.`,
      'We do not maintain long-term databases of player activity, game history, or usage patterns linked to individual users.',
    ],
  },
  {
    title: 'Third-Party Services',
    content: [
      'Our servers are hosted on third-party cloud infrastructure. These providers have their own privacy policies and security practices.',
      'We do not sell, trade, or otherwise transfer your information to third parties beyond what is necessary to operate the service.',
    ],
  },
  {
    title: 'Children\'s Privacy',
    content: [
      `${SITE_CONFIG.app_name_without_space} is intended for general audiences. We do not knowingly collect personal information from children under 13. If you believe a child has provided personal information through our service, please contact us and we will promptly delete it.`,
    ],
  },
  {
    title: 'Changes to This Policy',
    content: [
      `We may update this Privacy Policy from time to time. Changes will be reflected by the "Last Updated" date at the top of this page. Continued use of ${SITE_CONFIG.app_name_without_space} after changes constitutes acceptance of the updated policy.`,
    ],
  },
  {
    title: 'Contact Us',
    content: [
      `If you have questions about this Privacy Policy, please contact us at: ${SITE_CONFIG.email}`,
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <PageLayout
      title="Privacy Policy"
      subtitle={`Last updated: ${LAST_UPDATED}`}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Intro banner */}
        <div style={{
          background: 'rgba(34,211,160,0.07)',
          border: '1px solid rgba(34,211,160,0.2)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '40px',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>🛡️</span>
          <p style={{ color: 'rgba(34,211,160,0.9)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
            <strong>Short version:</strong> {SITE_CONFIG.app_name_without_space} does not require account creation.
            We collect no personal data during gameplay. Third-party ads may use cookies.
            Room data auto-deletes within 24 hours.
          </p>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: '36px' }}>
            <h2 style={{
              fontSize: '16px', fontWeight: 700, marginBottom: '12px',
              color: '#f0f0f5', letterSpacing: '-0.01em',
            }}>
              {section.title}
            </h2>
            {section.content.map((para, i) => (
              <p key={i} style={{
                color: 'var(--text-muted)', fontSize: '14px',
                lineHeight: 1.8, marginBottom: '10px',
              }}>
                {para}
              </p>
            ))}
            <div style={{ borderBottom: '1px solid var(--border)', marginTop: '20px' }} />
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
