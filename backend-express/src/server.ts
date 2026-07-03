import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { execSync, execFileSync } from "child_process";
import pptxgen from "pptxgenjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Setup directories
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Config Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `upload_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Python command resolver
let cachedPythonCommand: string | null = null;
function getPythonCommand(): string {
  if (cachedPythonCommand) return cachedPythonCommand;
  try {
    execSync("python3 --version", { stdio: "ignore" });
    cachedPythonCommand = "python3";
    return cachedPythonCommand;
  } catch {}
  try {
    execSync("python --version", { stdio: "ignore" });
    cachedPythonCommand = "python";
    return cachedPythonCommand;
  } catch {}
  cachedPythonCommand = "python3";
  return cachedPythonCommand;
}

// Interfaces
interface SlideImage {
  url: string;
  keyword: string;
  width?: number;
  position?: "left" | "right" | "top" | "background" | "none";
}

interface ChartData {
  type: "bar" | "line" | "pie";
  labels: string[];
  values: number[];
  title?: string;
}

interface TimelineItem {
  label: string;
  detail?: string;
}

interface ComparisonTable {
  headers: string[];
  rows: string[][];
}

interface Slide {
  title: string;
  subtitle?: string;
  layout_type: "title" | "bullet_list" | "two_column" | "timeline" | "comparison" | "cards" | "process_flow" | "statistics" | "image_text" | "quote";
  content: string[];
  icon_suggestions?: string[];
  image_search_prompt?: string;
  image?: SlideImage;
  chart_data?: ChartData;
  timeline_data?: TimelineItem[];
  comparison_table?: ComparisonTable;
  custom_bg?: string;
  custom_bg_type?: "theme" | "solid" | "gradient";
}

// 1. UPLOAD ENDPOINT
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const prompt = req.body.prompt || "";
    let extractedText = "";

    if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      const tempPath = file.path;

      try {
        if (ext === ".txt" || ext === ".md") {
          extractedText = fs.readFileSync(tempPath, "utf-8");
        } else if (ext === ".pdf") {
          const pythonCmd = getPythonCommand();
          const readerScript = path.join(__dirname, "..", "..", "backend", "pdf_reader.py");
          extractedText = execFileSync(pythonCmd, [readerScript, tempPath]).toString();
        } else if (ext === ".docx") {
          const pythonCmd = getPythonCommand();
          const readerScript = path.join(__dirname, "..", "..", "backend", "docx_reader.py");
          extractedText = execFileSync(pythonCmd, [readerScript, tempPath]).toString();
        } else {
          return res.status(400).json({ error: "Unsupported file extension. Please upload PDF, DOCX, TXT, or MD." });
        }
      } catch (err: any) {
        console.error("Text extraction failed:", err);
        return res.status(500).json({ error: "Failed to extract text from file", details: err.message });
      } finally {
        // Clean up temp uploaded file
        try {
          fs.unlinkSync(tempPath);
        } catch {}
      }
    }

    if (!extractedText && !prompt.trim()) {
      return res.status(400).json({ error: "No file uploaded or prompt outline text provided." });
    }

    // Call Python slide generator
    const pythonCmd = getPythonCommand();
    const generatorScript = path.join(__dirname, "..", "..", "backend", "slide_generator.py");
    const payload = JSON.stringify({
      text: extractedText,
      prompt: prompt.trim() || null
    });

    console.log("Invoking Python slide generator...");
    const slidesOutput = execFileSync(pythonCmd, [generatorScript, payload]).toString();
    const parsedData = JSON.parse(slidesOutput);

    // Fetch Unsplash photos for empty slide images based on keyword
    const slidesArray = parsedData.slides || parsedData;
    if (Array.isArray(slidesArray)) {
      for (const slide of slidesArray) {
        const keyword = slide.image_search_prompt || slide.image_keyword;
        if (keyword && !slide.image) {
          try {
            const query = encodeURIComponent(keyword);
            const unsplashRes = await fetch(`https://unsplash.com/napi/search/photos?query=${query}&per_page=3`);
            if (unsplashRes.ok) {
              const data = (await unsplashRes.json()) as any;
              const photos = data.results || [];
              if (photos.length > 0) {
                slide.image = {
                  url: photos[0].urls?.regular || photos[0].urls?.small || "",
                  keyword: keyword,
                  width: 100,
                  position: "right"
                };
              }
            }
          } catch (e) {
            console.error("Failed to fetch image for keyword:", keyword, e);
          }
        }
      }
    }

    res.json(parsedData);
  } catch (err: any) {
    console.error("Upload route error:", err);
    res.status(500).json({ error: "Slide generation failed", details: err.message });
  }
});

// 2. EXPORT PPTX ENDPOINT (using PPTXGenJS)
app.post("/api/export", async (req, res) => {
  try {
    const { slides, theme } = req.body;
    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ error: "Invalid slides data. Expected a non-empty array." });
    }

    const activeTheme = theme || "slate";
    
    // Theme palette hex colors
    const themePalettes: Record<string, { bg: string, cardBg: string, text: string, muted: string, accent: string, accentLight: string }> = {
      slate: { bg: "F8FAFC", cardBg: "FFFFFF", text: "0F172A", muted: "64748B", accent: "4F46E5", accentLight: "EFF6FF" },
      dark: { bg: "0F172A", cardBg: "1E293B", text: "F8FAFC", muted: "94A3B8", accent: "818CF8", accentLight: "312E81" },
      indigo: { bg: "EEF2FF", cardBg: "FFFFFF", text: "1E1B4B", muted: "4F46E5", accent: "4F46E5", accentLight: "E0E7FF" },
      emerald: { bg: "F0FDF4", cardBg: "FFFFFF", text: "064E3B", muted: "059669", accent: "059669", accentLight: "D1FAE5" },
      sakura: { bg: "FFF5F5", cardBg: "FFFFFF", text: "4C0519", muted: "DB2777", accent: "DB2777", accentLight: "FCE7F3" },
      cobalt: { bg: "F0F4F8", cardBg: "FFFFFF", text: "102A43", muted: "0F62FE", accent: "0F62FE", accentLight: "E5F1FF" }
    };

    const colors = themePalettes[activeTheme] || themePalettes.slate;

    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_16x9";

    slides.forEach((slide: Slide, index: number) => {
      const pptxSlide = pptx.addSlide();
      pptxSlide.background = { fill: colors.bg };

      // Render Title and Subtitle helper
      const addHeader = (yPos = 0.5) => {
        pptxSlide.addText(slide.title, {
          x: 0.8,
          y: yPos,
          w: 8.5,
          h: 0.6,
          fontSize: 26,
          bold: true,
          color: colors.text
        });
        if (slide.subtitle) {
          pptxSlide.addText(slide.subtitle, {
            x: 0.8,
            y: yPos + 0.55,
            w: 8.5,
            h: 0.35,
            fontSize: 14,
            color: colors.muted
          });
        }
      };

      const layout = slide.layout_type;

      if (layout === "title") {
        // Main centered title slide
        pptxSlide.addText(slide.title, {
          x: 1.0,
          y: 2.2,
          w: 8.0,
          h: 1.2,
          fontSize: 40,
          bold: true,
          align: "center",
          color: colors.text
        });
        if (slide.subtitle) {
          pptxSlide.addText(slide.subtitle, {
            x: 1.0,
            y: 3.5,
            w: 8.0,
            h: 0.5,
            fontSize: 18,
            align: "center",
            color: colors.muted
          });
        }
      } 
      
      else if (layout === "bullet_list") {
        addHeader();
        const bulletObjects = slide.content.map(point => ({
          text: point + "\n",
          options: { bullet: true, color: colors.text, fontSize: 16 }
        }));
        
        pptxSlide.addText(bulletObjects as any, {
          x: 0.8,
          y: 1.8,
          w: 8.4,
          h: 4.0,
          valign: "top"
        });
      } 
      
      else if (layout === "two_column") {
        addHeader();
        // Split content array in half
        const mid = Math.ceil(slide.content.length / 2);
        const col1Points = slide.content.slice(0, mid);
        const col2Points = slide.content.slice(mid);

        pptxSlide.addText(col1Points.map(p => ({ text: p + "\n", options: { bullet: true, color: colors.text, fontSize: 15 } })) as any, {
          x: 0.8,
          y: 1.8,
          w: 4.0,
          h: 4.0,
          valign: "top"
        });

        pptxSlide.addText(col2Points.map(p => ({ text: p + "\n", options: { bullet: true, color: colors.text, fontSize: 15 } })) as any, {
          x: 5.2,
          y: 1.8,
          w: 4.0,
          h: 4.0,
          valign: "top"
        });
      } 
      
      else if (layout === "timeline") {
        addHeader(0.4);
        const timeline = slide.timeline_data || [];
        const itemsToRender = timeline.slice(0, 4);
        
        // Draw timeline center line
        pptxSlide.addShape("rect" as any, {
          x: 0.8,
          y: 3.2,
          w: 8.4,
          h: 0.08,
          fill: { color: colors.accent }
        });

        const numItems = itemsToRender.length;
        if (numItems > 0) {
          const stepX = 8.4 / numItems;
          itemsToRender.forEach((item, idx) => {
            const nodeX = 0.8 + (idx * stepX) + (stepX / 2) - 0.25;

            // Draw Node Circle
            pptxSlide.addShape("oval" as any, {
              x: nodeX,
              y: 3.0,
              w: 0.5,
              h: 0.5,
              fill: { color: colors.cardBg },
              line: { color: colors.accent, width: 3 }
            });

            // Milestone header
            pptxSlide.addText(item.label, {
              x: nodeX - 0.75,
              y: 2.1,
              w: 2.0,
              h: 0.8,
              fontSize: 12,
              bold: true,
              align: "center",
              color: colors.accent
            });

            // Milestone description
            if (item.detail) {
              pptxSlide.addText(item.detail, {
                x: nodeX - 0.75,
                y: 3.6,
                w: 2.0,
                h: 1.5,
                fontSize: 10,
                align: "center",
                color: colors.text
              });
            }
          });
        }
      } 
      
      else if (layout === "comparison") {
        addHeader(0.4);
        const comp = slide.comparison_table || { headers: ["Criteria", "Option A", "Option B"], rows: [["Detail", "A", "B"]] };
        
        // Setup table rows matching layout styles
        const tableRows: any[] = [];
        // Header Row
        tableRows.push(
          comp.headers.map(h => ({
            text: h,
            options: { fill: { color: colors.accent }, color: "FFFFFF", bold: true, fontSize: 13, align: "center" as const }
          }))
        );

        // Body Rows
        comp.rows.forEach((row) => {
          tableRows.push(
            row.map(cell => ({
              text: cell,
              options: { fill: { color: colors.cardBg }, color: colors.text, fontSize: 12, border: { type: "solid", color: colors.muted + "20" } }
            }))
          );
        });

        pptxSlide.addTable(tableRows, {
          x: 0.8,
          y: 1.8,
          w: 8.4,
          h: 3.5
        });
      } 
      
      else if (layout === "cards") {
        addHeader(0.4);
        const items = slide.content.slice(0, 3); // max 3 cards
        const numCards = items.length;
        if (numCards > 0) {
          const totalWidth = 8.4;
          const gap = 0.3;
          const cardW = (totalWidth - (gap * (numCards - 1))) / numCards;

          items.forEach((item, idx) => {
            const cardX = 0.8 + idx * (cardW + gap);
            
            // Draw background rectangle
            pptxSlide.addShape("roundRect" as any, {
              x: cardX,
              y: 1.8,
              w: cardW,
              h: 3.8,
              fill: { color: colors.cardBg },
              line: { color: colors.accent + "30", width: 1.5 }
            });

            // Card title
            const [titlePart, ...bodyParts] = item.split(": ");
            const hasSplit = bodyParts.length > 0;

            pptxSlide.addText(hasSplit ? titlePart : `Point ${idx + 1}`, {
              x: cardX + 0.15,
              y: 2.0,
              w: cardW - 0.3,
              h: 0.5,
              fontSize: 14,
              bold: true,
              color: colors.accent
            });

            pptxSlide.addText(hasSplit ? bodyParts.join(": ") : item, {
              x: cardX + 0.15,
              y: 2.6,
              w: cardW - 0.3,
              h: 2.8,
              fontSize: 12,
              color: colors.text,
              valign: "top"
            });
          });
        }
      } 
      
      else if (layout === "process_flow") {
        addHeader(0.4);
        const steps = slide.content.slice(0, 4); // max 4 steps
        const numSteps = steps.length;
        if (numSteps > 0) {
          const totalWidth = 8.4;
          const gap = 0.4;
          const blockW = (totalWidth - (gap * (numSteps - 1))) / numSteps;

          steps.forEach((step, idx) => {
            const blockX = 0.8 + idx * (blockW + gap);

            // Draw Block Rect
            pptxSlide.addShape("roundRect" as any, {
              x: blockX,
              y: 2.2,
              w: blockW,
              h: 3.2,
              fill: { color: colors.accentLight },
              line: { color: colors.accent, width: 2 }
            });

            // Step Label
            pptxSlide.addText(`Step ${idx + 1}`, {
              x: blockX + 0.1,
              y: 2.4,
              w: blockW - 0.2,
              h: 0.4,
              fontSize: 13,
              bold: true,
              align: "center",
              color: colors.accent
            });

            // Step Details
            const textContent = step.startsWith("Step") || step.includes(":") 
              ? step.split(":").slice(1).join(":").trim() 
              : step;

            pptxSlide.addText(textContent || step, {
              x: blockX + 0.1,
              y: 2.9,
              w: blockW - 0.2,
              h: 2.2,
              fontSize: 11,
              align: "center",
              color: colors.text,
              valign: "top"
            });

            // Arrow connectors between blocks
            if (idx < numSteps - 1) {
              const arrowX = blockX + blockW + (gap / 2) - 0.15;
              pptxSlide.addShape("rightArrow" as any, {
                x: arrowX,
                y: 3.4,
                w: 0.3,
                h: 0.4,
                fill: { color: colors.accent }
              });
            }
          });
        }
      } 
      
      else if (layout === "statistics") {
        addHeader(0.4);
        
        // Large Stat Highlight on the Left
        const mainStatText = slide.content[0] || "Key Target Achieved";
        pptxSlide.addText(mainStatText, {
          x: 0.8,
          y: 2.2,
          w: 4.0,
          h: 3.2,
          fontSize: 22,
          bold: true,
          color: colors.accent,
          valign: "middle"
        });

        // Add secondary bullets below
        if (slide.content.length > 1) {
          pptxSlide.addText(slide.content.slice(1).map(p => ({ text: p + "\n", options: { bullet: true, color: colors.text, fontSize: 13 } })) as any, {
            x: 0.8,
            y: 3.8,
            w: 4.0,
            h: 1.8,
            valign: "top"
          });
        }

        // Render Native Chart on the Right
        if (slide.chart_data && slide.chart_data.labels && slide.chart_data.values) {
          const chartData = [
            {
              name: slide.chart_data.title || "Statistics Data",
              labels: slide.chart_data.labels,
              values: slide.chart_data.values
            }
          ];

          const chartTypeMap = {
            bar: pptx.ChartType.bar,
            line: pptx.ChartType.line,
            pie: pptx.ChartType.pie
          };

          const selectedChartType = chartTypeMap[slide.chart_data.type] || pptx.ChartType.bar;
          
          pptxSlide.addChart(selectedChartType as any, chartData, {
            x: 5.0,
            y: 1.8,
            w: 4.2,
            h: 3.8
          });
        }
      } 
      
      else if (layout === "image_text") {
        addHeader();
        
        // Left Column Content
        pptxSlide.addText(slide.content.map(p => ({ text: p + "\n", options: { bullet: true, color: colors.text, fontSize: 15 } })) as any, {
          x: 0.8,
          y: 1.8,
          w: 4.4,
          h: 4.0,
          valign: "top"
        });

        // Right Column Image
        if (slide.image && slide.image.url && slide.image.url.startsWith("http")) {
          pptxSlide.addImage({
            path: slide.image.url,
            x: 5.6,
            y: 1.8,
            w: 3.6,
            h: 3.6
          });
        }
      } 
      
      else if (layout === "quote") {
        // Stylized quote container
        pptxSlide.addShape("roundRect" as any, {
          x: 1.0,
          y: 1.6,
          w: 8.0,
          h: 3.8,
          fill: { color: colors.accentLight },
          line: { color: colors.accent, width: 2 }
        });

        // Large quote text
        const quoteVal = slide.content[0] || "No quote generated.";
        pptxSlide.addText(`"${quoteVal}"`, {
          x: 1.3,
          y: 1.9,
          w: 7.4,
          h: 2.2,
          fontSize: 22,
          italic: true,
          align: "center",
          color: colors.text,
          valign: "middle"
        });

        // Quote author/subtitle
        const quoteAuthor = slide.subtitle || "Anonymous";
        pptxSlide.addText(`— ${quoteAuthor}`, {
          x: 1.3,
          y: 4.3,
          w: 7.4,
          h: 0.6,
          fontSize: 14,
          bold: true,
          align: "center",
          color: colors.accent
        });
      }
    });

    // Write presentation to a Node buffer and return it
    const buffer = await pptx.write({ outputType: "nodebuffer" });
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", 'attachment; filename="presentation.pptx"');
    res.send(buffer);
  } catch (err: any) {
    console.error("Export endpoint failed:", err);
    res.status(500).json({ error: "Failed to compile PowerPoint presentation", details: err.message });
  }
});

// 3. IMAGE PROXY ENDPOINT
app.get("/api/images", async (req, res) => {
  try {
    const query = (req.query.query as string) || "presentation";
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=12`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unsplash returned status ${response.status}`);
    }

    const data = (await response.json()) as any;
    const photos = data.results || [];

    const mapped = photos.map((p: any) => ({
      id: p.id,
      url: p.urls?.regular || p.urls?.small || "",
      thumb: p.urls?.thumb || "",
      description: p.alt_description || p.description || "",
      author: p.user?.name || "Unsplash"
    }));

    res.json(mapped);
  } catch (err: any) {
    console.error("Image proxy failed:", err);
    // Return local fallback list
    res.json([
      { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600", thumb: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200", description: "Business presentation" },
      { url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600", thumb: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200", description: "Colleague collaboration" },
      { url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600", thumb: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=200", description: "Project dashboard" }
    ]);
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`Express server backend is running on http://localhost:${PORT}`);
});
