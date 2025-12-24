import { useState } from 'react'
import { toast, ToastContainer } from 'react-toastify';

const EliminarDatos = () => {

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Regex simple para validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            toast.error("Por favor, ingrese un correo electrónico válido.");
            return;
        }

        setError("");
        toast.success("Los datos fueron eliminados correctamente.");
        setEmail("");
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 w-full">
            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center flex flex-col gap-5">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Ingrese su email para eliminar sus datos
                </h2>
                <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
                <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full border text-gray-700 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-all duration-200 cursor-pointer"
                >
                    Eliminar
                </button>
                </form>
            </div>
            <ToastContainer
                autoClose={3000} 
                closeButton 
                pauseOnHover
                draggable
                limit={1}
            />     
        </div>
    )
}

export default EliminarDatos