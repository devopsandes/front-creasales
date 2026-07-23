// plantillasEjemplos.ts
// HTML estático de cada plantilla EJS, con datos ficticios de ejemplo
// (variables reemplazadas, condicionales resueltos a la rama "con datos completos").
// Si el backend actualiza una plantilla .ejs, hay que reflejar el cambio acá a mano.

export interface PlantillaEjemplo {
    id: number;
    nombre: string;
    descripcion: string;
    html: string;
}

const HEAD_ESTILOS = `
<style>
  body { margin:0; padding:0; background-color:#0b2a4a; font-family: Arial, Helvetica, sans-serif; }
  table { border-spacing:0; }
  td { padding:0; }
  img { border:0; display:block; }
  @media screen and (max-width:600px) {
    .container { width:100% !important; }
    .title-text { font-size:26px !important; }
  }
</style>`;

const LOGO_ROW = `
<tr>
  <td align="center" style="padding:30px 20px 10px 20px;">
    <img src="https://andessalud.com.ar/logo-andes-salud.png" alt="Andes Salud" width="180">
  </td>
</tr>`;

const FOOTER_ROW = `
<tr>
  <td align="center" style="background-color:#0b2a4a; padding:20px; border-radius:0 0 8px 8px;">
    <p style="color:#ffffff; font-size:14px; margin:0;">
      Andes Salud · Cuidamos tu salud · <a href="#" style="color:#ffffff; font-size:14px; text-decoration:underline;">Desuscribirse</a>
    </p>
  </td>
</tr>`;

const wrap = (title: string, body: string) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${HEAD_ESTILOS}
</head>
<body style="margin:0; padding:0; background-color:#0b2a4a;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b2a4a">
<tr><td align="center" style="padding:40px 10px;">
<table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#ffffff; border-radius:8px;">
${LOGO_ROW}
${body}
${FOOTER_ROW}
</table>
</td></tr>
</table>
</body>
</html>`;

// ---------- Datos ficticios ----------
const D = {
    nombreCompleto: "María González",
    nroAfiliado: "458219",
    plan: "TITANIUM PLUS S/C",
    email: "maria.gonzalez@gmail.com",
    numCelular: "261 555-1234",
    formaPago: "TARJETA DE CREDITO VISA",
    categoria: "Adherente",
    integrantesNumero: "3",
    periodosAdeudados: "Marzo 2026, Abril 2026",
};

const SALDOS = [
    { fechaVencimiento: "10/08/2026", valor: "$45.000", titular: "20-34567890-1", linkDePago: "https://pagos.andessalud.com.ar/ejemplo-1" },
    { fechaVencimiento: "10/09/2026", valor: "$45.000", titular: "20-34567890-1", linkDePago: "https://pagos.andessalud.com.ar/ejemplo-2" },
];

// ---------- 1. Bienvenida-ADH ----------
const bienvenidaAdh = wrap("Bienvenido a Andes Salud", `
<tr><td align="center" style="padding:20px;">
  <h1 class="title-text" style="margin:0; font-size:32px; color:#0b2a4a;">
    ¡Felicitaciones ${D.nombreCompleto}! 😊<br>Se activó tu cobertura de salud
  </h1>
</td></tr>
<tr><td style="padding:0 30px 30px 30px;">
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    Te damos la bienvenida a <strong>Andes Salud</strong>. A continuación, te contamos cómo acceder fácilmente a tu cobertura médica.
  </p>
  <div style="background-color:#f2f6fa; border-left:4px solid #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">📲 App móvil</p>
    <p style="margin:0 0 10px 0; color:#333333; font-size:15px; line-height:1.5;">
      Al momento de instalarla, tené a mano tu <strong>DNI</strong>, lo vas a necesitar para ingresar.
    </p>
    <p style="margin:0; font-size:15px;">
      👉 <a href="#" style="color:#0b2a4a; text-decoration:none;">Descargar en iOS</a><br>
      👉 <a href="#" style="color:#0b2a4a; text-decoration:none;">Descargar en Android</a>
    </p>
  </div>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 15px 0;">
    🤖 <strong>Pixi</strong>, tu asistente virtual, disponible por WhatsApp:<br>
    <a href="#" style="color:#0b2a4a; text-decoration:none;">wa.me/5492613300622</a>
  </p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 25px 0;">
    🌐 También podés realizar todas tus gestiones desde nuestro sitio web:<br>
    <a href="#" style="color:#0b2a4a; text-decoration:none;">www.andessalud.com.ar</a>
  </p>
  <div style="background-color:#ffffff; border:1px solid #d9e2ec; padding:20px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">Tus datos</p>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#333333;">
      <strong>N° de afiliado:</strong> ${D.nroAfiliado}<br>
      <strong>Plan:</strong> ${D.plan}<br>
      <strong>Email:</strong> ${D.email}<br>
      <strong>Numero de Teléfono:</strong> ${D.numCelular}<br>
      <strong>Forma de pago:</strong> ${D.formaPago}<br>
      <a href="#" style="color:#0b2a4a; text-decoration:none;">Ver credencial</a>
    </p>
  </div>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin-top:25px;">
    Gracias por elegirnos.<br><strong>Andes Salud</strong>
  </p>
</td></tr>`);

// ---------- 2. Bienvenida-MON ----------
const bienvenidaMon = wrap("Bienvenido a Andes Salud", `
<tr><td align="center" style="padding:20px;">
  <h1 class="title-text" style="margin:0; font-size:32px; color:#0b2a4a;">
    ¡Felicitaciones ${D.nombreCompleto}! 😊<br>Se activó tu cobertura de salud
  </h1>
</td></tr>
<tr><td style="padding:0 30px 30px 30px;">
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    Te damos la bienvenida a <strong>Andes Salud</strong>. A continuación, te contamos cómo acceder fácilmente a tu cobertura médica.
  </p>
  <div style="background-color:#f2f6fa; border-left:4px solid #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">📲 App móvil</p>
    <p style="margin:0 0 10px 0; color:#333333; font-size:15px;">Al momento de instalarla, tené a mano tu <strong>DNI</strong>.</p>
    <p style="margin:0; font-size:15px;">👉 <a href="#" style="color:#0b2a4a;">iOS</a><br>👉 <a href="#" style="color:#0b2a4a;">Android</a></p>
  </div>
  <p style="font-size:16px; line-height:1.6;">🤖 <strong>Pixi</strong> por WhatsApp:<br><a href="#" style="color:#0b2a4a;">wa.me/5492613300622</a></p>
  <p style="font-size:16px; line-height:1.6;">🌐 Web: <a href="#" style="color:#0b2a4a;">www.andessalud.com.ar</a></p>
  <div style="border:1px solid #d9e2ec; padding:20px; margin-top:20px;">
    <p style="font-weight:bold; color:#0b2a4a;">Tus datos</p>
    <p style="font-size:15px; line-height:1.6;">
      <strong>N° Afiliado:</strong> ${D.nroAfiliado}<br>
      <strong>Plan:</strong> ${D.plan}<br>
      <strong>Email:</strong> ${D.email}<br>
      <strong>Numero de Teléfono:</strong> ${D.numCelular}<br>
      <strong>Forma de pago:</strong> ${D.formaPago}<br>
      <strong>Credencial digital:</strong> <a href="#" style="color:#0b2a4a;">Ver credencial</a>
    </p>
  </div>
  <p style="margin-top:25px;">Gracias por elegirnos.<br><strong>Andes Salud</strong></p>
</td></tr>`);

// ---------- 3. Bienvenida-REL ----------
const bienvenidaRel = wrap("Bienvenido a Andes Salud", `
<tr><td align="center" style="padding:20px;">
  <h1 class="title-text" style="margin:0; font-size:32px; color:#0b2a4a;">
    ¡Felicitaciones ${D.nombreCompleto}! 😊<br>Se activó tu cobertura de salud
  </h1>
</td></tr>
<tr><td style="padding:0 30px 30px 30px;">
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    Te damos la bienvenida a <strong>Andes Salud</strong>. A continuación, te contamos cómo acceder fácilmente a tu cobertura médica.
  </p>
  <div style="background-color:#f2f6fa; border-left:4px solid #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">📲 App móvil</p>
    <p style="margin:0 0 10px 0; color:#333333; font-size:15px; line-height:1.5;">
      Al momento de instalarla, tené a mano tu <strong>DNI</strong>, lo vas a necesitar para ingresar.
    </p>
    <p style="margin:0; font-size:15px;">
      👉 <a href="#" style="color:#0b2a4a; text-decoration:none;">Descargar en iOS</a><br>
      👉 <a href="#" style="color:#0b2a4a; text-decoration:none;">Descargar en Android</a>
    </p>
  </div>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 15px 0;">
    🤖 <strong>Pixi</strong>, tu asistente virtual, disponible por WhatsApp:<br>
    <a href="#" style="color:#0b2a4a; text-decoration:none;">wa.me/5492613300622</a>
  </p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 25px 0;">
    🌐 También podés realizar todas tus gestiones desde nuestro sitio web:<br>
    <a href="#" style="color:#0b2a4a; text-decoration:none;">www.andessalud.com.ar</a>
  </p>
  <div style="border:1px solid #d9e2ec; padding:20px; margin-top:20px;">
    <p style="font-weight:bold; color:#0b2a4a;">Tus datos</p>
    <p style="font-size:15px; line-height:1.6;">
      <strong>N° Afiliado:</strong> ${D.nroAfiliado}<br>
      <strong>Plan:</strong> ${D.plan}<br>
      <strong>Email:</strong> ${D.email}<br>
      <strong>Numero de Teléfono:</strong> ${D.numCelular}<br>
      <strong>Forma de pago:</strong> ${D.formaPago}<br>
      <strong>Credencial digital:</strong> <a href="#" style="color:#0b2a4a;">Ver credencial</a>
    </p>
  </div>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin-top:25px;">
    Gracias por elegirnos.<br><strong>Andes Salud</strong>
  </p>
</td></tr>`);

// ---------- 4. Deuda-Utilidad (con aviso de suspensión) ----------
const saldosHtmlUtilidad = SALDOS.map(s => `
  <div style="border:1px solid #d9e2ec; padding:20px; margin-bottom:25px; border-radius:6px;">
    <p style="margin:0 0 16px 0; font-size:15px; line-height:1.8; color:#333333;">
      <strong>Vencimiento:</strong> ${s.fechaVencimiento}<br>
      <strong>Deuda total:</strong> ${s.valor}<br>
      <strong>CUIL titular:</strong> ${s.titular}
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td align="center">
        <a href="${s.linkDePago}" target="_blank" style="display:inline-block; background-color:#e8a000; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:14px 36px; border-radius:6px; letter-spacing:0.5px; text-transform:uppercase; border:2px solid #c88a00;">
          💳 &nbsp; Pagar ahora
        </a>
      </td></tr>
    </table>
  </div>`).join("");

const deudaUtilidad = wrap("Información de pago – Andes Salud", `
<tr><td align="center" style="padding:20px;">
  <h1 class="title-text" style="margin:0; font-size:30px; color:#0b2a4a;">Información de pago</h1>
</td></tr>
<tr><td style="padding:0 30px 30px 30px;">
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    Estimado/a afiliado/a <strong>${D.nombreCompleto}</strong>,
  </p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    Registramos cuotas impagas correspondientes a su cuenta en <strong>Andes Salud</strong>.
    Solicitamos regularizar la deuda a la mayor brevedad posible, a fin de evitar inconvenientes en la continuidad de su cobertura y la de su grupo familiar.
  </p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    Podrá efectuar el pago de forma rápida y segura mediante los links detallados más abajo, o bien a través de <strong>transferencia bancaria</strong> utilizando el alias informado.
  </p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 25px 0;">
    Asimismo, le recordamos que la cuota prestacional posee vencimiento el <strong>día 10 del corriente mes</strong>.
  </p>
  <div style="background-color:#fff5f5; border-left:4px solid #c0392b; padding:18px 20px; margin-bottom:25px;">
    <p style="margin:0; font-size:15px; line-height:1.6; color:#555555;">
      ⚠️ La falta de regularización de los períodos adeudados podrá generar la <strong>suspensión y/o limitación</strong> en la normal prestación de los servicios, conforme a las condiciones vigentes de afiliación.
    </p>
  </div>
  <div style="background-color:#f2f6fa; border-left:4px solid #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">📄 Períodos adeudados</p>
    <p style="margin:0; font-size:15px; color:#333333; line-height:1.6;">${D.periodosAdeudados}</p>
  </div>
  ${saldosHtmlUtilidad}
  <div style="background-color:#ffffff; border:1px dashed #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">💳 Transferencia bancaria</p>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#333333;">
      <strong>Alias:</strong> ANDES.SALUD123<br><strong>Razón social:</strong> ANDESALUD S.A.
    </p>
  </div>
  <p style="color:#555555; font-size:14px; line-height:1.6; margin:0 0 20px 0;">
    ⚠️ <strong>Este es un mensaje automático, no debés responderlo.</strong>
  </p>
  <p style="color:#555555; font-size:14px; line-height:1.6; margin:0 0 20px 0;">
    Si usted ya realizó el pago correspondiente, por favor desestime este mensaje.
  </p>
  <p style="color:#333333; font-size:15px; line-height:1.6; margin:0;">
    Si tenés alguna duda, comunicate con <strong>Pixi</strong>, nuestro asistente virtual, vía WhatsApp haciendo clic acá 👉🏼
    <a href="#" style="color:#0b2a4a; text-decoration:none;">wa.me/5492613300622</a>
  </p>
</td></tr>`);

// ---------- 5. Deuda (sin aviso de suspensión) ----------
const saldosHtmlDeuda = SALDOS.map(s => `
  <div style="border:1px solid #d9e2ec; padding:20px; margin-bottom:25px;">
    <p style="margin:0; font-size:15px; line-height:1.6; color:#333333;">
      <strong>Vencimiento:</strong> ${s.fechaVencimiento}<br>
      <strong>Deuda total:</strong> ${s.valor}<br>
      <strong>CUIL titular:</strong> ${s.titular}
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr><td align="center">
        <a href="${s.linkDePago}" target="_blank" style="display:inline-block; background-color:#e8a000; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:14px 36px; border-radius:6px; letter-spacing:0.5px; text-transform:uppercase; border:2px solid #c88a00;">
          💳 &nbsp; Pagar ahora
        </a>
      </td></tr>
    </table>
  </div>`).join("");

const deuda = wrap("Información de pago – Andes Salud", `
<tr><td align="center" style="padding:20px;">
  <h1 class="title-text" style="margin:0; font-size:30px; color:#0b2a4a;">Información de pago</h1>
</td></tr>
<tr><td style="padding:0 30px 30px 30px;">
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    Estimado/a afiliado/a <strong>${D.nombreCompleto}</strong>,
  </p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    Desde <strong>Andes Salud</strong> te compartimos los <strong>links de pago de la cuota mensual</strong> correspondientes a los períodos detallados a continuación.
  </p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 25px 0;">
    Recordá que también podés abonar mediante <strong>transferencia bancaria</strong> utilizando el alias indicado más abajo.
  </p>
  <div style="background-color:#f2f6fa; border-left:4px solid #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">📄 Períodos adeudados</p>
    <p style="margin:0; font-size:15px; color:#333333; line-height:1.6;">${D.periodosAdeudados}</p>
  </div>
  ${saldosHtmlDeuda}
  <div style="background-color:#ffffff; border:1px dashed #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">💳 Transferencia bancaria</p>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#333333;">
      <strong>Alias:</strong> ANDES.SALUD123<br><strong>Razón social:</strong> ANDESALUD S.A.
    </p>
  </div>
  <p style="color:#555555; font-size:14px; line-height:1.6; margin:0 0 20px 0;">
    ⚠️ <strong>Este es un mensaje automático, no debés responderlo.</strong>
  </p>
  <p style="color:#555555; font-size:14px; line-height:1.6; margin:0 0 20px 0;">
    Si usted ya realizó el pago correspondiente, por favor desestime este mensaje.
  </p>
  <p style="color:#333333; font-size:15px; line-height:1.6; margin:0;">
    Si tenés alguna duda, comunicate con <strong>Pixi</strong>, nuestro asistente virtual, vía WhatsApp haciendo clic acá 👉🏼
    <a href="#" style="color:#0b2a4a; text-decoration:none;">wa.me/5492613300622</a>
  </p>
</td></tr>`);

// ---------- 6. Pre-Alta-ADH ----------
const preAltaAdh = wrap("Estamos procesando tu solicitud – Andes Salud", `
<tr><td align="center" style="padding:20px;">
  <h1 class="title-text" style="margin:0; font-size:30px; color:#0b2a4a;">Estamos procesando tu solicitud ✅</h1>
</td></tr>
<tr><td style="padding:0 30px 30px 30px;">
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">¡Hola <strong>${D.nombreCompleto}</strong>! ☺️</p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 25px 0;">
    Estamos procesando tu solicitud para afiliarte a <strong>Andes Salud</strong> y queremos asegurarnos de que tus <strong>datos de contacto</strong> sean correctos.
  </p>
  <div style="background-color:#f2f6fa; border-left:4px solid #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">📋 Datos del plan</p>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#333333;">
      <strong>Plan elegido:</strong> ${D.plan}<br>
      <strong>Modalidad de ingreso:</strong> ${D.categoria}<br>
      <strong>Cantidad total de integrantes:</strong> ${D.integrantesNumero}<br>
      <strong>Forma de pago:</strong> ${D.formaPago}<br>
      <strong>Correo electrónico:</strong> ${D.email}<br>
      <strong>Numero de Teléfono:</strong> ${D.numCelular}<br>
    </p>
  </div>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    Si detectás algún dato incorrecto o tenés alguna consulta, comunicate con nosotros por WhatsApp 📱
  </p>
  <p style="margin:0; font-size:16px;">👉 <a href="#" style="color:#0b2a4a; text-decoration:none;">wa.me/5492613300622</a></p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin-top:25px;">¡Gracias por elegirnos! 😊<br><strong>Andes Salud</strong></p>
</td></tr>`);

// ---------- 7. Pre-Alta-REL (con info de débito automático) ----------
const preAltaRel = wrap("Validación de datos – Débito automático", `
<tr><td align="center" style="padding:20px;">
  <h1 class="title-text" style="margin:0; font-size:30px; color:#0b2a4a;">Estamos procesando tu solicitud ✅</h1>
</td></tr>
<tr><td style="padding:0 30px 30px 30px;">
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">¡Hola <strong>${D.nombreCompleto}</strong>! ☺️</p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 25px 0;">
    Estamos procesando tu solicitud para afiliarte a <strong>Andes Salud</strong> y queremos asegurarnos de que tus <strong>datos de contacto</strong> sean correctos.
  </p>
  <div style="background-color:#f2f6fa; border-left:4px solid #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">📋 Datos del plan</p>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#333333;">
      <strong>Plan elegido:</strong> ${D.plan}<br>
      <strong>Modalidad de ingreso:</strong> ${D.categoria}<br>
      <strong>Cantidad total de integrantes:</strong> ${D.integrantesNumero}<br>
      <strong>Forma de pago:</strong> ${D.formaPago}<br>
      <strong>Correo electrónico:</strong> ${D.email}<br>
      <strong>Numero de Teléfono:</strong> ${D.numCelular}<br>
    </p>
  </div>
  <div style="border:1px solid #d9e2ec; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; font-weight:bold; color:#0b2a4a;">🔐 Importante para completar el débito</p>
    <p style="margin:0; font-size:15px; line-height:1.6; color:#333333;">
      Para hacer efectiva esta opción, necesitás contar con tu <strong>Clave Fiscal</strong>.<br>
      Te mostramos cómo hacerlo en el siguiente video:<br>
      👉 <a href="#" style="color:#0b2a4a; text-decoration:none;">Ver tutorial</a>
    </p>
  </div>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 15px 0;">
    Si tenés alguna duda o necesitás ayuda 📱, comunicate con nosotros por WhatsApp:
  </p>
  <p style="margin:0; font-size:16px;">👉 <a href="#" style="color:#0b2a4a; text-decoration:none;">wa.me/5492613300622</a></p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin-top:25px;">¡Gracias por elegirnos! 😊<br><strong>Andes Salud</strong></p>
</td></tr>`);

// ---------- 8. Prevencion-Estafas ----------
const prevencionEstafas = wrap("Aviso importante – Prevención de Estafas", `
<tr><td align="center" style="padding:20px;">
  <h1 class="title-text" style="margin:0; font-size:34px; color:#0b2a4a;">🔐 Aviso importante de seguridad</h1>
</td></tr>
<tr><td style="padding:0 30px 30px 30px;">
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">¡Hola <strong>${D.nombreCompleto}</strong>! ☺️</p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    Recordá que <strong>ANDES SALUD</strong> <strong>nunca solicita datos bancarios</strong> por teléfono, correo electrónico ni mensajes.
  </p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 25px 0;">
    Si recibís un llamado o mensaje donde te pidan información como tu número de cuenta, tarjeta o claves, <strong>no los compartas</strong> y comunicate directamente con nuestros <strong>canales oficiales</strong>.
  </p>
  <div style="background-color:#f2f6fa; border-left:4px solid #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; color:#0b2a4a; font-size:16px; font-weight:bold;">Canales oficiales de contacto</p>
    <p style="margin:0; font-size:15px; color:#333333; line-height:1.6;">
      👉 <strong>Teléfono oficial:</strong> +54 9 261 330-0622<br>
      👉 <strong>Sitio web oficial:</strong> <a href="#" style="color:#0b2a4a; text-decoration:none;">www.andessalud.com.ar</a><br>
      👉 <strong>Dominios oficiales:</strong> andessalud.com.ar · andessalud.ar
    </p>
  </div>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0;">
    <strong>Cuidar tus datos es cuidar tu salud.</strong><br>Muchas gracias.
  </p>
</td></tr>`);

// ---------- 9. Referidos ----------
const referidos = wrap("Programa de Referidos – Andes Salud", `
<tr><td align="center" style="padding:20px;">
  <h1 class="title-text" style="margin:0; font-size:34px; color:#0b2a4a;">🎉 ¡Referí y ganá con Andes Salud!</h1>
</td></tr>
<tr><td style="padding:0 30px 30px 30px;">
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">¡Hola <strong>${D.nombreCompleto}</strong>! 😊</p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
    <strong>Sumate a nuestro Programa de Referidos</strong> y empezá a ganar beneficios por invitar a tus contactos.
  </p>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0 0 25px 0;">
    Por cada persona que se sume gracias a vos, podés obtener <strong>hasta $70.000 de descuento</strong> para usar en tu cuenta corriente.
  </p>
  <div style="background-color:#f2f6fa; border-left:4px solid #0b2a4a; padding:20px; margin-bottom:25px;">
    <p style="margin:0 0 10px 0; color:#0b2a4a; font-size:16px; font-weight:bold;">¿Cómo participar?</p>
    <p style="margin:0; font-size:15px; color:#333333; line-height:1.6;">
      👉 Escribinos a nuestro asistente <strong>Pixi</strong><br>
      👉 WhatsApp: <a href="#" style="color:#0b2a4a; text-decoration:none; font-weight:bold;">261 330-0622</a><br>
      👉 Elegí la opción <strong>E: ¡Referí y ganá!</strong>
    </p>
  </div>
  <p style="color:#333333; font-size:16px; line-height:1.6; margin:0;">
    <strong>¡No te lo pierdas!</strong><br>Invitá, referí y empezá a disfrutar tus beneficios con Andes Salud.
  </p>
</td></tr>`);

// ---------- Export ----------
export const PLANTILLAS_EJEMPLO: PlantillaEjemplo[] = [
    { id: 1, nombre: "Bienvenida-ADH", descripcion: "Alta de afiliado adherente", html: bienvenidaAdh },
    { id: 2, nombre: "Bienvenida-MON", descripcion: "Alta de afiliado monotributista", html: bienvenidaMon },
    { id: 3, nombre: "Bienvenida-REL", descripcion: "Alta de afiliado relación de dependencia", html: bienvenidaRel },
    { id: 4, nombre: "Deuda-Utilidad", descripcion: "Aviso de deuda con riesgo de suspensión", html: deudaUtilidad },
    { id: 5, nombre: "Deuda", descripcion: "Links de pago de cuota mensual", html: deuda },
    { id: 6, nombre: "Pre-Alta-ADH", descripcion: "Validación de datos pre-alta adherente", html: preAltaAdh },
    { id: 7, nombre: "Pre-Alta-REL", descripcion: "Validación de datos + débito automático", html: preAltaRel },
    { id: 8, nombre: "Prevencion-Estafas", descripcion: "Aviso de seguridad para afiliados", html: prevencionEstafas },
    { id: 9, nombre: "Referidos", descripcion: "Programa de referidos", html: referidos },
];