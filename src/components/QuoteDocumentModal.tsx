import React from 'react';
import type { QuoteRecord } from '../types/cotizador';
import { formatCLP } from '../lib/supabase';
import { Printer, Download, MessageSquare, Ticket, X, CheckCircle2, ShieldAlert, Clock, FileCheck } from 'lucide-react';

interface QuoteDocumentModalProps {
  quote: QuoteRecord;
  hourlyRateCLP: number;
  onClose: () => void;
  onCreateTicketFromQuote: (quoteCode: string) => void;
}

export const QuoteDocumentModal: React.FC<QuoteDocumentModalProps> = ({
  quote,
  hourlyRateCLP,
  onClose,
  onCreateTicketFromQuote,
}) => {
  const createdDate = quote.created_at
    ? new Date(quote.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

  const handleDownloadHTMLDocument = () => {
    const docElement = document.getElementById('smartlean-printable-quote');
    if (!docElement) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Propuesta_${quote.quote_code}_${quote.client_name.replace(/\s+/g, '_')}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #f8fafc; padding: 32px; line-height: 1.5; }
    .sheet { max-width: 850px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
    th { background: #f1f5f9; font-weight: 700; }
    .badge { display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 99px; font-size: 12px; font-weight: 700; }
    .clause-box { background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 18px; margin-top: 16px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="sheet">
    ${docElement.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cotizacion_${quote.quote_code}_${quote.company_name || quote.client_name}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const whatsappText = encodeURIComponent(
    `Hola SmartLean, acabo de generar la cotización *${quote.quote_code}* en cotiza.smartlean.cl:\n` +
      `• Cliente: ${quote.client_name} (${quote.company_name || 'Particular'})\n` +
      `• Plan: ${quote.selected_plan_name}\n` +
      `• Total Proyecto: ${formatCLP(quote.total_clp)}\n` +
      `Me gustaría coordinar los siguientes pasos.`
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(12px)',
        overflowY: 'auto',
        padding: '24px 16px',
      }}
    >
      {/* Top Action Bar (Hidden when printing) */}
      <div
        className="no-print"
        style={{
          maxWidth: 900,
          margin: '0 auto 18px auto',
          background: '#0f172a',
          border: '1px solid rgba(0, 210, 255, 0.35)',
          borderRadius: 16,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={22} color="#10b981" />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
              Propuesta Oficial Generada: <span style={{ color: '#00d2ff' }}>{quote.quote_code}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Usa ese código en la Ticketera para consultar avances o levantar solicitudes.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} className="btn-primary" style={{ padding: '10px 16px', fontSize: '12px' }}>
            <Printer size={15} />
            Guardar PDF / Imprimir
          </button>
          <button onClick={handleDownloadHTMLDocument} className="btn-slate">
            <Download size={15} />
            Descargar Archivo
          </button>
          <button
            onClick={() => onCreateTicketFromQuote(quote.quote_code)}
            className="btn-slate"
            style={{ borderColor: 'rgba(0,210,255,0.4)', color: '#00d2ff' }}
          >
            <Ticket size={15} />
            Abrir Ticket con este Código
          </button>
          <a
            href={`https://wa.me/56930057769?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-slate"
            style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#10b981' }}
          >
            <MessageSquare size={15} />
            Enviar a WhatsApp
          </a>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '9px 12px' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Printable Proposal Sheet */}
      <div
        id="smartlean-printable-quote"
        className="printable-document"
        style={{
          maxWidth: 900,
          margin: '0 auto',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 20,
          padding: '44px 48px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
        }}
      >
        {/* Document Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '24px',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.04em', color: '#0f172a' }}>
              SMARTLEAN <span style={{ color: '#0284c7' }}>CHILE</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em' }}>
              INGENIERÍA DE SOFTWARE, DESARROLLO WEB & TRANSFORMACIÓN DIGITAL
            </div>
            <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '6px' }}>
              Web: <strong>cotiza.smartlean.cl</strong> • Contacto: ariel@smartlean.cl • +56 9 3005 7769
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'inline-block',
                background: '#0f172a',
                color: '#00d2ff',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '14px',
                letterSpacing: '0.04em',
              }}
            >
              COTIZACIÓN N° {quote.quote_code}
            </div>
            <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '6px' }}>
              <strong>Fecha de Emisión:</strong> {createdDate}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              <strong>Validez de la Oferta:</strong> 15 días corridos
            </div>
          </div>
        </div>

        {/* Client Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px 22px',
            marginBottom: '28px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Cliente / Solicitante
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{quote.client_name}</div>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              {quote.company_name || 'Persona Natural'} {quote.client_rut ? `• RUT: ${quote.client_rut}` : ''}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Datos de Contacto
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{quote.client_email}</div>
            <div style={{ fontSize: '13px', color: '#475569' }}>WhatsApp: {quote.client_phone}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Plazo Estimado & Garantía
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0284c7' }}>
              Entrega: {quote.estimated_timeline}
            </div>
            <div style={{ fontSize: '12.5px', color: '#059669', fontWeight: 700 }}>
              Incluye {quote.warranty_days} días de Garantía Técnica
            </div>
          </div>
        </div>

        {/* Itemized Financial Breakdown */}
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#0f172a',
            marginBottom: '12px',
          }}
        >
          1. Desglose de Alcance y Valores (CLP)
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#ffffff' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', borderRadius: '8px 0 0 0' }}>
                Ítem / Módulo Contratado
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px' }}>Categoría</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', borderRadius: '0 8px 0 0' }}>
                Valor Neto (CLP)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '14px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{quote.selected_plan_name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Desarrollo base, diseño UX/UI adaptable y marcha blanca garantizada
                </div>
              </td>
              <td style={{ padding: '14px', fontSize: '12.5px', fontWeight: 700, color: '#0284c7' }}>Plan Principal</td>
              <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, fontSize: '14px' }}>
                {formatCLP(
                  quote.subtotal_clp -
                    quote.selected_addons.reduce((acc, a) => acc + a.price_clp, 0)
                )}
              </td>
            </tr>

            {quote.selected_addons.map((addon) => (
              <tr key={addon.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 14px', fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                  + {addon.name}
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b' }}>Módulo / Extra</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '13.5px' }}>
                  {formatCLP(addon.price_clp)}
                </td>
              </tr>
            ))}

            <tr style={{ background: '#f1f5f9' }}>
              <td colSpan={2} style={{ padding: '16px 14px', fontWeight: 900, fontSize: '15px', color: '#0f172a' }}>
                TOTAL INVERSIÓN DESARROLLO DEL PROYECTO
              </td>
              <td
                style={{
                  padding: '16px 14px',
                  textAlign: 'right',
                  fontWeight: 900,
                  fontSize: '18px',
                  color: '#0284c7',
                }}
              >
                {formatCLP(quote.total_clp)}
              </td>
            </tr>
          </tbody>
        </table>

        {quote.selected_maintenance && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '26px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '13px', color: '#166534' }}>
              <strong>Modalidad Post-Entrega Seleccionada:</strong> {quote.selected_maintenance.name}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d' }}>
              {quote.selected_maintenance.price_clp === 0
                ? 'Sin cobro mensual ($0)'
                : `${formatCLP(quote.selected_maintenance.price_clp)} / mes`}
            </div>
          </div>
        )}

        {/* Briefing Summary */}
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#0f172a',
            marginBottom: '12px',
          }}
        >
          2. Especificaciones Levantadas en el Briefing
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '26px',
            fontSize: '13px',
          }}
        >
          <div>
            <strong>Objetivo del Proyecto:</strong> {quote.project_objective || 'Por detallar en reunión inicial'}
          </div>
          <div>
            <strong>Rubro / Propuesta de Valor:</strong> {quote.briefing_answers?.rubro || 'No especificado'}
          </div>
          <div>
            <strong>Público Objetivo:</strong> {quote.briefing_answers?.publico_objetivo || 'General'}
          </div>
          <div>
            <strong>Estado de Logo / Marca:</strong> {quote.briefing_answers?.estado_logo || 'Por confirmar'}
          </div>
          <div>
            <strong>Textos y Fotografías:</strong> {quote.briefing_answers?.estado_contenido || 'Por confirmar'}
          </div>
          <div>
            <strong>Dominio y Hosting:</strong> {quote.briefing_answers?.dominio || 'Por confirmar'}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <strong>Sitios de Referencia / Competencia:</strong>{' '}
            {quote.briefing_answers?.referencias || 'Sin referencias adjuntas'}
          </div>
        </div>

        {/* Terms, 15-Day Warranty & Out-of-Scope Clause */}
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#0f172a',
            marginBottom: '12px',
          }}
        >
          3. Condiciones Comerciales, Garantía de 15 Días y Control de Alcance
        </h3>

        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderLeft: '4px solid #0284c7',
            borderRadius: '10px',
            padding: '16px 20px',
            fontSize: '12.5px',
            color: '#334155',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div>
            <strong>• Forma de Pago Estándar:</strong> 50% de anticipo ({formatCLP(Math.round(quote.total_clp / 2))})
            para reservar agenda e iniciar el desarrollo; 50% restante ({formatCLP(quote.total_clp - Math.round(quote.total_clp / 2))})
            contra validación funcional y previa puesta en producción final.
          </div>
          <div>
            <strong>• Período de Garantía Técnica ({quote.warranty_days} Días Corridos):</strong> A partir de la entrega
            oficial del proyecto, el cliente dispone de <strong>{quote.warranty_days} días corridos</strong> sin costo
            para reportar errores técnicos (bugs), enlaces rotos o ajustes visuales dentro de los requerimientos
            aprobados en este documento.
          </div>
          <div>
            <strong>• Cambios Fuera de Plazo o Nuevos Módulos (Anexos de Proyecto):</strong> Cualquier modificación
            solicitada una vez vencidos los {quote.warranty_days} días de garantía, o bien requerimientos que cambien la
            naturaleza del proyecto (por ejemplo: transformar una página informativa en un sistema web o tienda online,
            integrar nuevas pasarelas o rediseñar secciones ya aprobadas), <strong>se cotizará como un Proyecto o Anexo
            independiente</strong> a razón del tarifario vigente o valor hora de ingeniería ({formatCLP(hourlyRateCLP)}/hora).
          </div>
        </div>

        {/* Signatures */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '48px',
            marginTop: '42px',
            paddingTop: '24px',
          }}
        >
          <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '8px', textAlign: 'center', fontSize: '12px' }}>
            <strong>SMARTLEAN CHILE</strong>
            <div style={{ color: '#64748b' }}>Ingeniería & Desarrollo de Proyectos</div>
          </div>
          <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '8px', textAlign: 'center', fontSize: '12px' }}>
            <strong>ACEPTACIÓN CLIENTE: {quote.client_name.toUpperCase()}</strong>
            <div style={{ color: '#64748b' }}>Firma y Fecha de Conformidad de Alcance</div>
          </div>
        </div>
      </div>
    </div>
  );
};
