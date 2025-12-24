import {  useState } from "react";
import { CiSquarePlus } from "react-icons/ci";
import CrearTagModal from "../../components/modal/CrearTagModal";
import { useDispatch } from "react-redux";
import { openModalTag } from "../../app/slices/actionSlice";
import "./acciones.css";
// import { getTags } from "../../services/tags/tags.services";
// import { Tag } from "../../interfaces/tags.interface";
// import { RootState } from "../../app/store";

const ITEMS_PER_PAGE = 5;

const acciones = [
  {
    id: 1,
    nombre: "asignar",
    descripcion: "Se asigna un chat a un operador que se encuentre activo"
  },
  {
    id: 2,
    nombre: "mencionar",
    descripcion: "Se menciona a un operador en un chat para que el mismo realice una tarea"
  },
  {
    id: 3,
    nombre: "archivar",
    descripcion: "Un operador en particular archiva un chat evitando la comunicación con el bot"
  },
  {
    id: 4,
    nombre: "ticket",
    descripcion: "Un operador en particular crea un ticket de la gestión del chat"
  }
];


const TableAcciones = () => {
  const [page, setPage] = useState(1);
  // const [tags, setTags] = useState<Tag[]>([]);
  const totalPages = Math.ceil(acciones!.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentTags = acciones.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // const newTag = useSelector((state: RootState) => state.action.newTag);
  const dispatch = useDispatch();
  // const token = localStorage.getItem("token") || "";

  /* useEffect(() => {
    const ejecucion = async () => {
      const resp = await getTags(token);
      setTags(resp.tags);
    };
    ejecucion();
  }, []);
 */
  /* useEffect(() => {
    if (newTag) {
      setTags((prevTags) => [
        ...prevTags,
        {
          id: `${tags.length}`,
          nombre: newTag,
          descripcion: "Sin descripción", // valor por defecto
        },
      ]);
    }
  }, [newTag]); */

  return (
    <div className="acciones-wrapper">
      {/* Header */}
      <div className="acciones-header">
        <h2 className="acciones-header-title">Gestión de Acciones</h2>
        <p className="acciones-header-description">
          Visualice y administre todas las acciones disponibles en su sistema. Las acciones son operaciones que pueden 
          ejecutarse dentro de los chats, como asignar un chat a un operador, mencionar a un usuario, archivar conversaciones 
          o crear tickets. Cada acción pertenece a su empresa, puede ser ejecutada por un usuario específico, tener múltiples 
          usuarios responsables y estar asociada a uno o varios chats.
        </p>
      </div>

      <div className="acciones-container">
      <div className="acciones-table-wrapper overflow-x-auto">
        <table className="acciones-table">
          <thead>
            <tr className="acciones-table-header grid grid-cols-5">
              <th className="acciones-table-header-cell">ID</th>
              <th className="acciones-table-header-cell">Nombre</th>
              <th className="acciones-table-header-cell">Descripción</th>
              <th className="acciones-table-header-cell">
                <CiSquarePlus
                  size={35}
                  onClick={() => dispatch(openModalTag())}
                  className="acciones-button-add"
                />
              </th>
              <th className="acciones-table-header-cell"></th>
            </tr>
          </thead>
          <tbody>
            {currentTags.map((tag, index) => (
              <tr
                key={tag.id}
                className="acciones-table-row grid grid-cols-5 items-center"
              >
                <td className="acciones-table-cell acciones-table-cell-id">
                  {index + 1}
                </td>
                <td className="acciones-table-cell acciones-table-cell-nombre">
                  {tag.nombre}
                </td>
                <td className="acciones-table-cell acciones-table-cell-descripcion">
                  {tag.descripcion || "Sin descripción"}
                </td>
                <td className="acciones-table-cell flex justify-center">
                  <button className="acciones-button-edit">
                    Editar
                  </button>
                </td>
                <td className="acciones-table-cell flex justify-center">
                  <button className="acciones-button-delete">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="acciones-pagination-container">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="acciones-pagination-button"
        >
          Anterior
        </button>
        <span className="acciones-pagination-info">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="acciones-pagination-button"
        >
          Siguiente
        </button>
      </div>

      <CrearTagModal />
      </div>
    </div>
  );
};

export default TableAcciones;
