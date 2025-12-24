import { useState, useEffect } from "react"
import { switchActivo } from "../../services/auth/auth.services"
import SuccessModal from "../modal/SuccessModal"

interface SwitchProps {
    checked: boolean | undefined
    onChange?: (checked: boolean) => void
    label?: string
    id?: string
}
const Switch = ({ checked, label, id, onChange}: SwitchProps) => {
    const [isActive, setIsActive] = useState<boolean | undefined>(checked)
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

    useEffect(() => {
      setIsActive(checked)
    }, [checked])

    const token = localStorage.getItem('token') || ''

    const handleChange = async () => {
      const newValue = !isActive
      setIsActive(newValue)
      setIsSuccessModalOpen(true)
      
      if(onChange) {
        onChange(newValue)
      }
      
      const resp = await switchActivo(id,token,newValue) 
      console.log(resp);
      
      if(resp.statusCode !== 200) {
        setIsActive(!newValue)
        setIsSuccessModalOpen(false)
      }
      
    }

    const handleCloseSuccessModal = () => {
      setIsSuccessModalOpen(false)
    }
    //  focus:outline-none focus:ring-2 focus:ring-offset-2 / clases que se encontraban en el button
  return (
    <>
      <div className="flex items-center gap-2">
        {label && <span className="text-sm font-medium">{label}</span>}
        <button
          type="button"
          onClick={handleChange}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300  ${
            isActive ? "bg-blue-400" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
              isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <SuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
        title="Estado Actualizado"
        message="Se ha actualizado el estado del usuario correctamente"
      />
    </>
  )
}

export default Switch