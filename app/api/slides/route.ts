import { execSync } from "child_process";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const content =
    searchParams.get("content") || "";

  const output = execSync(
    `python3 python/slide_generator.py "${content}"`
  ).toString();

  const slides = JSON.parse(output);

  return Response.json(slides);
}