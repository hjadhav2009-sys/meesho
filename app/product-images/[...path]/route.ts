import { readFile, stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import { absoluteCachedImagePath, contentTypeForCachedImage } from "@/lib/image-cache";

type ProductImageRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

export async function GET(_request: Request, context: ProductImageRouteContext) {
  const params = await context.params;
  const relativePath = params.path?.join("/") ?? "";
  const filePath = absoluteCachedImagePath(relativePath);

  if (!filePath) {
    return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
  }

  try {
    const [file, fileStat, contentType] = await Promise.all([
      readFile(filePath),
      stat(filePath),
      contentTypeForCachedImage(filePath)
    ]);

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, max-age=86400"
      }
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
