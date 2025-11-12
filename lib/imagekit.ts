import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function uploadImage(
  file: Buffer | string,
  fileName: string,
  folder: string
): Promise<string> {
  try {
    const result = await imagekit.upload({
      file,
      fileName,
      folder,
    });
    return result.url;
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw new Error('Failed to upload image');
  }
}

export async function deleteImage(fileId: string): Promise<void> {
  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error('ImageKit delete error:', error);
    throw new Error('Failed to delete image');
  }
}

export function getImageKitAuthParams() {
  return imagekit.getAuthenticationParameters();
}

export default imagekit;