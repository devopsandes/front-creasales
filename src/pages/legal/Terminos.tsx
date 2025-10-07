import { useState } from 'react'

const Terminos = () => {
    const [accepted, setAccepted] = useState(false);

    const handleSubmit = () => {
        if (!accepted) {
            alert("Debes aceptar los términos y condiciones para continuar.");
            return;
        }
        alert("Términos aceptados correctamente ✅");
    };

    return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 w-screen">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
          Términos y Condiciones
        </h1>

        
        <div className="border border-gray-200 rounded-xl p-4 overflow-y-scroll h-72 mb-4 [&::-webkit-scrollbar]:hidden ">
          <p className="text-sm text-gray-700 mb-2">
            Bienvenido/a a nuestra aplicación CRM con ChatBot. Al utilizar esta
            plataforma, aceptas los siguientes términos y condiciones:
          </p>

          <p className="text-sm text-gray-700 mb-2">
            1️⃣ <strong>Uso del servicio:</strong> La aplicación está destinada a la
            gestión de clientes, comunicación interna y automatización de
            procesos mediante inteligencia artificial conversacional.
          </p>

          <p className="text-sm text-gray-700 mb-2">
            2️⃣ <strong>Datos personales:</strong> Toda la información
            proporcionada por los usuarios será tratada conforme a la normativa
            vigente en materia de protección de datos. No compartimos información
            personal con terceros sin consentimiento.
          </p>

          <p className="text-sm text-gray-700 mb-2">
            3️⃣ <strong>Responsabilidad del usuario:</strong> El usuario es
            responsable de mantener la confidencialidad de sus credenciales de
            acceso y de toda la actividad que ocurra bajo su cuenta.
          </p>

          <p className="text-sm text-gray-700 mb-2">
            4️⃣ <strong>Disponibilidad del servicio:</strong> Nos reservamos el
            derecho a interrumpir o modificar el servicio por mantenimiento,
            actualizaciones o causas técnicas.
          </p>

          <p className="text-sm text-gray-700 mb-2">
            5️⃣ <strong>ChatBot y automatización:</strong> Las respuestas generadas
            por el ChatBot se basan en datos internos y reglas de negocio, y no
            constituyen asesoramiento profesional. El usuario debe validar la
            información antes de tomar decisiones basadas en el sistema.
          </p>

          <p className="text-sm text-gray-700 mb-2">
            6️⃣ <strong>Modificaciones:</strong> Nos reservamos el derecho de
            actualizar estos términos en cualquier momento. El uso continuado de
            la plataforma implica la aceptación de los cambios.
          </p>

          <p className="text-sm text-gray-700">
            Al marcar la casilla de aceptación, declaras haber leído,
            comprendido y aceptado la totalidad de los presentes términos y
            condiciones.
          </p>
        </div>

        <div className='flex flex-col gap-4 mt-5'>
            <label className="flex items-center mb-4 text-sm text-gray-700">
            <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
            />
            Acepto los términos y condiciones
            </label>

        <button
          onClick={handleSubmit}
          disabled={!accepted}
          className={`w-full py-2 rounded-xl text-white font-semibold transition 
            ${
              accepted
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          Aceptar
        </button>
        </div>

       
      </div>
    </div>
    )
}

export default Terminos