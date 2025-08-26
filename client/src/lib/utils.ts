import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Static placeholder SVG used when an image URL is not provided
export const placeholderImageData =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9iMjQ0IiB2aWV3Qm94PSIwIDAgNDAwIDI0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTE2MCAxMDBIMjI1VjE0MEhNMTYwVjEwMFoiIGZpbGw9IiNEOUQ5QkIiLz4KPHBhdGggZD0iTTE3NSAxN0gxNzVWMTE1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';

/**
 * Normalizes an object storage path into a publicly served URL.
 *
 * The backend serves files through the `/public-objects` endpoint, so paths
 * returned from uploads (e.g. `/objects/...`) need to be converted. This
 * helper centralizes that logic and also falls back to a placeholder image
 * when no URL is provided.
 */
export function getImageUrl(imageUrl: string): string {
  if (!imageUrl?.trim()) {
    console.log("getImageUrl: Empty or null URL, returning placeholder");
    return placeholderImageData;
  }

  console.log("getImageUrl: Processing URL:", imageUrl);

  // Handle data URLs (base64 encoded images)
  if (imageUrl.startsWith('data:')) {
    console.log("getImageUrl: Data URL detected, returning as-is");
    return imageUrl;
  }

  // Handle external URLs
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log("getImageUrl: External URL detected, returning as-is");
    return imageUrl;
  }

  // Clean up the path - remove leading slashes and normalize
  let cleanUrl = imageUrl.replace(/^\/+/, '');
  console.log("getImageUrl: Cleaned URL:", cleanUrl);

  // Handle object storage paths - try direct object access first
  if (cleanUrl.startsWith('objects/')) {
    // Try the direct objects path first (this should work with proper server setup)
    const directPath = `/${cleanUrl}`;
    console.log("getImageUrl: Using direct objects path:", directPath);
    return directPath;
  }

  // Handle paths that already have public-objects prefix
  if (cleanUrl.startsWith('public-objects/')) {
    console.log("getImageUrl: Already has /public-objects/ prefix");
    return `/${cleanUrl}`;
  }

  // For other relative paths, ensure they start with /
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = `/${cleanUrl}`;
  }

  console.log("getImageUrl: Final URL:", cleanUrl);
  return cleanUrl;
}