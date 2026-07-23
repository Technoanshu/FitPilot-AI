import { supabase } from "@/lib/supabase/client";

export const MEMBER_AVATARS_BUCKET = "member-avatars";

export async function uploadMemberAvatar(file: File, memberId: string): Promise<string> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("You must be signed in to upload an avatar.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userData.user.id}/${memberId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(MEMBER_AVATARS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function createMemberAvatarUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(MEMBER_AVATARS_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteMemberAvatar(path: string): Promise<void> {
  const { error } = await supabase.storage.from(MEMBER_AVATARS_BUCKET).remove([path]);
  if (error) throw error;
}