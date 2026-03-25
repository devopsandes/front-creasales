import { ChangeEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalEditUser, openSessionExpired } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';
import { toast } from 'react-toastify';
import { UserCog, X, Eye, EyeOff } from 'lucide-react';
import { ROLES, TIPOS_DOC } from '../../utils/constans';
import Spinner23 from '../spinners/Spinner23';
import { updateUser } from '../../services/auth/auth.services';
import './crear-usuario-modal.css';

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

const EditarUsuarioModal = ({ onUserUpdated }: { onUserUpdated?: () => void }) => {
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
    const modalEditUser = useSelector((state: RootState) => state.action.modalEditUser);
    const editingUser = useSelector((state: RootState) => state.action.editingUser);
    const token = localStorage.getItem('token') || '';

    useEffect(() => {
        if (editingUser) {
            setNombre(editingUser.nombre || '');
            setApellido(editingUser.apellido || '');
            setEmail(editingUser.email || '');
            setTelefono(editingUser.telefono || '');
            setRole(editingUser.role || '');
            setNumero(editingUser.nro_doc?.toString() || '');
            setPass('');
            setErrores({});

            if (editingUser.nacimiento) {
                const fecha = new Date(editingUser.nacimiento);
                const formatted = fecha.toISOString().split('T')[0];
                setNacimiento(formatted);
            }

            if (editingUser.tipo_doc) {
                const tipoFound = TIPOS_DOC.find(t => t.nombre === editingUser.tipo_doc);
                if (tipoFound) {
                    setTipo({ id: tipoFound.id, valor: tipoFound.nombre });
                }
            }
        }
    }, [editingUser]);

    if (!modalEditUser) return null;

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

    const validarLocal = (): boolean => {
        const nuevosErrores: { [campo: string]: string[] } = {};

        if (nombre.trim() === '') nuevosErrores.nombre = ['El nombre es obligatorio'];
        if (apellido.trim() === '') nuevosErrores.apellido = ['El apellido es obligatorio'];
        if (email.trim() === '') nuevosErrores.email = ['El email es obligatorio'];
        if (nacimiento.trim() === '') nuevosErrores.nacimiento = ['La fecha de nacimiento es obligatoria'];
        if (telefono.trim() === '') nuevosErrores.telefono = ['El teléfono es obligatorio'];
        if (numero.trim() === '') nuevosErrores.nro_doc = ['El número de documento es obligatorio'];
        if (role.trim() === '') nuevosErrores.role = ['El rol es obligatorio'];
        if (tipo.valor.trim() === '') nuevosErrores.tipo_doc = ['El tipo de documento es obligatorio'];

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

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

        if (!token) {
            setShowSpinner(false);
            dispatch(openSessionExpired());
            return;
        }

        const userData: Record<string, any> = {
            nombre,
            apellido,
            email,
            nacimiento,
            telefono,
            tipo_doc: tipo.valor,
            nro_doc: +numero,
            role,
        };

        if (pass.trim() !== '') {
            userData.password = pass;
        }

        const resp = await updateUser(editingUser!.id, token, userData);

        setShowSpinner(false);

        if (resp.statusCode === 200 || resp.statusCode === 201) {
            toast.success('Usuario actualizado correctamente');
            limpiarForm();
            dispatch(closeModalEditUser());
            if (onUserUpdated) onUserUpdated();
        } else if (resp.statusCode === 401) {
            dispatch(openSessionExpired());
        } else {
            const backendErrores = resp.message || resp.msg;
            if (backendErrores) {
                procesarErroresBackend(backendErrores);
            } else {
                setErrores({ general: ['Error al actualizar el usuario'] });
            }
        }
    };

    const handleClose = () => {
        dispatch(closeModalEditUser());
        limpiarForm();
    };

    const handleChangeTipo = (e: ChangeEvent<HTMLSelectElement>) => {
        setTipo({
            id: +e.target.value,
            valor: e.target.selectedOptions[0].text,
        });
        if (errores.tipo_doc) {
            setErrores(prev => { const n = { ...prev }; delete n.tipo_doc; return n; });
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const limpiarErrorCampo = (campo: string) => {
        if (errores[campo]) {
            setErrores(prev => { const n = { ...prev }; delete n[campo]; return n; });
        }
    };

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
                        <UserCog size={32} />
                    </div>

                    <h2 className="create-user-modal-title">Editar Usuario</h2>
                    <p className="create-user-modal-subtitle">
                        Modifique los datos de {editingUser?.nombre} {editingUser?.apellido}
                    </p>

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
                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-nombre">Nombre</label>
                                    <input
                                        type="text"
                                        id="edit-nombre"
                                        placeholder="Ingrese un nombre"
                                        className={`create-user-modal-input ${tieneError('nombre') ? 'input-error' : ''}`}
                                        value={nombre}
                                        onChange={(e) => { setNombre(e.target.value); limpiarErrorCampo('nombre'); }}
                                    />
                                    {errores.nombre && errores.nombre.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-apellido">Apellido</label>
                                    <input
                                        type="text"
                                        id="edit-apellido"
                                        placeholder="Ingrese un apellido"
                                        className={`create-user-modal-input ${tieneError('apellido') ? 'input-error' : ''}`}
                                        value={apellido}
                                        onChange={(e) => { setApellido(e.target.value); limpiarErrorCampo('apellido'); }}
                                    />
                                    {errores.apellido && errores.apellido.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-email">Email</label>
                                    <input
                                        type="email"
                                        id="edit-email"
                                        placeholder="Ingrese un email"
                                        className={`create-user-modal-input ${tieneError('email') ? 'input-error' : ''}`}
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); limpiarErrorCampo('email'); }}
                                    />
                                    {errores.email && errores.email.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-nacimiento">Nacimiento</label>
                                    <input
                                        type="date"
                                        id="edit-nacimiento"
                                        className={`create-user-modal-input ${tieneError('nacimiento') ? 'input-error' : ''}`}
                                        value={nacimiento}
                                        onChange={(e) => { setNacimiento(e.target.value); limpiarErrorCampo('nacimiento'); }}
                                    />
                                    {errores.nacimiento && errores.nacimiento.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-telefono">Teléfono</label>
                                    <input
                                        type="text"
                                        id="edit-telefono"
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
                                <div className="create-user-modal-field create-user-modal-field-password">
                                    <label htmlFor="edit-pass">
                                        Contraseña <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>(dejar vacío para no cambiar)</span>
                                    </label>
                                    <div className="create-user-modal-password-wrapper">
                                        <input
                                            id="edit-pass"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Nueva contraseña (opcional)"
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

                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-tipo">Tipo Documento</label>
                                    <select
                                        name="tipo"
                                        id="edit-tipo"
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

                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-numero">Número</label>
                                    <input
                                        type="text"
                                        id="edit-numero"
                                        placeholder="33265987"
                                        className={`create-user-modal-input ${tieneError('nro_doc') ? 'input-error' : ''}`}
                                        value={numero}
                                        onChange={(e) => { setNumero(e.target.value); limpiarErrorCampo('nro_doc'); }}
                                    />
                                    {errores.nro_doc && errores.nro_doc.map((err, i) => (
                                        <span key={i} className="field-error-message">{err}</span>
                                    ))}
                                </div>

                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-role">Rol Usuario</label>
                                    <select
                                        name="role"
                                        id="edit-role"
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
                            Guardar Cambios
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default EditarUsuarioModal;
