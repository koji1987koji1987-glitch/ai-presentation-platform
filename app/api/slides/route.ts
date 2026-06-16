import { execSync } from "child_process";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const file =
    searchParams.get("file") || "Document.pdf";

  const title = file.replace(".pdf", "");

  const output = execSync(
    `python3 python/slide_generator.py "${title}"`
  ).toString();

  const slides = JSON.parse(output);

  return Response.json(slides);
}