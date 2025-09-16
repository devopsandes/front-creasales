import { useEffect, useState } from "react";
import { CiSquarePlus } from "react-icons/ci";
import CrearTagModal from "../../components/modal/CrearTagModal";
import { useDispatch, useSelector } from "react-redux";
import { openModalTag } from "../../app/slices/actionSlice";
import { getTags } from "../../services/tags/tags.services";
import { Tag } from "../../interfaces/tags.interface";
import { capitalizeWords } from "../../utils/functions";
import { RootState } from "../../app/store";




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
    <div className="p-4 w-full h-full">
      {loading ? (
        <div className="spinner-lista">
          <div className="loader2"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-600 text-left text-sm font-bold text-white grid grid-cols-5">
                <th className="p-2">ID Etiqueta</th>
                <th className="p-2">Nombre de la Etiqueta</th>
                <th className="p-2">Empresa</th>
                <th><CiSquarePlus size={45} onClick={() => dispatch(openModalTag())} className="cursor-pointer"/></th>
              </tr>
            </thead>
            <tbody>
              {currentTags.map((tag, index) => (
                <tr key={tag.id} className="border-b hover:bg-slate-100 grid grid-cols-5 items-center">
                  <td className="p-2 text-sm font-semibold text-gray-800 text-left">{index+1}</td>
                  <td className="p-2 text-sm text-gray-700 text-left">{tag.nombre.toUpperCase()}</td>
                  <td className="p-2 text-sm text-gray-700 text-left">{capitalizeWords(tag.empresa.nombre)}</td>
                  <td className="p-2 flex justify-end">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                      Editar
                    </button>
                  </td>
                  <td className="p-2">
                    <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
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
      <div className="flex justify-end mt-4 space-x-2">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 border bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="px-3 py-1 border rounded bg-gray-700 text-white">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="px-3 py-1 border bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
      <CrearTagModal  />
      
    </div>
  );
};

export default TableTags;
