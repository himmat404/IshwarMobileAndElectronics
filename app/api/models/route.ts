import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Model from '@/lib/models/Model';
import { requireAdmin } from '@/lib/middleware';

// GET - List models (Public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const search = searchParams.get('search');
    
    let query: any = {};
    
    if (brandId) {
      query.brandId = brandId;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const models = await Model.find(query)
      .populate('brandId', 'name logo')
      .sort({ name: 1 });
    
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

// POST - Create new model (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    await connectDB();
    
    const data = await request.json();
    const { name, brandId, image, releaseYear, specifications } = data;
    
    if (!name || !brandId) {
      return NextResponse.json(
        { error: 'Model name and brand are required' },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check if model already exists for this brand
    const existingModel = await Model.findOne({ brandId, slug });
    if (existingModel) {
      return NextResponse.json(
        { error: 'Model already exists for this brand' },
        { status: 400 }
      );
    }
    
    const model = await Model.create({
      name,
      slug,
      brandId,
      image,
      releaseYear,
      specifications,
    });
    
    // Populate brand info
    await model.populate('brandId', 'name logo');
    
    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    console.error('Create model error:', error);
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    );
  }
}