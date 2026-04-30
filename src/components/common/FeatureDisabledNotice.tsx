type Props = {
  title?: string
  message?: string
}

const FeatureDisabledNotice = ({
  title = 'Funcionalidad temporalmente deshabilitada',
  message = 'Esta sección está temporalmente deshabilitada en modo liviano.',
}: Props) => {
  return (
    <div className="chat-empty-prompt">
      <p className="chat-empty-text">{title}</p>
      <p className="chat-empty-text">{message}</p>
    </div>
  )
}

export default FeatureDisabledNotice
