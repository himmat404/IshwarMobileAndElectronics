import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import imagekit from '@/lib/imagekit';

export async function POST(request: NextRequest) {
  try {
    // ✅ Authenticate first
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'products';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // ✅ Enhanced validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // ✅ Validate file name
    if (file.name.length > 255) {
      return NextResponse.json(
        { error: 'File name too long' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${timestamp}-${randomString}.${extension}`;
    
    // ✅ Upload to ImageKit with error handling
    try {
      const result = await imagekit.upload({
        file: buffer,
        fileName: fileName,
        folder: `mobile-accessories/${folder}`,
        useUniqueFileName: false,
      });
      
      return NextResponse.json({
        url: result.url,
        fileId: result.fileId,
        name: result.name,
        thumbnailUrl: result.thumbnailUrl,
      });
    } catch (uploadError: any) {
      console.error('ImageKit upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload to ImageKit' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}