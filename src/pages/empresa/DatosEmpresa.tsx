import { registerForPushNotifications } from "../../services/prueba.services"

const DatosEmpresa = () => {

  const handleClickButton = async () => {
    const resp = await registerForPushNotifications()
    console.log(resp);
  }
  
  return (
    <div>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ea, officiis est dolor veniam praesentium, esse tempore debitis ad ipsam pariatur quidem possimus, ut facere inventore ducimus laboriosam porro quas perspiciatis.</p>
      {/* <button style={{backgroundColor: 'blueviolet', padding: '10px', borderRadius: '8px', color: 'white', cursor: 'pointer'}} onClick={handleClickButton}>funcion de prueba gonza</button> */}
    </div>
  )
}

export default DatosEmpresa