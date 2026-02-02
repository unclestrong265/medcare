import { supabase } from "./supabase";

type UploadInput = {
  bucket: string;
  path: string;
  file: Blob;
  contentType?: string;
  upsert?: boolean;
};

export async function uploadToStorage({
  bucket,
  path,
  file,
  contentType,
  upsert = true,
}: UploadInput) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert,
  });
  if (error) {
    throw error;
  }
  return data;
}

export function getPublicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
