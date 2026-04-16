import React from 'react';

// Replace data-ad-client and data-ad-slot with your real AdSense values
// Also uncomment the script tag in public/index.html

const AdBanner = ({ slot = 'top', style = {} }) => {
  const sizes = {
    top: { width: '100%', height: '90px', label: 'Leaderboard Ad (728×90)' },
    sidebar: { width: '300px', height: '250px', label: 'Medium Rectangle (300×250)' },
    bottom: { width: '100%', height: '90px', label: 'Leaderboard Ad (728×90)' },
    inline: { width: '100%', height: '100px', label: 'Banner Ad (468×60)' },
  };

  const size = sizes[slot] || sizes.top;

  // In production, replace this div with the actual AdSense <ins> tag:
  // <ins className="adsbygoogle"
  //   style={{ display: 'block' }}
  //   data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  //   data-ad-slot="XXXXXXXXXX"
  //   data-ad-format="auto"
  //   data-full-width-responsive="true" />

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px dashed rgba(255,255,255,0.12)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.25)',
        fontSize: '11px',
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
        width: size.width,
        minHeight: size.height,
        margin: '0 auto',
        ...style,
      }}
    >
      {size.label} — AdSense
    </div>
  );
};

export default AdBanner;
