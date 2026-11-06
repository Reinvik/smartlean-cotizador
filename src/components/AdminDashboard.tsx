import React, { useState } from 'react';
import type { QuoteItem, QuoteRecord, TicketRecord, TicketStatus, ItemCategory } from '../types/cotizador';
import { formatCLP, supabase } from '../lib/supabase';
import {
  DollarSign,
  FileText,
  Ticket,
  Layers,
  User,
  Camera,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Save,
  Plus,
  CheckCircle2,
  Eye,
  Send,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardProps {
  user: { name: string; email: string; role: string };
  items: QuoteItem[];
  quotes: QuoteRecord[];
  tickets: TicketRecord[];
  onRefreshData: () => Promise<void>;
  onOpenQuoteModal: (quote: QuoteRecord) => void;
  onLogout: () => void;
  onSwitchToPublic: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  items,
  quotes,
  tickets,
  onRefreshData,
  onOpenQuoteModal,
  onLogout,
  onSwitchToPublic,
}) => {
  const [activeTab, setActiveTab] = useState<'pricing' | 'quotes' | 'tickets'>('pricing');
  const [editedItems, setEditedItems] = useState<Record<string, Partial<QuoteItem>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Item form
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('integration');
  const [newItemPrice, setNewItemPrice] = useState(100000);
  const [newItemDays, setNewItemDays] = useState('+3 días');
  const [newItemDesc, setNewItemDesc] = useState('');

  // Ticket update states
  const [ticketUpdateNotes, setTicketUpdateNotes] = useState<Record<string, string>>({});
  const [ticketExtraCost, setTicketExtraCost] = useState<Record<string, number>>({});
  const [ticketNewEventTitle, setTicketNewEventTitle] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleFieldChange = (id: string, field: keyof QuoteItem, value: unknown) => {
    setEditedItems((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveItem = async (item: QuoteItem) => {
    const changes = editedItems[item.id];
    if (!changes) return;

    setSavingId(item.id);
    const updated = {
      ...item,
      ...changes,
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('smartlean_quote_items').upsert([updated]);
      await onRefreshData();
      setEditedItems((prev) => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
      showToast(`✅ Precio/valor actualizado: ${updated.name}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const id = `custom-${Date.now()}`;
    const newItem: QuoteItem = {
      id,
      category: newItemCategory,
      name: newItemName.trim(),
      description: newItemDesc.trim() || 'Módulo o servicio configurable en el cotizador.',
      price_clp: Number(newItemPrice) || 0,
      delivery_days: newItemDays.trim() || '+2 días',
      features: ['Incluido en documento de alcance oficial'],
      is_active: true,
      sort_order: 50,
    };

    await supabase.from('smartlean_quote_items').insert([newItem]);
    await onRefreshData();
    setShowNewItem(false);
    setNewItemName('');
    setNewItemDesc('');
    showToast(`✅ Nuevo ítem agregado al cotizador: ${newItem.name}`);
  };

  const handleUpdateQuoteStatus = async (quoteCode: string, status: QuoteRecord['status']) => {
    await supabase.from('smartlean_quotes').update({ status }).eq('quote_code', quoteCode);
    await onRefreshData();
    showToast(`✅ Estado de cotización ${quoteCode} actualizado a ${status.toUpperCase()}`);
  };

  const handleUpdateTicket = async (ticket: TicketRecord, newStatus: TicketStatus) => {
    const code = ticket.ticket_code;
    const notes = ticketUpdateNotes[code] !== undefined ? ticketUpdateNotes[code] : ticket.admin_notes;
    const extra = ticketExtraCost[code] !== undefined ? ticketExtraCost[code] : ticket.extra_cost_clp;
    const eventTitle =
      ticketNewEventTitle[code]?.trim() ||
      `Actualización de estado a: ${newStatus.replace('_', ' ').toUpperCase()}`;

    const nowStr = new Date().toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedEvents = [
      ...(ticket.timeline_events || []),
      {
        date: nowStr,
        status: newStatus,
        title: eventTitle,
        detail: notes,
      },
    ];

    await supabase
      .from('smartlean_tickets')
      .update({
        status: newStatus,
        admin_notes: notes,
        extra_cost_clp: Number(extra) || 0,
        timeline_events: updatedEvents,
        updated_at: new Date().toISOString(),
      })
      .eq('ticket_code', code);

    setTicketNewEventTitle((prev) => ({ ...prev, [code]: '' }));
    await onRefreshData();
    showToast(`✅ Ticket ${code} actualizado y notificado en el tracker público`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--void)' }}>
      {/* Official SmartLean Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Layers size={18} />
          </div>
          <div className="sidebar-logo-text-wrapper">
            <span className="sidebar-logo-text">Cotizador Pro</span>
            <span className="sidebar-logo-subtext">BY SMARTLEAN</span>
          </div>
        </div>

        <div className="sidebar-menu-category">MENU PRINCIPAL</div>

        <nav className="sidebar-menu">
          <button
            className={`sidebar-item ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <DollarSign size={18} />
            Tarifario & Precios CLP
          </button>

          <button
            className={`sidebar-item ${activeTab === 'quotes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quotes')}
          >
            <FileText size={18} />
            Cotizaciones ({quotes.length})
          </button>

          <button
            className={`sidebar-item ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <Ticket size={18} />
            Ticketera ({tickets.length})
          </button>

          <button className="sidebar-item" onClick={onSwitchToPublic} style={{ marginTop: '12px' }}>
            <ExternalLink size={18} />
            Ver Cotizador Público
          </button>
        </nav>

        {/* Footer Sidebar - Usuario Activo estilo Nexus Lean */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar-wrapper" style={{ cursor: 'pointer' }}>
              <div className="user-avatar-circle">
                <User size={20} />
              </div>
              <div className="user-avatar-camera">
                <Camera size={10} />
              </div>
            </div>
            <div className="user-details">
              <span className="user-name">{user.name || 'Ariel Mella'}</span>
              <span className="user-email">{user.email || 'ariel@smartlean.cl'}</span>
              <span className="user-role-badge">
                {user.role === 'nexusowner' ? 'Super Admin' : 'Administrador'}
              </span>
            </div>
          </div>

          <button className="btn-change-profile" onClick={() => showToast('Perfil Corporativo SmartLean Activo')}>
            <ShieldCheck size={15} />
            <span>CAMBIAR CONTRASEÑA / PERFIL</span>
          </button>

          <div className="sidebar-footer-buttons">
            <button className="btn-sidebar-action btn-sidebar-restart" onClick={onRefreshData}>
              <RefreshCw size={12} className="restart-icon" />
              REINICIAR
            </button>
            <button className="btn-sidebar-action btn-sidebar-logout" onClick={onLogout}>
              <LogOut size={12} />
              SALIR
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className="admin-main-content"
        style={{
          flex: 1,
          marginLeft: '265px',
          padding: '32px 36px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {toastMsg && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 300,
              background: '#0f172a',
              border: '1px solid #00d2ff',
              color: '#ffffff',
              padding: '12px 18px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 10px 30px rgba(0,210,255,0.25)',
            }}
          >
            {toastMsg}
          </div>
        )}

        {/* TAB 1: PRICING CONFIGURATOR */}
        {activeTab === 'pricing' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '26px',
              }}
            >
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.03em' }}>
                  Gestor de Tarifario & Precios para Chile (CLP)
                </h1>
                <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
                  Modifica cualquier valor, plazo de entrega o descripción. Los cambios impactan de inmediato en
                  cotiza.smartlean.cl.
                </p>
              </div>
              <button onClick={() => setShowNewItem(!showNewItem)} className="btn-slate">
                <Plus size={15} />
                + Nuevo Servicio o Módulo
              </button>
            </div>

            {showNewItem && (
              <form
                onSubmit={handleCreateNewItem}
                className="glass-card"
                style={{ marginBottom: '24px', border: '1px solid rgba(0,210,255,0.4)' }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px', color: '#00d2ff' }}>
                  Agregar Nuevo Ítem al Catálogo del Cotizador
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <label className="field-label">Nombre del Servicio / Plan</label>
                    <input
                      type="text"
                      className="input-dark"
                      placeholder="Ej: Integración ERP SAP / Softland"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Categoría</label>
                    <select
                      className="input-dark"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
                    >
                      <option value="base_plan">Plan Base Principal</option>
                      <option value="integration">Integración Técnica</option>
                      <option value="content">Contenido / Diseño / Hosting</option>
                      <option value="maintenance">Plan de Mantenimiento Mensual</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Precio Neto (CLP)</label>
                    <input
                      type="number"
                      className="input-dark"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Plazo Estimado</label>
                    <input
                      type="text"
                      className="input-dark"
                      placeholder="Ej: +4 días hábiles"
                      value={newItemDays}
                      onChange={(e) => setNewItemDays(e.target.value)}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Descripción para el Cliente</label>
                    <input
                      type="text"
                      className="input-dark"
                      placeholder="Describe qué incluye este ítem..."
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary">
                  Guardar en el Catálogo
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {items.map((item) => {
                const draft = editedItems[item.id] || {};
                const currentName = draft.name !== undefined ? draft.name : item.name;
                const currentPrice = draft.price_clp !== undefined ? draft.price_clp : item.price_clp;
                const currentDays = draft.delivery_days !== undefined ? draft.delivery_days : item.delivery_days;
                const currentDesc = draft.description !== undefined ? draft.description : item.description;
                const currentActive = draft.is_active !== undefined ? draft.is_active : item.is_active;
                const hasChanges = Object.keys(draft).length > 0;

                return (
                  <div
                    key={item.id}
                    className="glass-card"
                    style={{
                      padding: '18px 20px',
                      border: hasChanges ? '1px solid #00d2ff' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 160px 150px auto',
                        gap: '14px',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#00d2ff',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {item.category.replace('_', ' ')}
                        </span>
                        <input
                          type="text"
                          className="input-dark"
                          style={{ marginTop: 4, fontWeight: 700 }}
                          value={currentName}
                          onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="field-label">Valor CLP ($)</label>
                        <input
                          type="number"
                          className="input-dark"
                          style={{ fontWeight: 800, color: '#00d2ff' }}
                          value={currentPrice}
                          onChange={(e) => handleFieldChange(item.id, 'price_clp', Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="field-label">Plazo / Frecuencia</label>
                        <input
                          type="text"
                          className="input-dark"
                          value={currentDays}
                          onChange={(e) => handleFieldChange(item.id, 'delivery_days', e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '18px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={currentActive}
                            onChange={(e) => handleFieldChange(item.id, 'is_active', e.target.checked)}
                            style={{ accentColor: '#00d2ff' }}
                          />
                          Activo
                        </label>
                        <button
                          onClick={() => handleSaveItem(item)}
                          disabled={!hasChanges || savingId === item.id}
                          className={hasChanges ? 'btn-primary' : 'btn-slate'}
                          style={{ padding: '10px 14px' }}
                        >
                          <Save size={14} />
                          {savingId === item.id ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <input
                        type="text"
                        className="input-dark"
                        style={{ fontSize: '12px', color: '#94a3b8', padding: '8px 12px' }}
                        value={currentDesc}
                        onChange={(e) => handleFieldChange(item.id, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: QUOTES MANAGER */}
        {activeTab === 'quotes' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 900 }}>Cotizaciones & Briefings Generados</h1>
              <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
                Revisa cada cotización realizada por tus clientes o tu socio comercial, descarga el PDF o actualiza su
                etapa.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {quotes.map((q) => (
                <div key={q.quote_code} className="glass-card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '14px',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          background: 'rgba(0,210,255,0.12)',
                          color: '#00d2ff',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: '12px',
                          fontWeight: 900,
                        }}
                      >
                        {q.quote_code}
                      </span>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: 6 }}>
                        {q.client_name} — <span style={{ color: '#94a3b8' }}>{q.company_name || 'Particular'}</span>
                      </h3>
                      <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                        📧 {q.client_email} • 📱 {q.client_phone} {q.client_rut ? `• RUT: ${q.client_rut}` : ''}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#00d2ff' }}>
                        {formatCLP(q.total_clp)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{q.selected_plan_name}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      fontSize: '12.5px',
                      color: '#cbd5e1',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <strong>Objetivo:</strong> {q.project_objective}
                    </div>
                    <div>
                      <strong>Rubro / Cliente Ideal:</strong> {q.briefing_answers?.rubro || 'No especificado'}
                    </div>
                    <div>
                      <strong>Referencias:</strong> {q.briefing_answers?.referencias || 'No especificadas'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Estado:</span>
                      <select
                        className="input-dark"
                        style={{ width: 'auto', padding: '7px 12px', fontSize: '12px' }}
                        value={q.status}
                        onChange={(e) => handleUpdateQuoteStatus(q.quote_code, e.target.value as QuoteRecord['status'])}
                      >
                        <option value="emitida">Emitida</option>
                        <option value="en_revision">En Revisión</option>
                        <option value="aprobada">Aprobada por Cliente</option>
                        <option value="en_desarrollo">En Desarrollo</option>
                        <option value="entregada">Entregada (Corriendo 15d Garantía)</option>
                      </select>
                    </div>

                    <button onClick={() => onOpenQuoteModal(q)} className="btn-slate">
                      <Eye size={14} />
                      Abrir Documento Oficial PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TICKETS MANAGER */}
        {activeTab === 'tickets' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 900 }}>Administración de Ticketera, Garantías y Anexos</h1>
              <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
                Actualiza el estado de las solicitudes, responde a los clientes y asigna valor en CLP cuando una
                solicitud esté fuera de los 15 días de garantía o sea un nuevo módulo.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {tickets.map((t) => (
                <div key={t.ticket_code} className="glass-card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          background: '#00d2ff',
                          color: '#050811',
                          fontWeight: 900,
                          fontSize: '12px',
                          padding: '3px 10px',
                          borderRadius: 6,
                          marginRight: 8,
                        }}
                      >
                        {t.ticket_code}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Cotización vinculada: <strong>{t.quote_code || 'N/A'}</strong> • Tipo:{' '}
                        <strong>{t.request_type.toUpperCase()}</strong>
                      </span>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, marginTop: 6 }}>{t.subject}</h3>
                      <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                        Cliente: {t.client_name} ({t.company_name}) • {t.client_email}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(0,210,255,0.12)',
                        color: '#00d2ff',
                        fontWeight: 800,
                        fontSize: '12px',
                      }}
                    >
                      Estado actual: {t.status.toUpperCase()}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '13px',
                      color: '#e2e8f0',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '12px',
                      borderRadius: 10,
                      marginBottom: '14px',
                    }}
                  >
                    {t.description}
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <label className="field-label">Diagnóstico / Nota Visible al Cliente</label>
                      <input
                        type="text"
                        className="input-dark"
                        value={
                          ticketUpdateNotes[t.ticket_code] !== undefined
                            ? ticketUpdateNotes[t.ticket_code]
                            : t.admin_notes
                        }
                        onChange={(e) =>
                          setTicketUpdateNotes({ ...ticketUpdateNotes, [t.ticket_code]: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="field-label">Valor Anexo Extra CLP (Si está fuera de alcance)</label>
                      <input
                        type="number"
                        className="input-dark"
                        value={
                          ticketExtraCost[t.ticket_code] !== undefined
                            ? ticketExtraCost[t.ticket_code]
                            : t.extra_cost_clp
                        }
                        onChange={(e) =>
                          setTicketExtraCost({ ...ticketExtraCost, [t.ticket_code]: Number(e.target.value) })
                        }
                      />
                    </div>

                    <div>
                      <label className="field-label">Título de Nuevo Hito en el Timeline</label>
                      <input
                        type="text"
                        className="input-dark"
                        placeholder="Ej: Ajuste completado en producción"
                        value={ticketNewEventTitle[t.ticket_code] || ''}
                        onChange={(e) =>
                          setTicketNewEventTitle({ ...ticketNewEventTitle, [t.ticket_code]: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(
                      [
                        ['en_analisis', 'En Análisis'],
                        ['en_progreso', 'En Progreso'],
                        ['cotizado_anexo', 'Cotizar como Anexo Extra'],
                        ['esperando_cliente', 'Esperando Cliente'],
                        ['resuelto', 'Marcar Resuelto'],
                      ] as [TicketStatus, string][]
                    ).map(([stKey, stLabel]) => (
                      <button
                        key={stKey}
                        onClick={() => handleUpdateTicket(t, stKey)}
                        className={t.status === stKey ? 'btn-primary' : 'btn-slate'}
                        style={{ padding: '8px 13px', fontSize: '11.5px' }}
                      >
                        <Send size={12} />
                        {stLabel}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
