import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const prompt = formData.get("prompt") as string | null;

    let text = "";

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const isDocx = file.name.toLowerCase().endsWith(".docx");
      const tempPath = join(
        process.cwd(),
        `uploaded_${Date.now()}${isDocx ? ".docx" : ".pdf"}`
      );

      writeFileSync(tempPath, buffer);

      try {
        if (isDocx) {
          text = execFileSync("python3", [
            join(process.cwd(), "..", "backend", "docx_reader.py"),
            tempPath,
          ]).toString();
        } else {
          text = execFileSync("python3", [
            join(process.cwd(), "..", "backend", "pdf_reader.py"),
            tempPath,
          ]).toString();
        }
      } finally {
        // Guarantee cleanup of the temp file
        try {
          unlinkSync(tempPath);
        } catch {}
      }
    } else if (prompt && prompt.trim().length > 0) {
      text = prompt;
    } else {
      return Response.json(
        { error: "No file uploaded or prompt text provided" },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return Response.json(
        { error: "Could not extract readable text content." },
        { status: 422 }
      );
    }

    // Generate slides from extracted text or prompt
    const slidesOutput = execFileSync("python3", [
      join(process.cwd(), "..", "backend", "slide_generator.py"),
      text,
    ]).toString();

    const slides = JSON.parse(slidesOutput);

    return Response.json(slides);
  } catch (error: any) {
    console.error("Upload handler failed:", error);
    return Response.json(
      { error: "Failed to generate presentation", details: error.message },
      { status: 500 }
    );
  }
}