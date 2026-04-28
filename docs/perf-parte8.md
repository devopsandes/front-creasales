# Parte 8 - Medición Antes/Después (Frontend)

## Activación rápida
1. En la consola del navegador:
```js
localStorage.setItem('perfLogs', '1')
```
2. Recargar la app.
3. (Opcional) resetear métricas:
```js
window.__creasalesPerfReset()
```
4. Obtener snapshot:
```js
window.__creasalesPerfSnapshot()
```

## Qué se mide ahora
- Contadores de API:
  - `getChats`
  - `getChatCounts`
  - `findChatTimeline`
  - `getChatCountsByOperator`
- Marcas de realtime:
  - `socket.nuevo-chat.received`
  - `socket.chat.updated.received`
  - `socket.new-message.received`
  - `ui.chatlist.patched`
  - `ui.timeline.patched`
  - `ui.chat.patched`

## Flujos a medir
1. Abrir dashboard y entrar a chats.
2. Abrir una conversación.
3. Recibir mensaje entrante por WhatsApp.
4. Asignar/desasignar operador.
5. Abrir pantalla de usuarios.

## Tabla de control (completar)
| Flujo | Métrica | Antes | Después | Objetivo |
|---|---|---:|---:|---:|
| Abrir chats | llamadas `getChats` |  |  | <= 1 por carga inicial |
| Evento realtime en lista | llamadas `getChats` |  |  | 0 |
| Evento realtime en lista | llamadas `getChatCounts` |  |  | <= 1 (throttled) |
| Abrir conversación | llamadas `findChatTimeline` |  |  | 1 |
| Mensaje entrante | socket->UI (`ui.timeline.patched.latencyMs`) |  |  | p95 < 400ms |
| Asignar chat | llamadas `getChats` |  |  | 0 |
| Usuarios | llamadas pesadas para counts |  |  | 0 (`getChats 1000` eliminado) |

## Notas
- Si ves crecimiento de listeners o duplicidad de eventos, revisar `connectSocket` en `Dashboard` y `Chats`.
- Para pruebas comparables, repetir cada flujo al menos 10 veces y calcular p95.
