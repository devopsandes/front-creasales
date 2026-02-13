# Staging local (Frontend) — consumir backend staging vía túnel SSH

Objetivo: levantar el frontend en local y que consuma **exclusivamente** el backend staging (HTTP + Socket.IO) sin pegarle a producción.

## 1) Túnel SSH (recomendado)

Este comando **se ejecuta en tu PC local** (Terminal/iTerm en macOS, PowerShell/WSL en Windows), no dentro del servidor.

### Variante A: sin key explícita (si tu SSH ya tiene la key cargada)

```bash
ssh -L 3001:localhost:3001 admin@<IP_DEL_SERVER>
```

Si el puerto **3001** está ocupado en tu PC, podés usar otro puerto local (ej. **3002**) manteniendo el remoto en 3001:

```bash
ssh -L 3002:localhost:3001 admin@<IP_DEL_SERVER>
```

### Variante B (recomendada en Lightsail): pasando la key con `-i`

Si te aparece `Permission denied (publickey)`, es porque te falta indicar la key (o la key no corresponde).
En Lightsail normalmente se usa la key descargada tipo `LightsailDefaultKey-<region>.pem`.

```bash
ssh -i "/ruta/a/tu-key.pem" -L 3001:localhost:3001 admin@<IP_DEL_SERVER>
```

Y si tu puerto local **3001** está ocupado, usá 3002 local manteniendo 3001 remoto:

```bash
ssh -i "/ruta/a/tu-key.pem" -L 3002:localhost:3001 admin@<IP_DEL_SERVER>
```

> Nota: `"/ruta/a/tu-key.pem"` es un placeholder. No lo hardcodees con rutas personales en el repo.

### ¿De dónde sale `<IP_DEL_SERVER>`?

`<IP_DEL_SERVER>` es el **Public IPv4** de la instancia en **AWS Lightsail** (lo ves en el panel de la instancia).

Opcionalmente, desde adentro del servidor podés ver “la IP de salida” con:

```bash
curl -4 -sS ifconfig.me
```

Pero el “source of truth” para compartirlo con el equipo es Lightsail → Instance → **Public IPv4**.



Con esto, en tu PC queda:

- HTTP: `http://localhost:3001/api/v1`
- Socket.IO: `http://localhost:3001`

## (Opcional) Smoke test del túnel (health sin auth)

Si usaste el túnel con **3001** local:

```bash
curl -i http://localhost:3001/api/v1/plantillas/health/check
```

Si usaste el túnel con **3002** local:

```bash
curl -i http://localhost:3002/api/v1/plantillas/health/check
```

Debería devolver `200` y un JSON con `status: "ok"`.

## 2) Variables de entorno (Vite)

Crear un archivo **local** (no se commitea) llamado `.env.staging.local` en la raíz del proyecto:

```env
VITE_URL_BACK=http://localhost:3001
VITE_URL_BACKEND=http://localhost:3001/api/v1
```

Notas:
- `VITE_URL_BACKEND` se usa para **HTTP** (axios/fetch).
- `VITE_URL_BACK` se usa para **Socket.IO**.
- WhatsApp: el backend monta controllers como `@Controller('api/wa')` con prefijo global `api/v1`, por lo que el frontend arma correctamente: `${VITE_URL_BACKEND}/api/wa` → `http://localhost:3001/api/v1/api/wa/...`.

## 3) Correr el front en modo staging

```bash
npm run dev -- --mode staging
```

## 4) Checklist para confirmar que NO estás pegándole a prod

En el repo:

```bash
grep -R "sales.createch.com.ar" -n src
```

Debe dar **0 matches** en `src/`.

## 5) Prueba “real” recomendada

1) Abrí el frontend y logueate (credenciales de **staging**).
2) Abrí un chat.
3) Verificá Socket.IO:
   - En DevTools → Network → WS, deberías ver conexión a `http://localhost:3001` (o el host del túnel).
4) Enviar mensaje:
   - Botón “Enviar” debería emitir por socket (`enviar-mensaje`) y reflejarse en el timeline.
5) Acciones de chat:
   - “Archivar” / “Nota privada” deberían funcionar por socket.
   - “Eliminar chat” hace DELETE a `${VITE_URL_BACKEND}/chats/{chatId}/messages`.


