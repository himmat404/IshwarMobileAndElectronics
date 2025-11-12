import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, JWTPayload } from './auth';

export async function requireAuth(request: NextRequest): Promise<JWTPayload | NextResponse> {
  const user = await authenticateRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<JWTPayload | NextResponse> {
  const user = await authenticateRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }
  
  return user;
}