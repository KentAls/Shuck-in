import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name for team media
export const MEDIA_BUCKET = 'team-media';

// Get public URL for a file in storage
export function getStorageUrl(path: string): string {
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Upload file to storage
export async function uploadToStorage(
  file: Buffer,
  path: string,
  contentType: string
): Promise<{ url: string; error: Error | null }> {
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, {
      contentType,
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    });

  if (error) {
    return { url: '', error };
  }

  return { url: getStorageUrl(data.path), error: null };
}

// Delete file from storage
export async function deleteFromStorage(path: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove([path]);

  return { error };
}

// Extract storage path from URL
export function getStoragePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // URL format: https://[project].supabase.co/storage/v1/object/public/team-media/[path]
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/team-media\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
