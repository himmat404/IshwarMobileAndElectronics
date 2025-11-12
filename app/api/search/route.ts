import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Brand from '@/lib/models/Brand';
import Model from '@/lib/models/Model';
import Product from '@/lib/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'brands', 'models', 'products', or 'all'
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    const results: any = {
      brands: [],
      models: [],
      products: [],
    };
    
    // Search brands
    if (!type || type === 'all' || type === 'brands') {
      results.brands = await Brand.find({
        $text: { $search: query }
      }).limit(10);
    }
    
    // Search models
    if (!type || type === 'all' || type === 'models') {
      results.models = await Model.find({
        $text: { $search: query }
      })
        .populate('brandId', 'name logo')
        .limit(10);
    }
    
    // Search products
    if (!type || type === 'all' || type === 'products') {
      results.products = await Product.find({
        $text: { $search: query }
      })
        .populate({
          path: 'modelId',
          populate: {
            path: 'brandId',
            select: 'name logo'
          }
        })
        .limit(10);
    }
    
    // Calculate total results
    const totalResults = results.brands.length + results.models.length + results.products.length;
    
    return NextResponse.json({
      query,
      totalResults,
      results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}