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

export { getProvincias, getMunicipios }