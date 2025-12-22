import { useEffect, useState, useRef } from "react";
import { CiSquarePlus } from "react-icons/ci";
import CrearTagModal from "../../components/modal/CrearTagModal";
import EditTagModal from "../../components/modal/EditTagModal";
import DeleteTagModal from "../../components/modal/DeleteTagModal";
import { useDispatch, useSelector } from "react-redux";
import { openModalTag, openSessionExpired } from "../../app/slices/actionSlice";
import { getTags } from "../../services/tags/tags.services";
import { Tag } from "../../interfaces/tags.interface";
import { capitalizeWords } from "../../utils/functions";
import { RootState } from "../../app/store";
import "./tags.css";




const ITEMS_PER_PAGE = 15;

const TableTags = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [tags, setTags] = useState<Tag[]>([]);
  const totalPages = Math.ceil(tags!.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentTags = tags!.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const newTag = useSelector((state: RootState) => state.action.newTag);
  const dispatch = useDispatch();
  const token = localStorage.getItem('token') || '';
  const empresa = useSelector((state: RootState) => state.auth.empresa);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<{ id: string; nombre: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [showAddTooltip, setShowAddTooltip] = useState<boolean>(false);
  const [addTooltipStyle, setAddTooltipStyle] = useState<React.CSSProperties>({});
  const addIconRef = useRef<HTMLDivElement>(null);


  useEffect(()=>{
    const ejecucion = async () => {
      const resp = await getTags(token);
      if (resp.statusCode === 401) {
        dispatch(openSessionExpired());
        return;
      }
      setTags(resp.tags);
      setLoading(false)
    }
    ejecucion();
  },[])

  useEffect(() => {
    if(newTag && empresa) {
      setTags((prevTags) => [...prevTags, {id: `${tags.length}`, nombre: newTag, empresa }]);
    }
    
  },[ newTag])

  const handleEditClick = (tag: Tag) => {
    setSelectedTag({ id: tag.id, nombre: tag.nombre });
    setIsEditModalOpen(true);
  }

  const handleEditSuccess = async () => {
    // Recargar los tags después de editar
    const resp = await getTags(token);
    if (resp.statusCode === 401) {
      dispatch(openSessionExpired());
      return;
    }
    setTags(resp.tags);
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedTag(null);
  }

  const handleDeleteClick = (tag: Tag) => {
    setTagToDelete(tag);
    setIsDeleteModalOpen(true);
  }

  const handleDeleteSuccess = async () => {
    // Recargar los tags después de eliminar
    const resp = await getTags(token);
    if (resp.statusCode === 401) {
      dispatch(openSessionExpired());
      return;
    }
    setTags(resp.tags);
  }

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setTagToDelete(null);
  }

  const handleAddIconMouseEnter = () => {
    if (addIconRef.current) {
      const rect = addIconRef.current.getBoundingClientRect();
      const tooltipWidth = 120;
      const viewportWidth = window.innerWidth;
      
      let leftPosition = rect.left + rect.width / 2;
      
      if (leftPosition + tooltipWidth / 2 > viewportWidth - 10) {
        leftPosition = viewportWidth - tooltipWidth / 2 - 20;
      }
      
      setAddTooltipStyle({
        top: `${rect.top - 10}px`,
        left: `${leftPosition}px`,
      });
      setShowAddTooltip(true);
    }
  }

  const handleAddIconMouseLeave = () => {
    setShowAddTooltip(false);
  }

 
  return (
    <div className="tags-wrapper">
      {/* Header */}
      <div className="tags-header">
        <h2 className="tags-header-title">Gestión de Etiquetas</h2>
        <p className="tags-header-description">
          Visualice y administre todas las etiquetas creadas en su sistema. Las etiquetas son etiquetas personalizadas 
          que permiten clasificar y organizar las conversaciones de chat de manera flexible. Cada etiqueta pertenece 
          a su empresa y puede ser asignada a múltiples chats para facilitar la búsqueda y el seguimiento de conversaciones 
          relacionadas.
        </p>
      </div>

      <div className="tags-container">
      {loading ? (
        <div className="tags-spinner-container">
          <div className="loader2"></div>
        </div>
      ) : (
        <div className="tags-table-wrapper overflow-x-auto">
          <table className="tags-table">
            <thead>
              <tr className="tags-table-header grid grid-cols-4">
                <th className="tags-table-header-cell">ID Etiqueta</th>
                <th className="tags-table-header-cell">Nombre de la Etiqueta</th>
                <th className="tags-table-header-cell tags-table-header-cell-icon">
                  <div
                    ref={addIconRef as React.RefObject<HTMLDivElement>}
                    onMouseEnter={handleAddIconMouseEnter}
                    onMouseLeave={handleAddIconMouseLeave}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <CiSquarePlus 
                      size={32} 
                      onClick={() => dispatch(openModalTag())} 
                      className="tags-button-add"
                    />
                  </div>
                  {showAddTooltip && (
                    <div className="tags-tooltip" style={addTooltipStyle}>
                      Crear etiqueta
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTags.map((tag, index) => (
                <tr key={tag.id} className="tags-table-row grid grid-cols-4 items-center">
                  <td className="tags-table-cell tags-table-cell-id">{index+1}</td>
                  <td className="tags-table-cell tags-table-cell-nombre">{tag.nombre.toUpperCase()}</td>
                  <td className="tags-table-cell flex justify-end">
                    <button 
                      className="tags-button-edit"
                      onClick={() => handleEditClick(tag)}
                    >
                      Editar
                    </button>
                  </td>
                  <td className="tags-table-cell">
                    <button 
                      className="tags-button-delete"
                      onClick={() => handleDeleteClick(tag)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
     

      {/* Paginación */}
      <div className="tags-pagination-container">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="tags-pagination-button"
        >
          Anterior
        </button>
        <span className="tags-pagination-info">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="tags-pagination-button"
        >
          Siguiente
        </button>
      </div>
      <CrearTagModal />
      <EditTagModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        tagId={selectedTag?.id || null}
        tagName={selectedTag?.nombre || ''}
        onSuccess={handleEditSuccess}
      />
      <DeleteTagModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        tag={tagToDelete}
        onSuccess={handleDeleteSuccess}
      />
      </div>
    </div>
  );
};

export default TableTags;
