import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function authenticateUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }
  const decoded = verifyToken(token);
  return decoded;
}

export async function requireAuth(request) {
  const user = await authenticateUser(request);
  if (!user) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }
  return { user };
}

export async function requireAdmin(request) {
  const { user, error } = await requireAuth(request);
  if (error) return { error };
  if (user.role !== 'admin') {
    return { error: NextResponse.json({ message: 'Forbidden - Admin only' }, { status: 403 }) };
  }
  return { user };
}

export async function requireStaff(request) {
  const { user, error } = await requireAuth(request);
  if (error) return { error };
  if (user.role !== 'staff') {
    return { error: NextResponse.json({ message: 'Forbidden - Staff only' }, { status: 403 }) };
  }
  return { user };
}

export async function requireStaffOrAdmin(request) {
  const { user, error } = await requireAuth(request);
  if (error) return { error };
  if (user.role !== 'staff' && user.role !== 'admin') {
    return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
  }
  return { user };
}
