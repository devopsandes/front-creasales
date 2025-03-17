
function dividirArrayEnTres<T>(arr: T[]): [T[],T[],T[]] {
    const total = arr.length;

    if (total < 10) {
        return [arr, [], []]; // Todo en el primer grupo, los otros vacíos
    } 
    if (total < 20) {
        return [arr.slice(0, 10), arr.slice(10), []]; // 10 en el primero, el resto en el segundo, el tercero vacío
    }
    if (total < 30) {
        return [arr.slice(0, 10), arr.slice(10, 20), arr.slice(20)]; // 10 en el primero y segundo, el resto en el tercero
    }

    // Para 30 o más: División equitativa
    const size1 = Math.ceil(total / 3);
    const size2 = Math.ceil((total - size1) / 2);

    return [
        arr.slice(0, size1),
        arr.slice(size1, size1 + size2),
        arr.slice(size1 + size2)
    ];
}

function formatCreatedAt(createdAt: string): string {
    // console.log(typeof createdAt);
    const date = new Date(createdAt);
    if (date.getHours() > 21) {
        date.setDate(date.getDate() - 1);
    } 
    date.setHours(date.getHours() - 3);
    const newCreatedAt = date.toISOString().split('.')[0];
    const fecha = newCreatedAt.split('T')[0];
    const hora = newCreatedAt.split('T')[1];
   /*  const date = new Date(createdAt)
    console.log(date);
    const newCreatedAt = createdAt.split('.')[0]
    const fecha = newCreatedAt.split('T')[0]
    const hora = newCreatedAt.split('T')[1] */
    
   
    return `${fecha} ${hora}`
}

export { dividirArrayEnTres, formatCreatedAt }