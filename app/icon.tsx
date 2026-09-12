import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFFDF9',
          borderRadius: '8px',
          border: '2px solid #2C2724',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            backgroundColor: '#FF6B35',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFDF9',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
          }}
        >
          H
        </div>
      </div>
    ),
    { ...size }
  );
}
