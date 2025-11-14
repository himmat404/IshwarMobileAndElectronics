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

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length > 200) {
      return NextResponse.json(
        { error: 'Search query is too long' },
        { status: 400 }
      );
    }

    const results: any = { brands: [], models: [], products: [] };

    // Escape special regex characters
    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedQuery, 'i');
    
    // Search brands
    try {
      results.brands = await Brand.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      })
        .limit(10)
        .lean()
        .exec();
    } catch (err) {
      console.error('Brand search error:', err);
      results.brands = [];
    }

    // Search models
    try {
      results.models = await Model.find({
        $or: [
          { name: searchRegex },
          { specifications: searchRegex }
        ]
      })
        .populate('brandId', 'name logo')
        .limit(10)
        .lean()
        .exec();
    } catch (err) {
      console.error('Model search error:', err);
      results.models = [];
    }

    // Search products
    try {
      results.products = await Product.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { material: searchRegex },
          { color: searchRegex },
          { sku: searchRegex }
        ]
      })
        .populate({
          path: 'models',
          populate: { 
            path: 'brandId', 
            select: 'name logo'
          }
        })
        .limit(10)
        .lean()
        .exec();
    } catch (err) {
      console.error('Product search error:', err);
      results.products = [];
    }

    const totalResults =
      results.brands.length +
      results.models.length +
      results.products.length;

    return NextResponse.json({
      query: trimmedQuery,
      totalResults,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed. Please try again.' },
      { status: 500 }
    );
  }
}