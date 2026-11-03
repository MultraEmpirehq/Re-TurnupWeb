/**
 * What the api asks of a password (its passwordRegexp), checked here first so
 * people see what's missing before they send it.
 */
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "An uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "A lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "A number", test: (value: string) => /\d/.test(value) },
  {
    label: "A symbol, like ! or #",
    test: (value: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value),
  },
];

export const isStrongPassword = (value: string) =>
  PASSWORD_RULES.every((rule) => rule.test(value));

export const PASSWORD_HINT =
  "Use 8 or more characters with upper and lower case letters, a number and a symbol.";
