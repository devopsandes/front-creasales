// src/pages/conversaciones/ConversacionesTabs.tsx
// Pestañas del apartado Conversaciones. "Reporte de auditorías" solo la ven
// los auditores (ROOT / ADMIN / SUPER). Fede, 26/11/2026.
import { Link } from "react-router-dom"
import { puedeAuditar } from "../../components/conversaciones/AuditoriaConversacionCard"

type Props = { activa: "lista" | "reporte" }

const ConversacionesTabs = ({ activa }: Props) => {
    const esAuditor = puedeAuditar(localStorage.getItem("role"))
    return (
        <div className="header-lista">
            <Link to="/dashboard/conversaciones" className={`header-item ${activa === "lista" ? "header-item--active" : ""}`}>
                <span className="btn-item">Conversaciones archivadas</span>
            </Link>
            {esAuditor && (
                <Link to="/dashboard/conversaciones/reporte" className={`header-item ${activa === "reporte" ? "header-item--active" : ""}`}>
                    <span className="btn-item">Reporte de auditorías</span>
                </Link>
            )}
        </div>
    )
}

export default ConversacionesTabs
