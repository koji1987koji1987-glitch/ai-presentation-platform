import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { getPythonCommand } from "../pythonHelper";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const prompt = formData.get("prompt") as string | null;

    let text = "";

    const pythonCmd = getPythonCommand();

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
          text = execFileSync(pythonCmd, [
            join(process.cwd(), "..", "backend", "docx_reader.py"),
            tempPath,
          ]).toString();
        } else {
          text = execFileSync(pythonCmd, [
            join(process.cwd(), "..", "backend", "pdf_reader.py"),
            tempPath,
          ]).toString();
        }
      } finally {
        // Guarantee cleanup of the temp file
        try {
          unlinkSync(tempPath);
        } catch { }
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
    const slidesOutput = execFileSync(pythonCmd, [
      join(process.cwd(), "..", "backend", "slide_generator.py"),
      payload,
    ]).toString();

    const data = JSON.parse(slidesOutput);
    const slidesArray = data.slides || data;

    if (Array.isArray(slidesArray)) {
      for (const slide of slidesArray) {
        if (slide.image_keyword && !slide.image) {
          try {
            const query = encodeURIComponent(slide.image_keyword);
            const res = await fetch(`https://unsplash.com/napi/search/photos?query=${query}&per_page=3`);
            if (res.ok) {
              const resData = await res.json();
              const photos = resData.results || [];
              if (photos.length > 0) {
                slide.image = {
                  url: photos[0].urls?.regular || photos[0].urls?.small || "",
                  keyword: slide.image_keyword,
                  width: 100,
                  position: "right"
                };
              }
            }
          } catch (e) {
            console.error("Failed to resolve Unsplash image for slide in API:", e);
          }
        }
      }
    }

    return Response.json(data);
  } catch (error) {
    const err = error as Error;
    console.error("Upload handler failed:", err);
    return Response.json(
      { error: "Failed to generate presentation", details: err.message },
      { status: 500 }
    );
  }
}