import { NextRequest } from 'next/server';
import { getAllEngineers, addEngineer } from '@/lib/pg-db';

export async function GET(request: NextRequest) {
  try {
    const engineers = await getAllEngineers();
    return Response.json({ success: true, data: engineers });
  } catch (error) {
    console.error('Error fetching engineers:', error);
    return Response.json({ success: false, error: 'Failed to fetch engineers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return Response.json({ success: false, error: 'Invalid engineer name' }, { status: 400 });
    }

    const result = await addEngineer(name.trim());
    
    if (result) {
      return Response.json({ success: true, message: 'Engineer added successfully' });
    } else {
      return Response.json({ success: false, error: 'Failed to add engineer' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error adding engineer:', error);
    return Response.json({ success: false, error: 'Failed to add engineer' }, { status: 500 });
  }
}