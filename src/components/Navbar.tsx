import React, { useState, useEffect } from 'react';
import { Calculator, Ticket, Shield, ArrowUpRight, MessageSquare } from 'lucide-react';

interface NavbarProps {
  activeView: 'cotizador' | 'tickets' | 'admin';
  setActiveView: (v: 'cotizador' | 'tickets' | 'admin') => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView, isAdminLoggedIn }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: scrolled ? '.85rem 2rem' : '1.25rem 2rem',
    background: scrolled ? 'rgba(10,15,28,.88)' : 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,.06)',
    transition: 'all .35s ease',
  };

  return (
    <nav className="no-print" style={navStyle}>
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 0,
        }}
      >
        {/* Brand Logo - Official SmartLean style */}
        <div
          onClick={() => setActiveView('cotizador')}
          style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer' }}
        >
          <img
            src="/logo-icon.png"
            alt="SmartLean Logo"
            style={{ width: 42, height: 42, objectFit: 'contain' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  letterSpacing: '-.04em',
                  textTransform: 'uppercase',
                  display: 'block',
                  lineHeight: 1,
                  color: '#ffffff',
                }}
              >
                SmartLean
              </span>
              <span
                style={{
                  fontSize: '.55rem',
                  fontWeight: 800,
                  letterSpacing: '.12em',
                  padding: '2px 7px',
                  borderRadius: 99,
                  background: 'var(--em-dim)',
                  border: '1px solid var(--border-em)',
                  color: 'var(--sky)',
                  textTransform: 'uppercase',
                }}
              >
                Cotizador
              </span>
            </div>
            <span
              style={{
                fontSize: '.52rem',
                fontWeight: 700,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                display: 'block',
                marginTop: '3px',
              }}
            >
              Operational Excellence 5.0
            </span>
          </div>
        </div>

        {/* Center Navigation Links - SmartLean uppercase minimal style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <button
            onClick={() => setActiveView('cotizador')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '.74rem',
              fontWeight: 800,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: activeView === 'cotizador' ? '#0ea5e9' : 'var(--text-2)',
              transition: 'color .2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calculator size={13} />
            Cotizador
          </button>

          <button
            onClick={() => setActiveView('tickets')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '.74rem',
              fontWeight: 800,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: activeView === 'tickets' ? '#0ea5e9' : 'var(--text-2)',
              transition: 'color .2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Ticket size={13} />
            Ticketera
          </button>

          <button
            onClick={() => setActiveView('admin')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '.74rem',
              fontWeight: 800,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: activeView === 'admin' ? '#0ea5e9' : isAdminLoggedIn ? '#10b981' : 'var(--text-3)',
              transition: 'color .2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Shield size={13} />
            {isAdminLoggedIn ? 'Admin Activo' : 'Admin'}
          </button>
        </div>

        {/* CTA Contact Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
          <a
            href="https://wa.me/56930057769"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ padding: '.65rem 1.4rem', fontSize: '.72rem' }}
          >
            <MessageSquare size={14} />
            Contactar
          </a>
        </div>
      </div>
    </nav>
  );
};
