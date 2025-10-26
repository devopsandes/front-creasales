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
    const response = await axios.post<EmbeddedSignupCompleteResponse>(
      `${WHATSAPP_API_BASE}/embedded-signup/complete`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error completing embedded signup:', error);
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
