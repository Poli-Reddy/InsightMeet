import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Job status API - Simplified mode (no background jobs)
 * In simplified mode, processing happens synchronously during upload
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Background jobs not available in simplified mode',
    message: 'Processing happens synchronously during upload'
  }, { status: 501 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Background jobs not available in simplified mode' 
  }, { status: 501 });
}
