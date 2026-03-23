export const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const DD = String(d.getDate()).padStart(2, '0');
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const YY = String(d.getFullYear()).slice(-2);
  return `${DD}/${MM}/${YY}`;
};
