"use client";

import { putData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useEvent } from "@/hooks/use-event";
import { addEventNotification } from "@/lib/event-notifications";
import { appendEventChatMessage, ensureEventChatGroup } from "@/lib/event-chat";
import {
  IEventActivityDetails,
  IEventBlogPostDetails,
  IEventPassAssignmentDetails,
  IEventTicketOptionDetails,
} from "@/lib/types";
import { updateDevMockEvent } from "@/lib/dev-mock-events";
import useUserStore from "@/stores/user-store";
import { useQueryClient } from "@tanstack/react-query";
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

const createEmptyBlogPost = (): IEventBlogPostDetails => ({
  id: `blog-${Date.now()}`,
  title: "",
  excerpt: "",
  body: "",
  image: "",
  images: [],
  createdAt: new Date().toISOString(),
});

const createEmptyTicket = (): IEventTicketOptionDetails => ({
  ticketName: "",
  ticketPrice: 0,
  ticketQuantity: 1,
  visibility: "public",
  actionType: "paid",
  transferable: false,
  privateAccessCode: "",
});

const createEmptyPass = (): IEventPassAssignmentDetails => ({
  passName: "",
  quantity: 1,
  assigneeEmails: [],
  transferable: false,
});

const createPrivateAccessCode = (ticketName: string) => {
  const slug = ticketName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `${slug || "private"}-${Date.now().toString(36)}`;
};

const getTicketPriceAmount = (
  price: IEventTicketOptionDetails["ticketPrice"],
) => (typeof price === "number" ? price : Number(price?.amount ?? 0));

const createObjectUrl = (file: File | null | undefined) => {
  if (!file || !file.type.includes("image")) {
    return "";
  }

  return URL.createObjectURL(file);
};

const getImagePreviewUrl = (image: File | string | null | undefined) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (image instanceof Blob) return URL.createObjectURL(image);
  return "";
};

const VendorEventEdit: React.FC<{ id: string }> = ({ id }) => {
  const { data, isLoading } = useEvent(id);
  const queryClient = useQueryClient();
  const userDetails = useUserStore((state) => state.userDetails);
  const [formValues, setFormValues] = useState({
    name: "",
    date: "",
    venueName: "",
    venueAddress: "",
    description: "",
    totalTickets: "0",
  });
  const [saleMethod, setSaleMethod] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [activities, setActivities] = useState<IEventActivityDetails[]>([]);
  const [blogPosts, setBlogPosts] = useState<IEventBlogPostDetails[]>([]);
  const [bannerImage, setBannerImage] = useState("");
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [mediaImages, setMediaImages] = useState<string[]>([]);
  const [mediaImageFiles, setMediaImageFiles] = useState<File[]>([]);
  const [sponsors, setSponsors] = useState<string[]>([]);
  const [sponsorImages, setSponsorImages] = useState<string[]>([]);
  const [sponsorImageFiles, setSponsorImageFiles] = useState<
    Record<number, File>
  >({});
  const [eventTickets, setEventTickets] = useState<IEventTicketOptionDetails[]>(
    [],
  );
  const [passAssignments, setPassAssignments] = useState<
    IEventPassAssignmentDetails[]
  >([]);

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
    });
    setSaleMethod(data.saleMethod ?? "");
    setTicketUrl(data.ticketUrl ?? "");
    setActivities(data.activities ?? []);
    setBannerImage(data.image ?? "");
    setBannerImageFile(null);
    setMediaImages(data.medias ?? []);
    setMediaImageFiles([]);
    setSponsors(data.sponsors ?? []);
    setSponsorImages(data.sponsorImages ?? []);
    setSponsorImageFiles({});
    setEventTickets(data.eventTickets ?? []);
    setPassAssignments(
      data.passAssignments ??
        data.accessPasses ??
        data.eventPasses ??
        data.passes ??
        [],
    );
    setBlogPosts(
      data.blogPosts?.length
        ? data.blogPosts
        : data.blogPost
          ? [
              {
                id: `blog-${data.id}-legacy`,
                title: "Event update",
                excerpt: data.blogPost.slice(0, 140),
                body: data.blogPost,
                image: data.image || data.medias?.[0] || "",
                images: [data.image || data.medias?.[0] || ""].filter(Boolean),
                createdAt: new Date().toISOString(),
              },
            ]
          : [],
    );
  }, [data]);

  const isDevelopmentEdit = useMemo(() => {
    return process.env.NODE_ENV === "development";
  }, []);

  const availableImageOptions = useMemo(
    () =>
      [
        bannerImage,
        ...mediaImages,
        ...sponsorImages,
        ...(data?.venue?.images ?? []),
      ].filter(Boolean),
    [bannerImage, data?.venue?.images, mediaImages, sponsorImages],
  );

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

  const handleTicketChange = (
    index: number,
    field: keyof IEventTicketOptionDetails,
    value: string | boolean,
  ) => {
    setEventTickets((current) =>
      current.map((ticket, ticketIndex) => {
        if (ticketIndex !== index) return ticket;

        if (field === "ticketPrice" || field === "ticketQuantity") {
          return {
            ...ticket,
            [field]: Number(value) || 0,
          };
        }

        if (field === "visibility") {
          const visibility = value as "public" | "private";
          return {
            ...ticket,
            visibility,
            privateAccessCode:
              visibility === "private"
                ? ticket.privateAccessCode ||
                  createPrivateAccessCode(ticket.ticketName)
                : "",
          };
        }

        return {
          ...ticket,
          [field]: value,
        };
      }),
    );
  };

  const handleRemoveTicket = (index: number) => {
    setEventTickets((current) =>
      current.filter((_, ticketIndex) => ticketIndex !== index),
    );
  };

  const handleCopyPrivateTicketLink = (ticket: IEventTicketOptionDetails) => {
    if (!ticket.privateAccessCode) {
      toast.error("Save this private ticket first to generate its invite link");
      return;
    }

    const privateLink = `${window.location.origin}/explore/event/${id}/ticket?access=${ticket.privateAccessCode}`;
    navigator.clipboard?.writeText(privateLink);
    toast.success("Private ticket link copied");
  };

  const handlePassChange = (
    index: number,
    field: keyof IEventPassAssignmentDetails,
    value: string | boolean,
  ) => {
    setPassAssignments((current) =>
      current.map((pass, passIndex) => {
        if (passIndex !== index) return pass;

        if (field === "quantity") {
          return {
            ...pass,
            quantity: Number(value) || 0,
          };
        }

        if (field === "assigneeEmails") {
          return {
            ...pass,
            assigneeEmails: `${value}`
              .split(/[,\n]/)
              .map((email) => email.trim())
              .filter(Boolean),
          };
        }

        return {
          ...pass,
          [field]: value,
        };
      }),
    );
  };

  const handleRemovePass = (index: number) => {
    setPassAssignments((current) =>
      current.filter((_, passIndex) => passIndex !== index),
    );
  };

  const handleBlogPostChange = (
    index: number,
    field: keyof IEventBlogPostDetails,
    value: string,
  ) => {
    setBlogPosts((current) =>
      current.map((post, postIndex) =>
        postIndex === index
          ? {
              ...post,
              [field]: value,
              updatedAt: new Date().toISOString(),
            }
          : post,
      ),
    );
  };

  const handleBlogImageUploads = (index: number, files?: FileList | null) => {
    const imageFiles = Array.from(files ?? []).filter((file) =>
      file.type.includes("image"),
    );

    if (imageFiles.length === 0) {
      toast.error("Please select image files");
      return;
    }

    setBlogPosts((current) =>
      current.map((post, postIndex) => {
        if (postIndex !== index) return post;
        const images = [...(post.images ?? []), ...imageFiles];
        return {
          ...post,
          image: post.image || imageFiles[0],
          images,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const handleBlogExistingImageAdd = (index: number, imageUrl: string) => {
    if (!imageUrl) return;

    setBlogPosts((current) =>
      current.map((post, postIndex) => {
        if (postIndex !== index) return post;
        const images = post.images?.includes(imageUrl)
          ? (post.images ?? [])
          : [...(post.images ?? []), imageUrl];
        return {
          ...post,
          image: post.image || imageUrl,
          images,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const handleRemoveBlogImage = (postIndex: number, imageIndex: number) => {
    setBlogPosts((current) =>
      current.map((post, currentPostIndex) => {
        if (currentPostIndex !== postIndex) return post;
        const images = (post.images ?? []).filter(
          (_, currentImageIndex) => currentImageIndex !== imageIndex,
        );
        return {
          ...post,
          image: images[0] ?? "",
          images,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const handleRemoveBlogPost = (index: number) => {
    setBlogPosts((current) =>
      current.filter((_, postIndex) => postIndex !== index),
    );
  };

  const handleBannerUpload = (file?: File | null) => {
    const imageUrl = createObjectUrl(file);
    if (!imageUrl) {
      toast.error("Please select an image file");
      return;
    }

    setBannerImage(imageUrl);
    setBannerImageFile(file ?? null);
  };

  const handleMediaUpload = (files?: FileList | null) => {
    const nextFiles = Array.from(files ?? []).filter((file) =>
      file.type.includes("image"),
    );
    const nextImages = nextFiles.map(createObjectUrl).filter(Boolean);

    if (nextImages.length === 0) {
      toast.error("Please select image files");
      return;
    }

    setMediaImages((current) => [...current, ...nextImages]);
    setMediaImageFiles((current) => [...current, ...nextFiles]);
  };

  const handleSponsorImageUpload = (index: number, file?: File | null) => {
    const imageUrl = createObjectUrl(file);
    if (!imageUrl) {
      toast.error("Please select an image file");
      return;
    }

    setSponsorImages((current) => {
      const next = [...current];
      next[index] = imageUrl;
      return next;
    });
    if (file) {
      setSponsorImageFiles((current) => ({ ...current, [index]: file }));
    }
  };

  const handleSave = async () => {
    const existingBlogPostIds = new Set(data.blogPosts?.map((post) => post.id) ?? []);
    const blogImageFiles = blogPosts.flatMap((post) =>
      (post.images ?? []).filter((image): image is File => image instanceof File),
    );
    const cleanedBlogPosts = blogPosts
      .map((post) => {
        const images = (post.images?.length ? post.images : [post.image || ""])
          .filter(Boolean)
          .map((image) => (image instanceof File ? image.name : image));

        return {
          ...post,
          title: post.title.trim(),
          excerpt: post.excerpt?.trim(),
          body: post.body.trim(),
          image: images[0] || "",
          images,
          updatedAt: new Date().toISOString(),
        };
      })
      .filter((post) => post.title && post.body);
    const newlyPublishedBlogPosts = cleanedBlogPosts.filter(
      (post) => !existingBlogPostIds.has(post.id),
    );
    const cleanedEventTickets = eventTickets
      .map((ticket) => ({
        ...ticket,
        ticketName: ticket.ticketName.trim(),
        ticketPrice: getTicketPriceAmount(ticket.ticketPrice),
        ticketQuantity: Math.max(Number(ticket.ticketQuantity) || 0, 0),
        visibility: ticket.visibility ?? "public",
        actionType: ticket.actionType ?? "paid",
        transferable: !!ticket.transferable,
        privateAccessCode:
          ticket.visibility === "private"
            ? ticket.privateAccessCode ||
              createPrivateAccessCode(ticket.ticketName)
            : "",
      }))
      .filter((ticket) => ticket.ticketName && ticket.ticketQuantity > 0);
    const cleanedPassAssignments = passAssignments
      .map((pass) => ({
        id: pass.id,
        eventId: pass.eventId,
        passName: pass.passName.trim(),
        quantity: Math.max(Number(pass.quantity) || 0, 0),
        assigneeEmails: pass.assigneeEmails
          .map((email) => email.trim())
          .filter(Boolean),
        transferable: !!pass.transferable,
      }))
      .filter((pass) => pass.passName && pass.quantity > 0);
    const totalConfiguredTickets =
      cleanedEventTickets.reduce(
        (sum, ticket) => sum + (Number(ticket.ticketQuantity) || 0),
        0,
      ) +
      cleanedPassAssignments.reduce(
        (sum, pass) => sum + (Number(pass.quantity) || 0),
        0,
      );

    if (!isDevelopmentEdit) {
      try {
        const formData = new FormData();
        formData.append("status", data.status === "draft" ? "draft" : "published");
        formData.append("eventName", formValues.name);
        formData.append("eventDate", new Date(formValues.date).toISOString());
        formData.append("description", formValues.description);
        formData.append("saleMethod", saleMethod);
        formData.append("ticketUrl", ticketUrl.trim());
        formData.append("eventTickets", JSON.stringify(cleanedEventTickets));
        formData.append("ticketCategories", JSON.stringify(cleanedEventTickets));
        formData.append("passAssignments", JSON.stringify(cleanedPassAssignments));
        formData.append("accessPasses", JSON.stringify(cleanedPassAssignments));
        formData.append("activities", JSON.stringify(activities));
        formData.append("blogPosts", JSON.stringify(cleanedBlogPosts));
        formData.append(
          "sponsors",
          JSON.stringify(sponsors.map((sponsor) => sponsor.trim()).filter(Boolean)),
        );
        if (bannerImageFile) {
          formData.append("image", bannerImageFile);
          formData.append("banner", bannerImageFile);
        }
        mediaImageFiles.forEach((file) => {
          formData.append("medias", file);
        });
        Object.values(sponsorImageFiles).forEach((file) => {
          formData.append("sponsorImages", file);
        });
        blogImageFiles.forEach((file) => {
          formData.append("blogImages", file);
        });
        await putData<FormData, unknown>(`/event/${id}`, formData);
        queryClient.invalidateQueries({ queryKey: ["event", id] });
        queryClient.invalidateQueries({ queryKey: ["events"] });
        toast.success("Event updated successfully");
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Unable to update this event right now.",
          ),
        );
      }
      return;
    }

    updateDevMockEvent(id, {
      name: formValues.name,
      date: new Date(formValues.date),
      description: formValues.description,
      image: bannerImage,
      medias: mediaImages,
      sponsors: sponsors.map((sponsor) => sponsor.trim()).filter(Boolean),
      sponsorImages: sponsorImages.filter(Boolean),
      saleMethod,
      ticketUrl: ticketUrl.trim(),
      blogPost: cleanedBlogPosts[0]?.body ?? "",
      blogPosts: cleanedBlogPosts,
      eventTickets: cleanedEventTickets,
      passAssignments: cleanedPassAssignments,
      accessPasses: cleanedPassAssignments,
      totalTickets:
        totalConfiguredTickets ||
        Number(formValues.totalTickets) ||
        0,
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

    const updatedEvent = {
      ...data,
      name: formValues.name,
      image: bannerImage,
      medias: mediaImages,
      saleMethod,
      ticketUrl: ticketUrl.trim(),
      blogPosts: cleanedBlogPosts,
      eventTickets: cleanedEventTickets,
      passAssignments: cleanedPassAssignments,
      accessPasses: cleanedPassAssignments,
      totalTickets:
        totalConfiguredTickets ||
        Number(formValues.totalTickets) ||
        0,
    };
    queryClient.setQueryData(["event", id], updatedEvent);
    queryClient.invalidateQueries({ queryKey: ["events"] });

    ensureEventChatGroup(updatedEvent, userDetails);
    newlyPublishedBlogPosts.forEach((post) => {
      const postImages = (post.images?.length ? post.images : [post.image || ""])
        .filter((image): image is string => typeof image === "string" && !!image);
      appendEventChatMessage({
        eventId: id,
        sender: {
          id: userDetails?.id || "turnupz-vendor",
          name:
            userDetails?.name ||
            [userDetails?.firstName, userDetails?.lastName]
              .filter(Boolean)
              .join(" ") ||
            "Turnupz Vendor",
          role: "vendor",
          avatar: userDetails?.avatar,
        },
        kind: "event-update",
        body: `New blog post for ${formValues.name}: ${post.title}.`,
        assetUrl: postImages[0],
        assetName: post.title,
        href: `/app/events/${id}/blog/${post.id}`,
      });

      addEventNotification({
        eventId: id,
        eventName: formValues.name,
        title: `New update: ${post.title}`,
        description:
          post.excerpt ||
          `A new blog post has been published for ${formValues.name}.`,
        href: `/app/events/${id}/blog/${post.id}`,
      });
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
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-2xl border-secondary-200 px-6 text-base font-semibold text-secondary-950 hover:bg-secondary-50 sm:w-auto"
          >
            <Link href="/app/events">Back to Listings</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-2xl border-secondary-200 px-6 text-base font-semibold text-secondary-950 hover:bg-secondary-50 sm:w-auto"
          >
            <Link href={`/app/events/${id}`}>Back to Event</Link>
          </Button>
        </div>
      </div>

      <section>
        <form
          className="rounded-[1.6rem] border border-secondary-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[2.2rem] sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div className="space-y-8">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-secondary-950">
                  Banner Image
                </p>
                <p className="text-sm text-secondary-500">
                  Replace the event preview banner image.
                </p>
              </div>
              {bannerImage ? (
                <div
                  className="h-52 max-w-full rounded-[1.2rem] border border-secondary-100 bg-cover bg-center sm:h-64"
                  style={{ backgroundImage: `url(${bannerImage})` }}
                />
              ) : (
                <div className="flex h-52 max-w-full items-center justify-center rounded-[1.2rem] border border-dashed border-secondary-200 bg-secondary-50 text-sm text-secondary-500 sm:h-64">
                  No banner selected yet. Upload the event banner below.
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                className="h-12 rounded-2xl border-secondary-200"
                onChange={(event) => {
                  handleBannerUpload(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </div>

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
                    Media
                  </p>
                  <p className="text-sm text-secondary-500">
                    Add or remove event gallery images.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center rounded-xl border border-secondary-200 px-4 py-2 text-sm font-semibold text-secondary-950 hover:bg-secondary-50">
                  <Plus className="mr-2 size-4" />
                  Add Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      handleMediaUpload(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mediaImages.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="overflow-hidden rounded-[1.2rem] border border-secondary-100 bg-secondary-50"
                  >
                    <div
                      className="h-32 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                    <div className="p-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl border-secondary-200 bg-white"
                        onClick={() =>
                          setMediaImages((current) =>
                            current.filter((_, imageIndex) => imageIndex !== index),
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-950">
                    Tickets
                  </p>
                  <p className="text-sm text-secondary-500">
                    Display, add, edit, or delete ticket categories shown in the event preview.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-secondary-200"
                  onClick={() =>
                    setEventTickets((current) => [...current, createEmptyTicket()])
                  }
                >
                  <Plus className="size-4" />
                  Add Category
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 rounded-[1.3rem] bg-secondary-50 p-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-700">
                      Ticket Option
                    </label>
                    <select
                      value={saleMethod}
                      onChange={(event) => setSaleMethod(event.target.value)}
                      className="h-11 w-full rounded-xl border border-secondary-200 bg-white px-3 text-sm"
                    >
                      <option value="">Select ticket option</option>
                      <option value="on_turnup">Sell on Turnupz</option>
                      <option value="register">Register</option>
                      <option value="external_link">External Link</option>
                    </select>
                  </div>
                  {saleMethod === "external_link" && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-secondary-700">
                        External Ticket Link
                      </label>
                      <Input
                        value={ticketUrl}
                        onChange={(event) => setTicketUrl(event.target.value)}
                        placeholder="https://example.com/tickets"
                        className="h-11 rounded-xl border-secondary-200 bg-white"
                      />
                    </div>
                  )}
                </div>

                {eventTickets.length === 0 && (
                  <div className="rounded-[1.3rem] border border-dashed border-secondary-200 px-4 py-5 text-sm text-secondary-500">
                    No ticket categories yet. Add one to display tickets in the preview.
                  </div>
                )}
                {eventTickets.map((ticket, index) => (
                  <div
                    key={`ticket-${index}`}
                    className="rounded-[1.3rem] bg-secondary-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-secondary-950">
                        Ticket {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-secondary-200 bg-white"
                        onClick={() => handleRemoveTicket(index)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Ticket Name
                        </label>
                        <Input
                          value={ticket.ticketName}
                          onChange={(event) =>
                            handleTicketChange(
                              index,
                              "ticketName",
                              event.target.value,
                            )
                          }
                          className="h-11 rounded-xl border-secondary-200 bg-white"
                          placeholder="Regular ticket"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Price
                        </label>
                          <Input
                            type="number"
                            min="0"
                            value={
                              typeof ticket.ticketPrice === "number"
                                ? ticket.ticketPrice
                                : ticket.ticketPrice?.amount ?? 0
                            }
                          onChange={(event) =>
                            handleTicketChange(
                              index,
                              "ticketPrice",
                              event.target.value,
                            )
                          }
                          className="h-11 rounded-xl border-secondary-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Quantity
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={ticket.ticketQuantity}
                          onChange={(event) =>
                            handleTicketChange(
                              index,
                              "ticketQuantity",
                              event.target.value,
                            )
                          }
                          className="h-11 rounded-xl border-secondary-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Visibility
                        </label>
                        <select
                          value={ticket.visibility ?? "public"}
                          onChange={(event) =>
                            handleTicketChange(
                              index,
                              "visibility",
                              event.target.value,
                            )
                          }
                          className="h-11 w-full rounded-xl border border-secondary-200 bg-white px-3 text-sm"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2 xl:col-span-1">
                        <label className="text-sm font-medium text-secondary-700">
                          Type
                        </label>
                        <select
                          value={ticket.actionType ?? "paid"}
                          onChange={(event) =>
                            handleTicketChange(
                              index,
                              "actionType",
                              event.target.value,
                            )
                          }
                          className="h-11 w-full rounded-xl border border-secondary-200 bg-white px-3 text-sm"
                        >
                          <option value="paid">Paid</option>
                          <option value="register">Register</option>
                        </select>
                      </div>
                      <label className="flex min-h-11 items-center gap-3 rounded-xl border border-secondary-200 bg-white px-3 text-sm text-secondary-700 md:col-span-2 xl:col-span-5">
                        <input
                          type="checkbox"
                          checked={!!ticket.transferable}
                          onChange={(event) =>
                            handleTicketChange(
                              index,
                              "transferable",
                              event.target.checked,
                            )
                          }
                        />
                        <span>
                          Allow attendees to transfer this ticket category
                        </span>
                      </label>
                      {ticket.visibility === "private" && (
                        <div className="space-y-2 rounded-xl border border-dashed border-secondary-200 bg-white p-3 md:col-span-2 xl:col-span-5">
                          <p className="text-sm font-medium text-secondary-700">
                            Private Invite Link
                          </p>
                          <p className="break-all text-xs text-secondary-500">
                            /explore/event/{id}/ticket?access=
                            {ticket.privateAccessCode || "generated-after-save"}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl border-secondary-200"
                            onClick={() => handleCopyPrivateTicketLink(ticket)}
                          >
                            Copy Private Link
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-950">
                    Access Passes
                  </p>
                  <p className="text-sm text-secondary-500">
                    View saved passes, add more, and control pass transfer settings.
                  </p>
                  <p className="mt-1 text-xs text-secondary-400">
                    Invite emails are sent from Turnupz after the event is published.
                    Draft saves will not email assignees.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-secondary-200"
                  onClick={() =>
                    setPassAssignments((current) => [...current, createEmptyPass()])
                  }
                >
                  <Plus className="size-4" />
                  Add Pass
                </Button>
              </div>

              <div className="space-y-4">
                {passAssignments.length === 0 && (
                  <div className="rounded-[1.3rem] border border-dashed border-secondary-200 px-4 py-5 text-sm text-secondary-500">
                    No access passes yet. Add media, sponsor, worker, or guest passes.
                  </div>
                )}
                {passAssignments.map((pass, index) => (
                  <div
                    key={`pass-${index}`}
                    className="rounded-[1.3rem] bg-secondary-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-secondary-950">
                        Pass {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-secondary-200 bg-white"
                        onClick={() => handleRemovePass(index)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Pass Type
                        </label>
                        <Input
                          value={pass.passName}
                          onChange={(event) =>
                            handlePassChange(index, "passName", event.target.value)
                          }
                          placeholder="Media pass"
                          className="h-11 rounded-xl border-secondary-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Quantity
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={pass.quantity}
                          onChange={(event) =>
                            handlePassChange(index, "quantity", event.target.value)
                          }
                          className="h-11 rounded-xl border-secondary-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Assigned Emails
                        </label>
                        <Textarea
                          value={pass.assigneeEmails.join(", ")}
                          onChange={(event) =>
                            handlePassChange(
                              index,
                              "assigneeEmails",
                              event.target.value,
                            )
                          }
                          placeholder="one email per line or separated by commas"
                          className="min-h-24 rounded-[1rem] border-secondary-200 bg-white px-4 py-3"
                        />
                        {pass.assignments?.length ? (
                          <div className="rounded-xl border border-secondary-100 bg-white px-3 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-400">
                              Email delivery
                            </p>
                            <div className="mt-2 space-y-2">
                              {pass.assignments.map((assignment) => (
                                <div
                                  key={assignment.id}
                                  className="flex flex-wrap items-center justify-between gap-2 text-xs"
                                >
                                  <span className="break-all text-secondary-600">
                                    {assignment.email}
                                  </span>
                                  <span className="rounded-full bg-secondary-50 px-2.5 py-1 font-semibold capitalize text-secondary-500">
                                    {assignment.passClaimStatus ?? "invited"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : pass.emailedAssignees?.length ? (
                          <p className="text-xs text-secondary-500">
                            Emails sent to {pass.emailedAssignees.join(", ")}.
                          </p>
                        ) : (
                          <p className="text-xs text-secondary-400">
                            New assignees will receive pass emails when this event is
                            published.
                          </p>
                        )}
                      </div>
                      <label className="flex min-h-11 items-center gap-3 rounded-xl border border-secondary-200 bg-white px-3 text-sm text-secondary-700 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={!!pass.transferable}
                          onChange={(event) =>
                            handlePassChange(
                              index,
                              "transferable",
                              event.target.checked,
                            )
                          }
                        />
                        <span>Allow recipients to transfer these passes</span>
                      </label>
                    </div>
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-950">
                    Blog Posts
                  </p>
                  <p className="text-sm text-secondary-500">
                    Publish event updates, announcements, and stories.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-secondary-200"
                  onClick={() =>
                    setBlogPosts((current) => [...current, createEmptyBlogPost()])
                  }
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-4">
                {blogPosts.length === 0 && (
                  <div className="rounded-[1.3rem] border border-dashed border-secondary-200 px-4 py-5 text-sm text-secondary-500">
                    No blog posts yet. Add one to keep attendees updated.
                  </div>
                )}
                {blogPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="space-y-4 rounded-[1.3rem] bg-secondary-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-secondary-950">
                        Blog Post {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-secondary-200 bg-white"
                        onClick={() => handleRemoveBlogPost(index)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Title
                        </label>
                        <Input
                          value={post.title}
                          onChange={(event) =>
                            handleBlogPostChange(index, "title", event.target.value)
                          }
                          className="h-11 rounded-xl border-secondary-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Excerpt
                        </label>
                        <Input
                          value={post.excerpt ?? ""}
                          onChange={(event) =>
                            handleBlogPostChange(index, "excerpt", event.target.value)
                          }
                          className="h-11 rounded-xl border-secondary-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Details
                        </label>
                        <Textarea
                          value={post.body}
                          onChange={(event) =>
                            handleBlogPostChange(index, "body", event.target.value)
                          }
                          className="min-h-44 rounded-[1rem] border-secondary-200 bg-white px-4 py-3"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Add Existing Image
                        </label>
                        <select
                          value=""
                          onChange={(event) =>
                            handleBlogExistingImageAdd(index, event.target.value)
                          }
                          className="h-11 w-full rounded-xl border border-secondary-200 bg-white px-3 text-sm"
                        >
                          <option value="">Choose an image</option>
                          {availableImageOptions.map((image, imageIndex) => (
                            <option key={`${image}-${imageIndex}`} value={image}>
                              Image {imageIndex + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">
                          Upload Blog Images
                        </label>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          className="h-11 rounded-xl border-secondary-200 bg-white"
                          onChange={(event) => {
                            handleBlogImageUploads(index, event.target.files);
                            event.currentTarget.value = "";
                          }}
                        />
                      </div>
                    </div>
                    {!!post.images?.length && (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {post.images.map((image, imageIndex) => {
                          const previewUrl = getImagePreviewUrl(image);
                          return (
                            <div
                              key={`${previewUrl}-${imageIndex}`}
                              className="overflow-hidden rounded-[1rem] border border-secondary-100 bg-white"
                            >
                              <div
                                className="h-36 bg-cover bg-center"
                                style={{ backgroundImage: `url(${previewUrl})` }}
                              />
                              <div className="flex items-center justify-between gap-2 p-3">
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-400">
                                  Image {imageIndex + 1}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 rounded-xl border-secondary-200 bg-white px-3 text-xs"
                                  onClick={() =>
                                    handleRemoveBlogImage(index, imageIndex)
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-950">
                    Sponsors
                  </p>
                  <p className="text-sm text-secondary-500">
                    Edit sponsor names and optional sponsor images.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-secondary-200"
                  onClick={() => {
                    setSponsors((current) => [...current, ""]);
                    setSponsorImages((current) => [...current, ""]);
                  }}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {sponsors.length === 0 && (
                  <div className="rounded-[1.3rem] border border-dashed border-secondary-200 px-4 py-5 text-sm text-secondary-500">
                    No sponsors yet.
                  </div>
                )}
                {sponsors.map((sponsor, index) => (
                  <div
                    key={`sponsor-${index}`}
                    className="grid gap-3 rounded-[1.3rem] bg-secondary-50 p-4 md:grid-cols-[1fr_auto]"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={sponsor}
                        onChange={(event) =>
                          setSponsors((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            ),
                          )
                        }
                        placeholder="Sponsor name"
                        className="h-11 rounded-xl border-secondary-200 bg-white"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        className="h-11 rounded-xl border-secondary-200 bg-white"
                        onChange={(event) => {
                          handleSponsorImageUpload(index, event.target.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-secondary-200 bg-white"
                      onClick={() => {
                        setSponsors((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        );
                        setSponsorImages((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        );
                      }}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                    {sponsorImages[index] && (
                      <div
                        className="flex h-24 items-center justify-center rounded-[1rem] border border-secondary-100 bg-white bg-contain bg-center bg-no-repeat md:col-span-2"
                        style={{
                          backgroundImage: `url(${sponsorImages[index]})`,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
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
      </section>
    </div>
  );
};

export default memo(VendorEventEdit);
