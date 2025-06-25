import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    openAILength: process.env.OPENAI_API_KEY?.length,
    allEnvKeys: Object.keys(process.env).filter(key => !key.includes('PASSWORD') && !key.includes('SECRET')),
    workingDir: process.cwd(),
  });
} 