import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import type { QuoteItem, QuoteRecord, TicketRecord } from './types/cotizador';
import { supabase, FALLBACK_QUOTE_ITEMS } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { CotizadorView } from './components/CotizadorView';
import { TicketCenterView } from './components/TicketCenterView';
import { QuoteDocumentModal } from './components/QuoteDocumentModal';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';

export function App() {
  const [activeView, setActiveView] = useState<'cotizador' | 'tickets' | 'admin'>('cotizador');
  const [items, setItems] = useState<QuoteItem[]>(FALLBACK_QUOTE_ITEMS);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [selectedQuoteModal, setSelectedQuoteModal] = useState<QuoteRecord | null>(null);
  const [prefilledQuoteForTicket, setPrefilledQuoteForTicket] = useState<string>('');

  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    try {
      const saved = localStorage.getItem('smartlean_cotizador_admin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const fetchAllData = useCallback(async () => {
    try {
      const [itemsRes, quotesRes, ticketsRes] = await Promise.all([
        supabase.from('smartlean_quote_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('smartlean_quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('smartlean_tickets').select('*').order('created_at', { ascending: false }),
      ]);

      if (itemsRes.data && itemsRes.data.length > 0) {
        setItems(itemsRes.data as QuoteItem[]);
      }
      if (quotesRes.data) {
        setQuotes(quotesRes.data as QuoteRecord[]);
      }
      if (ticketsRes.data) {
        setTickets(ticketsRes.data as TicketRecord[]);
      }
    } catch {
      // Fallback already active
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const hourlyRateCLP =
    items.find((i) => i.id === 'config-hourly-rate')?.price_clp || 25000;

  const handleQuoteGenerated = (newQuote: QuoteRecord) => {
    setQuotes((prev) => [newQuote, ...prev]);
    setSelectedQuoteModal(newQuote);
  };

  const handleTicketCreated = (newTicket: TicketRecord) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  const handleCreateTicketFromQuote = (quoteCode: string) => {
    setSelectedQuoteModal(null);
    setPrefilledQuoteForTicket(quoteCode);
    setActiveView('tickets');
  };

  const handleLoginSuccess = (user: { name: string; email: string; role: string }) => {
    setAdminUser(user);
    localStorage.setItem('smartlean_cotizador_admin', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('smartlean_cotizador_admin');
    setActiveView('cotizador');
  };

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', color: 'var(--text-1)', position: 'relative' }}>
      {/* ── TOP SHIMMER BAR (SMARTLEAN OFFICIAL) ── */}
      <div className="shimmer-bar no-print" />

      {/* ── AMBIENT RADIAL GLOW & GRID OVERLAY ── */}
      <div className="grid-overlay no-print" />
      <div
        className="no-print"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at 50% 0%, #1e3a8a 0%, #0f172a 55%, #0f172a 100%)',
          opacity: 0.72,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── NAVBAR ── */}
      {activeView !== 'admin' && (
        <Navbar
          activeView={activeView}
          setActiveView={setActiveView}
          isAdminLoggedIn={Boolean(adminUser)}
        />
      )}

      {/* ── MAIN VIEWS ── */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        {activeView === 'cotizador' && (
          <CotizadorView
            items={items}
            onQuoteGenerated={handleQuoteGenerated}
            onGoToTickets={() => setActiveView('tickets')}
          />
        )}

        {activeView === 'tickets' && (
          <TicketCenterView
            tickets={tickets}
            quotes={quotes}
            prefilledQuoteCode={prefilledQuoteForTicket}
            onTicketCreated={handleTicketCreated}
            onOpenQuoteModal={(q) => setSelectedQuoteModal(q)}
          />
        )}

        {activeView === 'admin' &&
          (adminUser ? (
            <AdminDashboard
              user={adminUser}
              items={items}
              quotes={quotes}
              tickets={tickets}
              onRefreshData={fetchAllData}
              onOpenQuoteModal={(q) => setSelectedQuoteModal(q)}
              onLogout={handleLogout}
              onSwitchToPublic={() => setActiveView('cotizador')}
            />
          ) : (
            <AdminLogin
              onLoginSuccess={handleLoginSuccess}
              onBackToPublic={() => setActiveView('cotizador')}
            />
          ))}
      </main>

      {/* ── PROPOSAL DOCUMENT MODAL ── */}
      {selectedQuoteModal && (
        <QuoteDocumentModal
          quote={selectedQuoteModal}
          hourlyRateCLP={hourlyRateCLP}
          onClose={() => setSelectedQuoteModal(null)}
          onCreateTicketFromQuote={handleCreateTicketFromQuote}
        />
      )}

      {/* ── FOOTER (IDÉNTICO A SMARTLEAN.CL) ── */}
      {activeView !== 'admin' && (
        <footer
          className="no-print"
          style={{
            borderTop: '1px solid var(--border)',
            padding: '2.5rem 0',
            marginTop: '3rem',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <img
                src="/logo-icon.png"
                alt="Logo"
                style={{ width: 28, height: 28, objectFit: 'contain', filter: 'brightness(0.85)' }}
              />
              <span
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 900,
                  fontSize: '.85rem',
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                Ariel Mella · SmartLean · 2026
              </span>
            </div>
            <p
              style={{
                fontSize: '.72rem',
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
              }}
            >
              Operational Excellence 4.0 → 5.0 · cotiza.smartlean.cl
            </p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a
                href="https://smartlean.cl"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '.72rem',
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  textDecoration: 'none',
                }}
              >
                smartlean.cl
              </a>
              <a
                href="https://www.linkedin.com/in/arielmella/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '.72rem',
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  textDecoration: 'none',
                }}
              >
                LinkedIn
              </a>
              <a
                href="mailto:ariel@smartlean.cl"
                style={{
                  fontSize: '.72rem',
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  textDecoration: 'none',
                }}
              >
                Email
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
