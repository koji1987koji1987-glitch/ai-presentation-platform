import { SlideGenerator } from "./SlideGenerator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const file =
    searchParams.get("file") || "Document.pdf";

  const title = file.replace(".pdf", "");

  const generator = new SlideGenerator();

  const slides = generator.generate(title);

  return Response.json(slides);
}