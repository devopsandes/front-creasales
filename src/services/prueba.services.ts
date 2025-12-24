import axios from "axios";

const registerForPushNotifications = async () => {
    try {
        console.log('entro a la funcion -> registerForPushNotifications');
        const token = 'cx8TiIEaRSCOIVXJZ_RLC7:APA91bE9Cs7POtXkIuWkETEQzeSUPNuKCUN7IA7wuoCnX6XNK2NP8nySVl_tivQs_vB8CgLIjwMnHs_Cz7XGXbRuW_ZiCPufLTyJDbhL3KKwNb0r7rXq3kY'

        const { data } = await axios.post('https://gmfp.createch.com.ar/api/notificacionesPrueba', {token}, {
            headers:{
                'Content-Type': 'application/json'
            }
        })

        console.log(data);

        return data
        
    
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto  = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

export { registerForPushNotifications } 