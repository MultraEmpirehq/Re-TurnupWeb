/**
 * Who a ticket goes to, from one box: an email (anyone, account or not) or a
 * Turnupz username, with or without the @.
 */
export type TTransferRecipient =
  { kind: "email"; email: string } | { kind: "username"; username: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Letters, numbers, dots and underscores, as usernames are made.
const USERNAME = /^[a-z0-9._]{2,50}$/i;

export const parseRecipient = (input: string): TTransferRecipient | null => {
  const value = input.trim();
  if (EMAIL.test(value)) return { kind: "email", email: value.toLowerCase() };
  const username = value.replace(/^@+/, "");
  if (USERNAME.test(username)) return { kind: "username", username };
  return null;
};

/** The transfer request's recipient fields for what was typed. */
export const recipientBody = (recipient: TTransferRecipient) =>
  recipient.kind === "email"
    ? { recipientEmail: recipient.email }
    : { recipientUsername: recipient.username };
