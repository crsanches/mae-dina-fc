export async function GET(request: Request) {

    const { searchParams } =
      new URL(request.url);
  
    const url =
      searchParams.get("url");
  
    if (!url) {
  
      return new Response(
        "Missing URL",
        { status: 400 }
      );
  
    }
  
    const response =
      await fetch(url);
  
    const contentType =
      response.headers.get(
        "content-type"
      ) || "image/png";
  
    const buffer =
      await response.arrayBuffer();
  
    return new Response(buffer, {
  
      headers: {
  
        "Content-Type":
          contentType,
  
        "Cache-Control":
          "public, max-age=86400"
  
      }
  
    });
  
  }