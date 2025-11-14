import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Brand from "@/lib/models/Brand";
import { requireAdmin } from "@/lib/middleware";

export const revalidate = 0; // Disable caching for real-time data

// GET - List brands with advanced filtering, search, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Search
    const search = searchParams.get("search");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "name-asc";

    // Build query
    let query: any = {};

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    let sortObj: any = {};
    switch (sortBy) {
      case "name-asc":
        sortObj = { name: 1 };
        break;
      case "name-desc":
        sortObj = { name: -1 };
        break;
      case "date-newest":
        sortObj = { createdAt: -1 };
        break;
      case "date-oldest":
        sortObj = { createdAt: 1 };
        break;
      default:
        sortObj = { name: 1 };
    }

    // Get total count for pagination
    const total = await Brand.countDocuments(query);

    // Fetch brands with pagination
    const brands = await Brand.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        brands,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Get brands error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

// POST - Create new brand (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();

    const data = await request.json();
    const { name, logo, description } = data;

    if (!name) {
      return NextResponse.json(
        { error: "Required fields: name" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Check if brand already exists
    const existingBrand = await Brand.findOne({ slug });
    if (existingBrand) {
      return NextResponse.json(
        { error: "Brand with this name already exists" },
        { status: 400 }
      );
    }

    const brand = await Brand.create({
      name,
      slug,
      logo,
      description,
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error("Create brand error:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    );
  }
}