// Liste paginée au format de l'API : { items, total, page, limit }
export const offsetOf = ({ page, limit }) => (page - 1) * limit;

export const paginated = (items, total, { page, limit }) => ({ items, total, page, limit });
