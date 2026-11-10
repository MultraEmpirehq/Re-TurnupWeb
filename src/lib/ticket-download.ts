/**
 * Saves every `[data-saved-ticket]` on the page as one PDF, a page each.
 * Returns how many made it in. The libraries are fetched on tap: together
 * they're ~130 KB that every order page would otherwise load just in case.
 */
export const downloadSavedTickets = async (filename: string): Promise<number> => {
  const nodes = [...document.querySelectorAll<HTMLElement>("[data-saved-ticket]")];
  if (!nodes.length) return 0;

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
    // Let images and fonts settle before the pictures are taken.
    document.fonts?.ready ?? Promise.resolve(),
  ]);

  let pdf: InstanceType<typeof jsPDF> | null = null;
  let added = 0;
  for (const node of nodes) {
    try {
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      // Pages in points, at the ticket's own shape.
      const width = canvas.width / 2;
      const height = canvas.height / 2;
      if (!pdf) {
        pdf = new jsPDF({ unit: "pt", format: [width, height], orientation: "portrait" });
      } else {
        pdf.addPage([width, height], "portrait");
      }
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, width, height);
      added++;
    } catch {
      /* one that can't be drawn is left out; the count says so */
    }
  }
  pdf?.save(filename);
  return added;
};

/** "toronto-comedy-jam" from "Toronto Comedy Jam!" */
export const fileSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "tickets";
