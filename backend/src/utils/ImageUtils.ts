import sharp from "sharp";

export async function normalizeToJpegBase64(inputBase64: string): Promise<string> {
    const matches = inputBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 format');
    }
  
    const imageBuffer = Buffer.from(matches[2], 'base64');
  
    const jpegBuffer = await sharp(imageBuffer).jpeg().toBuffer();
  
    return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`;
}
