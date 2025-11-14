import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Model from '@/lib/models/Model';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/middleware';

// GET - Single model with related products count (Public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const model = await Model.findById(id)
      .populate('brandId', 'name logo');
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    // Get count of products using this model
    const productsCount = await Product.countDocuments({ models: id });
    
    return NextResponse.json({ 
      model,
      productsCount 
    });
  } catch (error) {
    console.error('Get model error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model' },
      { status: 500 }
    );
  }
}

// PUT - Update model (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { id } = await params;
    await connectDB();
    
    const data = await request.json();
    const { name, brandId, image, releaseYear, specifications } = data;
    
    const updateData: any = {};
    
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Check if new slug conflicts with existing model for the same brand
      const existingBrandId = brandId || (await Model.findById(id).select('brandId')).brandId;
      const existingModel = await Model.findOne({ 
        brandId: existingBrandId, 
        slug: updateData.slug,
        _id: { $ne: id }
      });
      
      if (existingModel) {
        return NextResponse.json(
          { error: 'Model with this name already exists for this brand' },
          { status: 400 }
        );
      }
    }
    
    if (brandId) {
      // Check if model with same slug exists for new brand
      const currentModel = await Model.findById(id);
      const slugToCheck = updateData.slug || currentModel?.slug;
      
      const existingModel = await Model.findOne({ 
        brandId, 
        slug: slugToCheck,
        _id: { $ne: id }
      });
      
      if (existingModel) {
        return NextResponse.json(
          { error: 'Model with this name already exists for the target brand' },
          { status: 400 }
        );
      }
      
      updateData.brandId = brandId;
    }
    
    if (image !== undefined) updateData.image = image;
    if (releaseYear !== undefined) updateData.releaseYear = releaseYear;
    if (specifications !== undefined) updateData.specifications = specifications;
    
    const model = await Model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('brandId', 'name logo');
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ model });
  } catch (error) {
    console.error('Update model error:', error);
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    );
  }
}

// DELETE - Delete model (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { id } = await params;
    await connectDB();
    
    // Check if model is used in any products
    const productsCount = await Product.countDocuments({ models: id });
    
    if (productsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete model. It is used in ${productsCount} product(s)` },
        { status: 400 }
      );
    }
    
    const model = await Model.findByIdAndDelete(id);
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Model deleted successfully',
      deletedModel: {
        id: model._id,
        name: model.name
      }
    });
  } catch (error) {
    console.error('Delete model error:', error);
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}