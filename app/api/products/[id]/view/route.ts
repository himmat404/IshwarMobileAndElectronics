// File: app/api/products/[id]/view/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';

// POST - Increment view count (Public endpoint)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    // ✅ Increment view count atomically
    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } }, // Increment by 1
      { new: true, select: 'viewCount' } // Only return viewCount
    );
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      viewCount: product.viewCount,
      success: true 
    });
  } catch (error) {
    console.error('Increment view count error:', error);
    // Don't fail the request if view count update fails
    return NextResponse.json(
      { error: 'Failed to update view count', viewCount: 0 },
      { status: 500 }
    );
  }
}