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
    }

    const promptText = prompt ? prompt.trim() : "";

    if (!text && !promptText) {
      return Response.json(
        { error: "No file uploaded or prompt text provided" },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      text: text,
      prompt: promptText || null
    });

    // Generate slides from payload
    const slidesOutput = execFileSync("python3", [
      join(process.cwd(), "..", "backend", "slide_generator.py"),
      payload,
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