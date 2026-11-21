import { deleteData, getData, patchData, postData } from "@/api";
import { uploadAttachment } from "@/api/attachments";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Mirrors the backend's limits (highlights.rules.ts). */
export const HIGHLIGHT_LIMITS = {
  organiser: 20,
  perAttendee: 10,
  clipSeconds: 30,
  /** The upload size limit for one file, in MB. */
  fileMb: 10,
} as const;

export interface IHighlight {
  id: string;
  url: string;
  type: "image" | "video";
  caption: string | null;
  /** "@amaka.o", or "Someone who was there"; null for the organiser's own. */
  by: string | null;
  durationSeconds: number | null;
  isCover: boolean;
  fromOrganiser: boolean;
  status: "pending" | "approved" | "declined";
  createdAt: string;
  /** Fans' photos: the post it belongs to, and whether it's the viewer's own. */
  postId?: string;
  mine?: boolean;
}

export interface IEventHighlights {
  over: boolean;
  recap: string | null;
  /** "800+", when the organiser shows it. */
  attendance: string | null;
  crowdOpen: boolean;
  organiser: IHighlight[];
  crowd: IHighlight[];
  /** Signed in only. */
  me: { holdsTicket: boolean; canAdd: boolean; remaining: number; pending: number } | null;
}

export interface IManagedHighlight extends IHighlight {
  checkedIn: boolean;
  reports: number;
}

export interface IManageHighlights {
  over: boolean;
  crowdOpen: boolean;
  crowdOpenUntil: string;
  settings: { recap: string | null; showAttendance: boolean; crowdPhotosOpen: boolean };
  counts: { organiser: number; organiserLimit: number; pending: number; approved: number; declined: number };
  items: IManagedHighlight[];
}

const publicKey = (eventId: string) => ["event-highlights", eventId];
const manageKey = (eventId: string) => ["event-highlights", eventId, "manage"];

/** What the event page shows once the event is over. */
export const useEventHighlights = (eventId: string, enabled = true) =>
  useQuery({
    queryKey: publicKey(eventId),
    queryFn: async () => (await getData<IEventHighlights>(`/event/${eventId}/highlights`)).data?.data ?? null,
    enabled: !!eventId && enabled,
    retry: false,
  });

/** The organiser's view: their photos and ticket holders' posts (showing and taken off). */
export const useManageHighlights = (eventId: string, enabled = true) =>
  useQuery({
    queryKey: manageKey(eventId),
    queryFn: async () => (await getData<IManageHighlights>(`/event/${eventId}/highlights/manage`)).data?.data ?? null,
    enabled: !!eventId && enabled,
    retry: false,
  });

/** A clip's length in whole seconds, read from the file itself. */
export const videoSeconds = (file: File) =>
  new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.max(1, Math.round(video.duration)));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that clip."));
    };
    video.src = url;
  });

/**
 * Checks and uploads picked files: photos and clips up to 30 seconds and
 * 10 MB. Returns the items to send, or throws a message to show.
 */
export const uploadHighlightFiles = async (files: File[]) => {
  const items: { attachmentId: string; durationSeconds?: number }[] = [];
  for (const file of files) {
    const isVideo = file.type.startsWith("video/");
    if (!isVideo && !file.type.startsWith("image/")) throw new Error(`${file.name} isn't a photo or video.`);
    if (file.size > HIGHLIGHT_LIMITS.fileMb * 1024 * 1024) {
      throw new Error(`${file.name} is over ${HIGHLIGHT_LIMITS.fileMb} MB.`);
    }
    const durationSeconds = isVideo ? await videoSeconds(file) : undefined;
    if (durationSeconds && durationSeconds > HIGHLIGHT_LIMITS.clipSeconds) {
      throw new Error(`${file.name} is ${durationSeconds} seconds. Clips can be up to ${HIGHLIGHT_LIMITS.clipSeconds}.`);
    }
    const attachment = await uploadAttachment(file, "EVENT_MEDIA");
    items.push({ attachmentId: attachment.id, ...(durationSeconds ? { durationSeconds } : {}) });
  }
  return items;
};

const useRefresh = (eventId: string) => {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: publicKey(eventId) });
};

/** A ticket holder posts their photos to the event (they show straight away). */
export const useSendCrowdPhotos = (eventId: string) => {
  const refresh = useRefresh(eventId);
  return useMutation({
    mutationFn: async (body: { files: File[]; caption: string; showName: boolean }) =>
      postData(`/event/${eventId}/highlights/crowd`, {
        items: await uploadHighlightFiles(body.files),
        caption: body.caption.trim() || undefined,
        showName: body.showName,
        consent: true,
      }),
    onSuccess: refresh,
  });
};

/** The organiser posts their photos and clips. */
export const usePostHighlights = (eventId: string) => {
  const refresh = useRefresh(eventId);
  return useMutation({
    mutationFn: async (body: { files: File[]; notifyHolders: boolean }) =>
      postData(`/event/${eventId}/highlights`, {
        items: await uploadHighlightFiles(body.files),
        notifyHolders: body.notifyHolders,
      }),
    onSuccess: refresh,
  });
};

export const useHighlightSettings = (eventId: string) => {
  const refresh = useRefresh(eventId);
  return useMutation({
    mutationFn: (body: Partial<IManageHighlights["settings"]>) =>
      patchData(`/event/${eventId}/highlights/settings`, body),
    onSuccess: refresh,
  });
};

export const useReviewHighlight = (eventId: string) => {
  const refresh = useRefresh(eventId);
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: "approved" | "declined"; isCover?: boolean }) =>
      patchData(`/event/${eventId}/highlights/${id}`, body),
    onSuccess: refresh,
  });
};

export const useRemoveHighlight = (eventId: string) => {
  const refresh = useRefresh(eventId);
  return useMutation({
    mutationFn: (id: string) => deleteData(`/event/${eventId}/highlights/${id}`),
    onSuccess: refresh,
  });
};

export const useReportHighlight = (eventId: string) =>
  useMutation({
    mutationFn: (id: string) => postData(`/event/${eventId}/highlights/${id}/report`, {}),
  });
