# Configuración de Variables de Entorno

## Crear archivo `.env.local`

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# API Configuration
# En desarrollo, usar el proxy de Vite (/api)
# En producción, usar la URL completa
VITE_API_URL=/api
```

## ¿Por qué es necesario?

1. **Proxy de Vite**: El proxy configurado en `vite.config.ts` solo funciona si las peticiones van a `/api`
2. **Sin `.env.local`**: Axios usa la URL completa `https://apicombustibles.ubiko.com.ar/api`, lo que causa errores CORS
3. **Con `.env.local`**: Axios usa `/api`, que es interceptado por el proxy de Vite y redirigido al servidor real

## Pasos

1. Crea el archivo `.env.local` en la raíz del proyecto
2. Agrega `VITE_API_URL=/api`
3. Reinicia el servidor de desarrollo (`pnpm dev`)

## Verificación

Después de crear el archivo, verifica en la consola del navegador que las peticiones vayan a:
- ✅ `http://localhost:5177/api/...` (correcto)
- ❌ `https://apicombustibles.ubiko.com.ar/api/...` (incorrecto, sin proxy)

