### Flujo de “No leído” + “hace X…” en lista de chats

Este documento describe cómo está implementado el flujo de:
- **Indicador de no leído** (punto rojo) en la lista de chats
- **Texto de antigüedad** del último mensaje entrante (“hace 2 minutos”, “hace un día”, etc.)
- **Selección por checkbox** en lista y acciones **bulk** en el header del chat: “Marcar como leído” / “Marcar como no leído”
- Integración **frontend ↔ backend** (endpoints y campos)

---

### Objetivo funcional (resumen)
- El punto rojo indica que el chat tiene **mensajes entrantes pendientes de lectura** o fue **marcado manualmente como no leído**.
- El punto rojo **NO desaparece al abrir** el chat (navegar a la conversación).
- El estado cambia únicamente mediante acciones explícitas:
  - Botón **“Marcar como leído”**
  - Botón **“Marcar como no leído”**
- El texto de tiempo muestra **cuándo fue recibido el último mensaje entrante** y, a partir de 1 día, se expresa solo en días (sin “1 día y 3 horas”).

---

### Backend: contrato consumido por el frontend

#### Base URL
- `VITE_URL_BACKEND` = `https://sales.createch.com.ar/api/v1`

#### Endpoint de listado (lista de chats)
- `GET /chats?page=1&limit=100`

El frontend espera que cada chat incluya (además del shape histórico) los siguientes campos:
- **`unreadCount`**: número (mensajes entrantes no leídos)
- **`manualUnread`**: boolean (chat marcado manualmente como no leído)
- **`lastIncomingMessageAt`**: string o null (timestamp del último mensaje entrante)
- **`lastReadAt`**: string o null (timestamp del último “read” aplicado por el operador)

#### Endpoint de estado de lectura por chat
- `PATCH /chats/:chatId/read-state`
- Body:

```json
{ "state": "read" }
```

o

```json
{ "state": "unread" }
```

Propiedades relevantes (según uso actual en frontend):
- Es **idempotente**.
- Se llama de forma “bulk” (múltiples chats en paralelo) cuando el operador usa los botones del header del chat.

---

### Frontend: dónde vive cada parte

#### Lista y tabs de chats
- Archivo: `src/pages/chats/ListaChats.tsx`
- Estilos: `src/pages/chats/chats.css`
- Estado global: `src/app/slices/actionSlice.ts` (Redux)

#### Vista del chat (header con acciones)
- Archivo: `src/pages/chats/Chats.tsx`
- Servicio HTTP: `src/services/chats/chats.services.ts`

---

### Indicador “no leído” (punto rojo)

#### Regla de render
En `ListaChats.tsx`, el indicador se muestra si:
- `unreadCount > 0` **o**
- `manualUnread === true`

El cálculo local está encapsulado en:
- `getUnreadCount(chat)` (usa `chat.unreadCount` si existe; si no, hace fallback con `mensajes[]` y `leido=false` en entrantes)
- `isManuallyUnread(chat)` (lee `chat.manualUnread`)

El indicador se renderiza en el header del item (alineado a la derecha del nombre):
- CSS: `.chat-unread-indicator` + `.chat-unread-dot`
- Color: rojo (para alta visibilidad)
- Dimensión aprox: 22×22 para el contenedor y 9×9 para el punto

#### Importante: no auto-lectura al abrir
El click para abrir un chat **no** marca como leído.
La función `handleOpenChat` (lista) solo dispara navegación/UX y no invoca `PATCH /read-state`.

---

### Texto “hace X…” (último mensaje entrante)

#### Fuente de datos
La fecha base se obtiene con `getLastIncomingAt(chat)`:
1) Usa `chat.lastIncomingMessageAt` si viene desde backend.
2) Fallback opcional: `chat.lastMessageAt` si `chat.lastMessageDirection === 'incoming'`.
3) Fallback legacy: recorre `mensajes[]` y toma el `createdAt` más reciente de mensajes entrantes (`msg_entrada`).

#### Formateo “hace X…”
Se implementa en `formatRelativeLastIncoming(date)`:
- Si \(diffDays ≥ 1\): “hace un día”, “hace 2 días”, “hace 3 días”, etc. (solo días)
- Si \(diffHr ≥ 1\): “hace 1 hora”, “hace N horas”
- Si \(diffMin ≥ 1\): “hace 1 minuto”, “hace N minutos”
- Si no: “hace unos segundos”

Esto evita mensajes mixtos tipo “hace 1 día y 3 horas”.

---

### Checkbox de selección (lista)

#### Pestaña “Menciones” (flujo existente, no se modifica)
En “Menciones”:
- Se muestra un checkbox por chat para seleccionar conversaciones mencionadas.
- El estado de selección vive en Redux:
  - `selectedMentionChatIds`
  - acciones: `toggleMentionChatSelection`, `clearMentionChatSelection`

Este flujo está relacionado con el botón “Marcar como leído” de **menciones** (no con `read-state` de chat).

#### Resto de pestañas (selección bulk de chats)
En pestañas no-Menciones:
- Se muestra **siempre** un checkbox `.checkbox` por chat.
- Ese checkbox controla la selección bulk para marcar chats como leído/no leído.

Estado Redux:
- `selectedBulkReadChatIds`
- acciones:
  - `toggleBulkReadChatSelection(chatId)`
  - `clearBulkReadChatSelection()`

Nota: al cambiar de pestaña en la lista se limpia esta selección para evitar aplicar acciones en un contexto incorrecto.

---

### Botones “Marcar como leído / Marcar como no leído” (bulk)

#### Ubicación
Se renderizan en el header del chat (columna derecha), **al lado de “Archivar”**:
- Archivo: `src/pages/chats/Chats.tsx`
- Contenedor: `.header-chat-actions`

#### Condición de render
Los botones bulk aparecen cuando:
- **NO** estamos en `mentionsMode`
- y `selectedBulkReadChatIds.length > 0`

#### Acción “Marcar como leído”
Al click:
- Optimistic UI: `markChatReadLocal(chatId)` en Redux para cada id seleccionado
  - fuerza `unreadCount=0` y `manualUnread=false`
- Request: `PATCH /chats/:chatId/read-state { state: "read" }` para cada chat seleccionado (en paralelo)
- Al final: `clearBulkReadChatSelection()`

#### Acción “Marcar como no leído”
Al click:
- Optimistic UI: `markChatUnreadLocal(chatId)` en Redux para cada id seleccionado
  - fuerza `manualUnread=true`
- Request: `PATCH /chats/:chatId/read-state { state: "unread" }` para cada chat seleccionado
- Al final: `clearBulkReadChatSelection()`

#### Importante: no afecta Menciones
En `Chats.tsx`, el método bulk retorna inmediatamente si `mentionsMode` está activo.
De esta manera:
- El botón de “Marcar como leído” en Menciones sigue ejecutando el flujo original de menciones (no `read-state`).

---

### Errores y diagnóstico (qué mirar si “no aparece el punto”)
- Verificar en `GET /chats` que el chat devuelva:
  - `unreadCount > 0` o `manualUnread=true` para que el punto rojo aparezca.
  - `lastIncomingMessageAt` con una fecha válida para que aparezca el “hace X…”.
- Confirmar que los mensajes “nuevos” que deberían contar como no leídos sean **entrantes** (no `msg_salida`).
- Verificar que `PATCH /chats/:id/read-state` responda 200 y actualice `manualUnread/lastReadAt` según corresponda.

