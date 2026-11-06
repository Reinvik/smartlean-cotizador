import React, { useState, useMemo } from 'react';
import type { QuoteItem, QuoteRecord, BriefingAnswers } from '../types/cotizador';
import { formatCLP, generateQuoteCode, supabase } from '../lib/supabase';
import {
  Check,
  Zap,
  TrendingUp,
  Network,
  Clock,
  ShieldCheck,
  Plus,
  ArrowRight,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { HeroBanner } from './HeroBanner';

interface CotizadorViewProps {
  items: QuoteItem[];
  onQuoteGenerated: (quote: QuoteRecord) => void;
  onGoToTickets?: () => void;
}

export const CotizadorView: React.FC<CotizadorViewProps> = ({ items, onQuoteGenerated, onGoToTickets }) => {
  const activeItems = useMemo(() => items.filter((i) => i.is_active), [items]);
  const basePlans = useMemo(() => activeItems.filter((i) => i.category === 'base_plan'), [activeItems]);
  const integrations = useMemo(() => activeItems.filter((i) => i.category === 'integration'), [activeItems]);
  const contentItems = useMemo(() => activeItems.filter((i) => i.category === 'content'), [activeItems]);
  const maintenancePlans = useMemo(() => activeItems.filter((i) => i.category === 'maintenance'), [activeItems]);
  const hourlyItem = useMemo(() => items.find((i) => i.id === 'config-hourly-rate'), [items]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(basePlans[0]?.id || 'plan-landing');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedMaintId, setSelectedMaintId] = useState<string>(maintenancePlans[0]?.id || 'maint-none');

  // Client & Briefing fields
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientRut, setClientRut] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectObjective, setProjectObjective] = useState('Captar cotizaciones y clientes por WhatsApp');

  const [briefing, setBriefing] = useState<BriefingAnswers>({
    rubro: '',
    publico_objetivo: '',
    estado_logo: 'Sí, cuento con logo en alta calidad y colores definidos',
    estado_contenido: 'El cliente entregará los textos y fotografías',
    dominio: 'Ya tengo dominio .CL o .COM contratado',
    referencias: '',
  });

  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedPlan = useMemo(
    () => basePlans.find((p) => p.id === selectedPlanId) || basePlans[0],
    [basePlans, selectedPlanId]
  );

  const selectedAddonsList = useMemo(
    () => activeItems.filter((i) => selectedAddonIds.includes(i.id)),
    [activeItems, selectedAddonIds]
  );

  const selectedMaint = useMemo(
    () => maintenancePlans.find((m) => m.id === selectedMaintId) || null,
    [maintenancePlans, selectedMaintId]
  );

  const totalCLP = useMemo(() => {
    const planPrice = selectedPlan?.price_clp || 0;
    const addonsPrice = selectedAddonsList.reduce((sum, a) => sum + a.price_clp, 0);
    return planPrice + addonsPrice;
  }, [selectedPlan, selectedAddonsList]);

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      setErrorMsg('Por favor completa Nombre, Correo y WhatsApp del cliente para emitir el documento oficial.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg('Debes confirmar la cláusula de garantía técnica de 15 días y alcance del proyecto.');
      return;
    }

    setErrorMsg('');
    setSaving(true);

    const quoteCode = generateQuoteCode();
    const newQuote: QuoteRecord = {
      quote_code: quoteCode,
      client_name: clientName.trim(),
      company_name: companyName.trim(),
      client_rut: clientRut.trim(),
      client_email: clientEmail.trim(),
      client_phone: clientPhone.trim(),
      project_objective: projectObjective,
      selected_plan_id: selectedPlan?.id || 'plan-landing',
      selected_plan_name: selectedPlan?.name || 'Desarrollo Web',
      selected_addons: selectedAddonsList.map((a) => ({
        id: a.id,
        name: a.name,
        price_clp: a.price_clp,
        delivery_days: a.delivery_days,
      })),
      selected_maintenance: selectedMaint
        ? { id: selectedMaint.id, name: selectedMaint.name, price_clp: selectedMaint.price_clp }
        : null,
      briefing_answers: briefing,
      subtotal_clp: totalCLP,
      discount_clp: 0,
      total_clp: totalCLP,
      estimated_timeline: selectedPlan?.delivery_days || '1 a 2 semanas',
      warranty_days: 15,
      status: 'emitida',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('smartlean_quotes').insert([newQuote]);
    } catch {
      // Continue smoothly
    } finally {
      setSaving(false);
      onQuoteGenerated(newQuote);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '105px', paddingBottom: '80px' }}>
      {/* ── BANNER HERO (TIPO IMAGEN 2) ── */}
      <HeroBanner
        onStartQuote={() => {
          document.getElementById('configurador')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onGoToTickets={() => {
          if (onGoToTickets) onGoToTickets();
        }}
      />

      {/* ── 2-COLUMN COTIZADOR LAYOUT ── */}
      <form
        id="configurador"
        onSubmit={handleGenerateQuote}
        className="cotizador-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 390px',
          gap: '28px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Configurator Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* STEP 1: Plan Base */}
          <section className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #135aec 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                1
              </span>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Selecciona la Plataforma Base
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                  Estructura y alcance principal para resolver el requerimiento de tu cliente.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {basePlans.map((plan) => {
                const isSelected = plan.id === selectedPlan?.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`selectable-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>{plan.name}</h3>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: isSelected ? 'none' : '1px solid #475569',
                          background: isSelected ? '#0ea5e9' : 'transparent',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>

                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#38bdf8', margin: '10px 0 6px 0' }}>
                      {formatCLP(plan.price_clp)}
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '11px',
                        color: '#cbd5e1',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '3px 9px',
                        borderRadius: 99,
                        marginBottom: '10px',
                      }}
                    >
                      <Clock size={11} color="#0ea5e9" />
                      Entrega estimada: {plan.delivery_days}
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'var(--text-2)', marginBottom: '12px' }}>
                      {plan.description}
                    </p>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {(plan.features || []).map((feat, idx) => (
                        <li
                          key={idx}
                          style={{
                            fontSize: '11.5px',
                            color: '#cbd5e1',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px',
                          }}
                        >
                          <Check size={13} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* STEP 2: Add-ons & Integrations */}
          <section className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #135aec 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                2
              </span>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Integraciones, Contenidos y Módulos Extras
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                  Suma pasarelas de pago Webpay/Flow, emisión de boletas SII, diseño de marca o dominio .CL.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {[...integrations, ...contentItems].map((item) => {
                const checked = selectedAddonIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleAddon(item.id)}
                    className={`selectable-card ${checked ? 'selected' : ''}`}
                    style={{ padding: '16px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff' }}>{item.name}</div>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          background: checked ? '#0ea5e9' : 'rgba(255,255,255,0.06)',
                          border: checked ? 'none' : '1px solid #475569',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {checked ? <Check size={13} strokeWidth={3} /> : <Plus size={13} color="#94a3b8" />}
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '6px 0 10px 0' }}>
                      {item.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#38bdf8' }}>
                        +{formatCLP(item.price_clp)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 700 }}>
                        {item.delivery_days}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* STEP 3: Maintenance & Warranty */}
          <section className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #135aec 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                3
              </span>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Modalidad Post-Entrega & Garantía Técnica
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                  Todos los desarrollos cuentan con 15 días de garantía técnica incluidos. Elige si sumas mantención.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
              {maintenancePlans.map((m) => {
                const isSelected = m.id === selectedMaint?.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMaintId(m.id)}
                    className={`selectable-card ${isSelected ? 'selected' : ''}`}
                    style={{ padding: '16px' }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>{m.name}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#22c55e', marginBottom: 8 }}>
                      {m.price_clp === 0 ? 'Incluido ($0)' : `${formatCLP(m.price_clp)} / mes`}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-2)' }}>{m.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* STEP 4: Briefing & Client Form */}
          <section className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #135aec 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                4
              </span>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Briefing Técnico & Datos del Cliente
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                  Información para generar la propuesta oficial descargable en PDF y respaldar el acuerdo.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label className="field-label">Nombre del Cliente *</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: Rodrigo Soto"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">Empresa / Razón Social</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: Austral SpA"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">RUT Empresa (Opcional)</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: 77.123.456-8"
                  value={clientRut}
                  onChange={(e) => setClientRut(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Correo Electrónico *</label>
                <input
                  type="email"
                  className="input-dark"
                  placeholder="cliente@empresa.cl"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">WhatsApp / Teléfono *</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="+56 9 1234 5678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">Objetivo Principal</label>
                <select
                  className="input-dark"
                  value={projectObjective}
                  onChange={(e) => setProjectObjective(e.target.value)}
                >
                  <option value="Captar cotizaciones y clientes por WhatsApp">
                    Captar cotizaciones y clientes por WhatsApp
                  </option>
                  <option value="Vender productos online con Webpay / Flow">
                    Vender productos online con Webpay / Flow
                  </option>
                  <option value="Posicionamiento e imagen corporativa">
                    Posicionamiento e imagen corporativa
                  </option>
                  <option value="Automatizar gestión interna con software a medida">
                    Automatizar gestión interna con software a medida
                  </option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">¿Qué vende el negocio y cuál es su propuesta de valor?</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: Venta de repuestos industriales con despacho a todo Chile..."
                  value={briefing.rubro}
                  onChange={(e) => setBriefing({ ...briefing, rubro: e.target.value })}
                />
              </div>

              <div>
                <label className="field-label">Estado de Logo y Manual</label>
                <select
                  className="input-dark"
                  value={briefing.estado_logo}
                  onChange={(e) => setBriefing({ ...briefing, estado_logo: e.target.value })}
                >
                  <option value="Sí, cuento con logo en alta calidad y colores definidos">
                    Logo en alta resolución y colores
                  </option>
                  <option value="Tengo un logo básico sin manual de marca">
                    Logo básico sin manual
                  </option>
                  <option value="No tengo logo, requiero diseño desde cero">
                    Requiere diseño de logotipo
                  </option>
                </select>
              </div>

              <div>
                <label className="field-label">Textos y Fotografías</label>
                <select
                  className="input-dark"
                  value={briefing.estado_contenido}
                  onChange={(e) => setBriefing({ ...briefing, estado_contenido: e.target.value })}
                >
                  <option value="El cliente entregará los textos y fotografías">
                    El cliente entregará todo
                  </option>
                  <option value="Requiere apoyo con redacción y fotos de stock">
                    Requiere redacción profesional
                  </option>
                </select>
              </div>

              <div>
                <label className="field-label">Dominio y Servidor</label>
                <select
                  className="input-dark"
                  value={briefing.dominio}
                  onChange={(e) => setBriefing({ ...briefing, dominio: e.target.value })}
                >
                  <option value="Ya tengo dominio .CL o .COM contratado">Ya tiene dominio y hosting</option>
                  <option value="No tengo dominio ni hosting, requiero gestión">
                    Requiere gestión de dominio/hosting
                  </option>
                </select>
              </div>

              <div>
                <label className="field-label">Sitios de Referencia o Competencia</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: sodimac.cl, autoplanet.cl"
                  value={briefing.referencias}
                  onChange={(e) => setBriefing({ ...briefing, referencias: e.target.value })}
                />
              </div>
            </div>

            {/* Warranty & Scope Protection Box */}
            <div
              style={{
                marginTop: '22px',
                padding: '16px 18px',
                borderRadius: 14,
                background: 'rgba(14, 165, 233, 0.05)',
                border: '1px solid rgba(14, 165, 233, 0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={18} color="#0ea5e9" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  Garantía Técnica de 15 Días y Reglas de Cambio Fuera de Alcance
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '12px', lineHeight: 1.6 }}>
                Al ser entregado el proyecto, el cliente cuenta con <strong>15 días corridos de garantía</strong> para
                reportar correcciones técnicas (bugs) o ajustes menores sin costo. Modificaciones solicitadas después de
                este plazo o cambios estructurales (ej. transformar una web informativa en un sistema o tienda online)
                se presupuestan como anexo de proyecto independiente ({formatCLP(hourlyItem?.price_clp || 25000)}/hr).
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ width: 17, height: 17, accentColor: '#0ea5e9' }}
                />
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                  He leído y acepto los términos de alcance, plazos y garantía técnica de 15 días.
                </span>
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Live Sticky SmartLean Card */}
        <aside
          className="bento-card"
          style={{
            position: 'sticky',
            top: '95px',
            border: '1px solid rgba(14, 165, 233, 0.35)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '14px',
              marginBottom: '16px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '.6rem',
                  fontWeight: 800,
                  color: 'var(--sky)',
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                }}
              >
                Resumen de Inversión
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>Cotización en Vivo</h3>
            </div>
            <FileCheck2 size={20} color="#0ea5e9" />
          </div>

          {/* Selected Base Plan */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Plataforma
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>{selectedPlan?.name}</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
                {formatCLP(selectedPlan?.price_clp || 0)}
              </span>
            </div>
          </div>

          {/* Addons */}
          {selectedAddonsList.length > 0 && (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '12px',
                marginBottom: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>
                Módulos Extras ({selectedAddonsList.length})
              </div>
              {selectedAddonsList.map((addon) => (
                <div
                  key={addon.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}
                >
                  <span style={{ color: '#cbd5e1' }}>+ {addon.name}</span>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>{formatCLP(addon.price_clp)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Total Box - SmartLean gradient styling */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(19, 90, 236, 0.22) 0%, rgba(14, 165, 233, 0.16) 100%)',
              border: '1px solid rgba(14, 165, 233, 0.4)',
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontSize: '.62rem',
                fontWeight: 800,
                color: 'var(--sky)',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
              }}
            >
              Inversión Total Proyecto (CLP)
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginTop: '4px',
              }}
            >
              {formatCLP(totalCLP)}
            </div>
            <div style={{ fontSize: '.72rem', color: '#cbd5e1', marginTop: '6px' }}>
              50% Inicio ({formatCLP(Math.round(totalCLP / 2))}) • 50% Contra Entrega
            </div>
          </div>

          {/* Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)' }}>
              <span>⏱ Tiempo estimado:</span>
              <strong style={{ color: '#ffffff' }}>{selectedPlan?.delivery_days}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)' }}>
              <span>🛡️ Garantía técnica:</span>
              <strong style={{ color: '#22c55e' }}>15 días corridos ($0)</strong>
            </div>
            {selectedMaint && selectedMaint.price_clp > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)' }}>
                <span>🔄 Soporte mensual:</span>
                <strong style={{ color: 'var(--sky)' }}>{formatCLP(selectedMaint.price_clp)}/mes</strong>
              </div>
            )}
          </div>

          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 10,
                padding: '10px 12px',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '.85rem' }}
            disabled={saving}
          >
            {saving ? (
              'Generando Documento...'
            ) : (
              <>
                <span>Emitir & Descargar Cotización</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </aside>
      </form>
    </div>
  );
};
