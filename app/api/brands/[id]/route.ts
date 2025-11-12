import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Brand from '@/lib/models/Brand';
import Model from '@/lib/models/Model';
import { requireAdmin } from '@/lib/middleware';

// GET - Single brand (Public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const brand = await Brand.findById(id);
    
    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Get brand error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand' },
      { status: 500 }
    );
  }
}

// PUT - Update brand (Admin only)
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
    const { name, logo, description } = data;
    
    const updateData: any = {};
    
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (logo !== undefined) updateData.logo = logo;
    if (description !== undefined) updateData.description = description;
    
    const brand = await Brand.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Update brand error:', error);
    return NextResponse.json(
      { error: 'Failed to update brand' },
      { status: 500 }
    );
  }
}

// DELETE - Delete brand (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { id } = await params;
    await connectDB();
    
    // Check if brand has models
    const modelsCount = await Model.countDocuments({ brandId: id });
    
    if (modelsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete brand with existing models' },
        { status: 400 }
      );
    }
    
    const brand = await Brand.findByIdAndDelete(id);
    
    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Delete brand error:', error);
    return NextResponse.json(
      { error: 'Failed to delete brand' },
      { status: 500 }
    );
  }
}