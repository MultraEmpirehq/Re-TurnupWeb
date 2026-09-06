"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TextareaField from "@/components/ui/textarea-field";
import {
  useVendorVerificationSnapshot,
  VendorVerificationNotice,
} from "@/components/pages/app/vendor-verification";
import Joi from "joi";
import React, { memo, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { TFormValues } from "@/app/app/create/page";
import Link from "next/link";

export const previewPublishSchema = Joi.object({
  acceptedTerms: Joi.boolean().valid(true).required().messages({
    "any.only": "Please confirm the terms and policies before publishing",
    "any.required": "Please confirm the terms and policies before publishing",
  }),
}).unknown(true);

const getImagePreviewUrl = (image: File | string | null | undefined) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (image instanceof Blob) return URL.createObjectURL(image);
  return "";
};

const getTicketPriceAmount = (price: unknown) => {
  if (typeof price === "number") return price;
  if (price && typeof price === "object" && "amount" in price) {
    return Number((price as { amount?: number }).amount ?? 0);
  }
  return Number(price ?? 0);
};

const PreviewPublishForm: React.FC<{
  handleNextStep: () => Promise<void>;
  handlePreviousStep?: () => void;
}> = ({ handleNextStep, handlePreviousStep }) => {
  const {
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<TFormValues>();

  const values = watch();
  const verification = useVendorVerificationSnapshot();
  const coverImage = values.coverImage;
  const mediaFiles = useMemo(() => values.mediaFiles ?? [], [values.mediaFiles]);
  const coverImagePreviewUrl = useMemo(
    () => getImagePreviewUrl(coverImage),
    [coverImage],
  );
  const mediaPreviewUrls = useMemo(
    () => mediaFiles.map(getImagePreviewUrl).filter(Boolean),
    [mediaFiles],
  );
  const eventTickets = useMemo(
    () => values.eventTickets ?? [],
    [values.eventTickets],
  );
  const passAssignments = useMemo(
    () => values.passAssignments ?? [],
    [values.passAssignments],
  );
  const blogPosts = useMemo(() => values.blogPosts ?? [], [values.blogPosts]);

  const totalAttendance = useMemo(() => {
    const ticketCapacity = eventTickets.reduce(
      (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
      0,
    );
    const passCapacity = passAssignments.reduce(
      (sum, pass) => sum + Number(pass.quantity || 0),
      0,
    );
    return ticketCapacity + passCapacity;
  }, [eventTickets, passAssignments]);

  const requiresPaidVerification = useMemo(() => {
    const hasPaidInternalTickets =
      values.saleMethod === "on_turnup" &&
      eventTickets.some((ticket) => getTicketPriceAmount(ticket.ticketPrice) > 0);
    const hasExternalTicketing = values.saleMethod === "external_link";
    return hasPaidInternalTickets || hasExternalTicketing;
  }, [eventTickets, values.saleMethod]);

  const isPaidPublishingLocked =
    requiresPaidVerification && verification.status !== "approved";

  const addBlogPost = () => {
    setValue(
      "blogPosts",
      [
        ...blogPosts,
        {
          id: `blog-${Date.now()}`,
          title: "",
          excerpt: "",
          body: "",
          images: [],
          createdAt: new Date().toISOString(),
        },
      ],
      { shouldValidate: true },
    );
  };

  const setTicketTransferable = (index: number, transferable: boolean) => {
    setValue(`eventTickets.${index}.transferable`, transferable, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const setPassTransferable = (index: number, transferable: boolean) => {
    setValue(`passAssignments.${index}.transferable`, transferable, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const privateTickets = useMemo(
    () =>
      eventTickets.filter(
        (ticket) => ticket.visibility === "private" && ticket.privateAccessCode,
      ),
    [eventTickets],
  );

  const blogImageOptions = useMemo(
    () =>
      [
        coverImage,
        ...mediaFiles,
        ...(values.sponsorImages ?? []),
      ].filter(Boolean) as Array<File | string>,
    [coverImage, mediaFiles, values.sponsorImages],
  );

  const addBlogImages = (index: number, images: Array<File | string>) => {
    const currentImages = blogPosts[index]?.images ?? [];
    setValue(
      `blogPosts.${index}.images`,
      [...currentImages, ...images],
      { shouldValidate: true, shouldDirty: true },
    );
    if (!blogPosts[index]?.image && images[0]) {
      setValue(`blogPosts.${index}.image`, images[0], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const removeBlogImage = (postIndex: number, imageIndex: number) => {
    const nextImages = (blogPosts[postIndex]?.images ?? []).filter(
      (_, index) => index !== imageIndex,
    );
    setValue(`blogPosts.${postIndex}.images`, nextImages, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`blogPosts.${postIndex}.image`, nextImages[0] ?? "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleNextStep)} className="space-y-8">
      <VendorVerificationNotice context="create" />

      <section className="rounded-[1.6rem] border border-secondary-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-400">
          Preview
        </p>
        <h2 className="mt-3 text-3xl font-bold text-secondary-950">
          {values.eventName || "Untitled event"}
        </h2>
        {coverImagePreviewUrl && (
          <div
            className="mt-5 h-52 rounded-[1.2rem] bg-cover bg-center sm:h-64"
            style={{ backgroundImage: `url(${coverImagePreviewUrl})` }}
          />
        )}
        <p className="mt-5 text-sm leading-7 text-secondary-600">
          {values.description || "No event description yet."}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-secondary-50 p-4">
            <p className="text-sm text-secondary-500">Ticket categories</p>
            <p className="mt-2 text-2xl font-bold text-secondary-950">
              {eventTickets.length}
            </p>
          </div>
          <div className="rounded-xl bg-secondary-50 p-4">
            <p className="text-sm text-secondary-500">Pass capacity</p>
            <p className="mt-2 text-2xl font-bold text-secondary-950">
              {passAssignments.reduce(
                (sum, pass) => sum + Number(pass.quantity || 0),
                0,
              )}
            </p>
          </div>
          <div className="rounded-xl bg-secondary-50 p-4">
            <p className="text-sm text-secondary-500">Total attendance</p>
            <p className="mt-2 text-2xl font-bold text-secondary-950">
              {totalAttendance}
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-secondary-50 p-4">
          <p className="text-sm text-secondary-500">Event location</p>
          <p className="mt-2 text-sm font-semibold text-secondary-950">
            {[values.eventCity, values.eventState, values.eventCountry]
              .filter(Boolean)
              .join(", ") || "No country, province/state, or city selected"}
          </p>
        </div>
        {mediaPreviewUrls.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {mediaPreviewUrls.slice(0, 6).map((previewUrl, index) => (
              <div
                key={`${previewUrl}-${index}`}
                className="h-28 rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url(${previewUrl})` }}
              />
            ))}
          </div>
        )}
      </section>

      {(eventTickets.length > 0 || passAssignments.length > 0) && (
        <section className="space-y-4 rounded-[1.6rem] border border-secondary-100 bg-white p-5">
          <div>
            <p className="text-sm font-semibold text-secondary-950">
              Transfer Settings
            </p>
            <p className="text-sm text-secondary-500">
              Enable transfer for any ticket category or access pass before publishing.
            </p>
          </div>
          {eventTickets.length > 0 && (
            <div className="space-y-3">
              {eventTickets.map((ticket, index) => (
                <label
                  key={`${ticket.ticketName}-${index}`}
                  className="flex items-start justify-between gap-4 rounded-xl bg-secondary-50 p-4 text-sm"
                >
                  <span>
                    <span className="block font-semibold text-secondary-950">
                      {ticket.ticketName || `Ticket ${index + 1}`}
                    </span>
                    <span className="mt-1 block text-secondary-500">
                      {ticket.ticketQuantity} tickets -{" "}
                      {ticket.transferable ? "Transfer enabled" : "Transfer disabled"}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={!!ticket.transferable}
                    onChange={(event) =>
                      setTicketTransferable(index, event.target.checked)
                    }
                    className="mt-1"
                  />
                </label>
              ))}
            </div>
          )}
          {passAssignments.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-secondary-500">
                Access pass invite emails are sent after publishing. Draft saves keep
                the pass list without emailing assignees.
              </p>
              {passAssignments.map((pass, index) => (
                <label
                  key={`${pass.passName}-${index}`}
                  className="flex items-start justify-between gap-4 rounded-xl bg-secondary-50 p-4 text-sm"
                >
                  <span>
                    <span className="block font-semibold text-secondary-950">
                      {pass.passName || `Access Pass ${index + 1}`}
                    </span>
                    <span className="mt-1 block text-secondary-500">
                      {pass.quantity} passes -{" "}
                      {pass.transferable ? "Transfer enabled" : "Transfer disabled"}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={!!pass.transferable}
                    onChange={(event) =>
                      setPassTransferable(index, event.target.checked)
                    }
                    className="mt-1"
                  />
                </label>
              ))}
            </div>
          )}
        </section>
      )}

      {privateTickets.length > 0 && (
        <section className="space-y-4 rounded-[1.6rem] border border-secondary-100 bg-white p-5">
          <div>
            <p className="text-sm font-semibold text-secondary-950">
              Private Ticket Invites
            </p>
            <p className="text-sm text-secondary-500">
              These categories stay hidden from the public ticket page. Share the
              private link after the event is published.
            </p>
          </div>
          <div className="space-y-3">
            {privateTickets.map((ticket) => (
              <div
                key={`${ticket.ticketName}-${ticket.privateAccessCode}`}
                className="rounded-xl bg-secondary-50 p-4 text-sm"
              >
                <p className="font-semibold text-secondary-950">
                  {ticket.ticketName}
                </p>
                <p className="mt-1 break-all text-secondary-500">
                  /explore/event/:eventId/ticket?access={ticket.privateAccessCode}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-[1.6rem] border border-secondary-100 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-secondary-950">
              Blog Posts
            </p>
            <p className="text-sm text-secondary-500">
              Add an optional launch update before publishing.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={addBlogPost}>
            Add Blog Post
          </Button>
        </div>
        {blogPosts.map((post, index) => (
          <div key={post.id} className="space-y-3 rounded-xl bg-secondary-50 p-4">
            <Input
              value={post.title}
              placeholder="Title"
              onChange={(event) =>
                setValue(`blogPosts.${index}.title`, event.target.value, {
                  shouldValidate: true,
                })
              }
              className="h-11 rounded-xl bg-white"
            />
            <Input
              value={post.excerpt ?? ""}
              placeholder="Excerpt"
              onChange={(event) =>
                setValue(`blogPosts.${index}.excerpt`, event.target.value, {
                  shouldValidate: true,
                })
              }
              className="h-11 rounded-xl bg-white"
            />
            <TextareaField
              value={post.body}
              placeholder="Details"
              onChange={(event) =>
                setValue(`blogPosts.${index}.body`, event.target.value, {
                  shouldValidate: true,
                })
              }
              className="bg-white"
            />
            <div className="space-y-3 rounded-xl bg-white p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-secondary-950">
                    Blog images
                  </p>
                  <p className="text-xs text-secondary-500">
                    Upload images or reuse banner, media, or sponsor images.
                  </p>
                </div>
                <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-secondary-200 px-4 text-sm font-semibold text-secondary-700 hover:bg-secondary-50">
                  Upload Images
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []).filter(
                        (file) => file.type.includes("image"),
                      );
                      if (files.length) {
                        addBlogImages(index, files);
                      }
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>

              {blogImageOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blogImageOptions.map((image, imageIndex) => {
                    const preview = getImagePreviewUrl(image);
                    if (!preview) return null;
                    return (
                      <button
                        key={`${preview}-${imageIndex}`}
                        type="button"
                        onClick={() => addBlogImages(index, [image])}
                        className="h-16 w-20 overflow-hidden rounded-lg border border-secondary-100 bg-cover bg-center"
                        style={{ backgroundImage: `url(${preview})` }}
                        aria-label="Use uploaded event image"
                      />
                    );
                  })}
                </div>
              )}

              {!!post.images?.length && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {post.images.map((image, imageIndex) => {
                    const preview = getImagePreviewUrl(image);
                    if (!preview) return null;
                    return (
                      <div
                        key={`${preview}-${imageIndex}`}
                        className="relative h-24 overflow-hidden rounded-xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${preview})` }}
                      >
                        <button
                          type="button"
                          onClick={() => removeBlogImage(index, imageIndex)}
                          className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-semibold text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setValue(
                  "blogPosts",
                  blogPosts.filter((_, postIndex) => postIndex !== index),
                  { shouldValidate: true },
                )
              }
            >
              Remove Blog Post
            </Button>
          </div>
        ))}
      </section>

      <Controller
        control={control}
        name="acceptedTerms"
        render={({ field }) => (
          <label className="flex items-start gap-3 rounded-2xl border border-secondary-100 bg-white p-5 text-sm text-secondary-600">
            <input
              type="checkbox"
              checked={!!field.value}
              onChange={(event) => field.onChange(event.target.checked)}
              className="mt-1"
            />
            <span>
              I confirm this event follows{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-semibold text-secondary-500 underline"
              >
                Turnupz terms, policies, ticketing rules, and venue/event
                publishing requirements
              </Link>
              .
            </span>
          </label>
        )}
      />
      {errors.acceptedTerms?.message && (
        <p className="text-sm text-destructive">
          {errors.acceptedTerms.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={handlePreviousStep}>
          Previous
        </Button>
        {isPaidPublishingLocked ? (
          <Button asChild type="button" variant="outline">
            <a href="/app/settings/vendor-verification">
              Complete Verification
            </a>
          </Button>
        ) : (
          <Button type="submit" loading={isSubmitting}>
            Publish Event
          </Button>
        )}
      </div>
    </form>
  );
};

export default memo(PreviewPublishForm);
