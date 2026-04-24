"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { ROUTES } from "@/lib/variables";
import { joiResolver } from "@hookform/resolvers/joi";
import joi from "joi";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ITransferFormValues {
  recipientEmail: string;
}

interface ITransferBody {
  userTicketId: string;
  recipientEmail: string;
  claimUrl: string;
}

const transferSchema = joi.object({
  recipientEmail: joi.string().email({ tlds: false }).required().messages({
    "string.email": "Invalid email address",
    "string.empty": "Recipient email is required",
    "any.required": "Recipient email is required",
  }),
});

const defaultValues: ITransferFormValues = {
  recipientEmail: "",
};

export default function TransferTicketPage() {
  const params = useParams();
  const router = useRouter();
  const userTicketId = params?.id?.toString() ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ITransferFormValues>({
    resolver: joiResolver(transferSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = useCallback(
    async (body: ITransferFormValues) => {
      try {
        const claimUrl = `${window.location.origin}/tickets/claim/{{transferId}}`;
        await postData<ITransferBody, unknown>("/ticket/transfer", {
          userTicketId,
          recipientEmail: body.recipientEmail,
          claimUrl,
        });
        toast.success("Ticket transferred successfully");
        router.push(ROUTES.PROFILE_TICKETS.href);
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Something went wrong while transferring this ticket!",
          ),
        );
      }
    },
    [userTicketId, router],
  );

  return (
    <div className="space-y-6">
      <Link
        href={ROUTES.PROFILE_TICKETS.href}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to My Tickets
      </Link>
      <div>
        <h2 className="text-lg font-semibold">Transfer Ticket</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Send this ticket to another person by entering the email address of
          the recipient below. They&apos;ll receive a link to claim it.
        </p>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 w-full max-w-sm"
      >
        <InputField
          inputClassName="bg-black/10"
          placeholder="recipient@example.com"
          label="Recipient Email"
          type="email"
          {...register("recipientEmail")}
          error={errors.recipientEmail?.message}
        />
        <Button
          disabled={!isValid || !userTicketId}
          loading={isSubmitting}
          type="submit"
          className="w-full"
        >
          Transfer Ticket
        </Button>
      </form>
    </div>
  );
}
