import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slides = body.slides || body;

    if (!Array.isArray(slides) || slides.length === 0) {
      return Response.json(
        { error: "Invalid slides data. Expected a non-empty array." },
        { status: 400 }
      );
    }

    const uniqueId = Date.now();
    // Use the workspace root for temporary files as requested by the sandbox environment
    const tempJsonPath = join(process.cwd(), `temp_slides_${uniqueId}.json`);
    const tempPptxPath = join(process.cwd(), `presentation_${uniqueId}.pptx`);

    // Write slides to a temp JSON file to avoid shell command line argument length limits
    writeFileSync(tempJsonPath, JSON.stringify(slides, null, 2), "utf-8");

    try {
      // Execute the python PPTX exporter
      execFileSync("python3", [
        "python/ppt_exporter.py",
        tempJsonPath,
        tempPptxPath,
      ]);

      const fileBuffer = readFileSync(tempPptxPath);

      // Clean up temporary files
      unlinkSync(tempJsonPath);
      unlinkSync(tempPptxPath);

      return new Response(fileBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": 'attachment; filename="presentation.pptx"',
        },
      });
    } catch (execError: any) {
      console.error("PPTX Generation process failed:", execError);
      
      // Clean up if files were created
      try {
        unlinkSync(tempJsonPath);
      } catch {}
      try {
        unlinkSync(tempPptxPath);
      } catch {}

      return Response.json(
        {
          error: "PowerPoint generation failed.",
          details: execError.message,
          stdout: execError.stdout?.toString(),
          stderr: execError.stderr?.toString(),
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Export request failed:", error);
    return Response.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    );
  }
}
