import axios from "axios"
import { AxiosErrorType, MunicipiosResponse, ProvinciasResponse } from "../../interfaces/common.interface"

// https://datosgobar.github.io/georef-ar-api/ -> API de geolocalización de Argentina

const getProvincias = async (): Promise<ProvinciasResponse> => {
    try {
        const url = 'https://apis.datos.gob.ar/georef/api/provincias'
      
        const { data } = await axios.get<ProvinciasResponse>(url)


     
        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: AxiosErrorType & ProvinciasResponse = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const getMunicipios = async (id: number): Promise<MunicipiosResponse> => {
    try {
        const url = `https://apis.datos.gob.ar/georef/api/municipios?provincia=${id}&campos=id,nombre&max=100`
      
        const { data } = await axios.get<MunicipiosResponse>(url)

        return data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const objeto: AxiosErrorType & MunicipiosResponse = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

const consultarAfiliadoJSON = async (dni: string) : Promise<any> => {
    try {
        const url = 'http://srvloc.andessalud.com.ar/WebServicePrestacional.asmx/consultarAfiliadoJson'
        const objeto = {
            usuario: 'CHATBOT',
            password: 'DrtEchat%',
            administradora: 'F100376F-33F9-49FD-AFB9-EE53616E7F0C',
            datosAfiliado: `${dni}`
        }
		const {data} = await axios.post(url,objeto)

		const arreglo1: string [] = data.split('{"d":null}')
        const nuevoArreglo1 = arreglo1.join('').slice(1,-1).split('}')
        // console.log(nuevoArreglo1)
        const arreglometro = nuevoArreglo1.map(elemento =>{
            // console.log(elemento)
            if(elemento.charAt(0) === "{"){
                const cadena = `${elemento}}`
                const objeto = JSON.parse(cadena)
                return objeto
            }else if(elemento.charAt(0) === ","){
                const cadena = elemento.slice(1)
                const objeto = JSON.parse(`${cadena}}`)
                return objeto
            }else{
                return elemento
            }
        })

		// console.log(arreglometro[0]);
		return arreglometro[0]
    } catch (error) {
         if (axios.isAxiosError(error) && error.response) {
            const objeto: AxiosErrorType & MunicipiosResponse = error.response.data
            return objeto
        }
        throw error; // Lanza el error si no es del tipo esperado
    }
}

export { getProvincias, getMunicipios, consultarAfiliadoJSON }