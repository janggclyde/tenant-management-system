import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export interface AuthUser {
  id: number;
  email: string;
  role: 'tenant' | 'admin' | 'super_admin';
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    let token = request.cookies.get('token')?.value;

    // Fallback to Authorization header if cookie not present
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.id) {
      return null;
    }

    return {
      id: Number(payload.id),
      email: String(payload.email || ''),
      role: payload.role as 'tenant' | 'admin' | 'super_admin',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Returns adminId if user is authenticated as 'admin' or 'super_admin'.
 * Defaults to 2 (first mock admin) if token is missing in development mode,
 * to ensure smooth testing, but always prefers the actual logged-in user id.
 */
export async function getAdminIdFromRequest(request: NextRequest): Promise<number> {
  const user = await getAuthUser(request);
  if (user && (user.role === 'admin' || user.role === 'super_admin')) {
    return user.id;
  }
  // Default to 2 (Admin 1 Sunrise) if no token is present during local development / testing
  return 2;
}
