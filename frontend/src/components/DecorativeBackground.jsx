import React from 'react';

export default function DecorativeBackground({ children, variant = 'default' }) {
  return (
    <div className="bg-decorative min-h-screen">
      {/* Paw prints */}
      {variant === 'paws' && (
        <div className="paw-prints">
          <div className="paw-print">🐾</div>
          <div className="paw-print">🐾</div>
          <div className="paw-print">🐾</div>
          <div className="paw-print">🐾</div>
          <div className="paw-print">🐾</div>
          <div className="paw-print">🐾</div>
        </div>
      )}

      {/* Bones */}
      {variant === 'bones' && (
        <div className="bone-pattern">
          <div className="bone"></div>
          <div className="bone"></div>
          <div className="bone"></div>
          <div className="bone"></div>
        </div>
      )}

      {/* Circles */}
      {variant === 'circles' && (
        <div className="circle-pattern">
          <div className="circle"></div>
          <div className="circle"></div>
          <div className="circle"></div>
          <div className="circle"></div>
        </div>
      )}

      {/* Mixed - default */}
      {variant === 'default' && (
        <>
          <div className="paw-prints">
            <div className="paw-print">🐾</div>
            <div className="paw-print">🐾</div>
            <div className="paw-print">🐾</div>
          </div>
          <div className="circle-pattern">
            <div className="circle"></div>
            <div className="circle"></div>
          </div>
        </>
      )}

      {/* Content */}
      {children}
    </div>
  );
}
