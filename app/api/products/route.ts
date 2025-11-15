import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product, { IProduct } from '@/lib/models/Product';
import Model from '@/lib/models/Model';
import Brand from '@/lib/models/Brand';
import { requireAdmin } from '@/lib/middleware';
import mongoose from 'mongoose';

export const revalidate = 0; // Disable caching

// Helper function to generate SKU
async function generateSKU(type: string, modelIds: string[]): Promise<string> {
  try {
    // Get the first model to extract brand info
    const firstModel = await Model.findById(modelIds[0]).populate('brandId');
    
    if (!firstModel) {
      throw new Error('Model not found');
    }

    const brand = firstModel.brandId as any;
    
    // Create SKU prefix
    // Format: BRAND-TYPE-NUMBER
    // Example: APP-CVR-001, SAM-SCR-045
    const brandCode = brand.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const typeCode = type === 'cover' ? 'CVR' : 'SCR';
    
    // Find the last product with similar SKU pattern
    const lastProduct = await Product.findOne({
      sku: new RegExp(`^${brandCode}-${typeCode}-`, 'i')
    }).sort({ createdAt: -1 });

    let nextNumber = 1;
    
    if (lastProduct) {
      // Extract number from last SKU (e.g., "APP-CVR-045" -> 45)
      const match = lastProduct.sku.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format: 001, 002, etc.
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    
    return `${brandCode}-${typeCode}-${paddedNumber}`;
  } catch (error) {
    console.error('SKU generation error:', error);
    // Fallback to timestamp-based SKU
    return `PRD-${type.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  }
}

// GET /api/products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Filters
    const modelId = searchParams.get('modelId');
    const brandId = searchParams.get('brandId');
    const type = searchParams.get('type');
    const inStock = searchParams.get('inStock');
    const search = searchParams.get('search');

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'date-newest';

    const filter: any = {};

    // --- Build Filter Logic ---

    // 1. Basic Filters
    if (type) filter.type = type;
    if (inStock === 'true') filter.stockQuantity = { $gt: 0 };

    // 2. Brand/Model Filters
    // If a specific modelId is given, it's the most specific filter.
    if (modelId) {
      filter.models = modelId;
    }
    // If only a brandId is given, find all models for that brand.
    else if (brandId) {
      const modelsForBrand = await Model.find({ brandId }).select('_id');
      const modelIds = modelsForBrand.map((m) => m._id);
      filter.models = { $in: modelIds };
    }

    // 3. Search Filter (Advanced search across products, models, and brands)
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };

      // Find matching Brand and Model IDs
      const matchingBrands = await Brand.find({ name: searchRegex }).select('_id');
      const matchingBrandIds = matchingBrands.map((b) => b._id);

      const matchingModels = await Model.find({
        $or: [{ name: searchRegex }, { brandId: { $in: matchingBrandIds } }],
      }).select('_id');
      const matchingModelIds = matchingModels.map((m) => m._id);

      // Build the final search query
      const searchQuery = {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { material: searchRegex },
          { color: searchRegex },
          { sku: searchRegex },
          { models: { $in: matchingModelIds } }, // Search products linked to matching models/brands
        ],
      };

      // Combine search query with existing filters
      if (Object.keys(filter).length > 0) {
        // Use $and to combine existing filters with the new $or search query
        filter.$and = [
          // Create a copy of the existing filters to avoid mutation issues
          { ...filter },
          searchQuery,
        ];
      } else {
        // If no other filters, the search query is the entire filter
        Object.assign(filter, searchQuery);
      }
    }

    // --- End Filter Logic ---

    // Sorting
    let sortOptions: any = {};
    switch (sortBy) {
      case 'name-asc':
        sortOptions = { name: 1 };
        break;
      case 'name-desc':
        sortOptions = { name: -1 };
        break;
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'date-oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'date-newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Fetch products
    const products = await Product.find(filter)
      .populate({
        path: 'models',
        select: 'name brandId',
        populate: {
          path: 'brandId',
          select: 'name',
        },
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Product.countDocuments(filter);

    // Return with limit included (for frontend pagination UI)
    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET Products Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const body = await request.json();
    const {
      name,
      models,
      type,
      material,
      color,
      price,
      images,
      description,
      stockQuantity,
    } = body;

    // Validation
    if (!name || !models || models.length === 0 || !type || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
      '-' +
      new Date().getTime().toString().slice(-6);

    // ✅ AUTO-GENERATE SKU
    const sku = await generateSKU(type, models);

    // Create new product
    const newProduct = new Product({
      name,
      slug,
      models,
      type,
      material,
      color,
      price,
      images,
      description,
      stockQuantity: stockQuantity || 0,
      sku,
    });

    await newProduct.save();

    return NextResponse.json(
      { product: newProduct, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Product Error:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}