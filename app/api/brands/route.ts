import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Brand from '@/lib/models/Brand';
import { requireAdmin } from '@/lib/middleware';

// GET - List all brands (Public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let query = {};
    
    if (search) {
      query = { $text: { $search: search } };
    }
    
    const brands = await Brand.find(query).sort({ name: 1 });
    
    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Get brands error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}

// POST - Create new brand (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    await connectDB();
    
    const data = await request.json();
    const { name, logo, description } = data;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check if brand already exists
    const existingBrand = await Brand.findOne({ slug });
    if (existingBrand) {
      return NextResponse.json(
        { error: 'Brand already exists' },
        { status: 400 }
      );
    }
    
    const brand = await Brand.create({
      name,
      slug,
      logo,
      description,
    });
    
    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error('Create brand error:', error);
    return NextResponse.json(
      { error: 'Failed to create brand' },
      { status: 500 }
    );
  }
}