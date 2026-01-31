import { NextRequest, NextResponse } from 'next/server';
import { getAllDcNumbers, addDcNumber, deleteDcNumber, updateDcNumberPartCodes } from '@/lib/pg-db';

export async function GET() {
  try {
    const dcNumbers = await getAllDcNumbers();
    return NextResponse.json({ dcNumbers });
  } catch (error) {
    console.error('Error fetching DC numbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DC numbers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { dcNumber } = await request.json();
    
    if (!dcNumber) {
      return NextResponse.json(
        { error: 'DC Number is required' },
        { status: 400 }
      );
    }

    const success = await addDcNumber(dcNumber, []);
    
    if (success) {
      const dcNumbers = await getAllDcNumbers();
      return NextResponse.json({ dcNumbers });
    } else {
      return NextResponse.json(
        { error: 'Failed to create DC Number' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating DC number:', error);
    return NextResponse.json(
      { error: 'Failed to create DC Number' },
      { status: 500 }
    );
  }
}