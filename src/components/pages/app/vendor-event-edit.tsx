"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useEvent } from "@/hooks/use-event";
import { IEventActivityDetails } from "@/lib/types";
import { updateDevMockEvent } from "@/lib/dev-mock-events";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const toDatetimeInputValue = (date: Date | string) => {
  const nextDate = new Date(date);
  const year = nextDate.getFullYear();
  const month = `${nextDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${nextDate.getDate()}`.padStart(2, "0");
  const hour = `${nextDate.getHours()}`.padStart(2, "0");
  const minute = `${nextDate.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const createEmptyActivity = (): IEventActivityDetails => ({
  name: "",
  description: "",
  date: new Date(),
});

const VendorEventEdit: React.FC<{ id: string }> = ({ id }) => {
  const { data, isLoading } = useEvent(id);
  const [formValues, setFormValues] = useState({
    name: "",
    date: "",
    venueName: "",
    venueAddress: "",
    description: "",
    totalTickets: "0",
    blogPost: "",
  });
  const [additionalInformation, setAdditionalInformation] = useState<string[]>(
    [],
  );
  const [activities, setActivities] = useState<IEventActivityDetails[]>([]);

  useEffect(() => {
    if (!data) {
      return;
    }

    setFormValues({
      name: data.name ?? "",
      date: toDatetimeInputValue(data.date),
      venueName: data.venue?.name ?? "",
      venueAddress: data.venue?.address ?? "",
      description: data.description ?? "",
      totalTickets: `${data.totalTickets ?? 0}`,
      blogPost: data.blogPost ?? "",
    });
    setAdditionalInformation(data.additionalInformation ?? []);
    setActivities(data.activities ?? []);
  }, [data]);

  const isDevelopmentEdit = useMemo(() => {
    return process.env.NODE_ENV === "development";
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-[32rem] w-full rounded-[2rem]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[2rem] border border-secondary-100 bg-white p-8 text-secondary-600 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        This event could not be found.
      </div>
    );
  }

  const handleChange =
    (field: keyof typeof formValues) =>
    (
      event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setFormValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleAdditionalInformationChange = (index: number, value: string) => {
    setAdditionalInformation((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  };

  const handleRemoveAdditionalInformation = (index: number) => {
    setAdditionalInformation((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleActivityChange = (
    index: number,
    field: keyof IEventActivityDetails,
    value: string,
  ) => {
    setActivities((current) =>
      current.map((activity, activityIndex) => {
        if (activityIndex !== index) {
          return activity;
        }

        if (field === "date") {
          return { ...activity, date: new Date(value) };
        }

        return { ...activity, [field]: value };
      }),
    );
  };

  const handleRemoveActivity = (index: number) => {
    setActivities((current) =>
      current.filter((_, activityIndex) => activityIndex !== index),
    );
  };

  const handleSave = () => {
    if (!isDevelopmentEdit) {
      toast.info(
        "Edit saving is currently enabled for development-created events.",
      );
      return;
    }

    updateDevMockEvent(id, {
      name: formValues.name,
      date: new Date(formValues.date),
      description: formValues.description,
      blogPost: formValues.blogPost,
      totalTickets: Number(formValues.totalTickets) || 0,
      additionalInformation: additionalInformation
        .map((item) => item.trim())
        .filter(Boolean),
      activities: activities
        .map((activity) => ({
          ...activity,
          name: activity.name.trim(),
          description: activity.description?.trim(),
        }))
        .filter((activity) => activity.name),
      venue: {
        ...data.venue,
        id: data.venue?.id || `venue-${id}`,
        name: formValues.venueName || "Venue pending",
        address: formValues.venueAddress || "",
        rating: data.venue?.rating ?? 5,
        totalAvailableSeat: data.venue?.totalAvailableSeat ?? 0,
        images: data.venue?.images ?? [],
      },
    });

    toast.success("Event updated successfully");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Edit Event
          </p>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[0.96] tracking-tight text-secondary-950">
            Refine {data.name}
          </h1>
          <p className="max-w-3xl text-base text-secondary-500">
            Update the event story, stored sections, and venue details without
            losing the Turnupz workflow you already have in place.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-2xl border-secondary-200 px-6 text-base font-semibold text-secondary-950 hover:bg-secondary-50 sm:w-auto"
          >
            <Link href={`/app/events/${id}`}>Back to Event</Link>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <form
          className="rounded-[1.6rem] border border-secondary-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[2.2rem] sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-secondary-700">
                  Event Name
                </label>
                <Input
                  value={formValues.name}
                  onChange={handleChange("name")}
                  className="h-12 rounded-2xl border-secondary-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">
                  Event Date
                </label>
                <Input
                  type="datetime-local"
                  value={formValues.date}
                  onChange={handleChange("date")}
                  className="h-12 rounded-2xl border-secondary-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">
                  Ticket Count
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formValues.totalTickets}
                  onChange={handleChange("totalTickets")}
                  className="h-12 rounded-2xl border-secondary-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">
                  Venue Name
                </label>
                <Input
                  value={formValues.venueName}
                  onChange={handleChange("venueName")}
                  className="h-12 rounded-2xl border-secondary-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">
                  Venue Address
                </label>
                <Input
                  value={formValues.venueAddress}
                  onChange={handleChange("venueAddress")}
                  className="h-12 rounded-2xl border-secondary-200"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-secondary-700">
                  Description
                </label>
                <Textarea
                  value={formValues.description}
                  onChange={handleChange("description")}
                  className="min-h-32 rounded-[1.5rem] border-secondary-200 px-4 py-3"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-950">
                    Additional Information
                  </p>
                  <p className="text-sm text-secondary-500">
                    Edit, delete, or add quick event notes.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-secondary-200"
                  onClick={() =>
                    setAdditionalInformation((current) => [...current, ""])
                  }
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {additionalInformation.length === 0 && (
                  <div className="rounded-[1.3rem] border border-dashed border-secondary-200 px-4 py-5 text-sm text-secondary-500">
                    No additional information yet. Add one to keep this event
                    detailed.
                  </div>
                )}
                {additionalInformation.map((item, index) => (
                  <div
                    key={`info-${index}`}
                    className="flex flex-col gap-3 rounded-[1.3rem] bg-secondary-50 p-4 sm:flex-row sm:items-start"
                  >
                    <Input
                      value={item}
                      onChange={(event) =>
                        handleAdditionalInformationChange(
                          index,
                          event.target.value,
                        )
                      }
                      className="h-11 rounded-xl border-secondary-200 bg-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-secondary-200 bg-white"
                      onClick={() => handleRemoveAdditionalInformation(index)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-950">
                    Activities
                  </p>
                  <p className="text-sm text-secondary-500">
                    Modify the stored event schedule or add new highlights.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-secondary-200"
                  onClick={() =>
                    setActivities((current) => [...current, createEmptyActivity()])
                  }
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-4">
                {activities.length === 0 && (
                  <div className="rounded-[1.3rem] border border-dashed border-secondary-200 px-4 py-5 text-sm text-secondary-500">
                    No activities yet. Add agenda items for this event.
                  </div>
                )}
                {activities.map((activity, index) => (
                  <div
                    key={`activity-${index}`}
                    className="rounded-[1.3rem] bg-secondary-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-secondary-950">
                        Activity {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-secondary-200 bg-white"
                        onClick={() => handleRemoveActivity(index)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Activity Name
                        </label>
                        <Input
                          value={activity.name}
                          onChange={(event) =>
                            handleActivityChange(
                              index,
                              "name",
                              event.target.value,
                            )
                          }
                          className="h-11 rounded-xl border-secondary-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Activity Date
                        </label>
                        <Input
                          type="datetime-local"
                          value={toDatetimeInputValue(activity.date)}
                          onChange={(event) =>
                            handleActivityChange(
                              index,
                              "date",
                              event.target.value,
                            )
                          }
                          className="h-11 rounded-xl border-secondary-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Activity Description
                        </label>
                        <Textarea
                          value={activity.description ?? ""}
                          onChange={(event) =>
                            handleActivityChange(
                              index,
                              "description",
                              event.target.value,
                            )
                          }
                          className="min-h-24 rounded-[1rem] border-secondary-200 bg-white px-4 py-3"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-700">
                Blog Post
              </label>
              <Textarea
                value={formValues.blogPost}
                onChange={handleChange("blogPost")}
                className="min-h-48 rounded-[1.5rem] border-secondary-200 px-4 py-3"
                placeholder="Write a blog-style post for this event update, announcement, or story."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-secondary-400 px-7 text-base font-semibold text-white hover:bg-secondary-500 sm:w-auto"
            >
              Save Changes
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-2xl border-secondary-200 px-7 text-base font-semibold text-secondary-950 hover:bg-secondary-50 sm:w-auto"
            >
              <Link href={`/app/events/${id}`}>View Event</Link>
            </Button>
          </div>
        </form>

        <aside className="rounded-[1.6rem] bg-[#11172d] p-5 text-white shadow-[0_20px_50px_rgba(17,23,45,0.24)] sm:rounded-[2.2rem] sm:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">
              Editing Notes
            </p>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              Keep the event page clear, current, and ready to convert.
            </h2>
            <p className="text-sm leading-7 text-white/72 sm:text-base sm:leading-8">
              This screen now keeps the stored event inputs editable, so you can
              remove, update, or add details without rebuilding the event from
              scratch.
            </p>
            <div className="rounded-[1.3rem] bg-white/8 p-4 text-sm leading-7 text-white/70 sm:rounded-[1.6rem] sm:p-5">
              In development, saved changes update the event cards, details,
              and blog-style content immediately so you can keep designing and
              testing the vendor flow without waiting on backend auth.
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default memo(VendorEventEdit);
