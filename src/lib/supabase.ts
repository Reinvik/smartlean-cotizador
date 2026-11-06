import { createClient } from '@supabase/supabase-js';
import type { QuoteItem } from '../types/cotizador';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iuzpgljjfeobxlptmsma.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_SPDWhx5zkQ9y3SiG6FXUhA_1A6ylpl7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function generateQuoteCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `SL-2026-${num}`;
}

export function generateTicketCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TK-${num}`;
}

export const FALLBACK_QUOTE_ITEMS: QuoteItem[] = [
  {
    id: 'plan-landing',
    category: 'base_plan',
    name: 'Landing Page de Alta Conversión',
    description: 'Página única estratégica enfocada en captar clientes potenciales por WhatsApp o formulario directo.',
    price_clp: 220000,
    delivery_days: '3 a 5 días hábiles',
    features: [
      'Diseño UX/UI responsivo (Móvil + Escritorio)',
      'Sección Héroe, Beneficios, Servicios y Testimonios',
      'Botón flotante de WhatsApp y Formulario directo',
      'Optimización de velocidad y Certificado SSL',
      '15 días corridos de Garantía Técnica',
    ],
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'plan-corp',
    category: 'base_plan',
    name: 'Sitio Web Corporativo Profesional',
    description: 'Presencia institucional completa de 4 a 6 secciones para empresas que buscan proyectar máxima solidez.',
    price_clp: 420000,
    delivery_days: '7 a 12 días hábiles',
    features: [
      'Hasta 6 secciones (Inicio, Nosotros, Servicios, Proyectos, Contacto)',
      'Diseño corporativo a medida alineado a tu marca',
      'Formulario corporativo + Mapa interactivo + WhatsApp',
      'Optimización SEO técnico inicial en Google',
      'Panel autoadministrable básico + 15 días de Garantía',
    ],
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'plan-catalog',
    category: 'base_plan',
    name: 'Catálogo Digital Interactivo',
    description: 'Vitrina de productos con filtros por categoría y cotización directa al WhatsApp de ventas.',
    price_clp: 550000,
    delivery_days: '10 a 15 días hábiles',
    features: [
      'Catálogo con buscador y filtros por categorías',
      'Carga inicial de hasta 30 productos con galería',
      'Carrito de cotización rápida enviado directo a WhatsApp',
      'Panel de administración de productos y precios',
      '15 días corridos de Garantía Técnica',
    ],
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'plan-ecom',
    category: 'base_plan',
    name: 'Tienda Online E-Commerce Completa',
    description: 'Venta automática 24/7 con carrito de compras, control de stock e integración de pagos en Chile.',
    price_clp: 850000,
    delivery_days: '15 a 21 días hábiles',
    features: [
      'Carrito de compras, gestión de inventario y pedidos',
      'Integración con 1 pasarela de pago (Webpay Plus, Flow o MercadoPago)',
      'Cálculo de despacho por regiones/comunas',
      'Notificaciones automáticas por correo a comprador y tienda',
      'Capacitación de uso + 15 días de Garantía Técnica',
    ],
    is_active: true,
    sort_order: 4,
  },
  {
    id: 'plan-webapp',
    category: 'base_plan',
    name: 'Sistema Web / Software a Medida',
    description: 'Aplicación web privada con inicio de sesión, roles de usuario, base de datos en la nube y paneles operativos.',
    price_clp: 1450000,
    delivery_days: '3 a 5 semanas',
    features: [
      'Arquitectura Cloud moderna (React + Base de Datos PostgreSQL)',
      'Autenticación segura con roles (Administrador, Operador, Cliente)',
      'Dashboard interactivo con métricas y exportación Excel/PDF',
      'Flujos de negocio personalizados y trazabilidad',
      'Garantía técnica de marcha blanca (15 días corridos)',
    ],
    is_active: true,
    sort_order: 5,
  },
];
