import { latestAdultBirthDate } from "@/lib/age";
import { isValidPhoneNumberStandard } from "@/lib/vendor-verification-helpers";
import Joi from "joi";
import {
  findPayoutCountry,
  SavedPayoutDigits,
  VerificationFormValues,
  VerificationStepKey,
} from "./types";

/** 10 MB, as the API allows; images or PDFs only. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const text = (label: string, min = 2) =>
  Joi.string()
    .trim()
    .min(min)
    .required()
    .messages({
      "string.empty": `${label} is required`,
      "any.required": `${label} is required`,
      "string.min": `${label} must be at least ${min} characters`,
    });

/** A new file picked must be an image or PDF under 10 MB; one already saved is fine. */
const document = (label: string, required: boolean) =>
  Joi.any()
    .custom((value, helpers) => {
      if (!value) {
        return required ? helpers.error("document.required") : value;
      }
      if (typeof File !== "undefined" && value instanceof File) {
        const allowed =
          value.type.startsWith("image/") || value.type === "application/pdf";
        if (!allowed) return helpers.error("document.type");
        if (value.size > MAX_DOCUMENT_BYTES)
          return helpers.error("document.size");
      }
      return value;
    })
    .messages({
      "document.required": `Upload your ${label}`,
      "document.type": "Upload an image or a PDF",
      "document.size": "The file must be 10 MB or smaller",
    });

const vendorTypeSchema = (values: VerificationFormValues) =>
  Joi.object({
    plan: Joi.string().valid("free", "paid").required().messages({
      "any.only": "Choose what you'll host",
      "any.required": "Choose what you'll host",
      "string.empty": "Choose what you'll host",
    }),
    vendorType:
      values.plan === "paid"
        ? Joi.string().valid("individual", "business").required()
        : Joi.any(),
    organiserName: Joi.string().trim().min(2).max(80).required().messages({
      "string.empty": "Enter the name your events go out under",
      "any.required": "Enter the name your events go out under",
      "string.min": "Enter the name your events go out under",
      "string.max": "Keep it under 80 characters",
    }),
  }).unknown(true);

const phoneNumber = Joi.string()
  .trim()
  .required()
  .custom((value: string, helpers) =>
    isValidPhoneNumberStandard(value) && value.startsWith("+")
      ? value
      : helpers.error("phone.invalid"),
  )
  .messages({
    "string.empty": "Phone number is required",
    "any.required": "Phone number is required",
    "phone.invalid": "Enter it with the country code, e.g. +234 801 234 5678",
  });

/** Free hosting: who they are and how to reach them, no ID. */
const freeHostSchema = Joi.object({
  legalFirstName: text("First name"),
  legalLastName: text("Last name"),
  countryOfResidence: text("Country of residence"),
  phoneNumber,
}).unknown(true);

const identitySchema = Joi.object({
  legalFirstName: text("Legal first name"),
  legalLastName: text("Legal last name"),
  dateOfBirth: Joi.date()
    .required()
    .custom((value: Date, helpers) =>
      value > latestAdultBirthDate() ? helpers.error("date.adult") : value,
    )
    .messages({
      "date.base": "Date of birth is required",
      "any.required": "Date of birth is required",
      "date.adult": "You must be at least 18 to verify as a vendor",
    }),
  countryOfResidence: text("Country of residence"),
  address: text("Residential address", 5),
  phoneNumber,
  idDocument: document("government ID", true),
}).unknown(true);

const businessSchema = Joi.object({
  businessName: text("Business name"),
  businessRegistrationNumber: text("Registration number"),
  businessAddress: text("Business address", 5),
  authorizedRepresentative: text("Authorised representative"),
  taxId: Joi.string().allow("").optional(),
}).unknown(true);

/**
 * Bank fields for the chosen payout country, each in that country's format. A
 * number already on file may be left blank to keep it.
 */
const payoutSchema = (
  values: VerificationFormValues,
  saved: SavedPayoutDigits,
) => {
  const country = findPayoutCountry(values.payoutCountry);
  const fields = country?.fields ?? [];
  const digits = (value: string) => value.replace(/[\s-]/g, "");

  const number = (
    field: "accountNumber" | "routingNumber" | "sortCode",
    label: string,
    pattern: RegExp | undefined,
    hint: string,
    savedLast4?: string | null,
  ) => {
    const base = Joi.string()
      .allow("")
      .custom((value: string, helpers) => {
        const clean = digits(value);
        if (!clean) {
          return savedLast4 ? value : helpers.error("number.missing");
        }
        if (pattern && !pattern.test(clean))
          return helpers.error("number.format");
        return value;
      })
      .messages({
        "number.missing": `${label} is required`,
        "number.format": hint,
      });
    return fields.includes(field) ? base : Joi.any();
  };

  return Joi.object({
    payoutCountry: Joi.string()
      .required()
      .custom((value: string, helpers) =>
        findPayoutCountry(value) ? value : helpers.error("country.unsupported"),
      )
      .messages({
        "string.empty": "Choose where you'll be paid",
        "any.required": "Choose where you'll be paid",
        "country.unsupported": "Payouts aren't available there yet",
      }),
    accountHolderName: text("Account holder name"),
    bankName: fields.includes("bankName")
      ? Joi.string()
          .trim()
          .required()
          .messages({
            "string.empty": country?.directPayout
              ? "Pick your bank from the list"
              : "Bank name is required",
            "any.required": "Bank name is required",
          })
      : Joi.any(),
    bankCode: country?.directPayout
      ? Joi.string().required().messages({
          "string.empty": "Pick your bank from the list",
          "any.required": "Pick your bank from the list",
        })
      : Joi.any(),
    accountNumber: number(
      "accountNumber",
      "Account number",
      country?.accountNumber?.pattern,
      country?.accountNumber?.hint ?? "Check the account number",
      saved.accountNumberLast4,
    ),
    routingNumber: number(
      "routingNumber",
      country?.routingNumber?.label ?? "Routing number",
      country?.routingNumber?.pattern,
      country?.routingNumber?.hint ?? "Check the routing number",
      saved.routingNumberLast4,
    ),
    sortCode: number(
      "sortCode",
      "Sort code",
      /^\d{6}$/,
      "6 digits, e.g. 12-34-56",
      saved.sortCodeLast4,
    ),
    iban: fields.includes("iban")
      ? Joi.string()
          .allow("")
          .custom((value: string, helpers) => {
            const clean = value.replace(/\s/g, "").toUpperCase();
            if (!clean)
              return saved.ibanLast4 ? value : helpers.error("iban.missing");
            const expected =
              country?.code === "AE"
                ? /^AE\d{21}$/
                : /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/;
            return expected.test(clean) ? value : helpers.error("iban.format");
          })
          .messages({
            "iban.missing": "IBAN is required",
            "iban.format":
              country?.code === "AE"
                ? "A UAE IBAN is AE followed by 21 digits"
                : "Check the IBAN",
          })
      : Joi.any(),
    swiftCode: fields.includes("swiftCode")
      ? Joi.string()
          .trim()
          .required()
          .pattern(/^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/)
          .messages({
            "string.empty": "SWIFT / BIC code is required",
            "any.required": "SWIFT / BIC code is required",
            "string.pattern.base":
              "A SWIFT code is 8 or 11 letters and numbers",
          })
      : Joi.any(),
  }).unknown(true);
};

const crossBorderSchema = (values: VerificationFormValues) =>
  values.hostsAbroad
    ? Joi.object({
        crossBorderCountries: Joi.array()
          .items(Joi.string())
          .min(1)
          .required()
          .messages({
            "array.min": "Add at least one country you'll host in",
            "any.required": "Add at least one country you'll host in",
          }),
        crossBorderReason: text("A reason", 10).messages({
          "string.empty": "Tell us why you'll host there",
          "string.min": "Tell us a little more (at least 10 characters)",
        }),
        supportingDocument: document("supporting document", false),
      }).unknown(true)
    : Joi.object().unknown(true);

const reviewSchema = Joi.object({
  acceptedTerms: Joi.boolean().valid(true).required().messages({
    "any.only": "Confirm your details are accurate to submit",
    "any.required": "Confirm your details are accurate to submit",
  }),
}).unknown(true);

/** The schema for one step, built for what's been entered so far. */
export const schemaFor = (
  step: VerificationStepKey,
  values: VerificationFormValues,
  saved: SavedPayoutDigits,
) => {
  switch (step) {
    case "vendorType":
      return vendorTypeSchema(values);
    case "identity":
      return values.plan === "free" ? freeHostSchema : identitySchema;
    case "business":
      return businessSchema;
    case "payout":
      return payoutSchema(values, saved);
    case "crossBorder":
      return crossBorderSchema(values);
    case "review":
      return reviewSchema;
  }
};
