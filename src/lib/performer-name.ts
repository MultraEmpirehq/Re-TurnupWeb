/**
 * What makes two names the same performer, matching the api: no accents, no
 * spaces or punctuation, any capitals ("Burna Boy" = "burna-boy" = "BurnaBoy").
 */
export const performerNameKey = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
