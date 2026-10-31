/** The same name, ignoring capitals and extra spaces ("VIP" and " vip "). */
export const sameName = (a: string, b: string) =>
  a.trim().replace(/\s+/g, " ").toLowerCase() ===
  b.trim().replace(/\s+/g, " ").toLowerCase();
