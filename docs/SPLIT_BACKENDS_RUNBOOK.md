# Split Backends Frontend

## Variables de entorno

- `FRONT_SPLIT_BACKENDS_ENABLED`: activa el router dual (`true` o `false`).
- `FRONT_API_ADMIN_BASE`: base del servidor administrativo.
- `FRONT_API_CONV_BASE`: base del servidor conversacional.
- `FRONT_SOCKET_CONV_URL` (opcional): URL explícita de socket conversacional.

Notas:
- Se mantiene soporte de fallback para `VITE_URL_BACKEND` y `VITE_URL_BACK`.
- Si una base no incluye `/api/v1`, se agrega automáticamente.
- `vite.config.ts` ahora acepta prefijos `VITE_` y `FRONT_`.

## Mapa endpoint -> backend

Administrativo (`adminClient`):
- `/tickets/*`
- `/tags/*`
- `/mentions/*`
- `/quick-responses/*`

Conversacional (`convClient`):
- `/chats/*`
- `/chats/:id/timeline`
- `/chats/:id/messages-lite`
- `/chats/send-message`
- `/chats/operators`
- socket de chat/realtime

## Respuestas rápidas

El frontend consume respuestas rápidas como catálogo cacheado: una carga por sesión con caché en memoria/localStorage y filtrado local al escribir `/` en el chat. El CRUD sigue viviendo en el backend administrativo bajo `/quick-responses/*`.

Contrato recomendado para escalar:
- El backend administrativo debería servir `GET /quick-responses` o un futuro `GET /quick-responses/catalog` desde caché por empresa, con `updatedAt`, `version` o `etag`.
- Al crear, editar o eliminar una respuesta rápida, el sistema debería emitir un evento liviano por socket: `quick-responses.updated` con `{ empresaId, version, updatedAt }`....
- El backend conversacional no necesita consultar la tabla de respuestas rápidas; solo puede transportar ese evento de invalidación para que los operadores refresquen el catálogo con jitter.

## Como activar split

1. Configurar:
   - `FRONT_SPLIT_BACKENDS_ENABLED=true`
   - `FRONT_API_ADMIN_BASE=https://admin.tu-dominio.com/api/v1` (o sin sufijo)
   - `FRONT_API_CONV_BASE=https://conv.tu-dominio.com/api/v1` (o sin sufijo)
2. Opcional: `FRONT_SOCKET_CONV_URL=https://conv.tu-dominio.com`
3. Deploy del frontend.
4. Validar en DevTools:
   - requests de tickets/tags/mentions en host admin
   - requests de chats/timeline/messages/socket en host conv

## Rollback en 1 minuto

1. Setear `FRONT_SPLIT_BACKENDS_ENABLED=false`.
2. Redeploy.
3. Verificar que todo vuelve al host legacy (`VITE_URL_BACKEND`/`VITE_URL_BACK`).

## Pruebas manuales sugeridas

Conectividad:
- abrir dashboard y confirmar requests exitosos en ambos dominios.

Auth:
- login valido, refresco de pagina, logout, y manejo de token expirado.

Administrativo:
- listar tickets, crear ticket, editar ticket.
- crear/editar/eliminar tag.
- menciones unread y mark-read.

Conversacional:
- listar chats, abrir chat, cargar timeline.
- fallback a `messages-lite` si timeline falla.
- enviar mensaje texto y con archivo.
- socket realtime de mensajes.

Regresion UX:
- navegar entre modulos admin/conversacional sin errores de CORS.
- con tabs sin chats, sin loop de requests y con empty state inmediato.

Fallback:
- apagar `FRONT_SPLIT_BACKENDS_ENABLED` y validar operacion normal.
