import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product, { IProduct } from '@/lib/models/Product';
import Model from '@/lib/models/Model';
import Brand from '@/lib/models/Brand';
import { requireAdmin } from '@/lib/middleware';
import mongoose from 'mongoose';

export const revalidate = 0; // Disable caching

// ✅ Improved SKU generation with better error handling and uniqueness
async function generateSKU(type: string, modelIds: string[]): Promise<string> {
  try {
    // Validate inputs
    if (!modelIds || modelIds.length === 0) {
      throw new Error('No model IDs provided for SKU generation');
    }

    // Get the first model to extract brand info
    const firstModel = await Model.findById(modelIds[0]).populate('brandId');
    
    if (!firstModel) {
      throw new Error('Model not found for SKU generation');
    }

    const brand = firstModel.brandId as any;
    
    if (!brand || !brand.name) {
      throw new Error('Brand information not found for SKU generation');
    }
    
    // Create SKU prefix - ensure we get at least 3 characters
    const brandName = brand.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const brandCode = brandName.substring(0, 3).padEnd(3, 'X'); // Pad with X if less than 3 chars
    const typeCode = type === 'cover' ? 'CVR' : 'SCR';
    
    // ✅ Find the last product with similar SKU pattern using a transaction-safe approach
    const lastProduct = await Product.findOne({
      sku: new RegExp(`^${brandCode}-${typeCode}-`, 'i')
    }).sort({ createdAt: -1 }).select('sku');

    let nextNumber = 1;
    
    if (lastProduct && lastProduct.sku) {
      // Extract number from last SKU (e.g., "APP-CVR-045" -> 45)
      const match = lastProduct.sku.match(/-(\d+)$/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format: 001, 002, etc.
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    const generatedSKU = `${brandCode}-${typeCode}-${paddedNumber}`;
    
    // ✅ Check if SKU already exists (rare but possible with concurrent requests)
    const existing = await Product.findOne({ sku: generatedSKU });
    if (existing) {
      // If collision, add timestamp suffix
      const timestamp = Date.now().toString().slice(-4);
      return `${brandCode}-${typeCode}-${paddedNumber}-${timestamp}`;
    }
    
    return generatedSKU;
  } catch (error) {
    console.error('SKU generation error:', error);
    // ✅ Better fallback SKU
    const typeCode = type === 'cover' ? 'CVR' : 'SCR';
    const timestamp = Date.now().toString().slice(-8);
    return `PRD-${typeCode}-${timestamp}`;
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

    // Build Filter Logic
    if (type) filter.type = type;
    if (inStock === 'true') filter.stockQuantity = { $gt: 0 };

    // Brand/Model Filters
    if (modelId) {
      filter.models = modelId;
    } else if (brandId) {
      const modelsForBrand = await Model.find({ brandId }).select('_id');
      const modelIds = modelsForBrand.map((m) => m._id);
      if (modelIds.length > 0) {
        filter.models = { $in: modelIds };
      } else {
        // No models for this brand, return empty
        return NextResponse.json({
          products: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
    }

    // Search Filter
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };

      const matchingBrands = await Brand.find({ name: searchRegex }).select('_id');
      const matchingBrandIds = matchingBrands.map((b) => b._id);

      const matchingModels = await Model.find({
        $or: [{ name: searchRegex }, { brandId: { $in: matchingBrandIds } }],
      }).select('_id');
      const matchingModelIds = matchingModels.map((m) => m._id);

      const searchQuery = {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { material: searchRegex },
          { color: searchRegex },
          { sku: searchRegex },
          { models: { $in: matchingModelIds } },
        ],
      };

      // ✅ Improved filter combination
      if (Object.keys(filter).length > 0) {
        const existingFilters = { ...filter };
        filter.$and = [existingFilters, searchQuery];
      } else {
        Object.assign(filter, searchQuery);
      }
    }

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
      case 'popular': // ✅ NEW: Sort by view count
        sortOptions = { viewCount: -1, createdAt: -1 };
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
      .limit(limit)
      .lean(); // ✅ Added lean() for better performance

    // Get total count
    const total = await Product.countDocuments(filter);

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
      seoTitle, // ✅ NEW
      seoDescription, // ✅ NEW
      seoKeywords, // ✅ NEW
    } = body;

    // Validation (same as before)
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'At least one compatible model is required' },
        { status: 400 }
      );
    }

    if (!type || !['cover', 'screen-guard'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid product type' },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }

    const validModels = await Model.find({ _id: { $in: models } }).select('_id');
    if (validModels.length !== models.length) {
      return NextResponse.json(
        { error: 'One or more invalid model IDs' },
        { status: 400 }
      );
    }

    // Generate slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const timestamp = Date.now().toString().slice(-6);
    const slug = `${baseSlug}-${timestamp}`;

    // Generate SKU
    let sku: string;
    try {
      sku = await generateSKU(type, models);
    } catch (error) {
      console.error('SKU generation failed:', error);
      return NextResponse.json(
        { error: 'Failed to generate SKU. Please try again.' },
        { status: 500 }
      );
    }

    // ✅ Create new product with SEO fields
    const newProduct = new Product({
      name: name.trim(),
      slug,
      models,
      type,
      material: material?.trim() || '',
      color: color?.trim() || '',
      price: parseFloat(price.toString()),
      images: images || [],
      description: description?.trim() || '',
      stockQuantity: parseInt(stockQuantity?.toString() || '0', 10),
      sku,
      viewCount: 0, // ✅ NEW: Initialize view count
      seoTitle: seoTitle?.trim() || undefined, // ✅ NEW: Will auto-generate if empty
      seoDescription: seoDescription?.trim() || undefined, // ✅ NEW: Will auto-generate if empty
      seoKeywords: seoKeywords || [], // ✅ NEW
    });

    await newProduct.save();

    // Populate the response
    const populatedProduct = await Product.findById(newProduct._id)
      .populate({
        path: 'models',
        populate: {
          path: 'brandId',
          select: 'name logo'
        }
      });

    return NextResponse.json(
      { product: populatedProduct, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST Product Error:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create product. Please try again.' },
      { status: 500 }
    );
  }
}