import { postData } from "@/api";
import { TAttachment, TAttachmentPurpose } from "@/lib/types";

/**
 * Stores a file and returns the attachment that represents it. Send the returned id
 * on whichever field should use the file, rather than posting the file itself.
 */
export const uploadAttachment = async (
  file: File,
  purpose?: TAttachmentPurpose,
): Promise<TAttachment> => {
  const formData = new FormData();
  formData.append("file", file);
  if (purpose) {
    formData.append("purpose", purpose);
  }

  const { data } = await postData<FormData, TAttachment>(
    "/attachment",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data.data;
};

/** Uploads several files, keeping the order they were given in. */
export const uploadAttachments = async (
  files: File[],
  purpose?: TAttachmentPurpose,
): Promise<TAttachment[]> => {
  if (!files.length) {
    return [];
  }
  return Promise.all(files.map((file) => uploadAttachment(file, purpose)));
};

/**
 * Uploads whichever entries are files and leaves the rest alone, so a form that
 * mixes newly picked files with images already on the record can be sent as one
 * list of ids and urls.
 */
export const uploadNewAttachments = async (
  items: (string | File)[],
  purpose?: TAttachmentPurpose,
): Promise<{ ids: string[]; urls: string[] }> => {
  const files = items.filter((item): item is File => item instanceof File);
  const urls = items.filter((item): item is string => typeof item === "string");
  const uploaded = await uploadAttachments(files, purpose);

  return { ids: uploaded.map((attachment) => attachment.id), urls };
};
