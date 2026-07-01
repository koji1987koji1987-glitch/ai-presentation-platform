import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "presentation";

    // Call Unsplash NAPI search (public endpoint, no key needed)
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=12`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Unsplash NAPI search returned status ${response.status}`);
    }

    const data = await response.json();
    const photos = data.results || [];

    // Map to simplified schema
    const results = photos.map((p: {
      id: string;
      urls?: { regular?: string; small?: string; thumb?: string };
      alt_description?: string;
      description?: string;
      user?: { name?: string };
    }) => ({
      id: p.id,
      url: p.urls?.regular || p.urls?.small || "",
      thumb: p.urls?.thumb || "",
      description: p.alt_description || p.description || "",
      author: p.user?.name || "Unsplash"
    }));

    return NextResponse.json(results);
  } catch (error) {
    const err = error as Error;
    console.error("Unsplash proxy error:", err);
    // Return high quality fallback images if the service fails or rate limits
    return NextResponse.json([
      { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600", thumb: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200", description: "Business presentation" },
      { url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600", thumb: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200", description: "Colleague collaboration" },
      { url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600", thumb: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=200", description: "Project dashboard" }
    ]);
  }
}
