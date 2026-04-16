import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, slug } = body;

    const expected = process.env.REVALIDATE_SECRET;
    if (!expected) {
      return NextResponse.json({ error: "REVALIDATE_SECRET not configured" }, { status: 500 });
    }
    if (secret !== expected) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    // Always revalidate the blog listing
    revalidatePath("/blog");

    // If slug provided, revalidate that specific article too
    const paths: string[] = ["/blog"];
    if (slug && typeof slug === "string") {
      revalidatePath(`/blog/${slug}`);
      paths.push(`/blog/${slug}`);
    }

    return NextResponse.json({
      revalidated: true,
      paths,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Revalidation error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

// Also allow GET for simple health check
export async function GET() {
  return NextResponse.json({ status: "ready", endpoint: "/api/revalidate-blog" });
}
