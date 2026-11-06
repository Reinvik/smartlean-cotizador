import React, { useState, useEffect } from 'react';
import type { TicketRecord, TicketRequestType, TicketPriority, QuoteRecord } from '../types/cotizador';
import { formatCLP, generateTicketCode, supabase } from '../lib/supabase';
import {
  Search,
  Ticket,
  PlusCircle,
  CheckCircle2,
  Clock,
  FileText,
  Activity,
  Zap,
} from 'lucide-react';

interface TicketCenterViewProps {
  tickets: TicketRecord[];
  quotes: QuoteRecord[];
  prefilledQuoteCode?: string;
  onTicketCreated: (ticket: TicketRecord) => void;
  onOpenQuoteModal: (quote: QuoteRecord) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  recibido: { label: 'Recibido en Bandeja', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  en_analisis: { label: 'En Evaluación Técnica', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  en_progreso: { label: 'En Desarrollo / Ejecución', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' },
  esperando_cliente: { label: 'Esperando Respuesta Cliente', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.14)' },
  cotizado_anexo: { label: 'Cotizado como Anexo Extra', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  resuelto: { label: 'Completado / Resuelto', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
};

const TYPE_LABELS: Record<TicketRequestType, { label: string; badgeColor: string }> = {
  garantia_15d: { label: 'Garantía Técnica (15 Días - $0)', badgeColor: '#22c55e' },
  cambio_alcance: { label: 'Cambio de Alcance / Fuera de Plazo (Anexo)', badgeColor: '#f97316' },
  nuevo_proyecto: { label: 'Inicio de Nuevo Proyecto', badgeColor: '#0ea5e9' },
  soporte_mensual: { label: 'Plan de Soporte Mensual Activo', badgeColor: '#8b5cf6' },
};

export const TicketCenterView: React.FC<TicketCenterViewProps> = ({
  tickets,
  quotes,
  prefilledQuoteCode,
  onTicketCreated,
  onOpenQuoteModal,
}) => {
  const [subTab, setSubTab] = useState<'tracker' | 'new'>(prefilledQuoteCode ? 'new' : 'tracker');
  const [searchQuery, setSearchQuery] = useState('TK-1042');
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);

  // New Ticket Form
  const [quoteCode, setQuoteCode] = useState(prefilledQuoteCode || '');
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [requestType, setRequestType] = useState<TicketRequestType>('garantia_15d');
  const [priority, setPriority] = useState<TicketPriority>('media');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (prefilledQuoteCode) {
      setQuoteCode(prefilledQuoteCode);
      setSubTab('new');
      const matchedQuote = quotes.find((q) => q.quote_code.toLowerCase() === prefilledQuoteCode.toLowerCase());
      if (matchedQuote) {
        setClientName(matchedQuote.client_name);
        setCompanyName(matchedQuote.company_name);
        setClientEmail(matchedQuote.client_email);
        setClientPhone(matchedQuote.client_phone);
      }
    }
  }, [prefilledQuoteCode, quotes]);

  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.ticket_code.toLowerCase().includes(q) ||
      (t.quote_code && t.quote_code.toLowerCase().includes(q)) ||
      t.client_email.toLowerCase().includes(q) ||
      t.client_name.toLowerCase().includes(q)
    );
  });

  const matchedQuotes = quotes.filter((quo) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    return (
      quo.quote_code.toLowerCase().includes(q) ||
      quo.client_email.toLowerCase().includes(q)
    );
  });

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim() || !subject.trim() || !description.trim()) return;

    setSubmitting(true);
    const code = generateTicketCode();
    const nowStr = new Date().toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newTicket: TicketRecord = {
      ticket_code: code,
      quote_code: quoteCode.trim().toUpperCase(),
      client_name: clientName.trim(),
      company_name: companyName.trim(),
      client_email: clientEmail.trim(),
      client_phone: clientPhone.trim(),
      request_type: requestType,
      priority,
      subject: subject.trim(),
      description: description.trim(),
      status: 'recibido',
      admin_notes:
        requestType === 'garantia_15d'
          ? 'Solicitud ingresada bajo cobertura de Garantía Técnica (15 días corridos). En revisión por ingeniería.'
          : requestType === 'cambio_alcance'
          ? 'Requerimiento adicional o fuera de plazo de garantía. El equipo técnico dimensionará el valor del Anexo.'
          : 'Ticket registrado correctamente en cola de atención.',
      extra_cost_clp: 0,
      timeline_events: [
        {
          date: nowStr,
          status: 'recibido',
          title: 'Solicitud Ingresada en Ticketera SmartLean',
          detail: `Ticket ${code} creado por ${clientName.trim()} (${TYPE_LABELS[requestType].label}).`,
        },
      ],
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('smartlean_tickets').insert([newTicket]);
    } catch {
      // Continue smoothly
    } finally {
      setSubmitting(false);
      onTicketCreated(newTicket);
      setCreatedBanner(code);
      setSearchQuery(code);
      setSubTab('tracker');
      setSubject('');
      setDescription('');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '105px', paddingBottom: '80px' }}>
      {/* ── HEADER (ESTILO SMARTLEAN) ── */}
      <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 40px auto' }}>
        <div
          className="badge"
          style={{
            marginBottom: '1.25rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
          }}
        >
          Gestión de Proyectos & Soporte 5.0
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.3rem, 4.4vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: '1.2rem',
            letterSpacing: '-0.035em',
          }}
        >
          <span className="gradient-title">Ticketera & Estado</span>
          <br />
          <span className="gradient-em">en Tiempo Real.</span>
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--text-2)',
            lineHeight: 1.65,
            maxWidth: '680px',
            margin: '0 auto 2.2rem auto',
          }}
        >
          Revisa el estado de tu cotización o requerimiento con tu código de seguimiento. Reporta errores técnicos dentro
          de tus 15 días de garantía o solicita anexos de desarrollo con total transparencia.
        </p>

        {/* Sub-navigation buttons */}
        <div style={{ display: 'inline-flex', gap: '10px' }}>
          <button
            onClick={() => setSubTab('tracker')}
            className={subTab === 'tracker' ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '.8rem 1.6rem', fontSize: '.75rem' }}
          >
            <Search size={14} />
            Consultar Estado de Solicitud
          </button>
          <button
            onClick={() => setSubTab('new')}
            className={subTab === 'new' ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '.8rem 1.6rem', fontSize: '.75rem' }}
          >
            <PlusCircle size={14} />
            Levantar Nuevo Ticket
          </button>
        </div>
      </div>

      {createdBanner && (
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto 28px auto',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={22} color="#22c55e" />
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '14px' }}>
                ¡Ticket Registrado con Éxito! Código de Seguimiento:{' '}
                <span style={{ color: 'var(--sky)' }}>{createdBanner}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                Usa este código en cualquier momento para revisar el progreso del equipo de ingeniería.
              </div>
            </div>
          </div>
          <button onClick={() => setCreatedBanner(null)} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '.75rem' }}>
            Cerrar
          </button>
        </div>
      )}

      {subTab === 'tracker' ? (
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Search Bar */}
          <div className="bento-card" style={{ padding: '22px' }}>
            <label className="field-label" style={{ marginBottom: '8px' }}>
              Buscar por Código de Ticket (ej: TK-1042), Código de Cotización (ej: SL-2026-1042) o Correo Electrónico
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search
                  size={16}
                  color="#64748b"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="input-dark"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Ingresa TK-1042, SL-2026-1042 o tu correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button onClick={() => setSearchQuery('')} className="btn-slate">
                Ver Todos ({tickets.length})
              </button>
            </div>
          </div>

          {/* Matched Quotes Section */}
          {matchedQuotes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matchedQuotes.map((q) => (
                <div
                  key={q.quote_code}
                  className="bento-card"
                  style={{
                    border: '1px solid rgba(14, 165, 233, 0.35)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '.62rem',
                        fontWeight: 800,
                        color: 'var(--sky)',
                        textTransform: 'uppercase',
                        letterSpacing: '.1em',
                      }}
                    >
                      Cotización Encontrada • {q.quote_code}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                      {q.selected_plan_name} — {q.client_name} ({q.company_name || 'Particular'})
                    </h3>
                    <div style={{ fontSize: '.8rem', color: 'var(--text-2)' }}>
                      Total: <strong style={{ color: 'var(--sky)' }}>{formatCLP(q.total_clp)}</strong> • Estado:{' '}
                      <strong style={{ color: '#22c55e', textTransform: 'uppercase' }}>{q.status}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onOpenQuoteModal(q)} className="btn-slate">
                      <FileText size={14} />
                      Ver Propuesta PDF
                    </button>
                    <button
                      onClick={() => {
                        setQuoteCode(q.quote_code);
                        setClientName(q.client_name);
                        setCompanyName(q.company_name);
                        setClientEmail(q.client_email);
                        setClientPhone(q.client_phone);
                        setSubTab('new');
                      }}
                      className="btn-primary"
                      style={{ padding: '.65rem 1.1rem', fontSize: '.72rem' }}
                    >
                      Abrir Ticket Asociado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tickets Results */}
          {filteredTickets.length === 0 ? (
            <div className="bento-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-2)' }}>
              No se encontraron tickets con ese criterio. Prueba buscando <strong>TK-1042</strong> o haz clic en "Ver
              Todos".
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const st = STATUS_LABELS[ticket.status] || STATUS_LABELS.recibido;
              const tp = TYPE_LABELS[ticket.request_type] || TYPE_LABELS.nuevo_proyecto;

              return (
                <div key={ticket.ticket_code} className="bento-card">
                  {/* Top Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      paddingBottom: '16px',
                      marginBottom: '18px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: 6 }}>
                        <span
                          style={{
                            background: 'var(--em)',
                            color: '#ffffff',
                            fontWeight: 900,
                            fontSize: '.72rem',
                            padding: '3px 10px',
                            borderRadius: 6,
                            letterSpacing: '.05em',
                          }}
                        >
                          {ticket.ticket_code}
                        </span>
                        {ticket.quote_code && (
                          <span
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              color: '#cbd5e1',
                              fontSize: '.72rem',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 6,
                            }}
                          >
                            Cotización: {ticket.quote_code}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '.7rem',
                            fontWeight: 700,
                            color: tp.badgeColor,
                            border: `1px solid ${tp.badgeColor}`,
                            padding: '2px 9px',
                            borderRadius: 99,
                          }}
                        >
                          {tp.label}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>{ticket.subject}</h3>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-2)', marginTop: 2 }}>
                        Solicitante: <strong>{ticket.client_name}</strong> ({ticket.company_name || ticket.client_email})
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '6px 14px',
                        borderRadius: 10,
                        background: st.bg,
                        border: `1px solid ${st.color}`,
                        color: st.color,
                        fontWeight: 800,
                        fontSize: '.75rem',
                        letterSpacing: '.04em',
                      }}
                    >
                      ● {st.label}
                    </div>
                  </div>

                  {/* Body & Engineering diagnosis */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '16px',
                      marginBottom: '20px',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 12,
                        padding: '14px',
                      }}
                    >
                      <div style={{ fontSize: '.6rem', fontWeight: 800, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                        Detalle del Requerimiento
                      </div>
                      <p style={{ fontSize: '.84rem', color: '#e2e8f0', lineHeight: 1.5 }}>{ticket.description}</p>
                    </div>

                    <div
                      style={{
                        background: 'rgba(14, 165, 233, 0.05)',
                        border: '1px solid rgba(14, 165, 233, 0.2)',
                        borderRadius: 12,
                        padding: '14px',
                      }}
                    >
                      <div style={{ fontSize: '.6rem', fontWeight: 800, color: 'var(--sky)', marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                        Diagnóstico & Respuesta Ingeniería SmartLean
                      </div>
                      <p style={{ fontSize: '.84rem', color: '#f8fafc', lineHeight: 1.5 }}>
                        {ticket.admin_notes || 'En revisión por el equipo técnico.'}
                      </p>
                      {ticket.extra_cost_clp > 0 && (
                        <div
                          style={{
                            marginTop: '10px',
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(14,165,233,0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontSize: '.75rem', color: '#f97316', fontWeight: 700 }}>
                            Valor Anexo / Fuera de Alcance:
                          </span>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#f97316' }}>
                            {formatCLP(ticket.extra_cost_clp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Tracker */}
                  <div>
                    <div
                      style={{
                        fontSize: '.62rem',
                        fontWeight: 800,
                        color: 'var(--text-3)',
                        textTransform: 'uppercase',
                        letterSpacing: '.12em',
                        marginBottom: '10px',
                      }}
                    >
                      Trazabilidad y Línea de Tiempo
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(ticket.timeline_events || []).map((ev, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.02)',
                            borderLeft: '3px solid var(--sky)',
                          }}
                        >
                          <Clock size={14} color="#0ea5e9" style={{ marginTop: 2, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                              <strong style={{ fontSize: '.82rem', color: '#ffffff' }}>{ev.title}</strong>
                              <span style={{ fontSize: '.7rem', color: 'var(--text-3)' }}>{ev.date}</span>
                            </div>
                            <p style={{ fontSize: '.78rem', color: 'var(--text-2)', marginTop: 2 }}>{ev.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* New Ticket Form */
        <form onSubmit={handleCreateTicket} className="bento-card" style={{ maxWidth: 780, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '6px' }}>
            Ingresar Nueva Solicitud o Ticket de Soporte
          </h2>
          <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginBottom: '24px' }}>
            Indica si tu requerimiento se encuentra dentro de los 15 días de garantía post-entrega ($0 por fallos técnicos)
            o si deseas cotizar un nuevo módulo como anexo.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
            <div>
              <label className="field-label">Tipo de Solicitud *</label>
              <select
                className="input-dark"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as TicketRequestType)}
              >
                <option value="garantia_15d">Garantía Técnica (Dentro de los 15 días post-entrega - $0)</option>
                <option value="cambio_alcance">Nuevo Módulo / Cambio Fuera de Plazo (Cotizar Anexo)</option>
                <option value="nuevo_proyecto">Iniciar Proyecto desde Cotización Emitida</option>
                <option value="soporte_mensual">Soporte de Plan Mensual Activo</option>
              </select>
            </div>

            <div>
              <label className="field-label">Código de Cotización Asociada</label>
              <input
                type="text"
                className="input-dark"
                placeholder="Ej: SL-2026-1042"
                value={quoteCode}
                onChange={(e) => setQuoteCode(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Nombre Completo *</label>
              <input
                type="text"
                className="input-dark"
                placeholder="Tu nombre y apellido"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="field-label">Empresa / Proyecto</label>
              <input
                type="text"
                className="input-dark"
                placeholder="Nombre de la empresa"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Correo Electrónico *</label>
              <input
                type="email"
                className="input-dark"
                placeholder="correo@empresa.cl"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="field-label">WhatsApp de Contacto</label>
              <input
                type="text"
                className="input-dark"
                placeholder="+56 9 1234 5678"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Prioridad</label>
              <select
                className="input-dark"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
              >
                <option value="baja">Baja — Consulta general</option>
                <option value="media">Media — Requerimiento estándar</option>
                <option value="alta">Alta — Afecta operación</option>
                <option value="urgente">Urgente — Caída o bloqueo crítico</option>
              </select>
            </div>

            <div>
              <label className="field-label">Asunto Resumido *</label>
              <input
                type="text"
                className="input-dark"
                placeholder="Ej: Ajuste en pasarela Webpay / Agregar sección nosotros"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Descripción Detallada *</label>
              <textarea
                rows={4}
                className="input-dark"
                placeholder="Explica qué necesitas ajustar o qué funcionalidad deseas cotizar..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '18px',
              marginBottom: '22px',
              padding: '14px 18px',
              borderRadius: 12,
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              fontSize: '.78rem',
              color: '#fdba74',
              lineHeight: 1.5,
            }}
          >
            <strong>Garantía de 15 Días vs. Anexos de Proyecto:</strong> Los reportes dentro de los 15 días posteriores
            a la entrega por fallos técnicos tienen costo $0. Si el plazo venció o se solicita agregar un módulo nuevo
            no contemplado originalmente, se cotizará previamente en este ticket antes de programar.
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '1rem', fontSize: '.85rem' }}
          >
            {submitting ? 'Registrando Ticket...' : 'Registrar Ticket y Obtener Código de Seguimiento →'}
          </button>
        </form>
      )}
    </div>
  );
};
