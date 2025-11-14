import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Progressive analysis endpoint
 * Returns analysis results as they complete
 */
export async function POST(req: NextRequest) {
  try {
    const { analysisId } = await req.json();
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Missing analysisId' }, { status: 400 });
    }

    // Load the saved analysis
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, `${analysisId}.json`);
    
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    // Check if full analysis exists
    if (data.fullAnalysis) {
      return NextResponse.json({
        status: 'complete',
        data: data.fullAnalysis,
      });
    }

    // Check if analysis is in progress
    if (data.analysisStatus) {
      return NextResponse.json({
        status: 'processing',
        progress: data.analysisStatus,
      });
    }

    // Start analysis if not started
    return NextResponse.json({
      status: 'pending',
      message: 'Analysis not started',
    });
  } catch (error) {
    console.error('Progressive analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to get analysis status' },
      { status: 500 }
    );
  }
}
