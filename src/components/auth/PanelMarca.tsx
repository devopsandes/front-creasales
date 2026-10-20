type Props = {
    titulo: string
    subtitulo: string
}

/** Panel azul con órbitas del login, compartido por las pantallas de acceso. */
const PanelMarca = ({ titulo, subtitulo }: Props) => (
    <section className="cs-login-brand">
        <svg className="cs-login-orbits" aria-hidden="true" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="#FFFFFF" strokeOpacity="0.10" strokeWidth="1.5">
                <ellipse cx="560" cy="520" rx="420" ry="170" transform="rotate(-24 560 520)" />
                <ellipse cx="560" cy="520" rx="300" ry="118" transform="rotate(-24 560 520)" />
                <ellipse cx="560" cy="520" rx="190" ry="72" transform="rotate(-24 560 520)" />
            </g>
            <path d="M 180 770 Q 400 640 640 330" fill="none" stroke="#F2445E" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
            <circle cx="640" cy="330" r="7" fill="#F2445E" />
            <circle cx="268" cy="640" r="5" fill="#5AA2FF" />
            <g fill="#FFFFFF">
                <circle cx="90" cy="160" r="1.6" fillOpacity="0.7" />
                <circle cx="330" cy="110" r="1.2" fillOpacity="0.5" />
                <circle cx="520" cy="190" r="1.8" fillOpacity="0.6" />
                <circle cx="720" cy="120" r="1.2" fillOpacity="0.5" />
                <circle cx="140" cy="430" r="1.2" fillOpacity="0.4" />
                <circle cx="760" cy="640" r="1.6" fillOpacity="0.5" />
                <circle cx="420" cy="820" r="1.2" fillOpacity="0.4" />
                <circle cx="60" cy="700" r="1.8" fillOpacity="0.5" />
            </g>
        </svg>

        <div className="cs-login-logo">
            <img src="/images/CreaTechRocket.png" alt="" />
            <span>CreaSales</span>
        </div>

        <div className="cs-login-brand-copy">
            <h2>{titulo}</h2>
            <p>{subtitulo}</p>
        </div>

        <p className="cs-login-brand-footer">Una creación de CreaTech</p>
    </section>
)

export default PanelMarca