import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { getPresignedUrl } from "@/lib/s3";

// POST /api/files/presign
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { filename, contentType } = await req.json();

    // Generate unique key
    const timestamp = Date.now();
    const key = `uploads/${timestamp}-${filename}`;

    const presignedUrl = await getPresignedUrl(key, contentType);

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
