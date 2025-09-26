import { fixExistingPcMacAddresses } from '@/lib/actions';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await fixExistingPcMacAddresses();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}