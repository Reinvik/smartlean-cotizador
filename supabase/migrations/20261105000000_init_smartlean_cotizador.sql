-- =========================================================================
-- SMARTLEAN COTIZADOR & TICKETERA (cotiza.smartlean.cl)
-- Tablas: smartlean_quote_items, smartlean_quotes, smartlean_tickets
-- =========================================================================

-- 1. Catálogo de Precios y Servicios Configurables
CREATE TABLE IF NOT EXISTS public.smartlean_quote_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('base_plan', 'integration', 'content', 'maintenance', 'config')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_clp INTEGER NOT NULL DEFAULT 0,
  delivery_days TEXT DEFAULT '5 a 7 días',
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Cotizaciones Generadas con Briefing Técnico
CREATE TABLE IF NOT EXISTS public.smartlean_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_code TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  client_rut TEXT DEFAULT '',
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  project_objective TEXT DEFAULT '',
  selected_plan_id TEXT NOT NULL,
  selected_plan_name TEXT NOT NULL,
  selected_addons JSONB DEFAULT '[]'::jsonb,
  selected_maintenance JSONB DEFAULT null,
  briefing_answers JSONB DEFAULT '{}'::jsonb,
  subtotal_clp INTEGER NOT NULL DEFAULT 0,
  discount_clp INTEGER NOT NULL DEFAULT 0,
  total_clp INTEGER NOT NULL DEFAULT 0,
  estimated_timeline TEXT DEFAULT '1 a 2 semanas',
  warranty_days INTEGER DEFAULT 15,
  status TEXT DEFAULT 'emitida' CHECK (status IN ('emitida', 'en_revision', 'aprobada', 'en_desarrollo', 'entregada', 'rechazada')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Ticketera de Solicitudes, Garantía (15 días) y Anexos
CREATE TABLE IF NOT EXISTS public.smartlean_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code TEXT UNIQUE NOT NULL,
  quote_code TEXT DEFAULT '',
  client_name TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  client_email TEXT NOT NULL,
  client_phone TEXT DEFAULT '',
  request_type TEXT NOT NULL CHECK (request_type IN ('nuevo_proyecto', 'garantia_15d', 'cambio_alcance', 'soporte_mensual')),
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'recibido' CHECK (status IN ('recibido', 'en_analisis', 'en_progreso', 'esperando_cliente', 'cotizado_anexo', 'resuelto')),
  admin_notes TEXT DEFAULT '',
  extra_cost_clp INTEGER DEFAULT 0,
  timeline_events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_smartlean_quotes_code ON public.smartlean_quotes(quote_code);
CREATE INDEX IF NOT EXISTS idx_smartlean_quotes_created ON public.smartlean_quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smartlean_tickets_code ON public.smartlean_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_smartlean_tickets_email ON public.smartlean_tickets(client_email);
CREATE INDEX IF NOT EXISTS idx_smartlean_tickets_created ON public.smartlean_tickets(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.smartlean_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartlean_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartlean_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público y administración para el cotizador y ticketera
DROP POLICY IF EXISTS "Lectura pública de items de cotizacion" ON public.smartlean_quote_items;
CREATE POLICY "Lectura pública de items de cotizacion"
  ON public.smartlean_quote_items FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Edición de items de cotizacion" ON public.smartlean_quote_items;
CREATE POLICY "Edición de items de cotizacion"
  ON public.smartlean_quote_items FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso a cotizaciones SmartLean" ON public.smartlean_quotes;
CREATE POLICY "Acceso a cotizaciones SmartLean"
  ON public.smartlean_quotes FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso a tickets SmartLean" ON public.smartlean_tickets;
CREATE POLICY "Acceso a tickets SmartLean"
  ON public.smartlean_tickets FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =========================================================================
-- SEED DATA INICIAL PARA CHILE (CLP)
-- =========================================================================
INSERT INTO public.smartlean_quote_items (id, category, name, description, price_clp, delivery_days, features, sort_order)
VALUES
  -- PLANES BASE
  ('plan-landing', 'base_plan', 'Landing Page de Alta Conversión', 'Página única estratégica enfocada en captar clientes potenciales por WhatsApp o formulario directo.', 220000, '3 a 5 días hábiles', '["Diseño UX/UI responsivo (Móvil + Escritorio)", "Sección Héroe, Beneficios, Servicios y Testimonios", "Botón flotante de WhatsApp y Formulario directo", "Optimización de velocidad y Certificado SSL", "15 días corridos de Garantía Técnica"]', 1),
  ('plan-corp', 'base_plan', 'Sitio Web Corporativo Profesional', 'Presencia institucional completa de 4 a 6 secciones para empresas que buscan proyectar máxima solidez.', 420000, '7 a 12 días hábiles', '["Hasta 6 secciones (Inicio, Nosotros, Servicios, Proyectos, Contacto)", "Diseño corporativo a medida alineado a tu marca", "Formulario corporativo + Mapa interactivo + WhatsApp", "Optimización SEO técnico inicial en Google", "Panel autoadministrable básico + 15 días de Garantía"]', 2),
  ('plan-catalog', 'base_plan', 'Catálogo Digital Interactivo', 'Vitrina de productos con filtros por categoría y cotización directa al WhatsApp de ventas (sin cobro con tarjeta).', 550000, '10 a 15 días hábiles', '["Catálogo con buscador y filtros por categorías", "Carga inicial de hasta 30 productos con galería", "Carrito de cotización rápida enviado directo a WhatsApp", "Panel de administración de productos y precios", "15 días corridos de Garantía Técnica"]', 3),
  ('plan-ecom', 'base_plan', 'Tienda Online E-Commerce Completa', 'Venta automática 24/7 con carrito de compras, control de stock e integración de pagos en Chile.', 850000, '15 a 21 días hábiles', '["Carrito de compras, gestión de inventario y pedidos", "Integración con 1 pasarela de pago (Webpay Plus, Flow o MercadoPago)", "Cálculo de despacho por regiones/comunas", "Notificaciones automáticas por correo a comprador y tienda", "Capacitación de uso + 15 días de Garantía Técnica"]', 4),
  ('plan-webapp', 'base_plan', 'Sistema Web / Software a Medida', 'Aplicación web privada con inicio de sesión, roles de usuario, base de datos en la nube y paneles operativos.', 1450000, '3 a 5 semanas', '["Arquitectura Cloud moderna (React + Base de Datos PostgreSQL)", "Autenticación segura con roles (Administrador, Operador, Cliente)", "Dashboard interactivo con métricas y exportación Excel/PDF", "Flujos de negocio personalizados y trazabilidad", "Garantía técnica de marcha blanca (15 días corridos)"]', 5),

  -- INTEGRACIONES Y MÓDULOS ADICIONALES
  ('addon-webpay', 'integration', 'Pasarela de Pago Adicional (Webpay / Flow / MercadoPago)', 'Configuración y certificación oficial de pasarela de pago adicional en pesos chilenos.', 120000, '+2 días', '["Certificación oficial en producción", "Pruebas de cobro y confirmación automática"]', 10),
  ('addon-shipping', 'integration', 'Integración Couriers (Starken / Chilexpress / Envíame)', 'Cálculo automático de tarifas de envío y generación de etiquetas logísticas.', 140000, '+3 días', '["Cotización dinámica por comuna de destino", "Conexión vía API con operador logístico"]', 11),
  ('addon-facturacion', 'integration', 'Conexión Facturación Electrónica SII (Bsale / OpenFactura / LibreDTE)', 'Emisión automática de boletas o facturas electrónicas tras cada venta.', 180000, '+4 días', '["Conexión API con proveedor de DTE", "Envío automático de boleta/factura al cliente"]', 12),
  ('addon-analytics', 'integration', 'Pack Marketing: Google Analytics 4 + Píxel de Meta Ads', 'Configuración de eventos de conversión para medir campañas de Instagram, Facebook y Google.', 65000, '+1 día', '["Instalación de GA4 y Meta Pixel", "Medición de clics en WhatsApp y formularios"]', 13),
  ('addon-roles', 'integration', 'Módulo de Usuarios y Portal de Clientes con Login', 'Área privada donde tus clientes pueden iniciar sesión, ver su historial o descargar documentos.', 280000, '+5 días', '["Login seguro con recuperación de clave", "Perfil privado por cliente"]', 14),
  ('addon-ai-bot', 'integration', 'Asistente IA de Atención y Captación 24/7', 'Chatbot entrenado con la información de tu negocio para responder dudas y agendar clientes.', 220000, '+3 días', '["Entrenamiento con catálogo y preguntas frecuentes", "Derivación inteligente a ejecutivo en WhatsApp"]', 15),

  -- CONTENIDOS, DISEÑO E INFRAESTRUCTURA
  ('content-branding', 'content', 'Diseño de Logotipo & Kit de Identidad Visual', 'Creación de logo profesional en alta resolución, paleta de colores corporativos y tipografías.', 110000, '+3 días', '["2 propuestas de diseño + ajustes", "Entrega en formatos editables (SVG, PNG transparente, PDF)"]', 20),
  ('content-copy', 'content', 'Redacción Comercial Persuasiva (Copywriting + Fotos Stock)', 'Redactamos todos los textos de tu web orientados a vender y seleccionamos fotografías licenciadas.', 95000, '+2 días', '["Textos optimizados para conversión y SEO", "Selección de banco de imágenes de alta calidad"]', 21),
  ('content-domain-hosting', 'content', 'Dominio .CL (NIC Chile) + Hosting Cloud Alta Velocidad (1 Año)', 'Registro de tu marca en NIC Chile, correos corporativos y servidor de alta disponibilidad por 12 meses.', 90000, '+1 día', '["Inscripción de dominio .cl por 1 año", "Servidor Cloud ultra rápido + SSL + Cuentas de correo"]', 22),

  -- PLANES DE MANTENIMIENTO MENSUAL (POST-GARANTÍA)
  ('maint-none', 'maintenance', 'Sin Plan Mensual (Solo Garantía Inicial de 15 Días)', 'Incluye los 15 días corridos de marcha blanca para bugs técnicos. Ajustes posteriores se cotizan por hora o anexo.', 0, 'Incluido', '["15 días corridos de garantía por errores técnicos", "Soporte posterior vía ticket a valor hora ($25.000 CLP/hr)"]', 30),
  ('maint-basic', 'maintenance', 'Plan Continuidad & Soporte Básico (Mensual)', 'Tranquilidad total: mantenemos tu web rápida, segura, respaldada y realizamos cambios menores mes a mes.', 45000, 'Mensual', '["Hosting Cloud + Renovación SSL + Copias de seguridad semanales", "Monitoreo de disponibilidad 24/7 y actualizaciones de seguridad", "Hasta 2 horas mensuales para cambios de textos, fotos o precios"]', 31),
  ('maint-pro', 'maintenance', 'Plan Evolución & Soporte Prioritario (Mensual)', 'Ideal para tiendas online y sistemas activos que requieren soporte preferente y mejoras continuas.', 85000, 'Mensual', '["Todo lo del Plan Básico + Copias de seguridad diarias", "Soporte prioritario vía Ticketera y WhatsApp directo", "Hasta 4 horas mensuales acumulables para mejoras o nuevas secciones"]', 32),

  -- PARÁMETROS GLOBALES
  ('config-hourly-rate', 'config', 'Valor Hora de Desarrollo / Cambio Fuera de Alcance', 'Tarifa referencial para requerimientos fuera del documento inicial o posteriores a los 15 días de garantía.', 25000, '1 hora', '["Evaluación técnica previa en ticketera", "Presupuesto cerrado antes de ejecutar"]', 40)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_clp = EXCLUDED.price_clp,
  delivery_days = EXCLUDED.delivery_days,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Seed de ejemplo para Cotización y Ticket demostrativo
INSERT INTO public.smartlean_quotes (quote_code, client_name, company_name, client_rut, client_email, client_phone, project_objective, selected_plan_id, selected_plan_name, selected_addons, selected_maintenance, briefing_answers, subtotal_clp, discount_clp, total_clp, estimated_timeline, warranty_days, status)
VALUES (
  'SL-2026-1042',
  'Carlos Valdivia',
  'Importadora Austral SpA',
  '77.412.890-K',
  'cvaldivia@importadoraaustral.cl',
  '+56 9 8412 3390',
  'Vender repuestos industriales en todo Chile con Webpay Plus y despacho por Starken.',
  'plan-ecom',
  'Tienda Online E-Commerce Completa',
  '[{"id": "addon-shipping", "name": "Integración Couriers (Starken / Chilexpress / Envíame)", "price_clp": 140000}, {"id": "addon-analytics", "name": "Pack Marketing: Google Analytics 4 + Píxel de Meta Ads", "price_clp": 65000}]'::jsonb,
  '{"id": "maint-basic", "name": "Plan Continuidad & Soporte Básico (Mensual)", "price_clp": 45000}'::jsonb,
  '{"rubro": "Importación y distribución de repuestos industriales", "publico_objetivo": "Talleres y empresas de transporte en Chile", "estado_logo": "Sí, cuenta con logo vectorial y manual de marca", "estado_contenido": "Entregará catálogo en Excel y fotografías propias", "dominio": "www.importadoraaustral.cl", "referencias": "sodimac.cl, autoplanet.cl"}'::jsonb,
  1055000,
  0,
  1055000,
  '15 a 21 días hábiles',
  15,
  'en_desarrollo'
) ON CONFLICT (quote_code) DO NOTHING;

INSERT INTO public.smartlean_tickets (ticket_code, quote_code, client_name, company_name, client_email, client_phone, request_type, priority, subject, description, status, admin_notes, extra_cost_clp, timeline_events)
VALUES (
  'TK-1042',
  'SL-2026-1042',
  'Carlos Valdivia',
  'Importadora Austral SpA',
  'cvaldivia@importadoraaustral.cl',
  '+56 9 8412 3390',
  'cambio_alcance',
  'media',
  'Agregar módulo de facturación automática con Bsale',
  'Hola equipo SmartLean, junto con el avance de la tienda online nos gustaría sumar la emisión automática de facturas electrónicas conectada con nuestra cuenta de Bsale.',
  'cotizado_anexo',
  'Se evaluó integración vía API REST de Bsale. Como es una funcionalidad adicional al alcance inicial, se cotizó como Anexo de Proyecto por $180.000 CLP (+4 días hábiles).',
  180000,
  '[
    {"date": "2026-11-04 10:30", "status": "recibido", "title": "Ticket ingresado en plataforma", "detail": "Solicitud registrada bajo código TK-1042 vinculada a cotización SL-2026-1042."},
    {"date": "2026-11-04 15:45", "status": "en_analisis", "title": "Revisión por Ingeniería SmartLean", "detail": "Verificando documentación de API Bsale y credenciales de facturación electrónica."},
    {"date": "2026-11-05 09:20", "status": "cotizado_anexo", "title": "Propuesta de Anexo Emitida ($180.000 CLP)", "detail": "Al tratarse de un módulo adicional al alcance original, se generó anexo de proyecto listo para aprobación."}
  ]'::jsonb
) ON CONFLICT (ticket_code) DO NOTHING;
