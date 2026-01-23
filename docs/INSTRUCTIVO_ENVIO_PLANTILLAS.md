# Instructivo: Sistema de Envío de Plantillas WhatsApp

## Índice
1. [Configuración General](#configuración-general)
2. [Flujo de Verificación al Abrir el Modal](#flujo-de-verificación-al-abrir-el-modal)
3. [Endpoints Utilizados](#endpoints-utilizados)
4. [Formato de Datos](#formato-de-datos)
5. [Respuestas del Backend](#respuestas-del-backend)
6. [Mapeo de Plantillas](#mapeo-de-plantillas)
7. [Manejo de Errores](#manejo-de-errores)

---

## Configuración General

### Requisitos Previos

Para que el sistema de envío de plantillas funcione correctamente, se requiere:

1. **Configuración de Meta**: El usuario debe tener configurada su integración con Meta (WhatsApp Business API) en la sección de Configuración → Meta del dashboard.

2. **Credenciales Requeridas**:
   - `graph_api_token`: Token de acceso de la aplicación Meta (Access Token)
   - `id_phone_number`: ID del número de teléfono de WhatsApp Business (debe ser un número)

3. **Chat Activo**: El usuario debe estar en un chat activo para poder enviar plantillas.

4. **Autenticación**: El usuario debe estar autenticado y tener un token válido en `localStorage`.

---

## Flujo de Verificación al Abrir el Modal

Cuando el usuario hace clic en el botón "Plantilla" en el chat, se ejecuta el siguiente flujo:

### 1. Activación del Modal

- Se dispara la acción `switchModalPlantilla()` que cambia el estado `modalPlantilla` en Redux a `true`.
- El componente `PlantillaModal` se renderiza.

### 2. Obtención de Datos del Chat

El modal obtiene automáticamente los siguientes datos del estado de Redux y del contexto actual:

```typescript
// Datos obtenidos del chat actual
const currentChat = chats.find(chat => chat.id === chatId);
const numeroTelefono = currentChat?.cliente?.telefono || '';
const nombreAfiliado = dataUser?.apellnombAfilado || currentChat?.cliente?.nombre || 'Cliente';
const nombreOperador = user?.name || 'Operador';
```

**Fuentes de datos:**
- `chats`: Lista de chats desde Redux (`state.action.chats`)
- `dataUser`: Datos del afiliado desde Redux (`state.action.dataUser`)
- `user`: Usuario actual desde Redux (`state.auth.user`)
- `chatId`: ID del chat desde la URL usando `useParams()`

### 3. Verificación de Configuración de Meta

Inmediatamente al abrir el modal, se ejecuta una petición para verificar si existe configuración de Meta:

**Endpoint:** `GET /meta/current`

**Headers:**
```
Authorization: Bearer <token>
```

**Proceso:**
1. Se muestra un estado de carga (`loadingMeta: true`)
2. Se realiza la petición al backend
3. Se verifica la respuesta:
   - Si `statusCode === 200` y hay datos válidos → Se guarda la configuración
   - Si `statusCode === 404` → Se muestra error indicando que debe configurar Meta
   - Si hay error → Se muestra mensaje de error

**Validaciones:**
- `graph_api_token` debe existir y no estar vacío
- `id_phone_number` debe existir y ser mayor a 0

### 4. Estados del Modal

El modal maneja los siguientes estados:

- `loadingMeta`: Indica si se está cargando la configuración de Meta
- `isLoading`: Indica si se está enviando la plantilla
- `error`: Mensaje de error si algo falla
- `metaConfig`: Configuración de Meta obtenida del backend
- `selectedPlantilla`: Plantilla seleccionada por el usuario

---

## Endpoints Utilizados

### 1. Obtener Configuración de Meta

**Método:** `GET`  
**URL:** `${VITE_URL_BACKEND}/meta/current`  
**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Descripción:** Obtiene la configuración de Meta guardada para el usuario/empresa actual.

**Cuándo se usa:** Al abrir el modal de plantillas.

---

### 2. Enviar Plantilla

**Método:** `POST`  
**URL:** `${VITE_URL_BACKEND}/meta/plantillas`  
**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Descripción:** Envía una plantilla de WhatsApp a través de la API de Meta.

**Cuándo se usa:** Cuando el usuario selecciona una plantilla y presiona "Enviar".

---

## Formato de Datos

### Envío de Plantilla

**Body de la petición POST `/meta/plantillas`:**

```json
{
  "opcion": 9,
  "graph_api_token": "EAAHOruLPcz8BO4oovHMz4ikEJT3jpZ...",
  "id_phone_number": 508224595713703,
  "numero": "5492615199046",
  "afiliado": "MORRESI GONZALO MARTIN",
  "operador": "MARCELO MARINO"
}
```

**Campos requeridos:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `opcion` | `number` | ID de la plantilla a enviar (ver mapeo) | `9` |
| `graph_api_token` | `string` | Token de acceso de Meta | `"EAAHOruLPcz8BO4oovHMz4ikEJT3jpZ..."` |
| `id_phone_number` | `number` | ID del número de WhatsApp Business | `508224595713703` |
| `numero` | `string` | Número de teléfono del destinatario (con código de país) | `"5492615199046"` |
| `afiliado` | `string` | Nombre completo del afiliado/cliente | `"MORRESI GONZALO MARTIN"` |
| `operador` | `string` | Nombre del operador que envía | `"MARCELO MARINO"` |

**⚠️ IMPORTANTE:**
- `opcion` debe ser un **número**, no string
- `id_phone_number` debe ser un **número**, no string
- El frontend convierte explícitamente estos valores usando `Number()`

**Código de conversión:**
```typescript
const dataEnvio = {
  opcion: Number(opcion), // Conversión explícita
  graph_api_token: metaConfig.graph_api_token,
  id_phone_number: Number(metaConfig.id_phone_number), // Conversión explícita
  numero: numeroTelefono,
  afiliado: nombreAfiliado,
  operador: nombreOperador
};
```

---

## Respuestas del Backend

### 1. Respuesta de GET /meta/current

#### Respuesta Exitosa (200)

```json
{
  "statusCode": 200,
  "meta": {
    "graph_api_token": "EAAHOruLPcz8BO4oovHMz4ikEJT3jpZ...",
    "id_phone_number": 508224595713703,
    "user_token": "opcional",
    "servicios": "WHATSAPP"
  }
}
```

**Procesamiento en el frontend:**
- Se extrae `data.meta.graph_api_token`
- Se extrae `data.meta.id_phone_number`
- Se valida que ambos existan y no estén vacíos

#### Respuesta de Error (404)

```json
{
  "statusCode": 404,
  "message": "No se encontró la configuración de Meta"
}
```

**Manejo en el frontend:**
- Se muestra mensaje: "No se encontró la configuración de Meta. Por favor, vaya a Configuración → Meta y complete los datos requeridos (Access Token e ID Phone Number)."

---

### 2. Respuesta de POST /meta/plantillas

#### Respuesta Exitosa (201)

**HTTP Status:** `201 Created`

**Body de respuesta:**
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "5492615199046",
      "wa_id": "5492615199046"
    }
  ],
  "messages": [
    {
      "id": "wamid.xxx"
    }
  ]
}
```

**Procesamiento en el frontend:**
- El servicio detecta el HTTP status `201`
- Normaliza la respuesta agregando `statusCode: 201`
- El componente verifica `statusCode === 201` y muestra mensaje de éxito
- Se cierra el modal automáticamente

**Código de normalización:**
```typescript
if (httpStatus === 200 || httpStatus === 201) {
  return {
    ...response,
    statusCode: response.statusCode || httpStatus,
    msg: response.msg || response.message || 'Plantilla enviada correctamente'
  };
}
```

#### Respuesta de Error

**HTTP Status:** `400`, `401`, `500`, etc.

**Body de respuesta:**
```json
{
  "statusCode": 400,
  "message": ["Error descriptivo"],
  "error": "Bad Request"
}
```

**Manejo en el frontend:**
- Se extrae el mensaje de error
- Se muestra en el modal
- El modal permanece abierto para que el usuario pueda reintentar

---

## Mapeo de Plantillas

El sistema mapea las plantillas del frontend a opciones numéricas del backend:

| Plantilla Frontend | Valor en Select | Opción Backend | Estado |
|-------------------|-----------------|---------------|--------|
| Retomar Conversación | `"inicio"` | `9` | ✅ Implementada |
| Plantilla 2 | `"plantilla2"` | `null` | ❌ No implementada |
| Plantilla 3 | `"plantilla3"` | `null` | ❌ No implementada |
| Plantilla 4 | `"plantilla4"` | `null` | ❌ No implementada |

**Código de mapeo:**
```typescript
const getOpcionPlantilla = (plantillaId: string): number | null => {
  switch (plantillaId) {
    case 'inicio':
      return 9; // Retomar Conversación
    case 'plantilla2':
      return null; // Por ahora no implementado
    // ...
  }
};
```

### Plantilla "Retomar Conversación"

**Texto de la plantilla:**
```
¡Hola {nombreAfiliado}! Mi nombre es {nombreOperador} y tengo novedades de tu gestión iniciada. Por favor cuando respondas este mensaje podemos continuar, muchas gracias.
```

**Variables dinámicas:**
- `{nombreAfiliado}`: Se reemplaza con el nombre del afiliado obtenido de `dataUser.apellnombAfilado` o `currentChat.cliente.nombre`
- `{nombreOperador}`: Se reemplaza con el nombre del operador obtenido de `user.name`

---

## Manejo de Errores

### Errores en la Obtención de Configuración de Meta

| Error | Causa | Mensaje Mostrado |
|-------|-------|------------------|
| `404` | No hay configuración guardada | "No se encontró la configuración de Meta. Por favor, vaya a Configuración → Meta y complete los datos requeridos (Access Token e ID Phone Number)." |
| `401` | Token expirado o inválido | Mensaje del backend o "Error al obtener la configuración de Meta" |
| `500` | Error del servidor | Mensaje del backend |
| Datos incompletos | `graph_api_token` o `id_phone_number` vacíos | "La configuración de Meta está incompleta. Por favor, vaya a Configuración → Meta y complete los datos requeridos." |

### Errores en el Envío de Plantilla

| Error | Causa | Mensaje Mostrado |
|-------|-------|------------------|
| Sin plantilla seleccionada | Usuario no seleccionó plantilla | Botón "Enviar" deshabilitado |
| Plantilla no implementada | `opcion === null` | "Esta plantilla aún no está implementada" |
| Sin configuración Meta | `metaConfig === null` | "No se encontró la configuración de Meta" |
| Sin número de teléfono | `numeroTelefono` vacío | "No se pudo obtener el número de teléfono del chat" |
| Error del backend | `statusCode !== 200 && statusCode !== 201` | Mensaje del backend o "Error al enviar la plantilla" |

### Validaciones del Frontend

Antes de enviar, el frontend valida:

1. ✅ Plantilla seleccionada
2. ✅ Opción de plantilla válida (no null)
3. ✅ Configuración de Meta disponible
4. ✅ Número de teléfono del chat disponible
5. ✅ Token de autenticación válido

---

## Flujo Completo de Envío

```
1. Usuario hace clic en botón "Plantilla"
   ↓
2. Modal se abre → useEffect se ejecuta
   ↓
3. GET /meta/current → Obtiene configuración de Meta
   ↓
4. Si hay configuración → Modal listo
   Si no hay → Muestra error
   ↓
5. Usuario selecciona plantilla del select
   ↓
6. Se muestra preview del mensaje con variables reemplazadas
   ↓
7. Usuario presiona "Enviar"
   ↓
8. Validaciones del frontend
   ↓
9. POST /meta/plantillas → Envía plantilla
   ↓
10. Si éxito (201) → Toast de éxito + Cierra modal
    Si error → Muestra error en modal
```

---

## Consideraciones Técnicas

### Variables de Entorno

El sistema utiliza la variable de entorno `VITE_URL_BACKEND` para construir las URLs de los endpoints.

**Ejemplo:**
```typescript
const url = `${import.meta.env.VITE_URL_BACKEND}/meta/current`;
```

### Autenticación

Todas las peticiones requieren un token JWT en el header `Authorization`:

```typescript
const token = localStorage.getItem('token') || '';
const headers = {
  authorization: `Bearer ${token}`
};
```

### Estados de Redux Utilizados

- `state.action.modalPlantilla`: Controla si el modal está abierto
- `state.action.chats`: Lista de chats disponibles
- `state.action.dataUser`: Datos del afiliado/cliente actual
- `state.auth.user`: Usuario autenticado actual

### Componentes Relacionados

- **PlantillaModal**: Componente principal del modal (`src/components/modal/PlantillaModal.tsx`)
- **Chats**: Componente que contiene el botón para abrir el modal (`src/pages/chats/Chats.tsx`)
- **Servicios**:
  - `src/services/meta/meta.services.ts`: Servicio para obtener configuración de Meta
  - `src/services/plantillas/plantillas.services.ts`: Servicio para enviar plantillas

---

## Ejemplo de Uso Completo

### Escenario: Enviar plantilla "Retomar Conversación"

1. **Usuario en chat activo:**
   - Chat ID: `"chat-123"`
   - Teléfono: `"5492615199046"`
   - Nombre afiliado: `"MORRESI GONZALO MARTIN"`
   - Operador: `"MARCELO MARINO"`

2. **Usuario hace clic en "Plantilla"**

3. **Sistema verifica configuración:**
   ```
   GET /api/v1/meta/current
   Headers: { Authorization: "Bearer token123" }
   ```

4. **Backend responde:**
   ```json
   {
     "statusCode": 200,
     "meta": {
       "graph_api_token": "EAAHOruLPcz8BO4oovHMz4ikEJT3jpZ...",
       "id_phone_number": 508224595713703
     }
   }
   ```

5. **Usuario selecciona "Retomar Conversación"**

6. **Sistema muestra preview:**
   ```
   ¡Hola MORRESI GONZALO MARTIN! Mi nombre es MARCELO MARINO y tengo novedades de tu gestión iniciada. Por favor cuando respondas este mensaje podemos continuar, muchas gracias.
   ```

7. **Usuario presiona "Enviar"**

8. **Sistema envía:**
   ```
   POST /api/v1/meta/plantillas
   Headers: { Authorization: "Bearer token123" }
   Body: {
     "opcion": 9,
     "graph_api_token": "EAAHOruLPcz8BO4oovHMz4ikEJT3jpZ...",
     "id_phone_number": 508224595713703,
     "numero": "5492615199075",
     "afiliado": "MORRESI GONZALO MARTIN",
     "operador": "MARCELO MARINO"
   }
   ```

9. **Backend responde:**
   ```
   HTTP 201 Created
   {
     "messaging_product": "whatsapp",
     "contacts": [...],
     "messages": [...]
   }
   ```

10. **Frontend muestra:** "Plantilla enviada correctamente" y cierra el modal

---

## Notas Importantes

1. **Tipos de datos críticos:**
   - `opcion` y `id_phone_number` **DEBEN** ser números, no strings
   - El frontend convierte explícitamente estos valores

2. **Configuración previa requerida:**
   - La configuración de Meta debe estar guardada antes de usar plantillas
   - Se accede desde: Dashboard → Configuración → Meta

3. **Permisos:**
   - El usuario debe tener rol ADMIN o ROOT para configurar Meta
   - El usuario debe pertenecer a una empresa con configuración

4. **Plantillas futuras:**
   - Para agregar nuevas plantillas, actualizar el mapeo en `getOpcionPlantilla()`
   - Agregar el texto en `getPlantillaText()`
   - Agregar opción en el select del modal

---

## Soporte

Para problemas o dudas sobre el sistema de envío de plantillas, revisar:
- Logs de la consola del navegador (solo errores)
- Respuestas del backend en Network tab
- Estado de Redux en React DevTools

---

**Última actualización:** Diciembre 2024  
**Versión del sistema:** 1.0

