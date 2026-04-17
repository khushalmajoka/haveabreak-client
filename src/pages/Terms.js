import React from 'react';
import PageLayout from '../components/PageLayout';
import { SITE_CONFIG } from '../config/config';

const LAST_UPDATED = 'January 1, 2025';

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content: [
      `By accessing or using ${SITE_CONFIG.app_name_without_space} ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.`,
      `We reserve the right to update these terms at any time. Continued use of ${SITE_CONFIG.app_name_without_space} after changes constitutes acceptance of the revised terms.`,
    ],
  },
  {
    title: 'Use of the Service',
    content: [
      `${SITE_CONFIG.app_name_without_space} is provided for entertainment purposes. You may use the Service for personal, non-commercial use only.`,
      `You agree not to use the Service to harass, abuse, or harm other players; to cheat, exploit bugs, or use automated tools to gain an unfair advantage; to attempt to disrupt, overload, or compromise the security of our servers; or to use the Service for any illegal activity.`,
      `We reserve the right to terminate access for any user who violates these terms.`,
    ],
  },
  {
    title: 'Player Conduct',
    content: [
      'You are responsible for the display name you choose when joining a game. Display names that are offensive, impersonating, or violating any applicable law are prohibited.',
      `${SITE_CONFIG.app_name_without_space} is a public platform. Do not share personal information about yourself or others in game rooms.`,
      `Play fair. Using external tools, scripts, or exploits to gain an advantage over other players is strictly prohibited.`,
    ],
  },
  {
    title: 'Intellectual Property',
    content: [
      `All content on ${SITE_CONFIG.app_name_without_space} — including but not limited to the logo, design, code, and game mechanics — is the property of ${SITE_CONFIG.app_name_without_space} and is protected by applicable intellectual property laws.`,
      `You may not copy, reproduce, distribute, or create derivative works from any part of the Service without prior written permission.`,
    ],
  },
  {
    title: 'Disclaimer of Warranties',
    content: [
      `${SITE_CONFIG.app_name_without_space} is provided "as is" and "as available" without warranties of any kind, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or free of bugs.`,
      `We are not responsible for any data loss, including game progress or room data, which is stored temporarily and may be lost due to server restarts or maintenance.`,
    ],
  },
  {
    title: 'Limitation of Liability',
    content: [
      `To the fullest extent permitted by law, ${SITE_CONFIG.app_name_without_space} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service.`,
      `Our total liability for any claims arising from use of the Service is limited to INR 0, as the Service is provided free of charge.`,
    ],
  },
  {
    title: 'Third-Party Advertising',
    content: [
      `${SITE_CONFIG.app_name_without_space} may display advertisements from third-party networks including Google AdSense. These advertisers operate under their own terms and privacy policies, which are separate from ours.`,
      `We are not responsible for the content of third-party advertisements displayed on the Service.`,
    ],
  },
  {
    title: 'Governing Law',
    content: [
      `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in India.`,
    ],
  },
  {
    title: 'Contact',
    content: [
      `For questions about these Terms of Service, contact us at: ${SITE_CONFIG.email}`,
    ],
  },
];

export default function Terms() {
  return (
    <PageLayout
      title="Terms of Service"
      subtitle={`Last updated: ${LAST_UPDATED}`}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Summary banner */}
        <div style={{
          background: 'rgba(124,58,237,0.07)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '40px',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>📋</span>
          <p style={{ color: 'rgba(167,139,250,0.9)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
            <strong>Short version:</strong> Use ${SITE_CONFIG.app_name_without_space} fairly and legally.
            Don't cheat, harass, or exploit bugs. The service is free and provided as-is.
            We may update these terms at any time.
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
