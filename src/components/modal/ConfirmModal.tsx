import React from "react"

type Props={isOpen:boolean;title:string;message:string;confirmText?:string;cancelText?:string;onClose:()=>void;onConfirm:()=>void}

const ConfirmModal=({isOpen,title,message,confirmText="Confirmar",cancelText="Cancelar",onClose,onConfirm}:Props)=>{
  if(!isOpen)return null
  const handleOverlayClick=(e:React.MouseEvent<HTMLDivElement>)=>{if(e.target===e.currentTarget)onClose()}
  return(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={handleOverlayClick}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-left shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">×</button>
        </div>
        <p className="mt-3 text-sm text-slate-700">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onClose} type="button">{cancelText}</button>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" onClick={onConfirm} type="button">{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal


