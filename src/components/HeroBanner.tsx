import React from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Globe,
  ShoppingCart,
  Layers,
  Database,
  FileCode,
  ShieldCheck,
  Receipt,
  Zap,
} from 'lucide-react';

interface HeroBannerProps {
  onStartQuote: () => void;
  onGoToTickets: () => void;
}

const nuclearTools = [
  { label: 'Landing & One-Page', color: '#38bdf8', icon: Globe },
  { label: 'Web Corporativa', color: '#60a5fa', icon: Layers },
  { label: 'E-Commerce & Webpay', color: '#34d399', icon: ShoppingCart },
  { label: 'Catálogos Digitales', color: '#fb923c', icon: FileCode },
  { label: 'Facturación SII', color: '#c084fc', icon: Receipt },
  { label: 'Software a Medida', color: '#f472b6', icon: Database },
  { label: 'Garantía 15 Días', color: '#22c55e', icon: ShieldCheck },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ onStartQuote, onGoToTickets }) => {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 28,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.65), 0 0 70px rgba(19, 90, 236, 0.12)',
        marginBottom: '52px',
        background: '#090e1d',
      }}
    >
      {/* ── BACKGROUND IMAGE (INGENIERÍA & OPERACIONES SMARTLEAN) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/img/caso-lean.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          filter: 'brightness(0.38) contrast(1.15)',
          transform: 'scale(1.02)',
        }}
      />

      {/* ── DARK GRADIENT & BLUEPRINT OVERLAY ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(8, 14, 30, 0.85) 0%, rgba(10, 16, 36, 0.94) 55%, rgba(6, 10, 22, 0.98) 100%)',
        }}
      />

      {/* ── TECHNICAL GRID PATTERN OVERLAY ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* ── CENTER AMBIENT RADIAL LIGHT ── */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '650px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      {/* ── HERO BANNER CONTENT (TIPO IMAGEN 2) ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '4.8rem 2rem 3.2rem 2rem',
          textAlign: 'center',
          maxWidth: 1040,
          margin: '0 auto',
        }}
      >
        {/* Top Pill Badge (G1 Impulso / Cotizador Oficial) */}
        <div style={{ marginBottom: '1.6rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.55rem',
              padding: '.42rem 1.25rem',
              borderRadius: 999,
              background: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '.72rem',
              fontWeight: 800,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              boxShadow: '0 0 20px rgba(14, 165, 233, 0.15)',
            }}
          >
            <Sparkles size={12} color="#38bdf8" />
            G1 IMPULSO | Consultoría Estratégica en Software & Soluciones Web a Medida
          </span>
        </div>

        {/* Main Bold Title (Idéntico en tipografía e impacto a Imagen 2) */}
        <h1
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(2.4rem, 5.2vw, 4.4rem)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            color: '#ffffff',
            marginBottom: '1.4rem',
            textShadow: '0 2px 25px rgba(0, 0, 0, 0.6)',
          }}
        >
          Movilizamos tu negocio hacia un desempeño digital superior.
        </h1>

        {/* Centered Descriptive Subtitle with Bold Accents */}
        <p
          style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
            color: '#94a3b8',
            lineHeight: 1.68,
            maxWidth: '780px',
            margin: '0 auto 2.5rem auto',
          }}
        >
          Transformamos tus requerimientos en <strong style={{ color: '#ffffff' }}>plataformas web de alto impacto</strong>,{' '}
          <strong style={{ color: '#ffffff' }}>rentabilidad</strong> y <strong style={{ color: '#ffffff' }}>conversión continua</strong>.
          Cotización transparente en segundos, plazos garantizados y <strong style={{ color: '#38bdf8' }}>15 días de marcha blanca técnica</strong> sin costo.
        </p>

        {/* Action Buttons Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.1rem',
            flexWrap: 'wrap',
            marginBottom: '3rem',
          }}
        >
          <button
            onClick={onStartQuote}
            className="btn-primary"
            style={{
              padding: '1rem 2.4rem',
              fontSize: '.85rem',
              borderRadius: '14px',
              background: 'linear-gradient(90deg, #1d4ed8 0%, #0284c7 100%)',
              boxShadow: '0 6px 28px rgba(29, 78, 216, 0.55)',
            }}
          >
            <span>Iniciar Cotización en Segundos</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onGoToTickets}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.6rem',
              padding: '1rem 2.2rem',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(14px)',
              color: '#f8fafc',
              fontSize: '.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all .25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          >
            <TrendingUp size={16} color="#0ea5e9" />
            <span>Consultar Estado de Ticket</span>
          </button>
        </div>

        {/* ── NUCLEAR TOOLS / SCOPE PILLS (HERRAMIENTAS NUCLEARES) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '.65rem',
            flexWrap: 'wrap',
            marginBottom: '2.5rem',
          }}
        >
          <span
            style={{
              fontSize: '.62rem',
              fontWeight: 800,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: '#64748b',
              marginRight: '.35rem',
            }}
          >
            HERRAMIENTAS NUCLEARES:
          </span>

          {nuclearTools.map((t, idx) => {
            const IconComponent = t.icon;
            return (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.4rem',
                  padding: '.32rem .85rem',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: `1px solid ${t.color}45`,
                  color: '#f1f5f9',
                  fontSize: '.68rem',
                  fontWeight: 700,
                  letterSpacing: '.02em',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <IconComponent size={12} color={t.color} />
                <span>{t.label}</span>
              </span>
            );
          })}
        </div>

        {/* ── BOTTOM TRUST CHECKMARKS ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2.2rem',
            flexWrap: 'wrap',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.76rem', color: '#cbd5e1' }}>
            <CheckCircle2 size={15} color="#22c55e" />
            <span>Tarifario transparente en pesos chilenos (CLP)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.76rem', color: '#cbd5e1' }}>
            <CheckCircle2 size={15} color="#22c55e" />
            <span>15 días corridos de garantía técnica post-entrega</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.76rem', color: '#cbd5e1' }}>
            <CheckCircle2 size={15} color="#22c55e" />
            <span>Arquitectura Cloud React & PostgreSQL Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
};
