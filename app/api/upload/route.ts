import { writeFileSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

export async function POST(request: Request) {
  const formData = await request.formData();

  const file = formData.get("file") as File;

  if (!file) {
    return Response.json(
      { error: "No file uploaded" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();

  const buffer = Buffer.from(bytes);

  const pdfPath = join(process.cwd(), "uploaded.pdf");

  writeFileSync(pdfPath, buffer);

  const text = execFileSync(
    "python3",
    ["python/pdf_reader.py", pdfPath]
  ).toString();

  const slidesOutput = execFileSync(
    "python3",
    ["python/slide_generator.py", text]
  ).toString();

  const slides = JSON.parse(slidesOutput);

  return Response.json(slides);
}