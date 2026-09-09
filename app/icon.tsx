import { ImageResponse } from 'next/og';

export const size = {
  width: 64,
  height: 64,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070b14',
          borderRadius: '16px',
          border: '1.5px solid #00f5c4',
          position: 'relative',
          padding: '4px',
          boxSizing: 'border-box',
        }}
      >
        {/* QR Pattern Representation */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            position: 'relative',
          }}
        >
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '3px' }}>
            <div style={{ width: '12px', height: '12px', border: '2.5px solid #ffffff', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '4px', height: '4px', backgroundColor: '#00f5c4' }} />
            </div>
            <div style={{ width: '12px', height: '12px', border: '2.5px solid #ffffff', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '4px', height: '4px', backgroundColor: '#00f5c4' }} />
            </div>
          </div>

          {/* Glowing laser scan line */}
          <div
            style={{
              width: '100%',
              height: '2.5px',
              backgroundColor: '#00f5c4',
              boxShadow: '0 0 8px #00f5c4',
              margin: '1px 0',
            }}
          />

          {/* Bottom row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '3px' }}>
            <div style={{ width: '12px', height: '12px', border: '2.5px solid #ffffff', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '4px', height: '4px', backgroundColor: '#00f5c4' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div style={{ width: '4px', height: '4px', backgroundColor: '#ffffff', borderRadius: '1px' }} />
                <div style={{ width: '4px', height: '4px', backgroundColor: '#00f5c4', borderRadius: '1px' }} />
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div style={{ width: '4px', height: '4px', backgroundColor: '#00f5c4', borderRadius: '1px' }} />
                <div style={{ width: '4px', height: '4px', backgroundColor: '#ffffff', borderRadius: '1px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Text at bottom */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px',
            fontSize: '9px',
            fontWeight: 900,
            marginTop: '2px',
            letterSpacing: '-0.5px',
          }}
        >
          <span style={{ color: '#ffffff' }}>QR-</span>
          <span style={{ color: '#00f5c4' }}>code</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
