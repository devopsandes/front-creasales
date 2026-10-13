// CampaniaContador.tsx — "12/65" al lado de un campo con tope de caracteres. Se pone rojo si se pasa.

const CampaniaContador = ({ valor, maximo }: { valor: string; maximo: number }) => {
  const largo = valor.trim().length;
  return (
    <span className={`campanias-contador ${largo > maximo ? 'campanias-contador-pasado' : ''}`} aria-label={`${largo} de ${maximo} caracteres`}>
      {largo}/{maximo}
    </span>
  );
};

export default CampaniaContador;
