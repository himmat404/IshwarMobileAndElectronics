import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/middleware';

// GET - List products (Public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const inStock = searchParams.get('inStock');
    
    let query: any = {};
    
    if (modelId) {
      query.modelId = modelId;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (inStock === 'true') {
      query.stockQuantity = { $gt: 0 };
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const products = await Product.find(query)
      .populate({
        path: 'modelId',
        populate: {
          path: 'brandId',
          select: 'name logo'
        }
      })
      .sort({ name: 1 });
    
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    await connectDB();
    
    const data = await request.json();
    const {
      name,
      modelId,
      type,
      material,
      color,
      price,
      images,
      description,
      stockQuantity,
      sku,
    } = data;
    
    if (!name || !modelId || !type || !price || !sku) {
      return NextResponse.json(
        { error: 'Required fields: name, modelId, type, price, sku' },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check if SKU already exists
    const existingSKU = await Product.findOne({ sku });
    if (existingSKU) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      );
    }
    
    const product = await Product.create({
      name,
      slug,
      modelId,
      type,
      material,
      color,
      price,
      images: images || [],
      description,
      stockQuantity: stockQuantity || 0,
      sku,
    });
    
    // Populate related data
    await product.populate({
      path: 'modelId',
      populate: {
        path: 'brandId',
        select: 'name logo'
      }
    });
    
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}