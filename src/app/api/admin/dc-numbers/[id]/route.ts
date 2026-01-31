import { NextRequest, NextResponse } from 'next/server';
import { deleteDcNumber, getAllDcNumbers, checkDcPartcodeCombinationExists } from '@/lib/pg-db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dcNumberId = params.id;
    
    // Check if this DC Number has any associated records
    // For now, we'll check if there are any records with this DC Number
    // In a real implementation, you'd want to check the actual dc_number column
    const dcNumbers = await getAllDcNumbers();
    const dcNumberObj = dcNumbers.find(dc => dc.id?.toString() === dcNumberId);
    
    if (dcNumberObj) {
      const hasRecords = await checkDcPartcodeCombinationExists(dcNumberObj.dcNumber, '');
      if (hasRecords) {
        return NextResponse.json(
          { error: 'Cannot delete DC Number: It has associated records' },
          { status: 400 }
        );
      }
    }

    const success = await deleteDcNumber(dcNumberObj?.dcNumber || '');
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete DC Number' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting DC number:', error);
    return NextResponse.json(
      { error: 'Failed to delete DC Number' },
      { status: 500 }
    );
  }
}