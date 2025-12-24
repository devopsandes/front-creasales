import './empty-state.css'

interface EmptyStateProps {
  message?: string;
}

const EmptyState = ({ message }: EmptyStateProps) => {
  return (
    <div className="empty-state-container">
      <img 
        src="/images/LogoCreaTechWhite.png" 
        alt="CreaTech Logo" 
        className="empty-state-logo"
      />
      {message && (
        <p className="empty-state-message">{message}</p>
      )}
    </div>
  )
}

export default EmptyState

