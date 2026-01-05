import axios from 'axios';
import { ErrorResponse, SuccessResponse } from '../../interfaces/auth.interface';

export interface EnviarPlantillaData {
  opcion: number;
  graph_api_token: string;
  id_phone_number: number;
  numero: string;
  afiliado: string;
  operador: string;
}

export const enviarPlantilla = async (
  token: string,
  data: EnviarPlantillaData
): Promise<SuccessResponse & ErrorResponse> => {
  try {
    const url = `${import.meta.env.VITE_URL_BACKEND}/meta/plantillas`;

    const headers = {
      authorization: `Bearer ${token}`
    };

    const axiosResponse = await axios.post<SuccessResponse & ErrorResponse>(
      url,
      data,
      { headers }
    );

    // Priorizar el status HTTP del axios, si el body no tiene statusCode o es diferente
    const response = axiosResponse.data || {};
    const httpStatus = axiosResponse.status;
    
    // Si el status HTTP es 200 o 201, es exitoso
    if (httpStatus === 200 || httpStatus === 201) {
      // Convertir message a string si es array
      const messageStr = Array.isArray(response.message) 
        ? response.message.join(', ') 
        : (response.message || 'Plantilla enviada correctamente');
      
      return {
        ...response,
        statusCode: response.statusCode || httpStatus,
        msg: response.msg || messageStr
      };
    }

    // Si la respuesta no tiene statusCode, usar el status HTTP
    if (!response.statusCode && httpStatus) {
      return {
        ...response,
        statusCode: httpStatus
      };
    }

    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const objeto: SuccessResponse & ErrorResponse = error.response.data;
      // Asegurar que tenga statusCode
      if (!objeto.statusCode && error.response.status) {
        objeto.statusCode = error.response.status;
      }
      return objeto;
    }
    throw error;
  }
};

