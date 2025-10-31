import { useEffect, useState } from "react";
import { CiSquarePlus } from "react-icons/ci";
import CrearTagModal from "../../components/modal/CrearTagModal";
import { useDispatch, useSelector } from "react-redux";
import { openModalTag } from "../../app/slices/actionSlice";
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
  const nombreEmpresa = useSelector((state: RootState) => state.auth.empresa);


  useEffect(()=>{
    const ejecucion = async () => {
      const resp = await getTags(token);
      setTags(resp.tags);
      setLoading(false)
    }
    ejecucion();
  },[])

  useEffect(() => {
    if(newTag) {
      setTags((prevTags) => [...prevTags, {id: `${tags.length}`, nombre: newTag, empresa: {nombre: nombreEmpresa!}}]);
    }
    
  },[ newTag])

 
  return (
    <div className="tags-container">
      {loading ? (
        <div className="tags-spinner-container">
          <div className="loader2"></div>
        </div>
      ) : (
        <div className="tags-table-wrapper overflow-x-auto">
          <table className="tags-table">
            <thead>
              <tr className="tags-table-header grid grid-cols-5">
                <th className="tags-table-header-cell">ID Etiqueta</th>
                <th className="tags-table-header-cell">Nombre de la Etiqueta</th>
                <th className="tags-table-header-cell">Empresa</th>
                <th className="tags-table-header-cell">
                  <CiSquarePlus 
                    size={45} 
                    onClick={() => dispatch(openModalTag())} 
                    className="tags-button-add"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTags.map((tag, index) => (
                <tr key={tag.id} className="tags-table-row grid grid-cols-5 items-center">
                  <td className="tags-table-cell tags-table-cell-id">{index+1}</td>
                  <td className="tags-table-cell tags-table-cell-nombre">{tag.nombre.toUpperCase()}</td>
                  <td className="tags-table-cell tags-table-cell-empresa">{capitalizeWords(tag.empresa.nombre)}</td>
                  <td className="tags-table-cell flex justify-end">
                    <button className="tags-button-edit">
                      Editar
                    </button>
                  </td>
                  <td className="tags-table-cell">
                    <button className="tags-button-delete">
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
      <CrearTagModal  />
      
    </div>
  );
};

export default TableTags;
