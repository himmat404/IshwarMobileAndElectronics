import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Brand from "@/lib/models/Brand";
import Model from "@/lib/models/Model";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/middleware";

// GET - Single brand with related models and products count (Public)
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
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Get count of models and products for this brand
    const modelsCount = await Model.countDocuments({ brandId: id });
    
    // Get model IDs for this brand
    const models = await Model.find({ brandId: id }).select("_id").lean();
    const modelIds = models.map((m) => m._id);
    
    // Count products that use any of these models
    const productsCount = await Product.countDocuments({
      models: { $in: modelIds },
    });

    return NextResponse.json({
      brand,
      modelsCount,
      productsCount,
    });
  } catch (error) {
    console.error("Get brand error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand" },
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
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      // Check if new slug conflicts with existing brand
      const existingBrand = await Brand.findOne({
        slug: updateData.slug,
        _id: { $ne: id },
      });

      if (existingBrand) {
        return NextResponse.json(
          { error: "Brand with this name already exists" },
          { status: 400 }
        );
      }
    }

    if (logo !== undefined) updateData.logo = logo;
    if (description !== undefined) updateData.description = description;

    const brand = await Brand.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Update brand error:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
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

    // Check if brand has any models
    const modelsCount = await Model.countDocuments({ brandId: id });

    if (modelsCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete brand. It has ${modelsCount} model(s) associated with it`,
        },
        { status: 400 }
      );
    }

    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Brand deleted successfully",
      deletedBrand: {
        id: brand._id,
        name: brand.name,
      },
    });
  } catch (error) {
    console.error("Delete brand error:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}