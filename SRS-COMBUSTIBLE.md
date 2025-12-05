SRS – Agente de WhatsApp para Registro de Combustible y Dashboard

Fecha: 2025-10-23

Tecnologías: React (Front), C# .NET (APIs), SQL Server (BD).
# **1. Objetivo**
Implementar un sistema que reemplace las planillas manuales de combustible mediante un agente de WhatsApp, capturando datos estructurados y evidencias (texto, audio, fotos, ubicación) para alimentar un dashboard y reportes, con frontoffice para administración y habilitación de usuarios.
# **2. Alcance**
MVP: Captura vía WhatsApp, dashboard básico, reportes estándar, ABM de usuarios y vehículos.

Futuro: OCR para odómetro/cuenta-litros, alertas inteligentes, integración con contabilidad.
# **3. Requerimientos Funcionales**
## **3.1 Captura por WhatsApp**
• Autenticación de usuarios por whitelist desde frontoffice.

• Flujo guiado: 'cargar combustible' abre secuencia de datos requeridos.

• Datos obligatorios configurables: vehículo/maquinaria, surtidor/tanque, litros, fecha/hora, geolocalización.

• Evidencias: fotos de surtidor, cuenta-litros, odómetro o horómetro, audio opcional, ubicación.

• Confirmación: resumen de carga + ID de evento.

• Validaciones de consistencia: litros máximos, duplicados, ubicación válida.
## **3.2 Frontoffice (React)**
• ABM de empresas, vehículos, usuarios, surtidores y tanques.

• Configuración de políticas: evidencias obligatorias, umbrales, precios de combustible.

• Dashboard con KPIs y reportes.

• Control de acceso por roles: operador, supervisor, auditor.
## **3.3 Reportes sugeridos**
• Consumo por vehículo (L/100km, L/hora).

• Litros por surtidor/tanque y por operador.

• Costos por centro de costos / lote / labor.

• Análisis de desvíos (fuera de rango, anomalías).

• Ranking de eficiencia y trazabilidad de evidencias.
# **4. Requerimientos No Funcionales**
• Escalabilidad multi-empresa (multi-tenant).

• Disponibilidad 99.5%.

• Seguridad: JWT, cifrado TLS, control por roles.

• Trazabilidad y auditoría de eventos.

• Observabilidad: logs estructurados y métricas.

• Rendimiento API < 300ms (p95).

• Portabilidad cloud-agnostic (Docker + blob storage).
# **5. Modelo de Datos**
Entidades principales: Empresa, Usuario, Vehículo, Surtidor, Tanque, CentroCosto, EventoCarga, Evidencia, Alerta, AuditLog.
# **6. APIs (C# .NET)**
• POST /webhooks/whatsapp – Recepción de mensajes.

• POST /api/eventos – Crear evento.

• GET /api/eventos – Listar eventos con filtros.

• GET /api/reportes/{tipo} – Reportes en Excel/PDF.

• CRUD de ABM: empresas, usuarios, vehículos, surtidores, tanques, centros de costo.
# **7. Dashboard (React)**
KPIs: litros totales, costo total, consumo promedio, stock por tanque, % eventos validados, alertas abiertas.

Visualizaciones: series temporales, barras por vehículo/surtidor, mapa de cargas, outliers, trazabilidad de fotos.
# **8. Roadmap**
• Sprint 1-2: WhatsApp webhook + persistencia básica.

• Sprint 3-4: Evidencias y dashboard inicial.

• Sprint 5-6: Reportes avanzados y alertas.

• Sprint 7+: OCR, IA predictiva, integraciones contables.
