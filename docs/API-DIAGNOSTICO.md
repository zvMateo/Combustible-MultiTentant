# Diagnóstico de Conexión API

## Problemas Identificados

### 1. **Falta archivo `.env` con `VITE_API_URL`**
- **Problema**: Sin `.env`, `axios.ts` usa la URL completa `https://apicombustibles.ubiko.com.ar/api` en lugar de `/api`
- **Impacto**: El proxy de Vite no funciona, causando errores CORS
- **Solución**: Crear `.env.local` con `VITE_API_URL=/api`

### 2. **Dos clientes API diferentes**
- **`src/lib/axios.ts`**: Cliente nuevo con Axios (usado por servicios nuevos)
- **`src/services/api.client.ts`**: Cliente legacy con fetch (no usado actualmente)
- **Estado**: OK, pero puede causar confusión

### 3. **Validación de formulario bloquea POST**
- **Problema**: `idCompany` puede quedar en `0` si no se setea correctamente
- **Impacto**: La validación falla y no se ejecuta el POST
- **Solución**: Asegurar que `idCompany` siempre tenga un valor válido

### 4. **Helper `toArray` duplicado**
- **Problema**: Definido localmente en `drivers.api.ts`
- **Impacto**: Código duplicado, inconsistencia
- **Solución**: Centralizar en `lib/axios.ts` o crear utilidad compartida

### 5. **Proxy de Vite configurado correctamente**
- **Estado**: ✅ OK
- **Configuración**: `/api` → `https://apicombustibles.ubiko.com.ar`

## Configuración Actual

### `vite.config.ts`
```typescript
proxy: {
  "/api": {
    target: "https://apicombustibles.ubiko.com.ar",
    changeOrigin: true,
    secure: false,
  },
}
```

### `src/lib/axios.ts`
```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://apicombustibles.ubiko.com.ar/api";
```

## Soluciones a Aplicar

1. ✅ Crear `.env.local` con `VITE_API_URL=/api`
2. ✅ Mejorar validación de `idCompany` en `DriversPage`
3. ✅ Centralizar helper `toArray`
4. ✅ Agregar logs de debug para validación

