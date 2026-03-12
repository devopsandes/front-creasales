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

    const dispatch = useDispatch();
    const modalEditUser = useSelector((state: RootState) => state.action.modalEditUser);
    const editingUser = useSelector((state: RootState) => state.action.editingUser);
    const token = localStorage.getItem('token') || '';

    // Pre-cargar los datos del usuario cuando se abre el modal
    useEffect(() => {
        if (editingUser) {
            setNombre(editingUser.nombre || '');
            setApellido(editingUser.apellido || '');
            setEmail(editingUser.email || '');
            setTelefono(editingUser.telefono || '');
            setRole(editingUser.role || '');
            setNumero(editingUser.nro_doc?.toString() || '');
            setPass(''); // No pre-cargar la contraseña

            // Formatear fecha de nacimiento para el input date
            if (editingUser.nacimiento) {
                const fecha = new Date(editingUser.nacimiento);
                const formatted = fecha.toISOString().split('T')[0];
                setNacimiento(formatted);
            }

            // Buscar el tipo de documento en la lista de TIPOS_DOC
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
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setShowSpinner(true);

        if (
            nombre.trim() === '' ||
            apellido.trim() === '' ||
            nacimiento.trim() === '' ||
            email.trim() === '' ||
            telefono.trim() === '' ||
            numero.trim() === '' ||
            role.trim() === ''
        ) {
            alert('Todos los campos son obligatorios (excepto contraseña)');
            setShowSpinner(false);
            return;
        }

        if (!token) {
            setShowSpinner(false);
            dispatch(openSessionExpired());
            return;
        }

        // Construir el objeto solo con los campos que cambiaron
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

        // Solo incluir password si se escribió una nueva
        if (pass.trim() !== '') {
            userData.password = pass;
        }

        const resp = await updateUser(editingUser!.id, token, userData);

        setShowSpinner(false);

        if (resp.statusCode === 200 || resp.statusCode === 201) {
            toast.success('Usuario actualizado correctamente');
            limpiarForm();
            dispatch(closeModalEditUser());
            // Callback para refrescar la tabla
            if (onUserUpdated) onUserUpdated();
        } else if (resp.statusCode === 401) {
            dispatch(openSessionExpired());
        } else if (resp.statusCode === 400) {
            // Mostrar errores de validación del backend
            const mensajes = Array.isArray(resp.message)
                ? resp.message.join('\n')
                : resp.message;
            toast.error(mensajes || 'Error de validación');
        } else {
            toast.error('Error al actualizar el usuario');
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
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

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

                    <form onSubmit={handleSubmit} className="create-user-modal-form">
                        <div className="create-user-modal-columns">
                            <div className="create-user-modal-column">
                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-nombre">Nombre</label>
                                    <input
                                        type="text"
                                        id="edit-nombre"
                                        placeholder="Ingrese un nombre"
                                        className="create-user-modal-input"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                    />
                                </div>
                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-apellido">Apellido</label>
                                    <input
                                        type="text"
                                        id="edit-apellido"
                                        placeholder="Ingrese un apellido"
                                        className="create-user-modal-input"
                                        value={apellido}
                                        onChange={(e) => setApellido(e.target.value)}
                                    />
                                </div>
                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-email">Email</label>
                                    <input
                                        type="email"
                                        id="edit-email"
                                        placeholder="Ingrese un email"
                                        className="create-user-modal-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-nacimiento">Nacimiento</label>
                                    <input
                                        type="date"
                                        id="edit-nacimiento"
                                        className="create-user-modal-input"
                                        value={nacimiento}
                                        onChange={(e) => setNacimiento(e.target.value)}
                                    />
                                </div>
                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-telefono">Teléfono</label>
                                    <input
                                        type="text"
                                        id="edit-telefono"
                                        placeholder="Ej: 5492615345678"
                                        className="create-user-modal-input"
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                    />
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
                                            onChange={(e) => setPass(e.target.value)}
                                            className="create-user-modal-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="create-user-modal-password-toggle"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-tipo">Tipo Documento</label>
                                    <select
                                        name="tipo"
                                        id="edit-tipo"
                                        className="create-user-modal-input"
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
                                </div>
                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-numero">Número</label>
                                    <input
                                        type="text"
                                        id="edit-numero"
                                        placeholder="33265987"
                                        className="create-user-modal-input"
                                        value={numero}
                                        onChange={(e) => setNumero(e.target.value)}
                                    />
                                </div>
                                <div className="create-user-modal-field">
                                    <label htmlFor="edit-role">Rol Usuario</label>
                                    <select
                                        name="role"
                                        id="edit-role"
                                        className="create-user-modal-input"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="">Seleccione</option>
                                        {ROLES.map((r) => (
                                            <option value={r.nombre} key={r.id}>
                                                {r.nombre}
                                            </option>
                                        ))}
                                    </select>
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
