import { useState } from "react"
import { switchActivo } from "../../services/auth/auth.services"

interface SwitchProps {
    checked: boolean | undefined
    // onChange: (checked: boolean) => void
    label?: string
    id?: string
}
const Switch = ({ checked, label, id}: SwitchProps) => {
    const [isActive, setIsActive] = useState<boolean | undefined>(checked)

    const token = localStorage.getItem('token') || ''

    const handleChange = async () => {

      setIsActive(!isActive)
      const resp = await switchActivo(id,token,!isActive) 
      console.log(resp);
      if(resp.statusCode === 200) {
        alert('Se ha actualizado el estado del usuario correctamente')
      }
      
    }
    //  focus:outline-none focus:ring-2 focus:ring-offset-2 / clases que se encontraban en el button
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm font-medium">{label}</span>}
      <button
        type="button"
        onClick={handleChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300  ${
          isActive ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
            isActive ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  )
}

export default Switch