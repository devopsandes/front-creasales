import axios from 'axios';

// Interfaces para el Embedded Signup
export interface EmbeddedSignupStartRequest {
  tenantId?: string;
  locale?: string;
}

export interface EmbeddedSignupStartResponse {
  signupUrl: string;
  state: string;
  correlationId: string;
}

export interface EmbeddedSignupStatusResponse {
  status: 'pending' | 'completed' | 'failed';
  data?: {
    wabaId: string;
    phoneNumberId: string;
    displayName: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Base URL para las APIs de WhatsApp
// VITE_URL_BACKEND ya incluye '/api/v1'
const WHATSAPP_API_BASE = `${import.meta.env.VITE_URL_BACKEND}/api/wa`;

export interface EmbeddedSignupCompleteRequest {
  state: string;
  wabaId: string;
  phoneNumberId: string;
  displayName: string;
}

export interface EmbeddedSignupCompleteResponse {
  success: boolean;
}

/**
 * Inicia el proceso de Embedded Signup
 */
export const startEmbeddedSignup = async (
  request: EmbeddedSignupStartRequest
): Promise<EmbeddedSignupStartResponse> => {
  try {
    const response = await axios.post<EmbeddedSignupStartResponse>(
      `${WHATSAPP_API_BASE}/embedded-signup/start`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error starting embedded signup:', error);
    throw error;
  }
};

/**
 * Completa el proceso de Embedded Signup
 */
export const completeEmbeddedSignup = async (
  request: EmbeddedSignupCompleteRequest
): Promise<EmbeddedSignupCompleteResponse> => {
  try {
    // Validar que todos los campos requeridos estén presentes
    if (!request.state) {
      throw new Error('El campo "state" es requerido para completar el signup');
    }
    if (!request.phoneNumberId) {
      throw new Error('El campo "phoneNumberId" es requerido para completar el signup');
    }
    if (!request.wabaId) {
      throw new Error('El campo "wabaId" es requerido para completar el signup');
    }

    console.log('[WhatsApp Service] Llamando a /complete con:', {
      state: request.state,
      phoneNumberId: request.phoneNumberId,
      wabaId: request.wabaId,
      displayName: request.displayName || 'Sin nombre',
      endpoint: `${WHATSAPP_API_BASE}/embedded-signup/complete`
    });

    const response = await axios.post<EmbeddedSignupCompleteResponse>(
      `${WHATSAPP_API_BASE}/embedded-signup/complete`,
      {
        state: request.state,
        phone_number_id: request.phoneNumberId,
        waba_id: request.wabaId,
        display_name: request.displayName || ''
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('[WhatsApp Service] Respuesta de /complete:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[WhatsApp Service] Error completando embedded signup:', {
      error,
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      request: {
        state: request.state,
        phoneNumberId: request.phoneNumberId,
        wabaId: request.wabaId,
        displayName: request.displayName
      }
    });
    throw error;
  }
};

/**
 * Verifica el estado del Embedded Signup
 */
export const getEmbeddedSignupStatus = async (
  state: string
): Promise<EmbeddedSignupStatusResponse> => {
  try {
    const response = await axios.get<EmbeddedSignupStatusResponse>(
      `${WHATSAPP_API_BASE}/embedded-signup/status`,
      {
        params: { state },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting embedded signup status:', error);
    throw error;
  }
};

/**
 * Abre el popup de Embedded Signup
 */
export const openEmbeddedSignupPopup = (signupUrl: string): Window | null => {
  return window.open(
    signupUrl,
    'wa_signup',
    'width=1000,height=800,noopener,noreferrer,scrollbars=yes,resizable=yes'
  );
};

/**
 * Cierra el popup de Embedded Signup
 */
export const closeEmbeddedSignupPopup = (popup: Window | null): void => {
  if (popup && !popup.closed) {
    popup.close();
  }
};
