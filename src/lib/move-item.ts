/** The list with one item moved a place earlier (-1) or later (+1). */
export const moveItem = <T,>(items: T[], index: number, by: -1 | 1) => {
  const other = index + by;
  if (other < 0 || other >= items.length) return items;
  const next = [...items];
  [next[index], next[other]] = [next[other], next[index]];
  return next;
};
