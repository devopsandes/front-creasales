import { ChangeEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalUser, openSessionExpired } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { toast } from 'react-toastify';
import { UserPlus, X, Eye, EyeOff } from 'lucide-react';
import { ROLES, TIPOS_DOC } from '../../utils/constans';
import Spinner23 from '../spinners/Spinner23';
import { empresaXUser } from '../../services/empresas/empresa.services';
import { authRegister } from '../../services/auth/auth.services';
import './crear-usuario-modal.css';

// Mapeo de palabras clave del backend a campos del formulario
const mapearErrorACampo = (error: string): string => {
    const errorLower = error.toLowerCase();
    if (errorLower.includes('nombre') && !errorLower.includes('apellido')) return 'nombre';
    if (errorLower.includes('apellido')) return 'apellido';
    if (errorLower.includes('email')) return 'email';
    if (errorLower.includes('nacimiento')) return 'nacimiento';
    if (errorLower.includes('telefono') || errorLower.includes('teléfono')) return 'telefono';
    if (errorLower.includes('password') || errorLower.includes('contraseña')) return 'password';
    if (errorLower.includes('tipo_doc') || errorLower.includes('tipo documento')) return 'tipo_doc';
    if (errorLower.includes('nro_doc') || errorLower.includes('documento') || errorLower.includes('valor no debe ser mayor') || errorLower.includes('valor debe ser al menos')) return 'nro_doc';
    if (errorLower.includes('rol') || errorLower.includes('role')) return 'role';
    return 'general';
};

const CrearUsuarioModal = () => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [nombre, setNombre] = useState<string>('');
    const [apellido, setApellido] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [nacimiento, setNacimiento] = useState<string>('');
    const [telefono, setTelefono] = useState<string>('');
    const [pass, setPass] = useState<string>('');
    const [tipo, setTipo] = useState({ id: 0, valor: '' });
    const [role, setRole] = useState<string>('');
    const [numero, setNumero] = useState<string>('');
    const [showSpinner, setShowSpinner] = useState(false);
    const [errores, setErrores] = useState<{ [campo: string]: string[] }>({});

    const dispatch = useDispatch();
    const modalUser = useSelector((state: RootState) => state.action.modalUser);
    const token = localStorage.getItem('token') || '';

    useEffect(() => {
        setNombre('');
    }, []);

    if (!modalUser) return null;

    const limpiarForm = () => {
        setNombre('');
        setApellido('');
        setEmail('');
        setNacimiento('');
        setTelefono('');
        setPass('');
        setTipo({ id: 0, valor: '' });
        setNumero('');
        setRole('');
        setErrores({});
    };

    // Validación local antes de enviar al backend
    const validarLocal = (): boolean => {
        const nuevosErrores: { [campo: string]: string[] } = {};

        if (nombre.trim() === '') nuevosErrores.nombre = ['El nombre es obligatorio'];
        if (apellido.trim() === '') nuevosErrores.apellido = ['El apellido es obligatorio'];
        if (email.trim() === '') nuevosErrores.email = ['El email es obligatorio'];
        if (nacimiento.trim() === '') nuevosErrores.nacimiento = ['La fecha de nacimiento es obligatoria'];
        if (telefono.trim() === '') nuevosErrores.telefono = ['El teléfono es obligatorio'];
        if (pass.trim() === '') nuevosErrores.password = ['La contraseña es obligatoria'];
        if (numero.trim() === '') nuevosErrores.nro_doc = ['El número de documento es obligatorio'];
        if (role.trim() === '') nuevosErrores.role = ['El rol es obligatorio'];
        if (tipo.valor.trim() === '') nuevosErrores.tipo_doc = ['El tipo de documento es obligatorio'];

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    // Procesar errores del backend y asignarlos a campos
    const procesarErroresBackend = (respErrores: string[] | string) => {
        const lista = Array.isArray(respErrores) ? respErrores : [respErrores];
        const nuevosErrores: { [campo: string]: string[] } = {};

        lista.forEach((err: string) => {
            const campo = mapearErrorACampo(err);
            if (!nuevosErrores[campo]) nuevosErrores[campo] = [];
            nuevosErrores[campo].push(err);
        });

        setErrores(nuevosErrores);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrores({});

        if (!validarLocal()) return;

        setShowSpinner(true);

        try {
            if (!token) {
                setShowSpinner(false);
                dispatch(openSessionExpired());
                return;
            }

            let empresaId: string | undefined = undefined;
            try {
                const empresa = await empresaXUser(token!);
                empresaId = empresa?.empresa?.id;
            } catch (err) {
                console.error('Error al obtener empresa:', err);
            }

            const resp = await authRegister({
                nombre,
                apellido,
                nacimiento,
                email,
                telefono,
                password: pass,
                tipo_doc: tipo.valor,
                nro_doc: +numero,
                role,
                empresa_id: empresaId,
            });

            setShowSpinner(false);

            if (resp.statusCode === 201) {
                limpiarForm();
                toast.success(resp.msg);
                dispatch(closeModalUser());
            } else if (resp.statusCode === 401) {
                dispatch(openSessionExpired());
            } else {
                const backendErrores = resp.message || resp.msg;
                if (backendErrores) {
                    procesarErroresBackend(backendErrores);
                } else {
                    setErrores({ general: ['Error al crear el usuario'] });
                }
            }
        } catch (error: any) {
            console.error('Error en handleSubmit:', error);
            console.error('Error message:', error?.message);
            console.error('Error response:', error?.response?.data);
            setShowSpinner(false);
            setErrores({ general: ['Ocurrió un error inesperado. Intente nuevamente.'] });
        }
    };

    const handleClose = () => {
        dispatch(closeModalUser());
        limpiarForm();
    };

    const handleChangeTipo = (e: ChangeEvent<HTMLSelectElement>) => {
        setTipo({
            id: +e.target.value,
            valor: e.target.selectedOptions[0].text,
        });
        // Limpiar error del campo al modificarlo
        if (errores.tipo_doc) {
            setErrores(prev => { const n = { ...prev }; delete n.tipo_doc; return n; });
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    // Helper para limpiar error de un campo cuando el usuario escribe
    const limpiarErrorCampo = (campo: string) => {
        if (errores[campo]) {
            setErrores(prev => { const n = { ...prev }; delete n[campo]; return n; });
        }
    };

    // Helper para saber si un campo tiene error
    const tieneError = (campo: string): boolean => !!errores[campo];

    return (
        <div className="create-user-modal-overlay" onClick={handleOverlayClick}>
            {showSpinner ? (
                <Spinner23 />
            ) : (
                <div className="create-user-modal-container">
                    <button className="create-user-modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>

                    <div className="create-user-modal-icon">
                        <UserPlus size={32} />
                    </div>

                    <h2 className="create-user-modal-title">Crear Usuario</h2>
                    <p className="create-user-modal-subtitle">Complete los datos del nuevo usuario</p>

                    {/* Errores generales (no mapeados a un campo) */}
                    {errores.general && (
                        <div className="create-user-modal-error-banner">
                            {errores.general.map((err, i) => (
                                <p key={i}>{err}</p>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="create-user-modal-form">
                        <div className="create-user-modal-columns">
                            <div className="create-user-modal-column">
                                {/* Nombre */}
                                <div className="create-user-modal-field">
                                    <label htmlFor="nombre">Nombre</label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        placeholder="Ingrese un nombre"
                                        className={`create-user-modal-input ${tieneError('nombre') ? 'input-error' : ''}`}
                                        value={nombre}
                                        onChange={(e) => { setNombre(e.target.value); limpiarErrorCampo('nombre'); }}
                                    />
                                    {errores.nombre && errores.nombre.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                {/* Apellido */}
                                <div className="create-user-modal-field">
                                    <label htmlFor="apellido">Apellido</label>
                                    <input
                                        type="text"
                                        id="apellido"
                                        placeholder="Ingrese un apellido"
                                        className={`create-user-modal-input ${tieneError('apellido') ? 'input-error' : ''}`}
                                        value={apellido}
                                        onChange={(e) => { setApellido(e.target.value); limpiarErrorCampo('apellido'); }}
                                    />
                                    {errores.apellido && errores.apellido.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                {/* Email */}
                                <div className="create-user-modal-field">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="Ingrese un email"
                                        className={`create-user-modal-input ${tieneError('email') ? 'input-error' : ''}`}
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); limpiarErrorCampo('email'); }}
                                    />
                                    {errores.email && errores.email.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                {/* Nacimiento */}
                                <div className="create-user-modal-field">
                                    <label htmlFor="nacimiento">Nacimiento</label>
                                    <input
                                        type="date"
                                        id="nacimiento"
                                        className={`create-user-modal-input ${tieneError('nacimiento') ? 'input-error' : ''}`}
                                        value={nacimiento}
                                        onChange={(e) => { setNacimiento(e.target.value); limpiarErrorCampo('nacimiento'); }}
                                    />
                                    {errores.nacimiento && errores.nacimiento.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                {/* Teléfono */}
                                <div className="create-user-modal-field">
                                    <label htmlFor="telefono">Teléfono</label>
                                    <input
                                        type="text"
                                        id="telefono"
                                        placeholder="Ej: 5492615345678"
                                        className={`create-user-modal-input ${tieneError('telefono') ? 'input-error' : ''}`}
                                        value={telefono}
                                        onChange={(e) => { setTelefono(e.target.value); limpiarErrorCampo('telefono'); }}
                                    />
                                    {errores.telefono && errores.telefono.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="create-user-modal-column">
                                {/* Contraseña */}
                                <div className="create-user-modal-field create-user-modal-field-password">
                                    <label htmlFor="pass">Contraseña</label>
                                    <div className="create-user-modal-password-wrapper">
                                        <input
                                            id="pass"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Ingrese su contraseña"
                                            value={pass}
                                            onChange={(e) => { setPass(e.target.value); limpiarErrorCampo('password'); }}
                                            className={`create-user-modal-input ${tieneError('password') ? 'input-error' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="create-user-modal-password-toggle"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errores.password && errores.password.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                {/* Tipo Documento */}
                                <div className="create-user-modal-field">
                                    <label htmlFor="tipo">Tipo Documento</label>
                                    <select
                                        name="tipo"
                                        id="tipo"
                                        className={`create-user-modal-input ${tieneError('tipo_doc') ? 'input-error' : ''}`}
                                        value={tipo.id}
                                        onChange={handleChangeTipo}
                                    >
                                        <option value="">Seleccione</option>
                                        {TIPOS_DOC.map((t) => (
                                            <option value={t.id} key={t.id}>
                                                {t.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errores.tipo_doc && errores.tipo_doc.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                {/* Número Documento */}
                                <div className="create-user-modal-field">
                                    <label htmlFor="numero">Número</label>
                                    <input
                                        type="text"
                                        id="numero"
                                        placeholder="33265987"
                                        className={`create-user-modal-input ${tieneError('nro_doc') ? 'input-error' : ''}`}
                                        value={numero}
                                        onChange={(e) => { setNumero(e.target.value); limpiarErrorCampo('nro_doc'); }}
                                    />
                                    {errores.nro_doc && errores.nro_doc.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                {/* Rol */}
                                <div className="create-user-modal-field">
                                    <label htmlFor="role">Rol Usuario</label>
                                    <select
                                        name="role"
                                        id="role"
                                        className={`create-user-modal-input ${tieneError('role') ? 'input-error' : ''}`}
                                        value={role}
                                        onChange={(e) => { setRole(e.target.value); limpiarErrorCampo('role'); }}
                                    >
                                        <option value="">Seleccione</option>
                                        {ROLES.map((r) => (
                                            <option value={r.nombre} key={r.id}>
                                                {r.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errores.role && errores.role.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="create-user-modal-submit">
                            Crear Usuario
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CrearUsuarioModal;
