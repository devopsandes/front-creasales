export interface WhatsAppChannel {
  id: string;
  name: string;
  assignedTo: string;
  whatsappAccount: string;
  createdBy: string;
  createdDate: string;
  status: 'active' | 'inactive';
}

export const mockWhatsAppChannels: WhatsAppChannel[] = [
  {
    id: '1',
    name: 'WHATSAPP',
    assignedTo: '+54-926-132-96035',
    whatsappAccount: 'Andes Salud',
    createdBy: 'Santiago Mas',
    createdDate: '08 Nov 2022 04:43 PM',
    status: 'inactive'
  },
  {
    id: '2',
    name: 'WhatsApp Ventas',
    assignedTo: '+54-911-555-0123',
    whatsappAccount: 'Empresa Principal',
    createdBy: 'María González',
    createdDate: '15 Dic 2023 10:30 AM',
    status: 'active'
  },
  {
    id: '3',
    name: 'WhatsApp Soporte',
    assignedTo: '+54-911-555-0456',
    whatsappAccount: 'Soporte Técnico',
    createdBy: 'Carlos López',
    createdDate: '20 Ene 2024 02:15 PM',
    status: 'active'
  },
  {
    id: '4',
    name: 'WhatsApp Marketing',
    assignedTo: '+54-911-555-0789',
    whatsappAccount: 'Marketing Dept',
    createdBy: 'Ana Rodríguez',
    createdDate: '05 Feb 2024 09:45 AM',
    status: 'inactive'
  },
  {
    id: '5',
    name: 'WhatsApp General',
    assignedTo: '+54-911-555-0321',
    whatsappAccount: 'General Info',
    createdBy: 'Luis Martínez',
    createdDate: '12 Mar 2024 11:20 AM',
    status: 'active'
  }
];

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  status: 'approved' | 'pending' | 'rejected';
  language: string;
  lastModified: string;
}

export const mockWhatsAppTemplates: WhatsAppTemplate[] = [
  {
    id: '1',
    name: 'Bienvenida Cliente',
    category: 'UTILITY',
    status: 'approved',
    language: 'es',
    lastModified: '10 Mar 2024'
  },
  {
    id: '2',
    name: 'Recordatorio Cita',
    category: 'UTILITY',
    status: 'approved',
    language: 'es',
    lastModified: '15 Mar 2024'
  },
  {
    id: '3',
    name: 'Promoción Especial',
    category: 'MARKETING',
    status: 'pending',
    language: 'es',
    lastModified: '20 Mar 2024'
  },
  {
    id: '4',
    name: 'Confirmación Pedido',
    category: 'UTILITY',
    status: 'approved',
    language: 'es',
    lastModified: '25 Mar 2024'
  }
];
