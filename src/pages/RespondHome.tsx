import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Globe, Star, ArrowRight, CheckCircle2, MessageSquare, Phone, Mail, Search, Info, Check, Sparkles, X, Download, Instagram, Linkedin } from 'lucide-react';

export default function RespondHome() {
  const [activeTab, setActiveTab] = useState('All');
  const [activeChatId, setActiveChatId] = useState('kara');
  const [showTour, setShowTour] = useState(true);
  const [activeFeature, setActiveFeature] = useState('capture');
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setIsScrolled(scrollContainerRef.current.scrollTop > 10);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const chats = [
    { id: 'kara', name: 'Kara Finley', time: 'Ayer', message: '¡Hola Kara! ¿En qué te puedo ayudar hoy?', isHotLead: true, color: 'bg-[#E83A82]', letter: 'K' },
    { id: 'lee', name: 'Lee', time: 'Ayer', message: '¡Gracias por la información!', isHotLead: false, color: 'bg-[#0066FF]', letter: 'L' },
    { id: 'shanny', name: 'Shanny', time: 'Hoy', message: 'Entendido. Me pondré en contacto de nuevo.', isHotLead: false, color: 'bg-[#10B981]', letter: 'S' }
  ];

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-screen overflow-y-auto overflow-x-hidden bg-white text-slate-900 font-sans relative selection:bg-blue-500 selection:text-white"
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.8s ease-out forwards; }
        .animate-delay-100 { animation-delay: 100ms; }
        .animate-delay-200 { animation-delay: 200ms; }
        .animate-delay-300 { animation-delay: 300ms; }
        .animate-delay-400 { animation-delay: 400ms; }
        
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(0, 102, 255, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(0, 102, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 102, 255, 0); }
        }
        .animate-pulse-glow { animation: pulse-glow 2s infinite; }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, -50px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 15s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {/* Background gradients interactivos y en movimiento (Abarcan todo el scroll) */}
      <div className="fixed inset-0 w-full h-[150vh] overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] bg-[#2A43E8]/20 blur-[140px] rounded-full mix-blend-multiply animate-blob"></div>
        <div className="absolute top-[15%] right-[-10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-[#F01A39]/15 blur-[140px] rounded-full mix-blend-multiply animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[20%] w-[45vw] h-[45vw] max-w-[800px] max-h-[800px] bg-[#0066FF]/15 blur-[140px] rounded-full mix-blend-multiply animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">

        {/* Navbar (Dinámico: Liquid Glass transparente -> Blanco sólido con sombra y borde al scrollear) */}
        <nav className={`w-full sticky top-0 z-50 h-[72px] transition-all duration-300 text-slate-900 bg-white ${isScrolled ? 'shadow-md' : ''}`}>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#2A43E8] via-[#E83A82] to-[#F01A39]"></div>

          <div className="max-w-[1600px] mx-auto px-6 lg:pl-12 lg:pr-8 w-full h-full flex items-center justify-between relative">
            {/* Logo */}
            <div className="flex items-center font-extrabold text-[22px] tracking-tight cursor-pointer text-slate-900 shrink-0 lg:ml-20 xl:ml-[250px]">
              creasales
            </div>

            {/* Enlaces de navegación (Centrados) */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-[14px] font-semibold text-slate-600 h-full tracking-tight absolute left-1/2 -translate-x-1/2">
                <div className="relative group h-full flex items-center">
                  <button className="flex items-center gap-1.5 hover:text-[#0066FF] transition-colors h-full focus:outline-none">
                    Producto <ChevronDown size={14} className="group-hover:-rotate-180 transition-transform duration-300" />
                  </button>
                  <div className="absolute top-full left-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 w-64 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 p-2 z-50">
                    <a href="#" className="block px-4 py-3 hover:bg-gray-50 rounded-lg text-slate-800 text-sm font-semibold transition-colors">Bandeja Omnicanal</a>
                    <a href="#" className="block px-4 py-3 hover:bg-gray-50 rounded-lg text-slate-800 text-sm font-semibold transition-colors">Agentes IA</a>
                  </div>
                </div>
                <div className="relative group h-full flex items-center">
                  <button className="flex items-center gap-1.5 hover:text-[#0066FF] transition-colors h-full focus:outline-none">
                    Industrias <ChevronDown size={14} className="group-hover:-rotate-180 transition-transform duration-300" />
                  </button>
                </div>
                <div className="relative group h-full flex items-center">
                  <button className="flex items-center gap-1.5 hover:text-[#0066FF] transition-colors h-full focus:outline-none">
                    Recursos <ChevronDown size={14} className="group-hover:-rotate-180 transition-transform duration-300" />
                  </button>
                </div>
                <a href="#" className="hover:text-[#0066FF] transition-colors h-full flex items-center">Precios</a>
                <a href="#" className="hover:text-[#0066FF] transition-colors h-full flex items-center">Por qué nosotros</a>
            </div>

            {/* Acciones a la derecha */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-5 shrink-0">
              <a href="#" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mr-1">Iniciar Sesión</a>
              
              <button className="px-6 py-2.5 text-[14px] font-bold rounded bg-gradient-to-r from-blue-100/90 via-indigo-100/70 to-purple-100/90 hover:from-blue-200/80 hover:via-indigo-200/60 hover:to-purple-200/80 border border-slate-200/80 shadow-sm text-slate-800 hover:text-slate-900 transition-all duration-300 tracking-wide">
                Hablar con Ventas
              </button>
              
              <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden xl:block"></div>
              
              <button className="text-slate-500 hover:text-slate-900 flex items-center gap-1.5 p-1 transition-colors group">
                <Globe size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-bold tracking-wider uppercase">ES</span>
                <ChevronDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative pt-16 md:pt-24 pb-20 px-4 md:px-9 flex flex-col items-center justify-center text-center w-full max-w-[1200px]">
          <div className="animate-fade-up opacity-0 inline-flex items-center gap-2 px-1 py-1 pr-3 rounded-full border border-gray-200 bg-white/80 backdrop-blur-md text-xs font-medium text-slate-700 mb-8 shadow-sm cursor-pointer hover:bg-gray-50 hover:shadow transition-all max-w-[90%] md:max-w-max overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="bg-[#1A2633] text-white px-3 py-[3px] rounded-full uppercase text-[10px] font-bold tracking-wider">Nuevo</span>
            <span className="text-blue-500 hidden sm:inline-block">🌍</span>
            <span className="truncate">¡Llamadas API de WhatsApp disponibles globalmente! Empieza hoy.</span>
            <span className="text-blue-600 font-semibold flex items-center gap-1 ml-1 group shrink-0">Más info <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
          </div>

          <h1 className="animate-fade-up animate-delay-100 opacity-0 text-[42px] md:text-[68px] font-extrabold tracking-tight text-[#111827] max-w-[1050px] leading-[1.05] w-full px-4">
            Los clientes preguntan por chat. Llaman para detalles. Confirman por email. ¿Puedes seguir el ritmo?
          </h1>

          {/* Espaciador forzado para alejar el boton del titulo */}
          <div className="h-[60px] lg:h-[100px] w-full shrink-0"></div>

          <div className="animate-fade-up animate-delay-200 opacity-0 flex flex-col items-center justify-center w-full">
            <button className="px-8 py-4 text-[17px] font-bold rounded-lg bg-[#0A0A0A] hover:bg-slate-800 text-white transition-all shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)] hover:-translate-y-1 w-full sm:w-[240px] cursor-pointer">
              Hablar con Ventas
            </button>
          </div>

          {/* Espaciador forzado bajo el boton */}
          <div className="h-[40px] lg:h-[60px] w-full shrink-0"></div>

          <div className="animate-fade-up animate-delay-300 opacity-0 flex items-center justify-center gap-2 text-sm text-slate-500 font-medium">
            <span className="text-[#FF5252] font-bold text-lg mr-1 leading-none">G</span>
            <div className="flex items-center text-[#FF5252] gap-[1px]">
              <Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" />
            </div>
            Mejor calificado en G2 por el mayor ROI
          </div>
        </div>

        {/* Main App Demo Mockup CENTRADO */}
        <div className="animate-fade-up animate-delay-400 opacity-0 w-full px-4 md:px-8 flex justify-center z-20">
          <div className="w-full max-w-[1100px] rounded-2xl overflow-hidden border border-gray-200/80 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.1)] bg-white relative flex flex-col">

            {/* OVERLAY INTERACTIVO (TOUR) IGUAL AL ORIGINAL */}
            {showTour && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 rounded-2xl overflow-hidden">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center relative animate-fade-up">
                  <button onClick={() => setShowTour(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={20} />
                  </button>

                  {/* Decorative graphic mimicking respond logic tree EXACTAMENTE como screenshot */}
                  <div className="w-full bg-[#18181B] rounded-xl h-44 mb-8 relative flex justify-center items-center overflow-hidden border border-gray-800 shadow-inner">
                    {/* Curvas finas de conexion */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
                      <path d="M 60 40 Q 150 40 200 85" stroke="white" strokeWidth="1" fill="none" />
                      <path d="M 60 85 Q 150 85 200 85" stroke="white" strokeWidth="1" fill="none" />
                      <path d="M 60 130 Q 150 130 200 85" stroke="white" strokeWidth="1" fill="none" />
                      <path d="M 400 40 Q 300 40 250 85" stroke="white" strokeWidth="1" fill="none" />
                      <path d="M 400 85 Q 300 85 250 85" stroke="white" strokeWidth="1" fill="none" />
                      <path d="M 400 130 Q 300 130 250 85" stroke="white" strokeWidth="1" fill="none" />
                    </svg>

                    {/* El logo azul en el centro */}
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,102,255,0.4)] z-10 relative">
                      <Check strokeWidth={3} className="text-[#0066FF]" size={26} />
                    </div>

                    {/* Nodos de canales a la Izquierda */}
                    <div className="absolute left-6 top-8 w-6 h-6 bg-pink-500 rounded flex items-center justify-center p-1"><Mail size={12} color="white" /></div>
                    <div className="absolute left-16 top-12 w-6 h-6 bg-blue-500 rounded flex items-center justify-center p-1"><MessageSquare size={12} color="white" /></div>
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#25D366] rounded flex items-center justify-center p-1"><Phone size={12} fill="white" color="white" /></div>
                    <div className="absolute left-16 bottom-12 w-6 h-6 bg-black border border-white/20 rounded flex items-center justify-center p-1"><Phone size={12} color="white" /></div>
                    <div className="absolute left-6 bottom-8 w-6 h-6 bg-purple-500 rounded flex items-center justify-center p-1"><Mail size={12} color="white" /></div>

                    {/* Nodos de software a la Derecha */}
                    <div className="absolute right-6 top-8 w-6 h-6 bg-orange-500 rounded flex items-center justify-center p-1"><CheckCircle2 size={12} color="white" /></div>
                    <div className="absolute right-16 top-12 w-6 h-6 bg-[#00A1E0] rounded flex items-center justify-center p-1"><Star size={12} color="white" /></div>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-green-600 rounded flex items-center justify-center p-1"><Info size={12} color="white" /></div>
                    <div className="absolute right-16 bottom-12 w-6 h-6 bg-red-500 rounded flex items-center justify-center p-1"><MessageSquare size={12} color="white" /></div>
                    <div className="absolute right-6 bottom-8 w-6 h-6 bg-blue-900 rounded flex items-center justify-center p-1"><Globe size={12} color="white" /></div>
                  </div>

                  <h2 className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">Descubre el poder de Respond.io</h2>
                  <p className="text-slate-500 mb-8 text-[14px] leading-relaxed">
                    Vende de forma más inteligente, fortalece relaciones y responde más rápido. Todo desde una sola bandeja. Experimenta cómo funciona al instante.
                  </p>
                  <button onClick={() => setShowTour(false)} className="bg-black hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl inline-flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 animate-pulse-glow w-full md:w-auto">
                    <Sparkles size={16} className="text-yellow-400" />
                    Empezar recorrido interactivo
                  </button>
                </div>
              </div>
            )}

            {/* Header Mockup */}
            <div className="h-10 border-b border-gray-100 bg-white flex items-center px-4 gap-2 w-full shrink-0">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-inner"></div>
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-inner"></div>
              <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-inner"></div>
            </div>

            <div className="flex flex-1 w-full min-h-[480px] bg-white">
              {/* Sidebar */}
              <div className="hidden sm:flex w-64 border-r border-gray-100 bg-[#FAFAFA] flex-col shrink-0">
                <div className="p-4 flex items-center gap-3 text-slate-900 border-b border-gray-100 h-16 shrink-0 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#0066FF] flex items-center justify-center text-white font-bold shadow-sm">R</div>
                  <span className="font-semibold text-[15px]">Bandeja</span>
                </div>
                <div className="p-4 flex-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Vistas</div>
                  <div onClick={() => setActiveTab('All')} className={`flex items-center justify-between py-2 px-3 rounded-lg mb-1 font-semibold cursor-pointer transition-colors ${activeTab === 'All' ? 'bg-[#F0F2F5] text-slate-900 shadow-sm border border-gray-200/50 hover:bg-[#e4e6eb]' : 'text-slate-500 hover:bg-gray-100'}`}>
                    <div className="flex items-center gap-3"><MessageSquare size={16} className={activeTab === 'All' ? 'text-slate-500' : ''} /><span className="text-[13px]">Todos</span></div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeTab === 'All' ? 'bg-white text-slate-600 shadow-sm border border-gray-200' : ''}`}>50</span>
                  </div>
                  <div onClick={() => setActiveTab('Mine')} className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer mb-1 transition-colors ${activeTab === 'Mine' ? 'bg-[#F0F2F5] text-slate-900 shadow-sm border border-gray-200/50 hover:bg-[#e4e6eb] font-semibold' : 'text-slate-500 hover:bg-gray-100 font-medium'}`}>
                    <div className="flex items-center gap-3"><CheckCircle2 size={16} /><span className="text-[13px]">Míos</span></div>
                    <span className="text-[11px]">3</span>
                  </div>
                </div>
              </div>

              {/* Chat List */}
              <div className="hidden md:flex flex-col w-[320px] border-r border-gray-100 bg-white shrink-0">
                <div className="p-4 border-b border-gray-100 h-24 flex flex-col justify-between shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-slate-900 text-[15px]">Chats</h2>
                    <button className="text-slate-400 hover:text-slate-600 hover:bg-gray-100 p-1 rounded-full transition-colors"><Search size={18} /></button>
                  </div>
                  <div className="flex gap-6 text-[13px] font-semibold mt-auto">
                    <button className="text-[#0066FF] border-b-2 border-[#0066FF] pb-2 cursor-pointer transition-colors">Chats</button>
                    <button className="text-slate-400 pb-2 hover:text-slate-600 transition-colors cursor-pointer">Llamadas</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {chats.map(chat => {
                    const isActive = activeChatId === chat.id;
                    return (
                      <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`p-3 rounded-xl mb-2 relative cursor-pointer transition-all border ${isActive ? 'bg-[#F0F5FF] border-[#D6E4FF] shadow-sm hover:shadow hover:bg-[#E5EEFF]' : 'border-transparent hover:border-gray-100 hover:bg-gray-50'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full ${chat.color} flex items-center justify-center text-white font-bold shrink-0 shadow-sm text-sm`}>{chat.letter}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className={`text-[13px] truncate ${isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{chat.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{chat.time}</span>
                            </div>
                            <p className={`text-[12px] truncate mb-1 ${isActive ? 'text-slate-600' : 'text-slate-500'}`}>{chat.message}</p>
                            {chat.isHotLead && (
                              <span className="text-[10px] font-bold text-[#F59E0B] flex items-center gap-1"><Star size={10} fill="currentColor" /> Lead Caliente</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col bg-[#FDFDFD] relative min-w-0 z-0">
                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                  <div className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-8 h-8 rounded-full ${activeChat.color} flex items-center justify-center text-white font-bold shadow-sm text-xs group-hover:shadow-md transition-shadow`}>{activeChat.letter}</div>
                    <div><h3 className="text-[14px] font-bold text-slate-900">{activeChat.name}</h3></div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <button className="hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"><Phone size={18} /></button>
                    <button className="hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"><Info size={18} /></button>
                    <button className="px-3 py-1.5 text-[13px] font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-slate-600 rounded flex items-center gap-2 transition-all shadow-sm">Cerrar</button>
                  </div>
                </div>
                <div className="flex-1 p-6 flex flex-col justify-end overflow-hidden relative">
                  <div className="bg-[#F0F2F5] p-3.5 px-4 rounded-2xl rounded-tl-sm max-w-sm mb-4 border border-transparent hover:border-gray-200 text-[13px] text-slate-800 shadow-sm cursor-text self-start transition-colors animate-fade-up" key={activeChat.message}>
                    {activeChat.message}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="w-full flex justify-center pb-16 pt-16 relative px-4">
          <div className="w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/50 backdrop-blur-md px-4 text-gray-400">
            <Sparkles size={20} />
          </div>
        </div>

        {/* SECCIÓN 2: MODO CLARO (ESCALA EL CRECIMIENTO Y OMNICHANNEL INBOX CENTRADAS) */}

        {/* Features: Escala el crecimiento (Ahora Blanca y Centrada en su contenedor máximo) */}
        <div className="w-full max-w-[1100px] mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center gap-16 mb-8 relative z-10">

          {/* Columna Izquierda (Textos y Acordeón) */}
          <div className="w-full lg:w-[45%] flex flex-col">
            <h2 className="text-[32px] md:text-[40px] leading-[1.15] font-extrabold tracking-tight mb-6 text-slate-900">
              Escala el crecimiento de tu negocio con cada conversación
            </h2>
            <p className="text-slate-600 text-[16px] leading-relaxed mb-10">
              A medida que los chats y llamadas se multiplican, las bandejas viejas y flujos de trabajo se rompen. El framework de Crecimiento Liderado por Conversaciones de Respond.io te ayuda a gestionar todo el viaje del cliente a través de cada canal y en un solo lugar, incluso con altos volúmenes.
            </p>

            <div className="flex flex-col gap-6">
              {/* Accordion Item 1 */}
              <div
                className={`flex flex-col border-l-[3px] pl-6 cursor-pointer transition-all duration-300 ${activeFeature === 'capture' ? 'border-[#0066FF] opacity-100' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                onClick={() => setActiveFeature('capture')}
              >
                <h3 className="font-bold text-[17px] mb-3 text-slate-900 tracking-tight">Captura: Unifica puntos de contacto para impulsar ingresos</h3>
                {activeFeature === 'capture' && (
                  <p className="text-slate-600 text-[14px] leading-relaxed animate-fade-up">
                    Los leads vienen de todas partes — chats de WhatsApp, anuncios de TikTok, mensajes de Facebook o visitas a la tienda. Respond.io los unifica en una bandeja de equipo para que ninguna oportunidad pase desapercibida. Trabaja con perfiles limpios y organizados que se sincronizan con tus CRMs para un seguimiento rápido.
                  </p>
                )}
              </div>

              {/* Accordion Item 2 */}
              <div
                className={`flex flex-col border-l-[3px] pl-6 cursor-pointer transition-all duration-300 ${activeFeature === 'convert' ? 'border-[#0066FF] opacity-100' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                onClick={() => setActiveFeature('convert')}
              >
                <h3 className="font-bold text-[17px] text-slate-900 tracking-tight">Convierte: Vende más con IA y analítica</h3>
              </div>

              {/* Accordion Item 3 */}
              <div
                className={`flex flex-col border-l-[3px] pl-6 cursor-pointer transition-all duration-300 ${activeFeature === 'retain' ? 'border-[#0066FF] opacity-100' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                onClick={() => setActiveFeature('retain')}
              >
                <h3 className="font-bold text-[17px] text-slate-900 tracking-tight">Retiene: Construye ingresos recurrentes, no solo únicas ventas</h3>
              </div>
            </div>
          </div>

          {/* Columna Derecha (Mockup Blanco y Glass) */}
          <div className="w-full lg:w-[55%] flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[500px] aspect-square rounded-[2rem] bg-white border border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex items-center justify-center p-8 overflow-hidden">
              {/* Efecto de Luz Interna (Glow) en Modo Claro */}
              <div className="absolute top-10 right-0 w-3/4 h-3/4 bg-[#0066FF]/10 blur-[80px] rounded-full pointer-events-none"></div>

              {/* Panel de Chat Glassmorphism sobre blanco */}
              <div className="w-full max-w-[420px] bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-xl p-6 relative z-10 border border-white flex flex-col gap-4 mx-auto">

                <div className="flex gap-2 self-start w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-white shadow-sm overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&w=100&q=80" alt="Customer" className="w-full h-full object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] bg-[#E83A82] rounded-full border border-white flex justify-center items-center"><MessageSquare size={7} color="white" /></div>
                  </div>
                  <div className="bg-[#E4E6EB] text-slate-800 text-[13px] p-3 rounded-2xl rounded-tl-sm shadow-sm font-medium leading-snug">
                    ¡Hola! ¿Tienen cursos de idiomas en promoción?
                  </div>
                </div>

                <div className="flex gap-2 self-end w-[85%] justify-end">
                  <div className="bg-[#F0F5FF] text-[#0066FF] border border-[#D6E4FF] text-[13px] p-3 rounded-2xl rounded-tr-sm shadow-sm font-medium leading-snug">
                    ¡Hola! Sí tenemos. Las clases de español y francés tienen 50% de descuento en este momento.
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 border border-white shadow-sm overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&w=100&q=80" alt="Agent" className="w-full h-full object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] bg-[#0066FF] rounded-full border border-white flex justify-center items-center"><MessageSquare size={7} color="white" /></div>
                  </div>
                </div>

                <div className="flex gap-2 self-start w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-white shadow-sm overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&w=100&q=80" alt="Customer" className="w-full h-full object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] bg-[#25D366] rounded-full border border-white flex justify-center items-center"><Phone size={7} fill="white" color="white" /></div>
                  </div>
                  <div className="bg-[#E4E6EB] text-slate-800 text-[13px] p-3 rounded-2xl rounded-tl-sm shadow-sm font-medium leading-snug">
                    Me gustaría inscribirme en una clase
                  </div>
                </div>

                <div className="flex gap-2 self-end w-[90%] justify-end mb-4">
                  <div className="bg-[#F0F5FF] text-[#0066FF] border border-[#D6E4FF] text-[13px] p-3 rounded-2xl rounded-tr-sm shadow-sm font-medium leading-snug">
                    ¡Perfecto! Tenemos descuento por paquete de clases. ¿Llamada rápida para ver detalles?
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 border border-white shadow-sm overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&w=100&q=80" alt="Agent" className="w-full h-full object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] bg-[#25D366] rounded-full border border-white flex justify-center items-center"><Phone size={7} fill="white" color="white" /></div>
                  </div>
                </div>

                {/* Ventana flotante interactiva de "WhatsApp Call" */}
                <div className="absolute -bottom-6 -right-6 md:right-4 w-[260px] bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 p-4 z-20 hover:-translate-y-2 transition-transform duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500 text-xs font-bold">00:49</span>
                    <div className="px-2 py-1 bg-blue-50 text-[#0066FF] rounded-md text-[11px] font-bold">Llamada WhatsApp</div>
                  </div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Phone size={20} fill="#25D366" className="text-[#25D366]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold text-sm">Emily Carter</span>
                      <span className="text-slate-500 text-xs">(758) 306-7038</span>
                    </div>
                  </div>
                  <button className="w-full py-2.5 rounded-xl text-white font-bold tracking-wide text-sm bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-colors shadow-sm">
                    Finalizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="w-full flex justify-center pb-16 pt-8 relative px-4 z-10">
          <div className="w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md px-4 text-gray-400">
            <Sparkles size={20} />
          </div>
        </div>

        {/* Tarjeta de Omnichannel Inbox (MODO CLARO Y CENTRADA PERFECTAMENTE) */}
        <div className="w-full max-w-[1100px] mx-auto px-4 md:px-8 z-10 relative mb-32">
          <div className="bg-white border border-gray-200/80 rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_rgba(0,102,255,0.08)] transition-shadow duration-500">

            {/* Izquierda (Visuales Light Mode) */}
            <div className="w-full md:w-[45%] lg:w-1/2 relative min-h-[450px] overflow-hidden group border-r border-gray-100 bg-slate-50">
              {/* Background Glow */}
              <div className="absolute -left-10 top-1/2 w-64 h-64 bg-blue-200/50 blur-[80px] rounded-full mix-blend-multiply pointer-events-none z-0"></div>

              <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Profesional conversando por teléfono" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 opacity-90 mix-blend-multiply z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent z-10"></div>

              {/* Overlay Menú de opciones de llamada (Dark en Light Bg) */}
              <div className="absolute top-[20%] left-[10%] w-[320px] bg-[#1a1a1c] border border-gray-800 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.3)] p-4 font-sans text-sm z-20 text-white font-medium hover:-translate-y-4 focus-within:-translate-y-4 transition-transform duration-500">
                <div className="flex items-center justify-between mb-4 border-b border-gray-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <Phone size={11} fill="black" className="text-black" />
                    </div>
                    Llamar con WhatsApp
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-2 flex justify-between">
                  <span>Número de contacto</span><span className="text-white">+1385738473</span>
                </div>
                <div className="text-[10px] text-gray-300 mb-4 bg-[#14291D] border border-[#2B4B36] p-2.5 rounded-lg leading-relaxed flex items-center shadow-inner">
                  <span className="text-[#2BD566] font-bold mr-1">¡Solicitud aceptada!</span> Puedes llamar al contacto dentro de las próximas 72 horas.
                </div>
                <button className="w-full bg-[#0066FF] hover:bg-blue-600 transition-colors text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 mb-2 group-hover:bg-blue-700">
                  <Phone size={14} /> Llamar
                </button>

                <div className="absolute top-[80%] right-[-20px] bg-white rounded-xl shadow-2xl border border-gray-100 w-[280px] text-slate-800 py-2 z-30 transition-transform hidden group-hover:block animate-fade-up">
                  <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-[#25D366] flex justify-center items-center"><Phone size={10} fill="white" className="text-white" /></div>
                    <span className="text-[13px] font-semibold">Llamada WhatsApp - +13857...</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex justify-center items-center"><Phone size={10} fill="black" className="text-black" /></div>
                    <span className="text-[13px] font-semibold">Llamada VoIP - +13857...</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-pink-500 flex justify-center items-center"><MessageSquare size={10} color="white" /></div>
                    <span className="text-[13px] font-semibold">Llamada Messenger - +13857...</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 pb-3 mb-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-[#25D366] flex justify-center items-center"><MessageSquare size={10} color="white" /></div>
                    <span className="text-[13px] font-semibold">Mensaje WhatsApp - +138...</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-1 hover:bg-gray-50 cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex justify-center items-center"><Mail size={10} className="text-[#0066FF]" /></div>
                    <span className="text-[13px] font-semibold">Correo - danielth@gmail...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Derecha (Textos en modo claro) */}
            <div className="w-full md:w-[55%] lg:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-white relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-[#0066FF]/5 blur-[100px] rounded-full pointer-events-none"></div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-fit gap-2 px-3 py-1.5 rounded-lg border border-blue-200 bg-[#F0F5FF] text-[#0066FF] text-[13px] font-bold mb-6 hover:bg-blue-100 transition-colors shadow-sm">
                  <Download size={14} /> Bandeja Omnicanal
                </div>
                <h2 className="text-[32px] md:text-[38px] leading-[1.12] font-extrabold text-slate-900 mb-6 tracking-tight">
                  Chats, llamadas y correos en un solo hilo
                </h2>
                <p className="text-slate-600 text-[16px] mb-5 leading-relaxed">
                  Respond.io unifica <span className="font-bold text-slate-900">llamadas de WhatsApp Business, Messenger</span> y <span className="font-bold text-slate-900">VoIP</span> en el mismo hilo que tus mensajes y correos.
                </p>
                <p className="text-slate-500 text-[15px] leading-relaxed">
                  No más silos ni malabares entre plataformas; solo un registro confiable para cada cliente, sin importar el canal.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Espacio divisor sin nada */}
        <div className="h-32 md:h-48 w-full shrink-0"></div>
        
        {/* Footer simple, finito y un poco más oscuro */}
        <footer className="w-full py-6 mt-20 border-t border-slate-200 bg-slate-50 flex justify-center">
          <div className="max-w-[1600px] w-full px-6 lg:px-12 flex flex-row items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-500 hover:text-[#E1306C] transition-colors" title="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-slate-500 hover:text-[#0077B5] transition-colors" title="LinkedIn">
                <Linkedin size={18} />
              </a>
            </div>
            <p className="text-slate-500 text-[13px] font-semibold tracking-tight">
              Creasales todos los derechos reservados.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
