export type JwtPayload = Record<string, unknown>;

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
      .join(''),
  );
}

export function decodeJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getJwtRole(payload: JwtPayload | null): string | null {
  if (!payload) return null;

  const possibleKeys = [
    'role',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  ];

  for (const key of possibleKeys) {
    const value = payload[key];
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0];
  }

  return null;
}

export function getJwtUserId(payload: JwtPayload | null): string | null {
  if (!payload) return null;
  const possibleKeys = [
    'sub',
    'userId',
    'nameid',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  ];
  for (const key of possibleKeys) {
    const value = payload[key];
    if (typeof value === 'string') return value;
  }
  return null;
}
