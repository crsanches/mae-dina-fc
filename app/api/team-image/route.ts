import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("id");

  if (!teamId) {
    return new NextResponse("Missing id", { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.sofascore.app/api/v1/team/${teamId}/image`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://www.sofascore.com/",
        },
      }
    );

    console.log("SofaScore status:", response.status, "for id:", teamId);

    if (!response.ok) {
      console.log("SofaScore error body:", await response.text());
      return new NextResponse("Image not found", { status: 404 });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}