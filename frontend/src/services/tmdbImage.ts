const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export function posterUrl(
  path: string | null,
  size: 'w200' | 'w342' | 'w500' = 'w500',
): string | null {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
}

export function backdropUrl(
  path: string | null,
  size: 'w780' | 'original' = 'original',
): string | null {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
}

export function profileUrl(path: string | null, size: 'w185' = 'w185'): string | null {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
}
