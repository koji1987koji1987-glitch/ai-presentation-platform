"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type DiagramItem = {
    label: string;
    detail?: string;
    category?: string;
};

type DiagramData = {
    title: string;
    root?: string;
    items: DiagramItem[];
};

type Diagram = {
    type: "flowchart" | "timeline" | "org_chart" | "mind_map" | "decision_tree" | "architecture" | "erd" | "matrix" | "none";
    data: DiagramData;
};

type SlideImage = {
    url: string;
    keyword: string;
    width: number;
    position: "left" | "right" | "top" | "background" | "none";
};

type Slide = {
    title: string;
    subtitle?: string;
    layout_type?: "title" | "bullet_list" | "two_column" | "timeline" | "comparison" | "cards" | "process_flow" | "statistics" | "image_text" | "quote";
    content: string[];
    visual_suggestion?: string;
    image_keyword?: string;
    image?: SlideImage;
    diagram?: Diagram;
    icon_suggestions?: string[];
    image_search_prompt?: string;
    chart_data?: { type: "bar" | "line" | "pie"; labels: string[]; values: number[]; title?: string };
    timeline_data?: { label: string; detail?: string }[];
    comparison_table?: { headers: string[]; rows: string[][] };
    custom_bg?: string;
    custom_bg_type?: "theme" | "solid" | "gradient";
};

const themePalettes = {
    slate: {
        name: "Slate Modern",
        bg: "#f8fafc",
        cardBg: "#ffffff",
        text: "#0f172a",
        muted: "#64748b",
        accent: "#4f46e5",
        accentLight: "#eff6ff",
        border: "#e2e8f0"
    },
    dark: {
        name: "Dark Slate",
        bg: "#0f172a",
        cardBg: "#1e293b",
        text: "#f8fafc",
        muted: "#94a3b8",
        accent: "#818cf8",
        accentLight: "#312e81",
        border: "#334155"
    },
    indigo: {
        name: "Indigo Ocean",
        bg: "#eef2ff",
        cardBg: "#ffffff",
        text: "#1e1b4b",
        muted: "#4f46e5",
        accent: "#4f46e5",
        accentLight: "#e0e7ff",
        border: "#c7d2fe"
    },
    emerald: {
        name: "Emerald Forest",
        bg: "#f0fdf4",
        cardBg: "#ffffff",
        text: "#064e3b",
        muted: "#059669",
        accent: "#059669",
        accentLight: "#d1fae5",
        border: "#a7f3d0"
    },
    sakura: {
        name: "Sakura Peach",
        bg: "#fff5f5",
        cardBg: "#ffffff",
        text: "#4c0519",
        muted: "#db2777",
        accent: "#db2777",
        accentLight: "#fce7f3",
        border: "#fbcfe8"
    },
    cobalt: {
        name: "Cobalt Tech",
        bg: "#f0f4f8",
        cardBg: "#ffffff",
        text: "#102a43",
        muted: "#0f62fe",
        accent: "#0f62fe",
        accentLight: "#e5f1ff",
        border: "#d0e2ff"
    }
};

type ThemeKey = keyof typeof themePalettes;
type ThemeColors = typeof themePalettes[ThemeKey];

const BACKGROUND_PRESETS = [
    { name: "Sunset Glow", value: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", type: "gradient" as const },
    { name: "Ocean Breeze", value: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)", type: "gradient" as const },
    { name: "Emerald Forest", value: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)", type: "gradient" as const },
    { name: "Royal Violet", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", type: "gradient" as const },
    { name: "Midnight Slate", value: "linear-gradient(135deg, #2c3e50 0%, #0f2027 100%)", type: "gradient" as const },
    { name: "Warm Peach", value: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)", type: "gradient" as const },
    { name: "Charcoal Dark", value: "#1e293b", type: "solid" as const },
    { name: "Light Paper", value: "#ffffff", type: "solid" as const }
];

const isDarkBackground = (customBg?: string, bgType?: string, activeTheme?: string) => {
    if (!customBg || bgType === "theme") {
        return activeTheme === "dark";
    }
    if (bgType === "gradient") {
        const darkGradients = ["#2c3e50", "#667eea", "royal-violet", "midnight-slate"];
        return darkGradients.some(val => customBg.toLowerCase().includes(val.toLowerCase()));
    }
    if (customBg.startsWith("#")) {
        const hex = customBg.replace("#", "");
        if (hex.length === 3 || hex.length === 6) {
            const r = parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.substring(0, 2), 16);
            const g = parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.substring(2, 4), 16);
            const b = parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.substring(4, 6), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance < 0.5;
        }
    }
    return false;
};

interface AutoGrowingTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value: string;
    onChange: (val: string) => void;
}

function AutoGrowingTextarea({
    value,
    onChange,
    style,
    ...props
}: AutoGrowingTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={1}
            style={{
                resize: "none",
                overflowY: "hidden",
                width: "100%",
                minWidth: "0",
                ...style
            }}
            onInput={adjustHeight}
            {...props}
        />
    );
}

export default function PresentationPage() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [activeTheme, setActiveTheme] = useState<ThemeKey>("slate");
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    type UnsplashPhoto = {
        id: string;
        url: string;
        thumb: string;
        description: string;
        author: string;
    };

    // Image search state
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [activeSearchSlideIndex, setActiveSearchSlideIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
    const [modalTab, setModalTab] = useState<"search" | "upload">("search");
    const [modalDragOver, setModalDragOver] = useState(false);

    const router = useRouter();
    const colors = themePalettes[activeTheme];

    const handleImageFileLoad = (file: File, slideIndex: number) => {
        if (!file.type.startsWith("image/")) {
            alert("Please drop a valid image file.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
                const currentImage = slides[slideIndex].image || {
                    url: "",
                    keyword: file.name,
                    width: 100,
                    position: "right"
                };
                handleUpdateSlideImage(slideIndex, {
                    ...currentImage,
                    url: dataUrl,
                    keyword: file.name
                });
            }
        };
        reader.readAsDataURL(file);
    };

    // Image Handlers
    const handleUpdateSlideImage = (slideIndex: number, updatedImage: SlideImage | undefined) => {
        const updated = [...slides];
        updated[slideIndex].image = updatedImage;
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleUpdateSlideBackground = (slideIndex: number, bgValue: string, bgType: "theme" | "solid" | "gradient") => {
        const updated = [...slides];
        updated[slideIndex].custom_bg = bgValue;
        updated[slideIndex].custom_bg_type = bgType;
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const openImageSearch = async (slideIndex: number, keyword: string) => {
        setActiveSearchSlideIndex(slideIndex);
        setSearchQuery(keyword || slides[slideIndex].title || "");
        setSearchModalOpen(true);
        setIsSearching(true);
        setSearchResults([]);
        try {
            const res = await fetch(`/api/images?query=${encodeURIComponent(keyword || slides[slideIndex].title || "presentation")}`);
            if (res.ok) {
                const text = await res.text();
                try {
                    const data = JSON.parse(text);
                    setSearchResults(data);
                } catch (e) {
                    console.error("Failed to parse search results as JSON:", e);
                }
            }
        } catch (err) {
            console.error("Failed to load search results:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchPhotos = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`/api/images?query=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const text = await res.text();
                try {
                    const data = JSON.parse(text);
                    setSearchResults(data);
                } catch (e) {
                    console.error("Failed to parse search results as JSON:", e);
                }
            }
        } catch (err) {
            console.error("Failed to search photos:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectPhoto = (photoUrl: string) => {
        if (activeSearchSlideIndex === null) return;
        const currentImage = slides[activeSearchSlideIndex].image || {
            url: "",
            keyword: searchQuery,
            width: 100,
            position: "right"
        };
        handleUpdateSlideImage(activeSearchSlideIndex, {
            ...currentImage,
            url: photoUrl,
            keyword: searchQuery
        });
        setSearchModalOpen(false);
        setActiveSearchSlideIndex(null);
    };

    const getGridCols = (slide: Slide) => {
        const hasDiagram = !!(slide.visual_suggestion || (slide.diagram && slide.diagram.type !== "none"));
        const hasSideImage = !!(slide.image && slide.image.position !== "none" && slide.image.position !== "top" && slide.image.position !== "background");
        
        if (hasDiagram && hasSideImage) {
            return "1fr 1fr 1fr";
        } else if (hasDiagram || hasSideImage) {
            return "1.2fr 1fr";
        }
        return "1fr";
    };

    // Render Slide Image Helper
    const renderSlideImage = (slide: Slide, index: number) => {
        if (!slide.image || slide.image.position === "none" || slide.image.position === "background") return null;
        return (
            <div className="slide-image-wrapper" style={{
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                width: `${slide.image.width || 100}%`,
                margin: "0 auto",
                border: `1px solid ${colors.border}`,
                boxShadow: "0 4px 10px rgba(0,0,0,0.03)",
                transition: "all 0.3s ease"
            }}>
                <img 
                    src={slide.image.url} 
                    alt={slide.image.keyword} 
                    style={{
                        width: "100%",
                        height: "220px",
                        objectFit: "cover",
                        display: "block"
                    }} 
                />
                
                {/* Hover Controls (Gamma style) */}
                <div className="no-print image-hover-controls" style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                    padding: "12px"
                }}>
                    <button
                        onClick={() => openImageSearch(index, slide.image?.keyword || "")}
                        className="image-control-btn"
                        style={{
                            backgroundColor: colors.accent,
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
                        }}
                    >
                        🔍 Replace Image
                    </button>
                    
                    {/* Position selection buttons */}
                    <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                        {(["left", "right", "top", "background", "none"] as const).map((pos) => (
                            <button
                                key={pos}
                                onClick={() => handleUpdateSlideImage(index, { ...slide.image!, position: pos })}
                                style={{
                                    backgroundColor: slide.image?.position === pos ? colors.accent : "rgba(255,255,255,0.25)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "3px 6px",
                                    fontSize: "0.68rem",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    textTransform: "capitalize"
                                }}
                            >
                                {pos}
                            </button>
                        ))}
                    </div>
                    
                    {/* Resize Slider */}
                    <div style={{ width: "90%", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", marginTop: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "0.62rem", color: "#ddd" }}>
                            <span>Resize Width</span>
                            <span>{slide.image?.width || 100}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="30" 
                            max="100" 
                            value={slide.image?.width || 100}
                            onChange={(e) => handleUpdateSlideImage(index, { ...slide.image!, width: parseInt(e.target.value) })}
                            style={{ width: "100%", accentColor: colors.accent, cursor: "ew-resize" }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        const savedSlides = localStorage.getItem("slides");
        const savedTheme = localStorage.getItem("theme");
        
        // Wrap state setters in a timeout to avoid synchronous set-state-in-effect ESLint rule
        // and prevent server-client hydration mismatches.
        setTimeout(() => {
            if (savedSlides) {
                try {
                    setSlides(JSON.parse(savedSlides));
                } catch (e) {
                    console.error("Failed to parse saved slides:", e);
                }
            }
            if (savedTheme && savedTheme in themePalettes) {
                setActiveTheme(savedTheme as ThemeKey);
            }
        }, 0);
    }, []);

    // Slide Array Updates
    const handleUpdateTitle = (slideIndex: number, newTitle: string) => {
        const updated = [...slides];
        updated[slideIndex].title = newTitle;
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleUpdateBullet = (slideIndex: number, bulletIndex: number, newValue: string) => {
        const updated = [...slides];
        updated[slideIndex].content[bulletIndex] = newValue;
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleAddBullet = (slideIndex: number) => {
        const updated = [...slides];
        updated[slideIndex].content.push("New point...");
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleDeleteBullet = (slideIndex: number, bulletIndex: number) => {
        const updated = [...slides];
        updated[slideIndex].content.splice(bulletIndex, 1);
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleUpdateVisual = (slideIndex: number, newVisual: string) => {
        const updated = [...slides];
        updated[slideIndex].visual_suggestion = newVisual;
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleMoveSlide = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= slides.length) return;
        const updated = [...slides];
        const temp = updated[fromIndex];
        updated[fromIndex] = updated[toIndex];
        updated[toIndex] = temp;
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleDeleteSlide = (slideIndex: number) => {
        if (confirm("Are you sure you want to delete this slide?")) {
            const updated = slides.filter((_, idx) => idx !== slideIndex);
            setSlides(updated);
            localStorage.setItem("slides", JSON.stringify(updated));
        }
    };

    const handleAddSlide = () => {
        const newSlide: Slide = {
            title: "New Slide Topic",
            content: ["Key takeaway point 1", "Key takeaway point 2"],
            visual_suggestion: "A grid or flowchart showing categories"
        };
        const updated = [...slides, newSlide];
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleUpdateLayoutType = (slideIndex: number, layoutType: Slide["layout_type"]) => {
        const updated = [...slides];
        updated[slideIndex].layout_type = layoutType;

        if (layoutType === "timeline" && !updated[slideIndex].timeline_data) {
            updated[slideIndex].timeline_data = [
                { label: "Phase 1: Kickoff", detail: "Initial alignment & planning." },
                { label: "Phase 2: Build", detail: "Prototyping & coding modules." },
                { label: "Phase 3: Launch", detail: "Production deployment & feedback." }
            ];
        } else if (layoutType === "comparison" && !updated[slideIndex].comparison_table) {
            updated[slideIndex].comparison_table = {
                headers: ["Criteria", "Option A", "Option B"],
                rows: [
                    ["Cost", "$10/mo", "$20/mo"],
                    ["Support", "Standard", "24/7 Premium"]
                ]
            };
        } else if (layoutType === "statistics" && !updated[slideIndex].chart_data) {
            updated[slideIndex].chart_data = {
                type: "bar",
                labels: ["Metric A", "Metric B", "Metric C"],
                values: [40, 75, 95],
                title: "KPI Performance Overview"
            };
        }
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleUpdateSubtitle = (slideIndex: number, val: string) => {
        const updated = [...slides];
        updated[slideIndex].subtitle = val;
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleUpdateTimelineItem = (slideIndex: number, itemIdx: number, field: "label" | "detail", val: string) => {
        const updated = [...slides];
        if (updated[slideIndex].timeline_data) {
            updated[slideIndex].timeline_data![itemIdx][field] = val;
            setSlides(updated);
            localStorage.setItem("slides", JSON.stringify(updated));
        }
    };

    const handleAddTimelineItem = (slideIndex: number) => {
        const updated = [...slides];
        if (!updated[slideIndex].timeline_data) updated[slideIndex].timeline_data = [];
        updated[slideIndex].timeline_data!.push({ label: "New Milestone", detail: "Milestone detail text." });
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleDeleteTimelineItem = (slideIndex: number, itemIdx: number) => {
        const updated = [...slides];
        if (updated[slideIndex].timeline_data) {
            updated[slideIndex].timeline_data!.splice(itemIdx, 1);
            setSlides(updated);
            localStorage.setItem("slides", JSON.stringify(updated));
        }
    };

    const handleUpdateComparisonHeader = (slideIndex: number, colIdx: number, val: string) => {
        const updated = [...slides];
        if (updated[slideIndex].comparison_table) {
            updated[slideIndex].comparison_table!.headers[colIdx] = val;
            setSlides(updated);
            localStorage.setItem("slides", JSON.stringify(updated));
        }
    };

    const handleUpdateComparisonCell = (slideIndex: number, rowIdx: number, colIdx: number, val: string) => {
        const updated = [...slides];
        if (updated[slideIndex].comparison_table) {
            updated[slideIndex].comparison_table!.rows[rowIdx][colIdx] = val;
            setSlides(updated);
            localStorage.setItem("slides", JSON.stringify(updated));
        }
    };

    const handleAddComparisonRow = (slideIndex: number) => {
        const updated = [...slides];
        if (!updated[slideIndex].comparison_table) {
            updated[slideIndex].comparison_table = { headers: ["Criteria", "Col 1", "Col 2"], rows: [] };
        }
        const numCols = updated[slideIndex].comparison_table!.headers.length;
        updated[slideIndex].comparison_table!.rows.push(Array(numCols).fill("New Cell"));
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleDeleteComparisonRow = (slideIndex: number, rowIdx: number) => {
        const updated = [...slides];
        if (updated[slideIndex].comparison_table) {
            updated[slideIndex].comparison_table!.rows.splice(rowIdx, 1);
            setSlides(updated);
            localStorage.setItem("slides", JSON.stringify(updated));
        }
    };

    const handleUpdateChartData = (slideIndex: number, field: "title" | "type", val: string) => {
        const updated = [...slides];
        if (updated[slideIndex].chart_data) {
            if (field === "title") {
                updated[slideIndex].chart_data!.title = val;
            } else if (field === "type") {
                updated[slideIndex].chart_data!.type = val as any;
            }
            setSlides(updated);
            localStorage.setItem("slides", JSON.stringify(updated));
        }
    };

    const handleUpdateChartItem = (slideIndex: number, itemIdx: number, field: "label" | "value", val: string) => {
        const updated = [...slides];
        if (updated[slideIndex].chart_data) {
            if (field === "label") {
                updated[slideIndex].chart_data!.labels[itemIdx] = val;
            } else if (field === "value") {
                const parsed = parseFloat(val);
                updated[slideIndex].chart_data!.values[itemIdx] = isNaN(parsed) ? 0 : parsed;
            }
            setSlides(updated);
            localStorage.setItem("slides", JSON.stringify(updated));
        }
    };

    const handleAddChartItem = (slideIndex: number) => {
        const updated = [...slides];
        if (!updated[slideIndex].chart_data) {
            updated[slideIndex].chart_data = { type: "bar", labels: [], values: [], title: "Chart Data" };
        }
        updated[slideIndex].chart_data!.labels.push("New Data Label");
        updated[slideIndex].chart_data!.values.push(50);
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleDeleteChartItem = (slideIndex: number, itemIdx: number) => {
        const updated = [...slides];
        if (updated[slideIndex].chart_data) {
            updated[slideIndex].chart_data!.labels.splice(itemIdx, 1);
            updated[slideIndex].chart_data!.values.splice(itemIdx, 1);
            setSlides(updated);
            localStorage.setItem("slides", JSON.stringify(updated));
        }
    };

    const handleUpdateIconSuggestions = (slideIndex: number, tags: string) => {
        const updated = [...slides];
        updated[slideIndex].icon_suggestions = tags.split(",").map(t => t.trim()).filter(Boolean);
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    const handleUpdateImageSearchPrompt = (slideIndex: number, val: string) => {
        const updated = [...slides];
        updated[slideIndex].image_search_prompt = val;
        setSlides(updated);
        localStorage.setItem("slides", JSON.stringify(updated));
    };

    async function handleExport() {
        if (slides.length === 0) return;
        setIsExporting(true);
        try {
            const response = await fetch("/api/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ slides, theme: activeTheme }),
            });

            if (!response.ok) {
                const errText = await response.text();
                let errorData: any = {};
                try {
                    errorData = JSON.parse(errText);
                } catch {
                    errorData = { error: errText || "Failed to export presentation" };
                }
                throw new Error(errorData.details || errorData.error || "Failed to export presentation");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;

            const uploadedName = localStorage.getItem("uploadedFile") || "presentation.pdf";
            const pptxName = uploadedName.toLowerCase().endsWith(".pdf")
                ? uploadedName.substring(0, uploadedName.length - 4) + ".pptx"
                : uploadedName + ".pptx";

            a.download = pptxName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            const err = error as Error;
            console.error("Export error:", err);
            alert(`Failed to export to PowerPoint: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{
            maxWidth: "1300px",
            margin: "0 auto",
            padding: "40px 20px",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            backgroundColor: colors.bg,
            color: colors.text,
            minHeight: "100vh",
            transition: "all 0.3s ease"
        }}>
            {/* CSS Stylesheet */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    header, .no-print, button, input[type="button"] {
                        display: none !important;
                    }
                    .slide-card {
                        page-break-after: always !important;
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 40px !important;
                        height: 100vh !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                    }
                }
                
                /* Responsive layout containers */
                .editor-container {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    gap: 40px;
                    align-items: start;
                }
                
                /* Slide card container overrides */
                .slide-card-container {
                    width: 100% !important;
                    aspect-ratio: auto !important; /* Override 16/9 if content grows */
                    min-height: 520px !important;
                    height: auto !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    box-sizing: border-box !important;
                    position: relative !important;
                }
                
                /* Slide inner grid */
                .slide-content-grid {
                    display: grid !important;
                    grid-template-columns: 1.2fr 1fr !important;
                    gap: 36px !important;
                    align-items: center !important;
                    flex-grow: 1 !important;
                    margin-top: 24px !important;
                }
                
                .slide-content-grid.no-visual {
                    grid-template-columns: 1fr !important;
                }
                
                /* Bullet row and dynamic delete button hover states */
                .bullet-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 14px;
                    position: relative;
                }
                
                .bullet-delete-btn {
                    opacity: 0;
                    transition: opacity 0.2s ease-in-out;
                }
                
                .bullet-row:hover .bullet-delete-btn {
                    opacity: 0.6;
                }
                
                .bullet-row:hover .bullet-delete-btn:hover {
                    opacity: 1;
                }
                
                /* Slide image hover controls */
                .slide-image-wrapper:hover .image-hover-controls {
                    opacity: 1 !important;
                }
                
                .image-control-btn {
                    transition: all 0.2s ease;
                }
                .image-control-btn:hover {
                    transform: scale(1.05);
                }
                
                .search-photo-item:hover {
                    transform: scale(1.03);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                }
                .search-photo-item:hover .photo-item-overlay {
                    opacity: 1 !important;
                }

                /* Media query for smaller displays/tablets */
                @media (max-width: 1024px) {
                    .editor-container {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                    .slide-content-grid, .slide-content-layout {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                }
            ` }} />

            <header className="no-print" style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "40px",
                border: `1px solid ${colors.border}`,
                borderRadius: "16px",
                padding: "16px 24px",
                backgroundColor: activeTheme === "dark" ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.4)",
                backdropFilter: "blur(12px)",
                position: "sticky",
                top: "20px",
                zIndex: 100,
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)"
            }}>
                <div>
                    <h1 style={{
                        fontSize: "1.8rem",
                        fontWeight: 800,
                        color: colors.text,
                        letterSpacing: "-0.025em",
                        margin: 0
                    }}>
                        Presentation Editor
                    </h1>
                    <p style={{ color: colors.muted, fontSize: "0.85rem", margin: "2px 0 0 0" }}>
                        Edit slides, adjust diagrams, and download as PowerPoint or PDF.
                    </p>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {/* Theme selector */}
                    <div style={{ display: "flex", gap: "6px", marginRight: "12px" }}>
                        {(Object.keys(themePalettes) as ThemeKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setActiveTheme(key);
                                    localStorage.setItem("theme", key);
                                }}
                                style={{
                                    backgroundColor: themePalettes[key].accent,
                                    border: activeTheme === key ? `2px solid ${colors.text}` : `1px solid ${themePalettes[key].border}`,
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "9999px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    transform: activeTheme === key ? "scale(1.15)" : "scale(1)"
                                }}
                                title={themePalettes[key].name}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handlePrint}
                        style={{
                            backgroundColor: colors.cardBg,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            padding: "8px 16px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        🖨️ Print PDF
                    </button>

                    {slides.length > 0 && (
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            style={{
                                backgroundColor: isExporting ? "#cbd5e1" : colors.accent,
                                color: "#ffffff",
                                padding: "8px 16px",
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                borderRadius: "8px",
                                border: "none",
                                cursor: isExporting ? "not-allowed" : "pointer",
                                boxShadow: `0 4px 6px -1px ${colors.accent}30`,
                                transition: "all 0.2s ease"
                            }}
                        >
                            {isExporting ? "Exporting..." : "💾 PowerPoint"}
                        </button>
                    )}
                </div>
            </header>

            {slides.length === 0 ? (
                <div style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    backgroundColor: colors.cardBg,
                    borderRadius: "16px",
                    border: `1px solid ${colors.border}`
                }}>
                    <p style={{ fontSize: "1.2rem", color: colors.muted }}>
                        No presentation generated yet. <span style={{ textDecoration: "underline", cursor: "pointer", color: colors.accent }} onClick={() => router.push("/upload")}>Upload a document</span> first.
                    </p>
                </div>
            ) : (
                <div className="editor-container">
                    {/* Left Column: Slide Outline Sidebar (Gamma.app style) */}
                    <div className="no-print" style={{
                        position: "sticky",
                        top: "110px",
                        maxHeight: "calc(100vh - 150px)",
                        overflowY: "auto",
                        backgroundColor: colors.cardBg,
                        borderRadius: "16px",
                        border: `1px solid ${colors.border}`,
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.02)"
                    }}>
                        <div style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: colors.muted,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            borderBottom: `1px solid ${colors.border}`,
                            paddingBottom: "8px"
                        }}>
                            Outline ({slides.length} Slides)
                        </div>

                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            overflowY: "auto",
                            maxHeight: "calc(100vh - 280px)",
                            paddingRight: "4px"
                        }}>
                            {slides.map((slide, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        setActiveSlideIndex(idx);
                                        document.getElementById(`slide-card-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "10px 12px",
                                        borderRadius: "10px",
                                        border: `1.5px solid ${activeSlideIndex === idx ? colors.accent : "transparent"}`,
                                        backgroundColor: activeSlideIndex === idx ? colors.accentLight : "transparent",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease"
                                    }}
                                    className="outline-item"
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "70%" }}>
                                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: activeSlideIndex === idx ? colors.accent : colors.muted }}>
                                            {String(idx + 1).padStart(2, "0")}
                                        </span>
                                        <span style={{
                                            fontSize: "0.85rem",
                                            fontWeight: 600,
                                            color: colors.text,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis"
                                        }}>
                                            {slide.title || `Untitled Slide`}
                                        </span>
                                    </div>

                                    {/* Sidebar outline actions */}
                                    <div style={{ display: "flex", gap: "2px" }}>
                                        <button
                                            disabled={idx === 0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMoveSlide(idx, idx - 1);
                                                setActiveSlideIndex(idx - 1);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "none",
                                                color: idx === 0 ? "rgba(0,0,0,0.15)" : colors.muted,
                                                cursor: idx === 0 ? "not-allowed" : "pointer",
                                                padding: "2px",
                                                fontSize: "0.75rem"
                                            }}
                                            title="Move Up"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            disabled={idx === slides.length - 1}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMoveSlide(idx, idx + 1);
                                                setActiveSlideIndex(idx + 1);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "none",
                                                color: idx === slides.length - 1 ? "rgba(0,0,0,0.15)" : colors.muted,
                                                cursor: idx === slides.length - 1 ? "not-allowed" : "pointer",
                                                padding: "2px",
                                                fontSize: "0.75rem"
                                            }}
                                            title="Move Down"
                                        >
                                            ▼
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSlide(idx);
                                            }}
                                            style={{
                                                border: "none",
                                                background: "none",
                                                color: "#ef4444",
                                                cursor: "pointer",
                                                padding: "2px",
                                                fontSize: "0.75rem"
                                            }}
                                            title="Delete Slide"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleAddSlide}
                            style={{
                                backgroundColor: colors.accentLight,
                                border: `1px dashed ${colors.accent}`,
                                color: colors.accent,
                                padding: "10px",
                                borderRadius: "10px",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                transition: "all 0.2s ease"
                            }}
                        >
                            ➕ Add Blank Slide
                        </button>
                    </div>

                    {/* Right Column: Main Slide Content */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "40px", width: "100%" }}>
                        {slides.map((slide, index) => {
                            const hasBgImage = !!(slide.image && slide.image.position === "background" && slide.image.url);
                            const cardBackgroundStyle = hasBgImage 
                                ? `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url(${slide.image?.url})`
                                : (slide.custom_bg || colors.cardBg);

                            const isDark = hasBgImage || isDarkBackground(slide.custom_bg, slide.custom_bg_type, activeTheme);
                            const slideTextColor = isDark ? "#f8fafc" : colors.text;
                            const slideMutedColor = isDark ? "#cbd5e1" : colors.muted;
                            const slideBorderColor = isDark ? "rgba(255, 255, 255, 0.15)" : colors.border;
                            const slideBulletBg = isDark ? "rgba(255, 255, 255, 0.1)" : colors.accentLight;
                            const slideBulletBorder = isDark ? "rgba(255, 255, 255, 0.3)" : colors.accent;
                            const slideBulletColor = isDark ? "#f8fafc" : colors.accent;
                            const isMultiColumnLayout = ["two_column", "timeline", "comparison", "cards", "process_flow", "statistics"].includes(slide.layout_type ?? "");
                            const showSideImage = !!(slide.image && 
                                (slide.image.position === "left" || slide.image.position === "right") && 
                                slide.image.url && 
                                slide.layout_type !== "image_text" &&
                                !isMultiColumnLayout);
                            const imagePos = slide.image?.position;

                            return (
                                <div
                                    key={index}
                                    id={`slide-card-${index}`}
                                    className={`slide-card slide-card-container`}
                                    onClick={() => setActiveSlideIndex(index)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (draggedSlideIndex !== index) {
                                            setDraggedSlideIndex(index);
                                        }
                                    }}
                                    onDragLeave={() => {
                                        setDraggedSlideIndex(null);
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDraggedSlideIndex(null);
                                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                            handleImageFileLoad(e.dataTransfer.files[0], index);
                                        }
                                    }}
                                    style={{
                                        background: cardBackgroundStyle,
                                        backgroundSize: hasBgImage ? "cover" : undefined,
                                        backgroundPosition: hasBgImage ? "center" : undefined,
                                        border: `1.5px solid ${activeSlideIndex === index ? colors.accent : slideBorderColor}`,
                                        borderRadius: "24px",
                                        boxShadow: activeSlideIndex === index
                                            ? `0 20px 30px -5px rgba(0, 0, 0, 0.05), 0 0 0 1.5px ${colors.accent}`
                                            : "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
                                        padding: "48px 64px",
                                        transition: "all 0.3s ease",
                                        position: "relative"
                                    }}
                                >
                                {/* Slide Header (Stylized number + title input) */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    borderBottom: `1px solid ${slideBorderColor}`,
                                    paddingBottom: "16px"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%" }}>
                                        <span style={{
                                            fontSize: "1.4rem",
                                            fontWeight: 800,
                                            color: colors.accent,
                                            fontFamily: "monospace",
                                            opacity: 0.8
                                        }}>
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <AutoGrowingTextarea
                                            value={slide.title}
                                            onChange={(val) => handleUpdateTitle(index, val)}
                                            style={{
                                                fontSize: "1.8rem",
                                                fontWeight: 800,
                                                color: slideTextColor,
                                                backgroundColor: "transparent",
                                                border: "1px solid transparent",
                                                borderRadius: "6px",
                                                width: "80%",
                                                padding: "4px 8px",
                                                fontFamily: "Georgia, serif",
                                                outline: "none"
                                            }}
                                        />
                                    </div>

                                    {/* Action items on card */}
                                    <div className="no-print" style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            onClick={() => handleDeleteSlide(index)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#ef4444",
                                                cursor: "pointer",
                                                fontSize: "0.85rem",
                                                fontWeight: 600,
                                                opacity: 0.6
                                            }}
                                            className="hover:opacity-100"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>                                {/* Slide Layout Renderer Switcher */}
                                <div style={{ 
                                    display: "grid", 
                                    gridTemplateColumns: showSideImage ? (imagePos === "left" ? "1fr 1.2fr" : "1.2fr 1fr") : "1fr", 
                                    gap: "36px", 
                                    alignItems: "center",
                                    width: "100%", 
                                    marginTop: "24px" 
                                }}>
                                    {/* Left Side Image */}
                                    {showSideImage && imagePos === "left" && (
                                        <div style={{ width: "100%" }}>
                                            {renderSlideImage(slide, index)}
                                        </div>
                                    )}

                                    {/* Top Image */}
                                    {slide.image && slide.image.position === "top" && slide.image.url && slide.layout_type !== "title" && slide.layout_type !== "image_text" && (
                                        <div style={{ width: "100%", marginBottom: "20px", gridColumn: showSideImage ? "span 2" : "auto" }}>
                                            {renderSlideImage(slide, index)}
                                        </div>
                                    )}

                                    {/* Main content of the layout */}
                                    <div style={{ width: "100%" }}>
                                        {(() => {
                                            const currentLayout = slide.layout_type || "bullet_list";

                                            if (currentLayout === "title") {
                                                const titleAlign = showSideImage ? "left" : "center";
                                                return (
                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: showSideImage ? "flex-start" : "center", justifyContent: "center", width: "100%", minHeight: "260px", textAlign: titleAlign }}>
                                                        <AutoGrowingTextarea
                                                            value={slide.subtitle || ""}
                                                            onChange={(val) => handleUpdateSubtitle(index, val)}
                                                            placeholder="Add subtitle or presenter info..."
                                                            style={{
                                                                fontSize: "1.2rem",
                                                                color: slideMutedColor,
                                                                backgroundColor: "transparent",
                                                                border: "none",
                                                                textAlign: titleAlign,
                                                                outline: "none",
                                                                width: "80%",
                                                                marginBottom: "12px",
                                                                fontStyle: "italic"
                                                            }}
                                                        />
                                                        <div style={{ width: "60px", height: "4px", backgroundColor: colors.accent, borderRadius: "2px", margin: showSideImage ? "16px 0" : "16px auto" }} />
                                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: showSideImage ? "flex-start" : "center", marginTop: "10px" }}>
                                                            {slide.content.map((point, i) => (
                                                                <div key={i} style={{ fontSize: "0.95rem", color: slideTextColor }}>
                                                                    {point}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (currentLayout === "bullet_list") {
                                                return (
                                                    <div style={{ width: "100%" }}>
                                                        {slide.subtitle && (
                                                            <AutoGrowingTextarea
                                                                value={slide.subtitle}
                                                                onChange={(val) => handleUpdateSubtitle(index, val)}
                                                                style={{ fontSize: "1.1rem", color: slideMutedColor, backgroundColor: "transparent", border: "none", width: "100%", padding: "4px 8px", outline: "none", marginBottom: "12px" }}
                                                            />
                                                        )}
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                                            {slide.content.map((point, i) => (
                                                                <div key={i} className="bullet-row">
                                                                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: slideBulletBg, border: `1.5px solid ${slideBulletBorder}`, marginTop: "6px", fontSize: "0.65rem", color: slideBulletColor, fontWeight: "bold", flexShrink: 0 }}>✓</span>
                                                                    <AutoGrowingTextarea
                                                                        value={point}
                                                                        onChange={(val) => handleUpdateBullet(index, i, val)}
                                                                        style={{ fontSize: "1.05rem", color: slideTextColor, backgroundColor: "transparent", border: "none", width: "100%", outline: "none", flexGrow: 1 }}
                                                                    />
                                                                    <button className="no-print bullet-delete-btn" onClick={() => handleDeleteBullet(index, i)} style={{ color: "#ef4444", backgroundColor: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem", padding: "0 8px" }}>×</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center" }}>
                                                            <button className="no-print" onClick={() => handleAddBullet(index)} style={{ color: colors.accent, backgroundColor: "transparent", border: "none", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", marginTop: "20px", display: "inline-flex", alignItems: "center", gap: "4px" }}>➕ Add Point</button>
                                                            {(!slide.image || slide.image.position === "none") && (
                                                                <button className="no-print" onClick={() => openImageSearch(index, slide.image_keyword || slide.title || "")} style={{ color: colors.accent, backgroundColor: "transparent", border: "none", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", marginTop: "20px", marginLeft: "16px", display: "inline-flex", alignItems: "center", gap: "4px" }}>🖼️ Add Image</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (currentLayout === "two_column") {
                                                const mid = Math.ceil(slide.content.length / 2);
                                                const col1 = slide.content.slice(0, mid);
                                                const col2 = slide.content.slice(mid);
                                                return (
                                                    <div style={{ width: "100%" }}>
                                                        {slide.subtitle && (
                                                            <AutoGrowingTextarea
                                                                value={slide.subtitle}
                                                                onChange={(val) => handleUpdateSubtitle(index, val)}
                                                                style={{ fontSize: "1.1rem", color: slideMutedColor, backgroundColor: "transparent", border: "none", width: "100%", padding: "4px 8px", outline: "none", marginBottom: "12px" }}
                                                            />
                                                        )}
                                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginTop: "12px" }}>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                                {col1.map((point, i) => (
                                                                    <div key={i} className="bullet-row">
                                                                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: slideBulletBg, border: `1.5px solid ${slideBulletBorder}`, marginTop: "6px", fontSize: "0.65rem", color: slideBulletColor, fontWeight: "bold", flexShrink: 0 }}>✓</span>
                                                                        <AutoGrowingTextarea
                                                                            value={point}
                                                                            onChange={(val) => handleUpdateBullet(index, i, val)}
                                                                            style={{ fontSize: "1rem", color: slideTextColor, backgroundColor: "transparent", border: "none", width: "100%", outline: "none" }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                                {col2.map((point, i) => {
                                                                    const actualIdx = mid + i;
                                                                    return (
                                                                        <div key={i} className="bullet-row">
                                                                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: slideBulletBg, border: `1.5px solid ${slideBulletBorder}`, marginTop: "6px", fontSize: "0.65rem", color: slideBulletColor, fontWeight: "bold", flexShrink: 0 }}>✓</span>
                                                                            <AutoGrowingTextarea
                                                                                value={point}
                                                                                onChange={(val) => handleUpdateBullet(index, actualIdx, val)}
                                                                                style={{ fontSize: "1rem", color: slideTextColor, backgroundColor: "transparent", border: "none", width: "100%", outline: "none" }}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        <button className="no-print" onClick={() => handleAddBullet(index)} style={{ color: colors.accent, backgroundColor: "transparent", border: "none", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", marginTop: "20px", display: "inline-flex", alignItems: "center", gap: "4px" }}>➕ Add Point</button>
                                                    </div>
                                                );
                                            }

                                            if (currentLayout === "timeline") {
                                                const timeline = slide.timeline_data || [];
                                                return (
                                                    <div style={{ width: "100%" }}>
                                                        {slide.subtitle && (
                                                            <AutoGrowingTextarea
                                                                value={slide.subtitle}
                                                                onChange={(val) => handleUpdateSubtitle(index, val)}
                                                                style={{ fontSize: "1.1rem", color: slideMutedColor, backgroundColor: "transparent", border: "none", width: "100%", padding: "4px 8px", outline: "none", marginBottom: "16px" }}
                                                            />
                                                        )}
                                                        <div style={{ position: "relative", padding: "20px 0" }}>
                                                            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "4px", backgroundColor: colors.accent, borderRadius: "2px", zIndex: 1, transform: "translateY(-50%)" }} />
                                                            <div style={{ display: "grid", gridTemplateColumns: `repeat(${timeline.length || 1}, 1fr)`, gap: "16px", zIndex: 2, position: "relative" }}>
                                                                {timeline.map((item, idx) => (
                                                                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                                                        <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: colors.cardBg, border: `4px solid ${colors.accent}`, marginBottom: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
                                                                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: colors.accent }}>{item.label}</div>
                                                                        {item.detail && <div style={{ fontSize: "0.8rem", color: slideTextColor, marginTop: "6px", lineHeight: 1.4, opacity: 0.8 }}>{item.detail}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (currentLayout === "comparison") {
                                                const comp = slide.comparison_table || { headers: ["Criteria", "Option A", "Option B"], rows: [] };
                                                return (
                                                    <div style={{ width: "100%" }}>
                                                        {slide.subtitle && (
                                                            <AutoGrowingTextarea
                                                                value={slide.subtitle}
                                                                onChange={(val) => handleUpdateSubtitle(index, val)}
                                                                style={{ fontSize: "1.1rem", color: slideMutedColor, backgroundColor: "transparent", border: "none", width: "100%", padding: "4px 8px", outline: "none", marginBottom: "16px" }}
                                                            />
                                                        )}
                                                        <div style={{ overflowX: "auto", marginTop: "12px" }}>
                                                            <table style={{ width: "100%", borderCollapse: "collapse", border: `1.5px solid ${slideBorderColor}` }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: colors.accent, color: "#ffffff" }}>
                                                                        {comp.headers.map((h, colIdx) => (
                                                                            <th key={colIdx} style={{ padding: "12px", textAlign: "left", fontSize: "0.9rem", fontWeight: 700, border: `1px solid ${slideBorderColor}` }}>
                                                                                {h}
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {comp.rows.map((row, rIdx) => (
                                                                        <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? "rgba(0,0,0,0.02)" : "transparent" }}>
                                                                            {row.map((cell, cIdx) => (
                                                                                <td key={cIdx} style={{ padding: "12px", fontSize: "0.85rem", color: slideTextColor, border: `1px solid ${slideBorderColor}` }}>
                                                                                    {cell}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (currentLayout === "cards") {
                                                return (
                                                    <div style={{ width: "100%" }}>
                                                        {slide.subtitle && (
                                                            <AutoGrowingTextarea
                                                                value={slide.subtitle}
                                                                onChange={(val) => handleUpdateSubtitle(index, val)}
                                                                style={{ fontSize: "1.1rem", color: slideMutedColor, backgroundColor: "transparent", border: "none", width: "100%", padding: "4px 8px", outline: "none", marginBottom: "16px" }}
                                                            />
                                                        )}
                                                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(3, slide.content.length) || 1}, 1fr)`, gap: "20px", marginTop: "12px" }}>
                                                            {slide.content.map((point, idx) => {
                                                                const [cTitle, ...cBody] = point.split(": ");
                                                                const hasSplit = cBody.length > 0;
                                                                return (
                                                                    <div key={idx} style={{ backgroundColor: colors.cardBg, border: `1.5px solid ${colors.accent}20`, borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                                                                        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: colors.accent }}>{hasSplit ? cTitle : `Pillar ${idx + 1}`}</div>
                                                                        <div style={{ fontSize: "0.9rem", color: slideTextColor, lineHeight: 1.5, opacity: 0.9 }}>{hasSplit ? cBody.join(": ") : point}</div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (currentLayout === "process_flow") {
                                                return (
                                                    <div style={{ width: "100%" }}>
                                                        {slide.subtitle && (
                                                            <AutoGrowingTextarea
                                                                value={slide.subtitle}
                                                                onChange={(val) => handleUpdateSubtitle(index, val)}
                                                                style={{ fontSize: "1.1rem", color: slideMutedColor, backgroundColor: "transparent", border: "none", width: "100%", padding: "4px 8px", outline: "none", marginBottom: "16px" }}
                                                            />
                                                        )}
                                                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", marginTop: "12px" }}>
                                                            {slide.content.map((step, idx) => {
                                                                const textContent = step.includes(":") ? step.split(":").slice(1).join(":").trim() : step;
                                                                const stepTitle = step.includes(":") ? step.split(":")[0].trim() : `Step ${idx+1}`;
                                                                return (
                                                                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                                        <div style={{ backgroundColor: colors.accentLight, border: `2px solid ${colors.accent}`, borderRadius: "12px", padding: "16px 20px", width: "170px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                                                                            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: colors.accent, marginBottom: "6px" }}>{stepTitle}</div>
                                                                            <div style={{ fontSize: "0.85rem", color: colors.text, fontWeight: 500, lineHeight: 1.4 }}>{textContent || step}</div>
                                                                        </div>
                                                                        {idx < slide.content.length - 1 && (
                                                                            <span style={{ fontSize: "1.6rem", color: colors.accent, fontWeight: "bold" }}>➔</span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (currentLayout === "statistics") {
                                                const mainStat = slide.content[0] || "100%";
                                                const chart = slide.chart_data || { type: "bar", labels: [], values: [] };
                                                return (
                                                    <div style={{ width: "100%" }}>
                                                        {slide.subtitle && (
                                                            <AutoGrowingTextarea
                                                                value={slide.subtitle}
                                                                onChange={(val) => handleUpdateSubtitle(index, val)}
                                                                style={{ fontSize: "1.1rem", color: slideMutedColor, backgroundColor: "transparent", border: "none", width: "100%", padding: "4px 8px", outline: "none", marginBottom: "16px" }}
                                                            />
                                                        )}
                                                        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "36px", alignItems: "center", marginTop: "12px" }}>
                                                            <div>
                                                                <div style={{ fontSize: "3.8rem", fontWeight: 900, color: colors.accent, lineHeight: 1 }}>{mainStat}</div>
                                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                                                                    {slide.content.slice(1).map((p, i) => (
                                                                        <div key={i} style={{ fontSize: "0.95rem", color: slideTextColor, opacity: 0.9 }}>• {p}</div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div style={{ borderLeft: `2px solid ${slideBorderColor}`, paddingLeft: "30px" }}>
                                                                {chart.labels.length > 0 && (
                                                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: colors.accent, textTransform: "uppercase" }}>{chart.title || "Analytics Overview"}</div>
                                                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                                            {chart.labels.map((lbl, idx) => {
                                                                                const val = chart.values[idx] || 0;
                                                                                const maxVal = Math.max(...chart.values, 1);
                                                                                const pct = (val / maxVal) * 100;
                                                                                return (
                                                                                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: slideTextColor }}>
                                                                                            <span>{lbl}</span>
                                                                                            <span style={{ fontWeight: "bold" }}>{val}</span>
                                                                                        </div>
                                                                                        <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                                                                                            <div style={{ width: `${pct}%`, height: "100%", backgroundColor: colors.accent }} />
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (currentLayout === "image_text") {
                                                return (
                                                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "36px", alignItems: "center", width: "100%" }}>
                                                        <div>
                                                            {slide.subtitle && (
                                                                <AutoGrowingTextarea
                                                                    value={slide.subtitle}
                                                                    onChange={(val) => handleUpdateSubtitle(index, val)}
                                                                    style={{ fontSize: "1.1rem", color: slideMutedColor, backgroundColor: "transparent", border: "none", width: "100%", padding: "4px 8px", outline: "none", marginBottom: "16px" }}
                                                                />
                                                            )}
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                                {slide.content.map((point, i) => (
                                                                    <div key={i} className="bullet-row">
                                                                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: slideBulletBg, border: `1.5px solid ${slideBulletBorder}`, marginTop: "6px", fontSize: "0.65rem", color: slideBulletColor, fontWeight: "bold", flexShrink: 0 }}>✓</span>
                                                                        <AutoGrowingTextarea
                                                                            value={point}
                                                                            onChange={(val) => handleUpdateBullet(index, i, val)}
                                                                            style={{ fontSize: "1rem", color: slideTextColor, backgroundColor: "transparent", border: "none", width: "100%", outline: "none" }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {renderSlideImage(slide, index) || (
                                                                <div onClick={() => openImageSearch(index, slide.image_keyword || slide.title || "")} style={{ border: `2px dashed ${slideBorderColor}`, borderRadius: "12px", padding: "40px", textAlign: "center", cursor: "pointer", color: colors.accent, fontWeight: "bold" }}>
                                                                    🖼️ Add Slide Image
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (currentLayout === "quote") {
                                                return (
                                                    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", textAlign: "center", position: "relative", padding: "20px 40px" }}>
                                                        <span style={{ fontSize: "6rem", position: "absolute", left: "10px", top: "-20px", color: colors.accent, opacity: 0.15, fontFamily: "Georgia, serif" }}>“</span>
                                                        <AutoGrowingTextarea
                                                            value={slide.content[0] || ""}
                                                            onChange={(val) => handleUpdateBullet(index, 0, val)}
                                                            placeholder="Paste or write quote details..."
                                                            style={{ fontSize: "1.5rem", fontStyle: "italic", fontWeight: 600, color: colors.accent, backgroundColor: "transparent", border: "none", textAlign: "center", outline: "none", width: "90%", lineHeight: 1.5 }}
                                                        />
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "24px", width: "100%" }}>
                                                            <span style={{ height: "1.5px", width: "24px", backgroundColor: colors.accent }} />
                                                            <input
                                                                value={slide.subtitle || ""}
                                                                onChange={(e) => handleUpdateSubtitle(index, e.target.value)}
                                                                placeholder="Quote Author Name"
                                                                style={{ fontSize: "1rem", fontWeight: "bold", color: slideTextColor, backgroundColor: "transparent", border: "none", outline: "none", textAlign: "center", width: "200px" }}
                                                            />
                                                        </div>
                                                        <span style={{ fontSize: "6rem", position: "absolute", right: "10px", bottom: "-40px", color: colors.accent, opacity: 0.15, fontFamily: "Georgia, serif" }}>”</span>
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })()}
                                    </div>

                                    {showSideImage && imagePos === "right" && (
                                        <div style={{ width: "100%" }}>
                                            {renderSlideImage(slide, index)}
                                        </div>
                                    )}
                                </div>

                                {/* Slide Customization Panel (Gamma style) */}
                                {activeSlideIndex === index && (
                                    <div className="no-print" style={{
                                        marginTop: "32px",
                                        paddingTop: "24px",
                                        borderTop: `1px solid ${slideBorderColor}`,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "20px"
                                    }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                                            {/* Layout Type Switcher */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: slideMutedColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    Slide Layout
                                                </span>
                                                <select
                                                    value={slide.layout_type || "bullet_list"}
                                                    onChange={(e) => handleUpdateLayoutType(index, e.target.value as any)}
                                                    style={{
                                                        padding: "8px 12px",
                                                        fontSize: "0.85rem",
                                                        borderRadius: "8px",
                                                        backgroundColor: colors.cardBg,
                                                        color: colors.text,
                                                        border: `1.5px solid ${slideBorderColor}`,
                                                        outline: "none"
                                                    }}
                                                >
                                                    <option value="title">Title Slide</option>
                                                    <option value="bullet_list">Bullet List</option>
                                                    <option value="two_column">Two Column</option>
                                                    <option value="timeline">Timeline</option>
                                                    <option value="comparison">Comparison Table</option>
                                                    <option value="cards">Cards Grid</option>
                                                    <option value="process_flow">Process Flow</option>
                                                    <option value="statistics">Statistics & Chart</option>
                                                    <option value="image_text">Image + Text</option>
                                                    <option value="quote">Quote Block</option>
                                                </select>
                                            </div>

                                            {/* Subtitle Input */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: slideMutedColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    Slide Subtitle
                                                </span>
                                                <input
                                                    type="text"
                                                    value={slide.subtitle || ""}
                                                    onChange={(e) => handleUpdateSubtitle(index, e.target.value)}
                                                    placeholder="Sub-heading or details..."
                                                    style={{
                                                        padding: "8px 12px",
                                                        fontSize: "0.85rem",
                                                        borderRadius: "8px",
                                                        backgroundColor: colors.cardBg,
                                                        color: colors.text,
                                                        border: `1.5px solid ${slideBorderColor}`,
                                                        outline: "none"
                                                    }}
                                                />
                                            </div>

                                            {/* Image keyword lookup */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: slideMutedColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    Image Keyword
                                                </span>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <input
                                                        type="text"
                                                        value={slide.image_search_prompt || slide.image_keyword || ""}
                                                        onChange={(e) => handleUpdateImageSearchPrompt(index, e.target.value)}
                                                        placeholder="Unsplash query keyword..."
                                                        style={{
                                                            padding: "8px 12px",
                                                            fontSize: "0.85rem",
                                                            borderRadius: "8px",
                                                            backgroundColor: colors.cardBg,
                                                            color: colors.text,
                                                            border: `1.5px solid ${slideBorderColor}`,
                                                            outline: "none",
                                                            flexGrow: 1
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => openImageSearch(index, slide.image_search_prompt || slide.image_keyword || "")}
                                                        style={{
                                                            padding: "8px 12px",
                                                            fontSize: "0.85rem",
                                                            backgroundColor: colors.accent,
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            fontWeight: "bold",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        Search
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Icon suggestion tags */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: slideMutedColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    Icon Suggestions
                                                </span>
                                                <input
                                                    type="text"
                                                    value={(slide.icon_suggestions || []).join(", ")}
                                                    onChange={(e) => handleUpdateIconSuggestions(index, e.target.value)}
                                                    placeholder="rocket, lightbulb, smile..."
                                                    style={{
                                                        padding: "8px 12px",
                                                        fontSize: "0.85rem",
                                                        borderRadius: "8px",
                                                        backgroundColor: colors.cardBg,
                                                        color: colors.text,
                                                        border: `1.5px solid ${slideBorderColor}`,
                                                        outline: "none"
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Dynamic Specific Layout Editors */}
                                        {slide.layout_type === "timeline" && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "12px", border: `1px solid ${slideBorderColor}` }}>
                                                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: colors.accent }}>📅 Edit Timeline Phases</span>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                    {(slide.timeline_data || []).map((item, itemIdx) => (
                                                        <div key={itemIdx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                            <input
                                                                type="text"
                                                                value={item.label}
                                                                onChange={(e) => handleUpdateTimelineItem(index, itemIdx, "label", e.target.value)}
                                                                placeholder="Phase/Milestone Label"
                                                                style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", backgroundColor: colors.cardBg, color: colors.text, border: `1px solid ${slideBorderColor}`, width: "150px" }}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={item.detail || ""}
                                                                onChange={(e) => handleUpdateTimelineItem(index, itemIdx, "detail", e.target.value)}
                                                                placeholder="Details..."
                                                                style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", backgroundColor: colors.cardBg, color: colors.text, border: `1px solid ${slideBorderColor}`, flexGrow: 1 }}
                                                            />
                                                            <button onClick={() => handleDeleteTimelineItem(index, itemIdx)} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}>×</button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => handleAddTimelineItem(index)} style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "6px", backgroundColor: colors.accentLight, color: colors.accent, border: "none", cursor: "pointer", fontWeight: "bold", width: "max-content", marginTop: "8px" }}>+ Add Milestone</button>
                                            </div>
                                        )}

                                        {slide.layout_type === "comparison" && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "12px", border: `1px solid ${slideBorderColor}` }}>
                                                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: colors.accent }}>⚖️ Edit Comparison Matrix</span>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowX: "auto" }}>
                                                    {/* Table headers */}
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        {(slide.comparison_table?.headers || []).map((h, colIdx) => (
                                                            <input
                                                                key={colIdx}
                                                                type="text"
                                                                value={h}
                                                                onChange={(e) => handleUpdateComparisonHeader(index, colIdx, e.target.value)}
                                                                style={{ padding: "6px 10px", fontSize: "0.8rem", fontWeight: "bold", borderRadius: "6px", backgroundColor: colors.accentLight, color: colors.accent, border: `1px solid ${slideBorderColor}`, width: "120px" }}
                                                            />
                                                        ))}
                                                    </div>
                                                    {/* Table rows */}
                                                    {(slide.comparison_table?.rows || []).map((row, rIdx) => (
                                                        <div key={rIdx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                            {row.map((cell, cIdx) => (
                                                                <input
                                                                    key={cIdx}
                                                                    type="text"
                                                                    value={cell}
                                                                    onChange={(e) => handleUpdateComparisonCell(index, rIdx, cIdx, e.target.value)}
                                                                    style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", backgroundColor: colors.cardBg, color: colors.text, border: `1px solid ${slideBorderColor}`, width: "120px" }}
                                                                />
                                                            ))}
                                                            <button onClick={() => handleDeleteComparisonRow(index, rIdx)} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}>×</button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => handleAddComparisonRow(index)} style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "6px", backgroundColor: colors.accentLight, color: colors.accent, border: "none", cursor: "pointer", fontWeight: "bold", width: "max-content", marginTop: "8px" }}>+ Add Compare Row</button>
                                            </div>
                                        )}

                                        {slide.layout_type === "statistics" && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "12px", border: `1px solid ${slideBorderColor}` }}>
                                                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: colors.accent }}>📊 Edit Statistics & Chart Data</span>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                                                    <input
                                                        type="text"
                                                        value={slide.chart_data?.title || ""}
                                                        onChange={(e) => handleUpdateChartData(index, "title", e.target.value)}
                                                        placeholder="Chart Title"
                                                        style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", backgroundColor: colors.cardBg, color: colors.text, border: `1px solid ${slideBorderColor}`, width: "200px" }}
                                                    />
                                                    <select
                                                        value={slide.chart_data?.type || "bar"}
                                                        onChange={(e) => handleUpdateChartData(index, "type", e.target.value)}
                                                        style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", backgroundColor: colors.cardBg, color: colors.text, border: `1px solid ${slideBorderColor}` }}
                                                    >
                                                        <option value="bar">Bar Chart</option>
                                                        <option value="line">Line Chart</option>
                                                        <option value="pie">Pie Chart</option>
                                                    </select>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                                                    {slide.chart_data?.labels.map((lbl, lblIdx) => (
                                                        <div key={lblIdx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                            <input
                                                                type="text"
                                                                value={lbl}
                                                                onChange={(e) => handleUpdateChartItem(index, lblIdx, "label", e.target.value)}
                                                                placeholder="Label (e.g., Q1)"
                                                                style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", backgroundColor: colors.cardBg, color: colors.text, border: `1px solid ${slideBorderColor}`, width: "120px" }}
                                                            />
                                                            <input
                                                                type="number"
                                                                value={slide.chart_data?.values[lblIdx] || 0}
                                                                onChange={(e) => handleUpdateChartItem(index, lblIdx, "value", e.target.value)}
                                                                placeholder="Value (e.g., 85)"
                                                                style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", backgroundColor: colors.cardBg, color: colors.text, border: `1px solid ${slideBorderColor}`, width: "80px" }}
                                                            />
                                                            <button onClick={() => handleDeleteChartItem(index, lblIdx)} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}>×</button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => handleAddChartItem(index)} style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "6px", backgroundColor: colors.accentLight, color: colors.accent, border: "none", cursor: "pointer", fontWeight: "bold", width: "max-content", marginTop: "8px" }}>+ Add Chart Item</button>
                                            </div>
                                        )}

                                        {/* Background Styling Preset Section */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: slideMutedColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                Background Styling
                                            </span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <button
                                                    onClick={() => handleUpdateSlideBackground(index, "", "theme")}
                                                    style={{
                                                        width: "28px",
                                                        height: "28px",
                                                        borderRadius: "50%",
                                                        border: `2px solid ${(!slide.custom_bg || slide.custom_bg_type === "theme") ? colors.accent : slideBorderColor}`,
                                                        background: colors.cardBg,
                                                        cursor: "pointer",
                                                        position: "relative",
                                                        transition: "all 0.2s"
                                                    }}
                                                    title="Theme Default"
                                                >
                                                    <span style={{ fontSize: "0.6rem", color: colors.text, position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</span>
                                                </button>

                                                {BACKGROUND_PRESETS.map((preset) => {
                                                    const isSelected = slide.custom_bg === preset.value && slide.custom_bg_type === preset.type;
                                                    return (
                                                        <button
                                                            key={preset.name}
                                                            onClick={() => handleUpdateSlideBackground(index, preset.value, preset.type)}
                                                            style={{
                                                                width: "28px",
                                                                height: "28px",
                                                                borderRadius: "50%",
                                                                border: `2px solid ${isSelected ? colors.accent : slideBorderColor}`,
                                                                background: preset.value,
                                                                cursor: "pointer",
                                                                transition: "all 0.2s"
                                                            }}
                                                            title={preset.name}
                                                        />
                                                    );
                                                })}

                                                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                                    <input
                                                        type="color"
                                                        value={slide.custom_bg_type === "solid" && slide.custom_bg?.startsWith("#") ? slide.custom_bg : "#ffffff"}
                                                        onChange={(e) => handleUpdateSlideBackground(index, e.target.value, "solid")}
                                                        style={{
                                                            opacity: 0,
                                                            position: "absolute",
                                                            inset: 0,
                                                            width: "28px",
                                                            height: "28px",
                                                            cursor: "pointer",
                                                            zIndex: 2
                                                        }}
                                                        title="Custom Solid Color"
                                                    />
                                                    <div style={{
                                                        width: "28px",
                                                        height: "28px",
                                                        borderRadius: "50%",
                                                        border: `2px solid ${slide.custom_bg_type === "solid" && !BACKGROUND_PRESETS.some(p => p.value === slide.custom_bg) ? colors.accent : slideBorderColor}`,
                                                        background: "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)",
                                                        zIndex: 1,
                                                        pointerEvents: "none"
                                                    }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Drag Drop Image Overlay */}
                                {draggedSlideIndex === index && (
                                    <div style={{
                                        position: "absolute",
                                        inset: 0,
                                        backgroundColor: "rgba(79, 70, 229, 0.2)",
                                        backdropFilter: "blur(6px)",
                                        border: `3px dashed ${colors.accent}`,
                                        borderRadius: "24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 50,
                                        pointerEvents: "none"
                                    }}>
                                        <div style={{
                                            backgroundColor: colors.cardBg,
                                            border: `1.5px solid ${colors.border}`,
                                            padding: "20px 32px",
                                            borderRadius: "16px",
                                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
                                            fontSize: "1.1rem",
                                            fontWeight: 800,
                                            color: colors.accent,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px"
                                        }}>
                                            📥 Drop Image File Here to Set Slide Image
                                        </div>
                                    </div>
                                )}
                            </div>
                        )})}

                        <button
                            className="no-print"
                            onClick={handleAddSlide}
                            style={{
                                border: `2px dashed ${colors.border}`,
                                color: colors.muted,
                                backgroundColor: "transparent",
                                padding: "24px",
                                borderRadius: "20px",
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px"
                            }}
                        >
                            ➕ Add New Blank Slide
                        </button>
                    </div>
                </div>
            )}
            {/* Unsplash Image Search Modal Dialog */}
            {searchModalOpen && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.7)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    animation: "fadeIn 0.2s ease-out"
                }}>
                    <div style={{
                        backgroundColor: colors.cardBg,
                        border: `1.5px solid ${colors.border}`,
                        borderRadius: "24px",
                        width: "550px",
                        maxWidth: "90%",
                        padding: "28px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: colors.text, margin: 0 }}>
                                🖼️ Choose Slide Image
                            </h3>
                            <button
                                onClick={() => {
                                    setSearchModalOpen(false);
                                    setActiveSearchSlideIndex(null);
                                }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "1.5rem",
                                    color: colors.muted,
                                    cursor: "pointer"
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Tab Headers */}
                        <div style={{
                            display: "flex",
                            borderBottom: `1px solid ${colors.border}`,
                            gap: "8px",
                            paddingBottom: "4px"
                        }}>
                            <button
                                onClick={() => setModalTab("search")}
                                style={{
                                    padding: "6px 12px",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    color: modalTab === "search" ? colors.accent : colors.muted,
                                    borderStyle: "none none solid none",
                                    borderWidth: "3px",
                                    borderColor: modalTab === "search" ? colors.accent : "transparent",
                                    background: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                🔍 Web Search (Unsplash)
                            </button>
                            <button
                                onClick={() => setModalTab("upload")}
                                style={{
                                    padding: "6px 12px",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    color: modalTab === "upload" ? colors.accent : colors.muted,
                                    borderStyle: "none none solid none",
                                    borderWidth: "3px",
                                    borderColor: modalTab === "upload" ? colors.accent : "transparent",
                                    background: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                📤 Upload Local Image
                            </button>
                        </div>

                        {modalTab === "search" ? (
                            <>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSearchPhotos();
                                        }}
                                        placeholder="Type keywords e.g. food safety, tech..."
                                        style={{
                                            flexGrow: 1,
                                            padding: "10px 14px",
                                            borderRadius: "10px",
                                            border: `1px solid ${colors.border}`,
                                            backgroundColor: colors.bg,
                                            color: colors.text,
                                            fontSize: "0.95rem",
                                            outline: "none"
                                        }}
                                    />
                                    <button
                                        onClick={handleSearchPhotos}
                                        style={{
                                            backgroundColor: colors.accent,
                                            color: "white",
                                            border: "none",
                                            borderRadius: "10px",
                                            padding: "10px 20px",
                                            fontSize: "0.95rem",
                                            fontWeight: "bold",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Search
                                    </button>
                                </div>

                                <div style={{
                                    maxHeight: "320px",
                                    overflowY: "auto",
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: "12px",
                                    padding: "4px"
                                }}>
                                    {isSearching ? (
                                        <div key="searching-photos" style={{ gridColumn: "span 3", textAlign: "center", padding: "40px 0", color: colors.muted }}>
                                            Searching high-quality photos...
                                        </div>
                                    ) : searchResults.length === 0 ? (
                                        <div key="empty-photos" style={{ gridColumn: "span 3", textAlign: "center", padding: "40px 0", color: colors.muted }}>
                                            No images found. Try searching another keyword.
                                        </div>
                                    ) : (
                                        searchResults.map((photo) => (
                                            <div
                                                key={photo.id}
                                                onClick={() => selectPhoto(photo.url)}
                                                style={{
                                                    borderRadius: "12px",
                                                    overflow: "hidden",
                                                    height: "90px",
                                                    cursor: "pointer",
                                                    border: `2px solid transparent`,
                                                    transition: "all 0.2s ease",
                                                    position: "relative"
                                                }}
                                                className="search-photo-item"
                                            >
                                                <img
                                                    src={photo.thumb || photo.url}
                                                    alt={photo.description}
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                                <div style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    backgroundColor: "rgba(0,0,0,0.2)",
                                                    opacity: 0,
                                                    transition: "opacity 0.2s"
                                                }} className="photo-item-overlay" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setModalDragOver(true);
                                }}
                                onDragLeave={() => {
                                    setModalDragOver(false);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setModalDragOver(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        if (activeSearchSlideIndex !== null) {
                                            handleImageFileLoad(e.dataTransfer.files[0], activeSearchSlideIndex);
                                            setSearchModalOpen(false);
                                            setActiveSearchSlideIndex(null);
                                        }
                                    }
                                }}
                                style={{
                                    border: `2px dashed ${modalDragOver ? colors.accent : colors.border}`,
                                    backgroundColor: modalDragOver ? `${colors.accent}10` : "transparent",
                                    borderRadius: "16px",
                                    padding: "48px 24px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "12px"
                                }}
                                onClick={() => {
                                    const fileInput = document.getElementById("modal-file-upload-input") as HTMLInputElement;
                                    fileInput?.click();
                                }}
                            >
                                <input
                                    id="modal-file-upload-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            if (activeSearchSlideIndex !== null) {
                                                handleImageFileLoad(e.target.files[0], activeSearchSlideIndex);
                                                setSearchModalOpen(false);
                                                setActiveSearchSlideIndex(null);
                                            }
                                        }
                                    }}
                                    style={{ display: "none" }}
                                />
                                <span style={{ fontSize: "2.5rem" }}>📤</span>
                                <div style={{ fontSize: "1rem", fontWeight: "bold", color: colors.text }}>
                                    Drag & drop an image here
                                </div>
                                <div style={{ fontSize: "0.85rem", color: colors.muted }}>
                                    or click to browse local files
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Interactive CSS Diagram Generator Widget
function DiagramWidget({ suggestion, content, colors, diagram }: { suggestion: string; content: string[]; colors: ThemeColors; diagram?: Diagram }) {
    const text = (suggestion || "").toLowerCase();

    // Helper to truncate text for clean layout sizing
    const truncate = (str: string, len: number) => {
        return str.length > len ? str.slice(0, len) + "..." : str;
    };

    // If structured diagram data is provided, render it!
    if (diagram && diagram.type && diagram.type !== "none" && diagram.data && Array.isArray(diagram.data.items) && diagram.data.items.length > 0) {
        const { type, data } = diagram;

        // 1. Process Flow / Business Workflow
        if (type === "flowchart") {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        🔄 {data.title || "Process Flow / Workflow"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "10px 0" }}>
                        {data.items.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                                <div style={{
                                    backgroundColor: colors.cardBg,
                                    border: `1.5px solid ${colors.accent}30`,
                                    borderRadius: "10px",
                                    padding: "12px 16px",
                                    fontSize: "0.85rem",
                                    color: colors.text,
                                    width: "90%",
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px"
                                }}>
                                    <div style={{ fontWeight: 700, color: colors.accent }}>
                                        {item.label}
                                    </div>
                                    {item.detail && (
                                        <div style={{ color: colors.muted, fontSize: "0.78rem", lineHeight: "1.4" }}>
                                            {item.detail}
                                        </div>
                                    )}
                                </div>
                                {idx < data.items.length - 1 && (
                                    <div style={{ fontSize: "1.2rem", color: colors.accent, padding: "4px 0", fontWeight: "bold" }}>↓</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 2. Timeline
        if (type === "timeline") {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        📅 {data.title || "Timeline Roadmap"}
                    </div>
                    <div style={{
                        position: "relative",
                        paddingLeft: "24px",
                        borderLeft: `3px solid ${colors.accent}40`,
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        margin: "10px 0 10px 10px"
                    }}>
                        {data.items.map((item, idx) => (
                            <div key={idx} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "4px" }}>
                                <div style={{
                                    position: "absolute",
                                    left: "-33px",
                                    top: "3px",
                                    width: "15px",
                                    height: "15px",
                                    borderRadius: "50%",
                                    backgroundColor: colors.cardBg,
                                    border: `3px solid ${colors.accent}`,
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                }} />
                                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: colors.accent }}>
                                    {item.label}
                                </div>
                                {item.detail && (
                                    <div style={{ fontSize: "0.78rem", color: colors.muted, lineHeight: "1.4" }}>
                                        {item.detail}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 3. Organizational Chart / Hierarchy
        if (type === "org_chart") {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", alignItems: "center" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em", alignSelf: "flex-start" }}>
                        🏢 {data.title || "Organizational Chart"}
                    </div>
                    <div style={{
                        backgroundColor: colors.accent,
                        color: "#ffffff",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        textAlign: "center",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        width: "80%"
                    }}>
                        {data.root || "Core Hierarchy"}
                    </div>
                    <div style={{ width: "2px", height: "12px", backgroundColor: colors.accent }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        {data.items.map((item, idx) => (
                            <div key={idx} style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: "8px",
                                padding: "10px 12px",
                                fontSize: "0.8rem",
                                color: colors.text,
                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px"
                            }}>
                                <span style={{ fontWeight: 700, color: colors.accent }}>{item.label}</span>
                                {item.detail && <span style={{ color: colors.muted, fontSize: "0.75rem" }}>{item.detail}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 4. Mind Map
        if (type === "mind_map") {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        🧠 {data.title || "Concept Mind Map"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
                        <div style={{
                            backgroundColor: colors.accent,
                            color: "#ffffff",
                            borderRadius: "20px",
                            padding: "10px 16px",
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            textAlign: "center",
                            boxShadow: `0 4px 10px ${colors.accent}30`
                        }}>
                            {data.root || "Core Focus"}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            {data.items.map((item, idx) => (
                                <div key={idx} style={{
                                    backgroundColor: colors.cardBg,
                                    border: `1.5px solid ${colors.border}`,
                                    borderRadius: "10px",
                                    padding: "10px",
                                    fontSize: "0.8rem",
                                    color: colors.text,
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "2px"
                                }}>
                                    <span style={{ fontWeight: 700, color: colors.accent }}>{item.label}</span>
                                    {item.detail && <span style={{ color: colors.muted, fontSize: "0.72rem" }}>{item.detail}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // 5. Decision Tree
        if (type === "decision_tree") {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        🌿 {data.title || "Decision Tree"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            backgroundColor: colors.accent,
                            color: "#ffffff",
                            borderRadius: "6px",
                            padding: "8px 14px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            textAlign: "center"
                        }}>
                            ❓ {data.root || "Decision Choice"}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%" }}>
                            {data.items.map((item, idx) => {
                                const isYes = item.category === "yes";
                                const borderColor = isYes ? "#22c55e" : "#ef4444";
                                const tagColor = isYes ? "#e8f5e9" : "#ffebee";
                                const textTagColor = isYes ? "#2e7d32" : "#c62828";
                                return (
                                    <div key={idx} style={{
                                        backgroundColor: colors.cardBg,
                                        border: `1.5px solid ${borderColor}`,
                                        borderRadius: "8px",
                                        padding: "10px",
                                        fontSize: "0.78rem",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px"
                                    }}>
                                        <span style={{
                                            backgroundColor: tagColor,
                                            color: textTagColor,
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            fontWeight: "bold",
                                            fontSize: "0.7rem",
                                            width: "max-content"
                                        }}>
                                            {isYes ? "YES" : "NO"}
                                        </span>
                                        <span style={{ fontWeight: 700, color: colors.text }}>{item.label}</span>
                                        {item.detail && <span style={{ color: colors.muted, fontSize: "0.72rem" }}>{item.detail}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        }

        // 6. System Architecture
        if (type === "architecture") {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        ⚙️ {data.title || "System Architecture"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        {data.items.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                                <div style={{
                                    backgroundColor: idx % 2 === 0 ? colors.accentLight : colors.accent,
                                    color: idx % 2 === 0 ? colors.text : "#ffffff",
                                    border: `1.5px solid ${colors.accent}40`,
                                    borderRadius: "8px",
                                    padding: "12px 14px",
                                    fontSize: "0.8rem",
                                    width: "95%",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "2px"
                                }}>
                                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span>{item.label}</span>
                                    </div>
                                    {item.detail && <div style={{ fontSize: "0.72rem", opacity: 0.9 }}>{item.detail}</div>}
                                </div>
                                {idx < data.items.length - 1 && (
                                    <div style={{ fontSize: "1rem", color: colors.accent, fontWeight: "bold" }}>↓</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 7. Data Relationship / ERD
        if (type === "erd") {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        📊 {data.title || "ERD Model"}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%" }}>
                        {data.items.map((item, idx) => (
                            <div key={idx} style={{
                                backgroundColor: colors.cardBg,
                                border: `1.5px solid ${colors.accent}40`,
                                borderRadius: "8px",
                                fontSize: "0.75rem",
                                width: "48%",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                            }}>
                                <div style={{
                                    backgroundColor: colors.accent,
                                    color: "#ffffff",
                                    padding: "6px 10px",
                                    fontWeight: "bold",
                                    borderTopLeftRadius: "6px",
                                    borderTopRightRadius: "6px"
                                }}>
                                    {item.label}
                                </div>
                                <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                    {item.detail ? item.detail.split(",").map((field, fIdx) => (
                                        <div key={fIdx} style={{ display: "flex", alignItems: "center", gap: "4px", color: colors.text }}>
                                            <span>•</span>
                                            <span>{field.trim()}</span>
                                        </div>
                                    )) : (
                                        <>
                                            <div>🔑 id (PK)</div>
                                            <div>📝 name</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 8. Matrix
        if (type === "matrix") {
            return (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        📊 {data.title || "Comparison Matrix Grid"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {data.items.map((item, idx) => (
                            <div key={idx} style={{
                                backgroundColor: colors.accentLight,
                                border: `1.5px solid ${colors.border}`,
                                borderRadius: "8px",
                                padding: "10px",
                                fontSize: "0.78rem",
                                color: colors.text,
                                borderLeft: `4px solid ${colors.accent}`,
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px"
                            }}>
                                <span style={{ fontWeight: 700, color: colors.accent }}>{item.label}</span>
                                {item.detail && <span style={{ color: colors.muted, fontSize: "0.72rem", lineHeight: "1.3" }}>{item.detail}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    }

    // --- Legacy String parsing / Fallback behaviour ---

    // 1. Process Flow / Business Workflow
    if (text.includes("process") || text.includes("workflow") || text.includes("flowchart")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🔄 Process Flow / Workflow
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", padding: "10px 0" }}>
                    {content.map((point, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                                backgroundColor: colors.accentLight,
                                border: `1px solid ${colors.accent}40`,
                                borderRadius: "8px",
                                padding: "10px 14px",
                                fontSize: "0.85rem",
                                color: colors.text,
                                fontWeight: 600,
                                maxWidth: "150px",
                                textAlign: "center",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                            }}>
                                <span style={{ color: colors.accent, marginRight: "4px" }}>Step {idx + 1}:</span>
                                {truncate(point, 30)}
                            </div>
                            {idx < content.length - 1 && (
                                <span style={{ fontSize: "1.2rem", color: colors.accent, fontWeight: "bold" }}>➔</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 2. Timeline
    if (text.includes("timeline") || text.includes("schedule") || text.includes("history")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    📅 Chronological Timeline
                </div>
                <div style={{
                    position: "relative",
                    padding: "20px 0",
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    minHeight: "120px",
                    overflowX: "auto"
                }}>
                    <div style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        height: "4px",
                        backgroundColor: colors.accent,
                        borderRadius: "2px",
                        zIndex: 1
                    }} />
                    
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", zIndex: 2, padding: "0 10px" }}>
                        {content.map((point, idx) => (
                            <div key={idx} style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                position: "relative",
                                width: "120px"
                            }}>
                                <div style={{
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: colors.cardBg,
                                    border: `4px solid ${colors.accent}`,
                                    marginBottom: "10px",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                }} />
                                
                                <div style={{
                                    backgroundColor: colors.accentLight,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: "6px",
                                    padding: "6px 8px",
                                    fontSize: "0.75rem",
                                    textAlign: "center",
                                    color: colors.text
                                }}>
                                    <div style={{ fontWeight: 700, color: colors.accent, marginBottom: "2px" }}>
                                        Point {idx + 1}
                                    </div>
                                    {truncate(point, 24)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 3. Organizational Chart / Hierarchy
    if (text.includes("organ") || text.includes("hierarchy") || text.includes("chart")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🏢 Organizational Chart / Hierarchy
                </div>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%"
                }}>
                    <div style={{
                        backgroundColor: colors.accent,
                        color: "#ffffff",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                        Root Level
                    </div>
                    <div style={{ width: "2px", height: "15px", backgroundColor: colors.accent }} />
                    <div style={{ display: "flex", justifyContent: "center", gap: "16px", width: "100%" }}>
                        {content.slice(0, 3).map((point, idx) => (
                            <div key={idx} style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center"
                            }}>
                                <div style={{
                                    backgroundColor: colors.accentLight,
                                    border: `1px solid ${colors.accent}30`,
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                    fontSize: "0.8rem",
                                    color: colors.text,
                                    textAlign: "center",
                                    maxWidth: "110px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                                }}>
                                    <div style={{ fontWeight: 700, color: colors.accent, fontSize: "0.75rem", marginBottom: "2px" }}>
                                        Division {idx + 1}
                                    </div>
                                    {truncate(point, 24)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 4. Mind Map
    if (text.includes("mind") || text.includes("concept")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🧠 Concept Mind Map
                </div>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                    position: "relative",
                    padding: "10px 0"
                }}>
                    <div style={{
                        backgroundColor: colors.accent,
                        color: "#ffffff",
                        borderRadius: "9999px",
                        padding: "10px 20px",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        zIndex: 2,
                        boxShadow: `0 4px 6px -1px ${colors.accent}40`
                    }}>
                        Core Concept
                    </div>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                        width: "100%"
                    }}>
                        {content.slice(0, 3).map((point, idx) => (
                            <div key={idx} style={{
                                backgroundColor: colors.accentLight,
                                border: `1px solid ${colors.border}`,
                                borderRadius: "8px",
                                padding: "8px 12px",
                                fontSize: "0.8rem",
                                color: colors.text,
                                textAlign: "center",
                                maxWidth: "120px"
                            }}>
                                {truncate(point, 25)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 5. Decision Tree
    if (text.includes("decision") || text.includes("tree") || text.includes("branch")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🌿 Decision Tree Node
                </div>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%"
                }}>
                    <div style={{
                        backgroundColor: colors.accent,
                        color: "#ffffff",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        fontSize: "0.8rem",
                        fontWeight: 700
                    }}>
                        Condition / Choice
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "60%", position: "relative" }}>
                        <div style={{ borderLeft: `2px solid ${colors.accent}`, height: "16px" }} />
                        <div style={{ borderRight: `2px solid ${colors.accent}`, height: "16px" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "90%" }}>
                        <div style={{
                            backgroundColor: colors.accentLight,
                            border: `1px solid ${colors.accent}40`,
                            borderRadius: "6px",
                            padding: "8px",
                            fontSize: "0.75rem",
                            maxWidth: "130px",
                            textAlign: "center"
                        }}>
                            <span style={{ fontWeight: "bold", color: "#22c55e", display: "block" }}>[Yes Branch]</span>
                            {truncate(content[0] || "Execute Action A", 30)}
                        </div>
                        <div style={{
                            backgroundColor: colors.accentLight,
                            border: `1px solid ${colors.accent}40`,
                            borderRadius: "6px",
                            padding: "8px",
                            fontSize: "0.75rem",
                            maxWidth: "130px",
                            textAlign: "center"
                        }}>
                            <span style={{ fontWeight: "bold", color: "#ef4444", display: "block" }}>[No Branch]</span>
                            {truncate(content[1] || "Execute Action B", 30)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 6. System Architecture
    if (text.includes("architecture") || text.includes("infrastructure") || text.includes("system")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ⚙️ System Architecture (3-Tier)
                </div>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%"
                }}>
                    <div style={{
                        backgroundColor: colors.accentLight,
                        border: `1px solid ${colors.accent}30`,
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        width: "80%",
                        textAlign: "center"
                    }}>
                        🖥️ Client UI: {truncate(content[0] || "Frontend layer", 35)}
                    </div>
                    <span style={{ fontSize: "1rem", color: colors.accent }}>↓</span>
                    <div style={{
                        backgroundColor: colors.accent,
                        color: "#ffffff",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        width: "80%",
                        textAlign: "center"
                    }}>
                        🚀 App API Server: {truncate(content[1] || "Backend routing", 35)}
                    </div>
                    <span style={{ fontSize: "1rem", color: colors.accent }}>↓</span>
                    <div style={{
                        backgroundColor: colors.accentLight,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        width: "80%",
                        textAlign: "center"
                    }}>
                        🗄️ Storage DB: {truncate(content[2] || "Database records", 35)}
                    </div>
                </div>
            </div>
        );
    }

    // 7. Data Relationship / ERD
    if (text.includes("relationship") || text.includes("database") || text.includes("data") || text.includes("erd")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    📊 Entity-Relationship Diagram (ERD)
                </div>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    gap: "10px",
                    padding: "6px 0"
                }}>
                    <div style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "6px",
                        fontSize: "0.7rem",
                        width: "45%"
                    }}>
                        <div style={{ backgroundColor: colors.accent, color: "#ffffff", padding: "4px 8px", fontWeight: "bold", borderTopLeftRadius: "5px", borderTopRightRadius: "5px" }}>
                            Entity_A
                        </div>
                        <div style={{ padding: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div>🔑 id (PK)</div>
                            <div>📝 name</div>
                            <div>📄 desc</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1 }}>
                        <span style={{ fontSize: "0.7rem", color: colors.accent, fontWeight: "bold" }}>1-to-N</span>
                        <div style={{ height: "2px", backgroundColor: colors.accent, width: "100%" }} />
                    </div>
                    <div style={{
                        backgroundColor: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "6px",
                        fontSize: "0.7rem",
                        width: "45%"
                    }}>
                        <div style={{ backgroundColor: colors.accent, color: "#ffffff", padding: "4px 8px", fontWeight: "bold", borderTopLeftRadius: "5px", borderTopRightRadius: "5px" }}>
                            Entity_B
                        </div>
                        <div style={{ padding: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div>🔑 id (PK)</div>
                            <div>🔗 fk_id (FK)</div>
                            <div>📊 value</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 8. Matrix / Quad categories (Default comparator)
    if (text.includes("matrix") || text.includes("compare") || text.includes("grid") || text.includes("quadrant") || text.includes("table")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    📊 Comparison Matrix Grid
                </div>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px"
                }}>
                    {content.slice(0, 4).map((point, idx) => (
                        <div key={idx} style={{
                            backgroundColor: colors.accentLight,
                            borderRadius: "8px",
                            padding: "12px",
                            fontSize: "0.85rem",
                            color: colors.text,
                            borderLeft: `4px solid ${colors.accent}`,
                            border: `1px solid ${colors.border}`
                        }}>
                            <div style={{ fontWeight: 700, color: colors.accent, marginBottom: "4px" }}>
                                Quadrant {idx + 1}
                            </div>
                            {truncate(point, 45)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Default Visual layout recommendations
    return (
        <div style={{
            backgroundColor: colors.accentLight,
            border: `1px dashed ${colors.accent}80`,
            borderRadius: "12px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
        }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: colors.accent,
                fontWeight: 700,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
            }}>
                <span>💡 Layout Recommendation</span>
            </div>
            <p style={{
                fontSize: "0.95rem",
                color: colors.text,
                lineHeight: "1.5",
                margin: 0,
                fontStyle: "italic"
            }}>
                &ldquo;{suggestion || "Standard Bullet List Layout"}&rdquo;
            </p>
        </div>
    );
}