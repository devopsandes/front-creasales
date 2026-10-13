// useConfirmacion.tsx — confirmación con la ventana de CreaSales (ConfirmModal) en vez del cartel del navegador.
// Por qué (09/10/2026): window.confirm no se muestra en algunos navegadores embebidos y devuelve "cancelar" solo; con eso
// "Enviar a todos" no hacía nada. Se usa igual que window.confirm, pero con await:
//   const { confirmar, ventanaConfirmacion } = useConfirmacion();
//   if (!(await confirmar({ titulo: 'Enviar', mensaje: '¿Seguro?' }))) return;
//   ...y en el JSX: {ventanaConfirmacion}

import { useCallback, useRef, useState } from 'react';
import ConfirmModal from '../../components/modal/ConfirmModal';

type Opciones = { titulo: string; mensaje: string; textoConfirmar?: string; textoCancelar?: string };

export const useConfirmacion = () => {
  const [abierta, setAbierta] = useState<Opciones | null>(null);
  const resolver = useRef<((valor: boolean) => void) | null>(null);

  const confirmar = useCallback(
    (opciones: Opciones) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setAbierta(opciones);
      }),
    [],
  );

  const cerrar = (valor: boolean) => {
    resolver.current?.(valor);
    resolver.current = null;
    setAbierta(null);
  };

  const ventanaConfirmacion = (
    <ConfirmModal
      isOpen={abierta !== null}
      title={abierta?.titulo ?? ''}
      message={abierta?.mensaje ?? ''}
      confirmText={abierta?.textoConfirmar ?? 'Confirmar'}
      cancelText={abierta?.textoCancelar ?? 'Cancelar'}
      onClose={() => cerrar(false)}
      onConfirm={() => cerrar(true)}
    />
  );

  return { confirmar, ventanaConfirmacion };
};
