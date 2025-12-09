# 📋 Requerimientos de API - Backend

## Sistema de Gestión de Combustibles Multi-Tenant

**Fecha:** Diciembre 2025  
**Versión:** 1.0  
**Proyecto:** GoodApps - Combustibles

---

# 🎯 SLIDE 1: Resumen Ejecutivo

## Estado Actual de la API

| Módulo                       | Cobertura | Prioridad |
| ---------------------------- | --------- | --------- |
| Autenticación                | 60%       | 🔴 Alta   |
| Empresas (Companies)         | 40%       | 🔴 Alta   |
| Recursos (Vehículos/Tanques) | 70%       | 🟡 Media  |
| Eventos de Carga             | 20%       | 🔴 Alta   |
| Evidencias                   | 0%        | 🔴 Alta   |
| Centros de Costo             | 0%        | 🟡 Media  |
| Reportes                     | 0%        | 🟢 Baja   |
| Configuración                | 0%        | 🟡 Media  |

**Cobertura Total Estimada: 45%**

---

# 🔐 SLIDE 2: Autenticación - Endpoints Faltantes

## Endpoints Necesarios

### 1. Registro de Empresa (Self-Registration)

```
POST /api/Auth/Register
```

**Request Body:**

```json
{
  "companyName": "string",
  "companyCuit": "string",
  "companyEmail": "string",
  "companyPhone": "string",
  "adminFirstName": "string",
  "adminLastName": "string",
  "adminEmail": "string",
  "adminPassword": "string"
}
```

**Response:**

```json
{
  "success": true,
  "companyId": 1,
  "userId": "guid",
  "token": "jwt-token"
}
```

### 2. Recuperar Contraseña

```
POST /api/Auth/ForgotPassword
```

```json
{
  "email": "string"
}
```

### 3. Reset Password

```
POST /api/Auth/ResetPassword
```

```json
{
  "token": "string",
  "newPassword": "string"
}
```

### 4. Refresh Token

```
POST /api/Auth/RefreshToken
```

```json
{
  "refreshToken": "string"
}
```

---

# 🏢 SLIDE 3: Companies - Campos Adicionales

## Estructura Actual vs Requerida

### Campos Actuales ✅

- id, name, detail

### Campos Faltantes ❌

```json
{
  "id": 0,
  "name": "string",
  "detail": "string",
  "cuit": "string", // ❌ FALTA
  "email": "string", // ❌ FALTA
  "phone": "string", // ❌ FALTA
  "address": "string", // ❌ FALTA
  "logo": "string (url)", // ❌ FALTA
  "isActive": true, // ❌ FALTA
  "subscriptionStatus": "string", // ❌ FALTA (trial, active, suspended)
  "subscriptionEndDate": "date", // ❌ FALTA
  "createdAt": "datetime", // ❌ FALTA
  "theme": {
    // ❌ FALTA - Configuración de tema
    "primaryColor": "#1E2C56",
    "secondaryColor": "#4A90E2",
    "logoUrl": "string"
  }
}
```

### Endpoint Faltante

```
PATCH /api/Companies/Deactivate?id={id}
```

---

# 🚗 SLIDE 4: Resources - Campos por Tipo

## El modelo actual unifica todo en "Resource"

## Necesitamos campos específicos por tipo

### Tipo 1: VEHÍCULOS

```json
{
  "id": 0,
  "idType": 1,
  "idCompany": 0,
  "idBusinessUnit": 0,
  "name": "string",
  "identifier": "string",
  // CAMPOS FALTANTES ↓
  "plate": "string", // Patente
  "brand": "string", // Marca
  "model": "string", // Modelo
  "year": 2024, // Año
  "idFuelType": 0, // Tipo combustible
  "tankCapacity": 0, // Capacidad tanque (litros)
  "currentOdometer": 0, // Odómetro actual
  "currentHorometer": 0, // Horómetro actual (maquinaria)
  "idDriver": 0, // Chofer asignado
  "idCostCenter": 0, // Centro de costo
  "isActive": true
}
```

### Tipo 2: TANQUES

```json
{
  "id": 0,
  "idType": 2,
  "idCompany": 0,
  "idBusinessUnit": 0,
  "name": "string",
  "identifier": "string",
  // CAMPOS FALTANTES ↓
  "maxCapacity": 0, // Capacidad máxima (litros)
  "currentStock": 0, // Stock actual
  "idFuelType": 0, // Tipo combustible
  "latitude": 0.0, // Ubicación GPS
  "longitude": 0.0,
  "minStockAlert": 0, // Alerta stock mínimo
  "isActive": true
}
```

### Tipo 3: SURTIDORES

```json
{
  "id": 0,
  "idType": 3,
  "idCompany": 0,
  "idBusinessUnit": 0,
  "name": "string",
  "identifier": "string",
  // CAMPOS FALTANTES ↓
  "idTank": 0, // Tanque asociado
  "idFuelType": 0, // Tipo combustible
  "latitude": 0.0, // Ubicación GPS
  "longitude": 0.0,
  "isActive": true
}
```

---

# 👤 SLIDE 5: Drivers - Campos Adicionales

## Estructura Actual vs Requerida

### Campos Actuales ✅

- id, idCompany, name, dni, phoneNumber

### Campos Faltantes ❌

```json
{
  "id": 0,
  "idCompany": 0,
  "idBusinessUnit": 0, // ❌ FALTA - Filtrar por unidad
  "name": "string",
  "dni": "string",
  "phoneNumber": "string",
  "email": "string", // ❌ FALTA
  "licenseNumber": "string", // ❌ FALTA - Nro licencia
  "licenseExpiry": "date", // ❌ FALTA - Vencimiento
  "idVehicle": 0, // ❌ FALTA - Vehículo asignado
  "isActive": true,
  "createdAt": "datetime"
}
```

### Endpoint Faltante

```
GET /api/Drivers/GetByIdBusinessUnit?idBusinessUnit={id}
```

---

# ⛽ SLIDE 6: Eventos de Carga (CRÍTICO)

## Este es el CORE del negocio

## La API actual tiene LoadLiters pero es muy limitada

### Endpoint Principal Requerido

```
POST /api/Events/Create
GET /api/Events/GetAll
GET /api/Events/GetById?id={id}
GET /api/Events/GetByCompany?idCompany={id}
GET /api/Events/GetByBusinessUnit?idBusinessUnit={id}
GET /api/Events/GetByDriver?idDriver={id}
GET /api/Events/GetByVehicle?idVehicle={id}
GET /api/Events/GetByDateRange?from={date}&to={date}
PUT /api/Events/Update
PATCH /api/Events/Validate?id={id}
PATCH /api/Events/Reject?id={id}
```

### Estructura del Evento

```json
{
  "id": 0,
  "idCompany": 0,
  "idBusinessUnit": 0,
  "idDriver": 0, // Quien carga
  "idVehicle": 0, // Vehículo que recibe
  "idDispenser": 0, // Surtidor usado (opcional)
  "idTank": 0, // Tanque origen (si no es surtidor)
  "idFuelType": 0, // Tipo combustible
  "liters": 0.0, // Litros cargados
  "pricePerLiter": 0.0, // Precio por litro
  "totalCost": 0.0, // Costo total
  "odometerBefore": 0, // Odómetro antes
  "odometerAfter": 0, // Odómetro después
  "horometerBefore": 0, // Horómetro antes (maquinaria)
  "horometerAfter": 0, // Horómetro después
  "latitude": 0.0, // Ubicación GPS
  "longitude": 0.0,
  "eventDate": "datetime", // Fecha/hora del evento
  "notes": "string", // Observaciones
  "status": "string", // pending, validated, rejected
  "validatedBy": "guid", // Usuario que validó
  "validatedAt": "datetime",
  "rejectionReason": "string",
  "createdAt": "datetime",
  "createdBy": "guid"
}
```

---

# 📸 SLIDE 7: Evidencias (CRÍTICO)

## Sin esto no hay trazabilidad

## Necesitamos almacenar fotos, audio y ubicación

### Endpoints Requeridos

```
POST /api/Evidences/Upload
GET /api/Evidences/GetByEvent?idEvent={id}
DELETE /api/Evidences/Delete?id={id}
```

### Estructura

```json
{
  "id": 0,
  "idEvent": 0, // Evento asociado
  "type": "string", // photo_dispenser, photo_odometer,
  // photo_liters, audio, location
  "fileUrl": "string", // URL del archivo en blob storage
  "fileName": "string",
  "mimeType": "string", // image/jpeg, audio/mp3
  "fileSize": 0, // Tamaño en bytes
  "latitude": 0.0, // GPS de donde se tomó
  "longitude": 0.0,
  "capturedAt": "datetime", // Cuando se capturó
  "createdAt": "datetime"
}
```

### Consideraciones Técnicas

- Usar Azure Blob Storage o similar
- Comprimir imágenes antes de subir
- Generar thumbnails
- URLs firmadas con expiración

---

# 💰 SLIDE 8: Centros de Costo

## Falta completamente este módulo

### Endpoints Requeridos

```
GET /api/CostCenters/GetAll
GET /api/CostCenters/GetById?id={id}
GET /api/CostCenters/GetByCompany?idCompany={id}
POST /api/CostCenters/Create
PUT /api/CostCenters/Update
PATCH /api/CostCenters/Deactivate?id={id}
```

### Estructura

```json
{
  "id": 0,
  "idCompany": 0,
  "idBusinessUnit": 0,
  "code": "string", // Código interno
  "name": "string",
  "description": "string",
  "budget": 0.0, // Presupuesto asignado
  "isActive": true,
  "createdAt": "datetime"
}
```

---

# ⚙️ SLIDE 9: Configuración por Empresa

## Políticas configurables por tenant

### Endpoints Requeridos

```
GET /api/Settings/GetByCompany?idCompany={id}
PUT /api/Settings/Update
```

### Estructura

```json
{
  "idCompany": 0,
  "policies": {
    "requirePhoto": true, // Foto obligatoria
    "requireLocation": true, // GPS obligatorio
    "minPhotos": 1, // Mínimo de fotos
    "maxPhotos": 5, // Máximo de fotos
    "locationRadius": 500, // Radio válido en metros
    "maxLitersPerLoad": 500, // Máx litros por carga
    "allowManualEntry": true, // Permitir carga manual
    "requireValidation": true, // Requiere validación
    "autoValidateAfterHours": 24 // Auto-validar después de X horas
  },
  "fuelPrices": [
    {
      "idFuelType": 1,
      "pricePerLiter": 1250.0,
      "effectiveFrom": "date"
    }
  ],
  "workingHours": {
    "start": "06:00",
    "end": "22:00",
    "allowWeekends": false
  }
}
```

---

# 📊 SLIDE 10: Reportes

## Pueden implementarse como endpoints específicos o generarse en frontend

### Endpoints Sugeridos

```
GET /api/Reports/ConsumptionByVehicle?from={date}&to={date}&idCompany={id}
GET /api/Reports/ConsumptionByDriver?from={date}&to={date}&idCompany={id}
GET /api/Reports/LitersByDispenser?from={date}&to={date}
GET /api/Reports/CostByCostCenter?from={date}&to={date}
GET /api/Reports/Efficiency?from={date}&to={date}
GET /api/Reports/Anomalies?from={date}&to={date}
GET /api/Reports/Export?type={excel|pdf}&reportType={string}
```

### Alternativa: Endpoints de Datos

Si prefieren que el frontend calcule:

```
GET /api/Events/GetForReport?from={date}&to={date}&idCompany={id}
```

Con todos los datos necesarios para armar reportes.

---

# 🔔 SLIDE 11: Alertas

## Sistema de notificaciones

### Endpoints Requeridos

```
GET /api/Alerts/GetByCompany?idCompany={id}
GET /api/Alerts/GetUnread?idCompany={id}
POST /api/Alerts/Create
PATCH /api/Alerts/MarkAsRead?id={id}
PATCH /api/Alerts/Dismiss?id={id}
```

### Estructura

```json
{
  "id": 0,
  "idCompany": 0,
  "idBusinessUnit": 0,
  "type": "string", // low_stock, high_consumption,
  // invalid_location, duplicate_load
  "severity": "string", // info, warning, critical
  "title": "string",
  "message": "string",
  "relatedEntityType": "string", // event, vehicle, tank
  "relatedEntityId": 0,
  "isRead": false,
  "createdAt": "datetime"
}
```

---

# 📝 SLIDE 12: Auditoría

## Trazabilidad de cambios

### Endpoints Requeridos

```
GET /api/AuditLog/GetByEntity?entityType={string}&entityId={id}
GET /api/AuditLog/GetByUser?userId={guid}
GET /api/AuditLog/GetByCompany?idCompany={id}&from={date}&to={date}
```

### Estructura

```json
{
  "id": 0,
  "idCompany": 0,
  "userId": "guid",
  "userName": "string",
  "action": "string", // create, update, delete, validate
  "entityType": "string", // event, vehicle, driver, etc.
  "entityId": 0,
  "oldValues": "json", // Valores anteriores
  "newValues": "json", // Valores nuevos
  "ipAddress": "string",
  "userAgent": "string",
  "createdAt": "datetime"
}
```

---

# 🎯 SLIDE 13: Prioridades de Desarrollo

## Fase 1 - MVP (Crítico)

1. ✅ `POST /api/Auth/Register` - Registro empresas
2. ✅ `Events` CRUD completo - Core del negocio
3. ✅ `Evidences` Upload/Get - Trazabilidad
4. ✅ Campos adicionales en `Resource` - Vehículos completos

## Fase 2 - Funcionalidad Completa

5. `CostCenters` CRUD
6. `Settings` - Configuración por empresa
7. Campos adicionales en `Companies`
8. `Drivers` filtro por unidad de negocio

## Fase 3 - Mejoras

9. `Reports` endpoints
10. `Alerts` sistema
11. `AuditLog` trazabilidad
12. OAuth (Google, Facebook)

---

# 📞 SLIDE 14: Próximos Pasos

## Acciones Inmediatas

1. **Revisar** este documento con el equipo de backend
2. **Priorizar** endpoints según roadmap del proyecto
3. **Definir** estructura final de cada endpoint
4. **Estimar** tiempos de desarrollo

## Contacto

- **Frontend Team:** [Tu nombre/email]
- **Swagger Actual:** https://apicombustibles.ubiko.com.ar/swagger/index.html

---

# ✅ SLIDE 15: Resumen

| Módulo      | Endpoints Nuevos | Campos Nuevos |
| ----------- | ---------------- | ------------- |
| Auth        | 4                | -             |
| Companies   | 1                | 8             |
| Resources   | 0                | 15+           |
| Drivers     | 1                | 5             |
| Events      | 10               | Nuevo módulo  |
| Evidences   | 3                | Nuevo módulo  |
| CostCenters | 6                | Nuevo módulo  |
| Settings    | 2                | Nuevo módulo  |
| Reports     | 7                | Nuevo módulo  |
| Alerts      | 5                | Nuevo módulo  |
| AuditLog    | 3                | Nuevo módulo  |

**Total: ~42 endpoints nuevos + campos adicionales**

---

_Documento generado para presentación al equipo de Backend_
_GoodApps - Sistema de Gestión de Combustibles_
