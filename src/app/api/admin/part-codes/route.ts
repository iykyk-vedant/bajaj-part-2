import { NextRequest, NextResponse } from 'next/server';
import { getAllDcNumbers, updateDcNumberPartCodes } from '@/lib/pg-db';

export async function POST(request: NextRequest) {
  try {
    const { dcNumberId, partCode } = await request.json();
    
    if (!dcNumberId || !partCode) {
      return NextResponse.json(
        { error: 'DC Number ID and Part Code are required' },
        { status: 400 }
      );
    }

    // Get all DC numbers to find the specific one
    const dcNumbers = await getAllDcNumbers();
    const dcNumberObj = dcNumbers.find(dc => dc.id?.toString() === dcNumberId.toString());
    
    if (!dcNumberObj) {
      return NextResponse.json(
        { error: 'DC Number not found' },
        { status: 404 }
      );
    }

    // Add the new part code to the existing array
    const updatedPartCodes = [...(dcNumberObj.partCodes || []), partCode];
    
    const success = await updateDcNumberPartCodes(dcNumberObj.dcNumber, updatedPartCodes);
    
    if (success) {
      const updatedDcNumbers = await getAllDcNumbers();
      return NextResponse.json({ dcNumbers: updatedDcNumbers });
    } else {
      return NextResponse.json(
        { error: 'Failed to add Part Code' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error adding Part Code:', error);
    return NextResponse.json(
      { error: 'Failed to add Part Code' },
      { status: 500 }
    );
  }
}