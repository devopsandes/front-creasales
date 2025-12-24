import { useDispatch, useSelector } from 'react-redux';
import {  switchModalPlantilla } from '../../app/slices/actionSlice';
import { RootState } from '../../app/store';




const ModalPlantilla = ( ) => {

    const modalPlantilla = useSelector((state: RootState) => state.action.modalPlantilla);
    const dispatch = useDispatch()
  

  if (!modalPlantilla) return null;

 

 

  return (
    <div className="fixed inset-0 bg-white/65 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Modal Plantillas</h2>
          <button onClick={() => dispatch(switchModalPlantilla())} className="text-gray-400 hover:text-gray- text-2xl cursor-pointer">×</button>
        </div>

        <div className="relative p-2 flex flex-col justify-center items-center gap-5">
            <div className='flex justify-between items-center w-full bg-gray-200 p-2 rounded-lg shadow-2xs'>
                <label htmlFor="" className='text-gray-700'>Plantillas</label>
                <select
                    className="block w-3/4 text-gray-700 px-3 py-2 mb-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option className="bg-white text-gray-700" value="">-- Seleccione plantilla --</option>
                    <option className="bg-white text-gray-700" value="">Plantilla 1</option>
                    <option className="bg-white text-gray-700" value="">Plantilla 2</option>
                    <option className="bg-white text-gray-700" value="">Plantilla 3</option>
                    <option className="bg-white text-gray-700" value="">Plantilla 4</option>
                </select>
            </div>

            <div className='w-full p-4 rounded-lg bg-gray-200 shadow-2xs'>
                <textarea name="" id="" className='w-full text-gray-700 border-gray-700 border-1 rounded-lg p-2'  cols={20} rows={10}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid nemo ipsum, vel distinctio odit architecto consectetur impedit repudiandae incidunt assumenda. Sit doloremque quasi recusandae nisi nostrum explicabo quam vitae sequi.
                </textarea>
            </div>
          
            <button
                onClick={() => alert('no implementado')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
            >
                Enviar
            </button>
        
        </div>

       
      </div>
    </div>
  );
};

export default ModalPlantilla;
