export type ItemCategory = 'base_plan' | 'integration' | 'content' | 'maintenance' | 'config';

export interface QuoteItem {
  id: string;
  category: ItemCategory;
  name: string;
  description: string;
  price_clp: number;
  delivery_days: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  updated_at?: string;
}

export interface BriefingAnswers {
  // Bloque A: Diagnóstico del Negocio y Objetivo
  nombre_negocio: string;
  productos_servicios: string;
  objetivo_principal: string;
  cliente_ideal_problema: string;
  referencias_urls: string;

  // Bloque B: Alcance y Funcionalidades
  tipo_proyecto: string;
  integraciones: string[];
  autoadministracion: string;

  // Bloque C: Material y Contenidos
  estado_logo: string;
  redaccion_fotos: string;
  dominio_hosting: string;

  // Campos de compatibilidad
  rubro?: string;
  publico_objetivo?: string;
  referencias?: string;
  dominio?: string;
  estado_contenido?: string;
  cantidad_productos?: string;
  notas_adicionales?: string;
}

export interface SelectedAddon {
  id: string;
  name: string;
  price_clp: number;
  delivery_days?: string;
}

export interface QuoteRecord {
  id?: string;
  quote_code: string;
  client_name: string;
  company_name: string;
  client_rut: string;
  client_email: string;
  client_phone: string;
  project_objective: string;
  selected_plan_id: string;
  selected_plan_name: string;
  selected_addons: SelectedAddon[];
  selected_maintenance: SelectedAddon | null;
  briefing_answers: BriefingAnswers;
  subtotal_clp: number;
  discount_clp: number;
  total_clp: number;
  estimated_timeline: string;
  warranty_days: number;
  status: 'emitida' | 'en_revision' | 'aprobada' | 'en_desarrollo' | 'entregada' | 'rechazada';
  created_at?: string;
}

export type TicketRequestType = 'nuevo_proyecto' | 'garantia_15d' | 'cambio_alcance' | 'soporte_mensual';
export type TicketPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type TicketStatus = 'recibido' | 'en_analisis' | 'en_progreso' | 'esperando_cliente' | 'cotizado_anexo' | 'resuelto';

export interface TimelineEvent {
  date: string;
  status: TicketStatus;
  title: string;
  detail: string;
}

export interface TicketRecord {
  id?: string;
  ticket_code: string;
  quote_code: string;
  client_name: string;
  company_name: string;
  client_email: string;
  client_phone: string;
  request_type: TicketRequestType;
  priority: TicketPriority;
  subject: string;
  description: string;
  status: TicketStatus;
  admin_notes: string;
  extra_cost_clp: number;
  timeline_events: TimelineEvent[];
  created_at?: string;
  updated_at?: string;
}
