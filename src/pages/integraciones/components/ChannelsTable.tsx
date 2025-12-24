import { useState } from 'react';
import { MessageSquare, User, ToggleLeft, ToggleRight } from 'lucide-react';
import { WhatsAppChannel, WhatsAppTemplate } from '../mocks/whatsapp';

interface ChannelsTableProps {
  type: 'canales' | 'plantillas';
  searchValue: string;
}

const ChannelsTable = ({ type, searchValue }: ChannelsTableProps) => {
  const [channels] = useState<WhatsAppChannel[]>([
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
    }
  ]);

  const [templates] = useState<WhatsAppTemplate[]>([
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
    }
  ]);

  // Filtrar datos según el tipo
  const filteredChannels = channels.filter(channel => 
    channel.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    channel.assignedTo.includes(searchValue)
  );

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    template.category.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (type === 'canales') {
    return (
      <div className="channels-table-container">
        <div className="channels-table-wrapper">
          <table className="channels-table">
            <thead>
              <tr className="channels-table-header">
                <th className="channels-table-header-cell">NOMBRE DE CANAL</th>
                <th className="channels-table-header-cell">ASIGNADO A</th>
                <th className="channels-table-header-cell">CUENTA DE WHATSAPP</th>
                <th className="channels-table-header-cell">CREADO POR</th>
                <th className="channels-table-header-cell">FECHA DE CREACIÓN</th>
                <th className="channels-table-header-cell">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {filteredChannels.map((channel) => (
                <tr key={channel.id} className="channels-table-row">
                  <td className="channels-table-cell">
                    <div className="channels-table-channel-name">
                      <MessageSquare size={16} className="text-green-500" />
                      <span>{channel.name}</span>
                    </div>
                  </td>
                  <td className="channels-table-cell">{channel.assignedTo}</td>
                  <td className="channels-table-cell">{channel.whatsappAccount}</td>
                  <td className="channels-table-cell">
                    <div className="channels-table-user">
                      <User size={16} className="text-gray-500" />
                      <span>{channel.createdBy}</span>
                    </div>
                  </td>
                  <td className="channels-table-cell">{channel.createdDate}</td>
                  <td className="channels-table-cell">
                    <button className="channels-toggle-button">
                      {channel.status === 'active' ? (
                        <ToggleRight size={20} className="text-blue-500" />
                      ) : (
                        <ToggleLeft size={20} className="text-gray-400" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="channels-table-container">
      <div className="channels-table-wrapper">
        <table className="channels-table">
          <thead>
            <tr className="channels-table-header">
              <th className="channels-table-header-cell">NOMBRE DE PLANTILLA</th>
              <th className="channels-table-header-cell">CATEGORÍA</th>
              <th className="channels-table-header-cell">ESTADO</th>
              <th className="channels-table-header-cell">IDIOMA</th>
              <th className="channels-table-header-cell">ÚLTIMA MODIFICACIÓN</th>
              <th className="channels-table-header-cell">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map((template) => (
              <tr key={template.id} className="channels-table-row">
                <td className="channels-table-cell">{template.name}</td>
                <td className="channels-table-cell">{template.category}</td>
                <td className="channels-table-cell">
                  <span className={`channels-status-badge ${
                    template.status === 'approved' ? 'channels-status-approved' :
                    template.status === 'pending' ? 'channels-status-pending' :
                    'channels-status-rejected'
                  }`}>
                    {template.status === 'approved' ? 'Aprobado' :
                     template.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                  </span>
                </td>
                <td className="channels-table-cell">{template.language.toUpperCase()}</td>
                <td className="channels-table-cell">{template.lastModified}</td>
                <td className="channels-table-cell">
                  <button className="channels-action-button">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChannelsTable;
