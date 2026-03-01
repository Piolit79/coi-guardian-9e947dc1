import { supabase } from '@/integrations/supabase/client';

type SignedUrlResult = {
  url: string;
  resolvedPath: string;
};

const STORAGE_PREFIX_REGEX = /^(uploads\/|agreements\/|policies\/)/i;

function toAbsoluteStorageUrl(signedUrl: string): string {
  if (signedUrl.startsWith('http')) return signedUrl;

  const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  if (signedUrl.startsWith('/storage/v1/')) return `${baseUrl}${signedUrl}`;
  if (signedUrl.startsWith('storage/v1/')) return `${baseUrl}/${signedUrl}`;

  return `${baseUrl}/storage/v1${signedUrl.startsWith('/') ? signedUrl : `/${signedUrl}`}`;
}

function getPathCandidates(filePath: string): string[] {
  const normalized = filePath.replace(/^\/+/, '');
  const candidates = [normalized];

  if (!STORAGE_PREFIX_REGEX.test(normalized)) {
    candidates.push(`uploads/coi/${normalized}`);
    candidates.push(`uploads/gl-policies/${normalized}`);
  }

  return [...new Set(candidates)];
}

export async function createSignedFileUrl(
  filePath: string,
  expiresInSeconds = 600,
  bucket = 'certificates'
): Promise<SignedUrlResult> {
  const candidates = getPathCandidates(filePath);
  let lastError: unknown;

  for (const candidate of candidates) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(candidate, expiresInSeconds);

    if (error) {
      lastError = error;
      continue;
    }

    const signed = (data as any)?.signedUrl || (data as any)?.signedURL;
    if (!signed) continue;

    return {
      url: toAbsoluteStorageUrl(signed),
      resolvedPath: candidate,
    };
  }

  throw new Error(
    `Unable to create signed URL for ${filePath}${lastError ? `: ${(lastError as Error)?.message || 'unknown error'}` : ''}`
  );
}
