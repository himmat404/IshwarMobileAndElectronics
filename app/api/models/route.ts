import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Model from '@/lib/models/Model';
import { requireAdmin } from '@/lib/middleware';

export const revalidate = 0; // Disable caching for real-time data

// GET - List models with advanced filtering, search, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Filters
    const brandId = searchParams.get('brandId');
    const search = searchParams.get('search');
    const yearFrom = searchParams.get('yearFrom');
    const yearTo = searchParams.get('yearTo');
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'name-asc';
    
    // Build query
    let query: any = {};
    
    // Brand filter
    if (brandId) {
      query.brandId = brandId;
    }
    
    // Release year range filter
    if (yearFrom || yearTo) {
      query.releaseYear = {};
      if (yearFrom) query.releaseYear.$gte = parseInt(yearFrom);
      if (yearTo) query.releaseYear.$lte = parseInt(yearTo);
    }
    
    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specifications: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Build sort object
    let sortObj: any = {};
    switch (sortBy) {
      case 'name-asc':
        sortObj = { name: 1 };
        break;
      case 'name-desc':
        sortObj = { name: -1 };
        break;
      case 'date-newest':
        sortObj = { createdAt: -1 };
        break;
      case 'date-oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'year-newest':
        sortObj = { releaseYear: -1, name: 1 };
        break;
      case 'year-oldest':
        sortObj = { releaseYear: 1, name: 1 };
        break;
      default:
        sortObj = { name: 1 };
    }
    
    // Get total count for pagination
    const total = await Model.countDocuments(query);
    
    // Fetch models with pagination
    const models = await Model.find(query)
      .populate('brandId', 'name logo')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();
    
    return NextResponse.json({ 
      models,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
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
        { error: 'Required fields: name, brandId' },
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