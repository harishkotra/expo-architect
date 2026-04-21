'use dom';

import React from 'react';

type LivePreviewProps = {
  appName: string;
  backgroundColor: string;
  slug: string;
};

export default function LivePreview({ appName, backgroundColor, slug }: LivePreviewProps) {
  return (
    <div style={styles.stage}>
      <div style={styles.phoneShell}>
        <div style={styles.camera} />
        <div style={{ ...styles.screen, background: backgroundColor }}>
          <div style={styles.logoDot} />
          <p style={styles.name}>{appName}</p>
          <p style={styles.slug}>{slug}</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  stage: {
    width: '100%',
    display: 'grid',
    placeItems: 'center',
    padding: 16,
  },
  phoneShell: {
    width: 300,
    height: 600,
    borderRadius: 44,
    padding: 12,
    background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)',
    boxShadow: '0 22px 50px rgba(15, 23, 42, 0.45)',
    position: 'relative',
  },
  camera: {
    position: 'absolute',
    top: 18,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 88,
    height: 22,
    borderRadius: 999,
    background: '#0A0A0A',
    zIndex: 2,
  },
  screen: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    display: 'grid',
    alignContent: 'center',
    justifyItems: 'center',
    color: '#f8fafc',
    gap: 8,
  },
  logoDot: {
    width: 56,
    height: 56,
    borderRadius: 999,
    background: 'rgba(248, 250, 252, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  },
  name: {
    fontFamily: 'Avenir Next, Spline Sans, sans-serif',
    fontWeight: 700,
    letterSpacing: 0.4,
    fontSize: 28,
    margin: 0,
    textAlign: 'center',
  },
  slug: {
    margin: 0,
    opacity: 0.85,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
};
