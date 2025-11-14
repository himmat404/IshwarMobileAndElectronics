import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    await connectDB();
    
    // Get inventory statistics
    const totalProducts = await Product.countDocuments();
    const inStockProducts = await Product.countDocuments({ stockQuantity: { $gt: 0 } });
    const outOfStockProducts = await Product.countDocuments({ stockQuantity: 0 });
    const lowStockProducts = await Product.countDocuments({
      stockQuantity: { $gt: 0, $lte: 5 }
    });
    
    // Get total stock value
    const products = await Product.find();
    const totalStockValue = products.reduce(
      (sum, product) => sum + (product.price * product.stockQuantity),
      0
    );
    
    // Get low stock items
    const lowStockItems = await Product.find({
      stockQuantity: { $gt: 0, $lte: 5 }
    })
      .populate({
        path: 'models',
        populate: {
          path: 'brandId',
          select: 'name'
        }
      })
      .limit(10);
    
    return NextResponse.json({
      summary: {
        totalProducts,
        inStockProducts,
        outOfStockProducts,
        lowStockProducts,
        totalStockValue,
      },
      lowStockItems,
    });
  } catch (error) {
    console.error('Inventory summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory summary' },
      { status: 500 }
    );
  }
}