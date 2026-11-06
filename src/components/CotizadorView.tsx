import React, { useState, useMemo, useEffect } from 'react';
import type { QuoteItem, QuoteRecord, BriefingAnswers, SelectedAddon } from '../types/cotizador';
import { formatCLP, generateQuoteCode, supabase } from '../lib/supabase';
import {
  Check,
  Zap,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FileCheck2,
  Sparkles,
  Layers,
  HelpCircle,
  RotateCcw,
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
  const hourlyItem = useMemo(() => items.find((i) => i.id === 'config-hourly-rate'), [items]);

  // Bloque A: Diagnóstico del Negocio y Objetivo
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [productosServicios, setProductosServicios] = useState('');
  const [objetivoPrincipal, setObjetivoPrincipal] = useState('Captar cotizaciones y clientes por WhatsApp');
  const [clienteIdealProblema, setClienteIdealProblema] = useState('');
  const [referenciasUrls, setReferenciasUrls] = useState('');

  // Bloque B: Alcance y Funcionalidades
  const [tipoProyecto, setTipoProyecto] = useState<string>('plan-corp');
  const [integracionesChecked, setIntegracionesChecked] = useState<{
    whatsapp: boolean;
    webpay: boolean;
    facturacion: boolean;
    crm_analytics: boolean;
    couriers: boolean;
    login_usuarios: boolean;
  }>({
    whatsapp: true,
    webpay: false,
    facturacion: false,
    crm_analytics: false,
    couriers: false,
    login_usuarios: false,
  });
  const [autoadministracion, setAutoadministracion] = useState<'cliente' | 'delegar_basico' | 'delegar_pro'>('cliente');

  // Bloque C: Material y Contenidos
  const [estadoLogo, setEstadoLogo] = useState<'tiene_logo' | 'requiere_diseno'>('tiene_logo');
  const [redaccionFotos, setRedaccionFotos] = useState<'cliente_entrega' | 'requiere_copy'>('cliente_entrega');
  const [dominioHosting, setDominioHosting] = useState<'tiene_ambos' | 'requiere_gestion'>('tiene_ambos');

  // Bloque D: Datos del Cliente
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientRut, setClientRut] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Bloque E: Garantía y Estado de Envío
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [autoSuggestionNotice, setAutoSuggestionNotice] = useState<string | null>(null);

  // Inteligencia de mapeo según Objetivo Principal
  const handleObjetivoChange = (val: string) => {
    setObjetivoPrincipal(val);
    if (val.includes('Vender online con Webpay') || val.includes('Tienda')) {
      setTipoProyecto('plan-ecom');
      setIntegracionesChecked((prev) => ({ ...prev, webpay: true }));
      setAutoSuggestionNotice('Plan ajustado a "Tienda Online E-Commerce" con pasarela Webpay activada.');
    } else if (val.includes('WhatsApp') && !val.includes('E-Commerce')) {
      if (tipoProyecto === 'plan-ecom') setTipoProyecto('plan-corp');
      setAutoSuggestionNotice('Alineado para captación rápida por WhatsApp.');
    } else if (val.includes('Automatizar procesos internos')) {
      setTipoProyecto('plan-webapp');
      setIntegracionesChecked((prev) => ({ ...prev, login_usuarios: true }));
      setAutoSuggestionNotice('Plan sugerido a "Sistema Web a Medida" con panel privado de usuarios.');
    } else if (val.includes('catálogo')) {
      setTipoProyecto('plan-catalog');
      setAutoSuggestionNotice('Plan sugerido a "Catálogo Digital Interactivo".');
    }
  };

  // Inteligencia de Tipo de Proyecto
  const handleTipoProyectoChange = (planId: string) => {
    setTipoProyecto(planId);
    if (planId === 'plan-ecom') {
      setIntegracionesChecked((prev) => ({ ...prev, webpay: true }));
      setAutoSuggestionNotice('Pasarela Webpay sugerida automáticamente para E-Commerce.');
    } else if (planId === 'plan-webapp') {
      setIntegracionesChecked((prev) => ({ ...prev, login_usuarios: true }));
      setAutoSuggestionNotice('Módulo de usuarios y roles sugerido para Sistema Web.');
    }
  };

  // Resuelve el Plan Base
  const currentPlan = useMemo(() => {
    return basePlans.find((p) => p.id === tipoProyecto) || basePlans[1] || basePlans[0];
  }, [basePlans, tipoProyecto]);

  // Resuelve los Addons seleccionados
  const calculatedAddons = useMemo<SelectedAddon[]>(() => {
    const list: SelectedAddon[] = [];

    // Pasarela de pago (si no está ya 100% incluida o como addon)
    if (integracionesChecked.webpay && tipoProyecto !== 'plan-ecom') {
      const item = activeItems.find((i) => i.id === 'addon-webpay');
      if (item) list.push({ id: item.id, name: item.name, price_clp: item.price_clp, delivery_days: item.delivery_days });
    }
    // Facturación
    if (integracionesChecked.facturacion) {
      const item = activeItems.find((i) => i.id === 'addon-facturacion');
      if (item) list.push({ id: item.id, name: item.name, price_clp: item.price_clp, delivery_days: item.delivery_days });
    }
    // Analytics y CRM
    if (integracionesChecked.crm_analytics) {
      const item = activeItems.find((i) => i.id === 'addon-analytics');
      if (item) list.push({ id: item.id, name: item.name, price_clp: item.price_clp, delivery_days: item.delivery_days });
    }
    // Couriers
    if (integracionesChecked.couriers) {
      const item = activeItems.find((i) => i.id === 'addon-shipping');
      if (item) list.push({ id: item.id, name: item.name, price_clp: item.price_clp, delivery_days: item.delivery_days });
    }
    // Login usuarios (si no es webapp donde ya es base)
    if (integracionesChecked.login_usuarios && tipoProyecto !== 'plan-webapp') {
      const item = activeItems.find((i) => i.id === 'addon-roles');
      if (item) list.push({ id: item.id, name: item.name, price_clp: item.price_clp, delivery_days: item.delivery_days });
    }
    // Logo
    if (estadoLogo === 'requiere_diseno') {
      const item = activeItems.find((i) => i.id === 'content-branding');
      if (item) list.push({ id: item.id, name: item.name, price_clp: item.price_clp, delivery_days: item.delivery_days });
    }
    // Copywriting y Fotos
    if (redaccionFotos === 'requiere_copy') {
      const item = activeItems.find((i) => i.id === 'content-copy');
      if (item) list.push({ id: item.id, name: item.name, price_clp: item.price_clp, delivery_days: item.delivery_days });
    }
    // Dominio y Hosting
    if (dominioHosting === 'requiere_gestion') {
      const item = activeItems.find((i) => i.id === 'content-domain-hosting');
      if (item) list.push({ id: item.id, name: item.name, price_clp: item.price_clp, delivery_days: item.delivery_days });
    }

    return list;
  }, [integracionesChecked, tipoProyecto, estadoLogo, redaccionFotos, dominioHosting, activeItems]);

  // Resuelve Mantenimiento mensual
  const calculatedMaintenance = useMemo<SelectedAddon | null>(() => {
    if (autoadministracion === 'delegar_basico') {
      const item = activeItems.find((i) => i.id === 'maint-basic');
      return item ? { id: item.id, name: item.name, price_clp: item.price_clp } : null;
    }
    if (autoadministracion === 'delegar_pro') {
      const item = activeItems.find((i) => i.id === 'maint-pro');
      return item ? { id: item.id, name: item.name, price_clp: item.price_clp } : null;
    }
    return { id: 'maint-none', name: 'Sin Plan Mensual (Solo Garantía 15 Días)', price_clp: 0 };
  }, [autoadministracion, activeItems]);

  // Total CLP
  const totalCLP = useMemo(() => {
    const planPrice = currentPlan?.price_clp || 0;
    const addonsSum = calculatedAddons.reduce((acc, a) => acc + a.price_clp, 0);
    return planPrice + addonsSum;
  }, [currentPlan, calculatedAddons]);

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      setErrorMsg('Por favor completa Nombre, Correo y WhatsApp del cliente en el Bloque D para emitir la propuesta.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg('Debes confirmar la cláusula de garantía técnica de 15 días y alcance del proyecto.');
      return;
    }

    setErrorMsg('');
    setSaving(true);

    const quoteCode = generateQuoteCode();
    const briefingData: BriefingAnswers = {
      nombre_negocio: nombreNegocio || companyName || clientName,
      productos_servicios: productosServicios,
      objetivo_principal: objetivoPrincipal,
      cliente_ideal_problema: clienteIdealProblema,
      referencias_urls: referenciasUrls,
      tipo_proyecto: currentPlan?.name || tipoProyecto,
      integraciones: Object.entries(integracionesChecked)
        .filter(([, v]) => v)
        .map(([k]) => k),
      autoadministracion:
        autoadministracion === 'cliente'
          ? 'Autoadministrable por el cliente (Garantía 15 días)'
          : autoadministracion === 'delegar_basico'
          ? 'Plan Continuidad y Soporte Básico ($45.000/mes)'
          : 'Plan Evolución y Soporte Pro ($85.000/mes)',
      estado_logo:
        estadoLogo === 'tiene_logo'
          ? 'Tiene logo vectorial y colores definidos'
          : 'No tiene logo, requiere diseño profesional',
      redaccion_fotos:
        redaccionFotos === 'cliente_entrega'
          ? 'El cliente entregará textos y fotos'
          : 'Requiere copywriting persuasivo y fotos de stock',
      dominio_hosting:
        dominioHosting === 'tiene_ambos'
          ? 'Ya tiene dominio y hosting contratados'
          : 'Requiere gestión de dominio .CL y hosting por 1 año',
      // Campos de compatibilidad
      rubro: productosServicios,
      publico_objetivo: clienteIdealProblema,
      referencias: referenciasUrls,
    };

    const newQuote: QuoteRecord = {
      quote_code: quoteCode,
      client_name: clientName.trim(),
      company_name: companyName.trim() || nombreNegocio.trim(),
      client_rut: clientRut.trim(),
      client_email: clientEmail.trim(),
      client_phone: clientPhone.trim(),
      project_objective: objetivoPrincipal,
      selected_plan_id: currentPlan?.id || 'plan-corp',
      selected_plan_name: currentPlan?.name || 'Desarrollo Web',
      selected_addons: calculatedAddons,
      selected_maintenance: calculatedMaintenance,
      briefing_answers: briefingData,
      subtotal_clp: totalCLP,
      discount_clp: 0,
      total_clp: totalCLP,
      estimated_timeline: currentPlan?.delivery_days || '1 a 2 semanas',
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
          document.getElementById('briefing-inteligente')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onGoToTickets={() => {
          if (onGoToTickets) onGoToTickets();
        }}
      />

      {/* ── HEADER DEL BRIEFING INTELIGENTE EN 5 BLOQUES ── */}
      <div id="briefing-inteligente" style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 40px auto' }}>
        <div
          className="badge"
          style={{
            marginBottom: '1rem',
            background: 'rgba(14, 165, 233, 0.1)',
            borderColor: 'rgba(14, 165, 233, 0.35)',
          }}
        >
          <Sparkles size={11} /> Cuestionario Inteligente de Alcance & Cotización
        </div>

        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, lineHeight: 1.1, margin: 0 }}>
          <span className="gradient-title">Briefing de Alcance</span> <span className="gradient-em">en 5 Bloques</span>
        </h2>

        <p style={{ marginTop: '.85rem', color: 'var(--text-2)', fontSize: '1.02rem', lineHeight: 1.6 }}>
          Responde estas preguntas con tu cliente. El sistema <strong style={{ color: '#ffffff' }}>dimensionará el alcance</strong>,
          activará las integraciones requeridas y calculará el <strong style={{ color: 'var(--sky)' }}>presupuesto exacto en pesos chilenos (CLP)</strong>.
        </p>

        {autoSuggestionNotice && (
          <div
            style={{
              marginTop: '1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.55rem',
              padding: '.45rem 1.1rem',
              borderRadius: 99,
              background: 'rgba(14, 165, 233, 0.12)',
              border: '1px solid rgba(14, 165, 233, 0.35)',
              color: '#38bdf8',
              fontSize: '.75rem',
              fontWeight: 700,
            }}
          >
            <Zap size={13} color="#0ea5e9" />
            <span>{autoSuggestionNotice}</span>
          </div>
        )}
      </div>

      {/* ── 2-COLUMN LAYOUT: 5 BLOQUES + LIVE STICKY COTIZACIÓN ── */}
      <form
        onSubmit={handleGenerateQuote}
        className="cotizador-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 390px',
          gap: '28px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: 5 Quick Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

          {/* ══════════════════════════════════════════════════════
              BLOQUE A: Diagnóstico del Negocio y Objetivo
          ══════════════════════════════════════════════════════ */}
          <section className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #135aec 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)',
                }}
              >
                A
              </span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Bloque A: Diagnóstico del Negocio y Objetivo
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                  Propósito comercial, cliente ideal y referencias visuales.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="field-label">
                  1. ¿Cuál es el nombre del negocio y qué productos o servicios vende exactamente? *
                </label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: Repuestos Sur SpA — Venta y distribución de repuestos automotrices para flotas y talleres en Chile"
                  value={productosServicios}
                  onChange={(e) => setProductosServicios(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label">
                  2. ¿Cuál es el objetivo principal de la web / programa? *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'Captar cotizaciones / clientes por WhatsApp', val: 'Captar cotizaciones y clientes por WhatsApp' },
                    { label: 'Venta online directa con Webpay / Tarjetas', val: 'Vender online con Webpay' },
                    { label: 'Mostrar catálogo digital informativo', val: 'Mostrar catálogo digital' },
                    { label: 'Automatizar procesos internos / Sistema web', val: 'Automatizar procesos internos' },
                  ].map((opt) => (
                    <div
                      key={opt.val}
                      onClick={() => handleObjetivoChange(opt.val)}
                      className={`selectable-card ${objetivoPrincipal === opt.val ? 'selected' : ''}`}
                      style={{ padding: '12px 14px' }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">
                  3. ¿Quién es su cliente ideal y qué problema le resuelve la página?
                </label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: Talleres mecánicos que necesitan cotizar rápido y recibir despacho en menos de 24 horas"
                  value={clienteIdealProblema}
                  onChange={(e) => setClienteIdealProblema(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label">
                  4. Enlaces a 2 o 3 páginas de referencia o competidores que le gusten visualmente:
                </label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: autoplanet.cl, sodimac.cl (me gustan los filtros limpios y el botón directo de WhatsApp)"
                  value={referenciasUrls}
                  onChange={(e) => setReferenciasUrls(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              BLOQUE B: Alcance y Funcionalidades (Para saber cuánto cobrar)
          ══════════════════════════════════════════════════════ */}
          <section className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #135aec 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)',
                }}
              >
                B
              </span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Bloque B: Alcance y Funcionalidades (Para saber cuánto cobrar)
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                  Arquitectura base, pasarelas de pago e integraciones.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 5. Tipo de Proyecto */}
              <div>
                <label className="field-label" style={{ marginBottom: '10px' }}>
                  5. Tipo de proyecto requerido:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {basePlans.map((plan) => {
                    const isSelected = plan.id === tipoProyecto;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleTipoProyectoChange(plan.id)}
                        className={`selectable-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>{plan.name}</span>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              border: isSelected ? 'none' : '1px solid #475569',
                              background: isSelected ? '#0ea5e9' : 'transparent',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>

                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8', margin: '8px 0 4px 0' }}>
                          {formatCLP(plan.price_clp)}
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.4 }}>{plan.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Integraciones Necesarias */}
              <div>
                <label className="field-label" style={{ marginBottom: '10px' }}>
                  6. Integraciones necesarias (Marca las que correspondan):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={integracionesChecked.whatsapp}
                      onChange={(e) => setIntegracionesChecked({ ...integracionesChecked, whatsapp: e.target.checked })}
                      style={{ accentColor: '#0ea5e9', width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      Botón directo de WhatsApp (Incluido)
                    </span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: integracionesChecked.webpay ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: integracionesChecked.webpay ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={integracionesChecked.webpay}
                      onChange={(e) => setIntegracionesChecked({ ...integracionesChecked, webpay: e.target.checked })}
                      style={{ accentColor: '#0ea5e9', width: 16, height: 16 }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        Pasarela de pagos (Webpay Plus, Flow, Mercado Pago)
                      </div>
                      <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                        {tipoProyecto === 'plan-ecom' ? 'Incluido en Tienda Online' : '+ $120.000 CLP'}
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: integracionesChecked.facturacion ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: integracionesChecked.facturacion ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={integracionesChecked.facturacion}
                      onChange={(e) => setIntegracionesChecked({ ...integracionesChecked, facturacion: e.target.checked })}
                      style={{ accentColor: '#0ea5e9', width: 16, height: 16 }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        Conexión Facturación / Boletas SII (Bsale, OpenFactura)
                      </div>
                      <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>+ $180.000 CLP</div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: integracionesChecked.crm_analytics ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: integracionesChecked.crm_analytics ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={integracionesChecked.crm_analytics}
                      onChange={(e) => setIntegracionesChecked({ ...integracionesChecked, crm_analytics: e.target.checked })}
                      style={{ accentColor: '#0ea5e9', width: 16, height: 16 }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        Formularios conectados a CRM & Píxel de Meta / GA4
                      </div>
                      <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>+ $65.000 CLP</div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: integracionesChecked.couriers ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: integracionesChecked.couriers ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={integracionesChecked.couriers}
                      onChange={(e) => setIntegracionesChecked({ ...integracionesChecked, couriers: e.target.checked })}
                      style={{ accentColor: '#0ea5e9', width: 16, height: 16 }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        Cálculo automático de envíos (Starken / Chilexpress)
                      </div>
                      <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>+ $140.000 CLP</div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: integracionesChecked.login_usuarios ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.02)',
                      border: integracionesChecked.login_usuarios ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={integracionesChecked.login_usuarios}
                      onChange={(e) => setIntegracionesChecked({ ...integracionesChecked, login_usuarios: e.target.checked })}
                      style={{ accentColor: '#0ea5e9', width: 16, height: 16 }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        Módulo de usuarios y portal privado con login
                      </div>
                      <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                        {tipoProyecto === 'plan-webapp' ? 'Incluido en Sistema Web' : '+ $280.000 CLP'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 7. Autoadministración */}
              <div>
                <label className="field-label" style={{ marginBottom: '8px' }}>
                  7. Autoadministración: ¿El cliente cambiará textos y fotos por su cuenta, o prefiere delegar el mantenimiento?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {[
                    {
                      key: 'cliente',
                      title: 'El cliente autoadministrará',
                      desc: 'Incluye 15 días corridos de garantía técnica ($0/mes)',
                    },
                    {
                      key: 'delegar_basico',
                      title: 'Delegar Soporte y Continuidad',
                      desc: 'Backups, hosting y hasta 2 hrs/mes de cambios ($45.000/mes)',
                    },
                    {
                      key: 'delegar_pro',
                      title: 'Soporte Preferente & Evolución',
                      desc: 'Para e-commerce y sistemas activos con 4 hrs/mes ($85.000/mes)',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => setAutoadministracion(item.key as typeof autoadministracion)}
                      className={`selectable-card ${autoadministracion === item.key ? 'selected' : ''}`}
                      style={{ padding: '14px' }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{item.title}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-2)', marginTop: 4 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              BLOQUE C: Material y Contenidos
          ══════════════════════════════════════════════════════ */}
          <section className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #135aec 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)',
                }}
              >
                C
              </span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Bloque C: Material y Contenidos
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                  Identidad visual, redacción de textos y hosting/dominio.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* 8. Logotipo */}
              <div>
                <label className="field-label">8. ¿Cuenta con logotipo en alta resolución y manual de marca?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    onClick={() => setEstadoLogo('tiene_logo')}
                    className={`selectable-card ${estadoLogo === 'tiene_logo' ? 'selected' : ''}`}
                    style={{ padding: '12px' }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                      Sí, el cliente entregará logo vectorial ($0)
                    </div>
                  </div>
                  <div
                    onClick={() => setEstadoLogo('requiere_diseno')}
                    className={`selectable-card ${estadoLogo === 'requiere_diseno' ? 'selected' : ''}`}
                    style={{ padding: '12px' }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                      No tiene logo / Diseñar logotipo profesional (+ $110.000 CLP)
                    </div>
                  </div>
                </div>
              </div>

              {/* 9. Textos y Fotos */}
              <div>
                <label className="field-label">9. ¿Quién redactará los textos y aportará las fotografías?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    onClick={() => setRedaccionFotos('cliente_entrega')}
                    className={`selectable-card ${redaccionFotos === 'cliente_entrega' ? 'selected' : ''}`}
                    style={{ padding: '12px' }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                      El cliente entregará todos los textos y fotos ($0)
                    </div>
                  </div>
                  <div
                    onClick={() => setRedaccionFotos('requiere_copy')}
                    className={`selectable-card ${redaccionFotos === 'requiere_copy' ? 'selected' : ''}`}
                    style={{ padding: '12px' }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                      Redacción comercial (Copywriting) + Fotos stock (+ $95.000 CLP)
                    </div>
                  </div>
                </div>
              </div>

              {/* 10. Dominio y Hosting */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">10. ¿Ya tiene dominio (.cl o .com) y hosting comprado, o requiere gestión?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setDominioHosting('tiene_ambos')}
                    className={`selectable-card ${dominioHosting === 'tiene_ambos' ? 'selected' : ''}`}
                    style={{ padding: '12px' }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                      Ya tiene dominio y hosting contratados ($0)
                    </div>
                  </div>
                  <div
                    onClick={() => setDominioHosting('requiere_gestion')}
                    className={`selectable-card ${dominioHosting === 'requiere_gestion' ? 'selected' : ''}`}
                    style={{ padding: '12px' }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
                      Inscripción Dominio .CL (NIC Chile) + Hosting Cloud 1 Año (+ $90.000 CLP)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              BLOQUE D: Datos del Cliente & Contacto
          ══════════════════════════════════════════════════════ */}
          <section className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #135aec 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)',
                }}
              >
                D
              </span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Bloque D: Datos del Cliente para la Propuesta Oficial
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                  Aparecerán membretados en el documento oficial PDF descargable.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label className="field-label">Nombre y Apellido del Cliente *</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: Marcelo Morales"
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
                  placeholder="Ej: Logística Austral SpA"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (!nombreNegocio) setNombreNegocio(e.target.value);
                  }}
                />
              </div>

              <div>
                <label className="field-label">RUT Empresa / Personal (Opcional)</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: 76.543.210-K"
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
                <label className="field-label">WhatsApp de Contacto *</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="+56 9 9876 5432"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              BLOQUE E: Garantía de 15 Días y Aceptación
          ══════════════════════════════════════════════════════ */}
          <section className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #135aec 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)',
                }}
              >
                E
              </span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Bloque E: Condiciones de Entrega, Garantía y Aceptación
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                  Respaldo legal y reglas de juego antes de emitir la cotización.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '16px 18px',
                borderRadius: 14,
                background: 'rgba(14, 165, 233, 0.05)',
                border: '1px solid rgba(14, 165, 233, 0.22)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={18} color="#0ea5e9" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  Garantía Técnica de 15 Días y Política de Cambios
                </span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                <li>
                  • <strong>Garantía de 15 Días Corridos:</strong> Posterior a la entrega en producción para corregir bugs, enlaces rotos o desalineaciones visuales acordadas ($0 costo).
                </li>
                <li>
                  • <strong>Cambios Fuera de Plazo o Estructurales:</strong> Toda nueva funcionalidad (ej. transformar una web informativa en e-commerce) o solicitud posterior a los 15 días se cotiza como un Anexo de Proyecto independiente ({formatCLP(hourlyItem?.price_clp || 25000)}/hr).
                </li>
                <li>
                  • <strong>Modalidad de Pago Estándar:</strong> 50% de anticipo al inicio y 50% contra entrega funcional previa publicación final.
                </li>
              </ul>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: '#0ea5e9' }}
              />
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                He revisado el alcance y acepto las condiciones comerciales y garantía de 15 días corridos.
              </span>
            </label>
          </section>
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT COLUMN: STICKY INTELIGENTE EN TIEMPO REAL
        ══════════════════════════════════════════════════════ */}
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
                  fontSize: '.62rem',
                  fontWeight: 800,
                  color: 'var(--sky)',
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={11} /> Cotización Inteligente
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>Cálculo en Vivo (CLP)</h3>
            </div>
            <FileCheck2 size={20} color="#0ea5e9" />
          </div>

          {/* Base Plan */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Plataforma Seleccionada (Bloque B)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#f8fafc' }}>{currentPlan?.name}</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
                {formatCLP(currentPlan?.price_clp || 0)}
              </span>
            </div>
          </div>

          {/* Addons List */}
          {calculatedAddons.length > 0 && (
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
                Integraciones & Extras Auto-detectados ({calculatedAddons.length})
              </div>
              {calculatedAddons.map((addon) => (
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

          {/* Maintenance Pill */}
          {calculatedMaintenance && (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '12px',
                marginBottom: '14px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>
                Autoadministración & Soporte
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ color: '#cbd5e1' }}>{calculatedMaintenance.name}</span>
                <span style={{ fontWeight: 800, color: '#22c55e' }}>
                  {calculatedMaintenance.price_clp === 0 ? '$0 / mes' : `${formatCLP(calculatedMaintenance.price_clp)}/mes`}
                </span>
              </div>
            </div>
          )}

          {/* Total Box */}
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
              Total Inversión Desarrollo (CLP)
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
              50% Anticipo ({formatCLP(Math.round(totalCLP / 2))}) • 50% Contra Entrega
            </div>
          </div>

          {/* Timeline & Guarantee metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)' }}>
              <span>⏱ Plazo estimado:</span>
              <strong style={{ color: '#ffffff' }}>{currentPlan?.delivery_days}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)' }}>
              <span>🛡️ Garantía técnica:</span>
              <strong style={{ color: '#22c55e' }}>15 días corridos ($0)</strong>
            </div>
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
              'Generando Propuesta Oficial...'
            ) : (
              <>
                <span>Emitir & Descargar Propuesta PDF</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </aside>
      </form>
    </div>
  );
};
