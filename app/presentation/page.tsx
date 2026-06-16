"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Slide = {
    title: string;
    content: string[];
    visual_suggestion?: string;
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
    }
};

type ThemeKey = keyof typeof themePalettes;

export default function PresentationPage() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [activeTheme, setActiveTheme] = useState<ThemeKey>("slate");
    
    const router = useRouter();
    const colors = themePalettes[activeTheme];

    useEffect(() => {
        const savedSlides = localStorage.getItem("slides");
        if (savedSlides) {
            try {
                setSlides(JSON.parse(savedSlides));
            } catch (e) {
                console.error("Failed to parse saved slides:", e);
            }
        }
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

    async function handleExport() {
        if (slides.length === 0) return;
        setIsExporting(true);
        try {
            const response = await fetch("/api/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ slides }),
            });

            if (!response.ok) {
                const errorData = await response.json();
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
        } catch (error: any) {
            console.error("Export error:", error);
            alert(`Failed to export to PowerPoint: ${error.message}`);
        } finally {
            setIsExporting(false);
        }
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "40px 20px",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            backgroundColor: colors.bg,
            color: colors.text,
            minHeight: "100vh",
            transition: "all 0.3s ease"
        }}>
            {/* CSS Print Stylesheet */}
            <style dangerouslySetInnerHTML={{ __html: `
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
            ` }} />

            <header className="no-print" style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "40px",
                borderBottom: `1px solid ${colors.border}`,
                paddingBottom: "20px"
            }}>
                <div>
                    <h1 style={{
                        fontSize: "2.25rem",
                        fontWeight: 800,
                        color: colors.text,
                        letterSpacing: "-0.025em"
                    }}>
                        Presentation Editor
                    </h1>
                    <p style={{ color: colors.muted, marginTop: "4px" }}>
                        Edit titles, points, layouts and export to PPTX or print-ready PDF.
                    </p>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {/* Theme selector */}
                    <div style={{ display: "flex", gap: "6px", marginRight: "12px" }}>
                        {(Object.keys(themePalettes) as ThemeKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setActiveTheme(key)}
                                style={{
                                    backgroundColor: activeTheme === key ? themePalettes[key].accent : themePalettes[key].bg,
                                    border: `1px solid ${themePalettes[key].border}`,
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "9999px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
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
                            padding: "10px 18px",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            borderRadius: "8px",
                            cursor: "pointer"
                        }}
                    >
                        🖨️ Print to PDF
                    </button>

                    {slides.length > 0 && (
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            style={{
                                backgroundColor: isExporting ? "#cbd5e1" : colors.accent,
                                color: "#ffffff",
                                padding: "10px 18px",
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                borderRadius: "8px",
                                border: "none",
                                cursor: isExporting ? "not-allowed" : "pointer",
                                boxShadow: `0 4px 6px -1px ${colors.accent}30`
                            }}
                        >
                            {isExporting ? "Exporting..." : "💾 Export PowerPoint"}
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
                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className="slide-card"
                            style={{
                                backgroundColor: colors.cardBg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: "16px",
                                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
                                padding: "32px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "24px",
                                transition: "all 0.3s ease"
                            }}
                        >
                            {/* Slide Header Toolbar */}
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: `1px solid ${colors.border}`,
                                paddingBottom: "16px"
                            }}>
                                <input
                                    type="text"
                                    value={slide.title}
                                    onChange={(e) => handleUpdateTitle(index, e.target.value)}
                                    style={{
                                        fontSize: "1.75rem",
                                        fontWeight: 800,
                                        color: colors.text,
                                        backgroundColor: "transparent",
                                        border: "1px solid transparent",
                                        borderRadius: "6px",
                                        width: "70%",
                                        padding: "4px 8px"
                                    }}
                                />
                                
                                <div className="no-print" style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        disabled={index === 0}
                                        onClick={() => handleMoveSlide(index, index - 1)}
                                        style={{ padding: "4px 8px", cursor: index === 0 ? "not-allowed" : "pointer" }}
                                    >
                                        ▲
                                    </button>
                                    <button
                                        disabled={index === slides.length - 1}
                                        onClick={() => handleMoveSlide(index, index + 1)}
                                        style={{ padding: "4px 8px", cursor: index === slides.length - 1 ? "not-allowed" : "pointer" }}
                                    >
                                        ▼
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSlide(index)}
                                        style={{ padding: "4px 8px", color: "#ef4444", cursor: "pointer" }}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: slide.visual_suggestion ? "1.2fr 1fr" : "1fr",
                                gap: "32px",
                                alignItems: "start"
                            }}>
                                {/* Slide Bullet Points */}
                                <div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {slide.content.map((point, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ color: colors.accent, fontWeight: "bold" }}>•</span>
                                                <input
                                                    type="text"
                                                    value={point}
                                                    onChange={(e) => handleUpdateBullet(index, i, e.target.value)}
                                                    style={{
                                                        fontSize: "1.05rem",
                                                        color: colors.text,
                                                        backgroundColor: "transparent",
                                                        border: "1px solid transparent",
                                                        borderRadius: "4px",
                                                        flexGrow: 1,
                                                        padding: "4px"
                                                    }}
                                                />
                                                <button
                                                    className="no-print"
                                                    onClick={() => handleDeleteBullet(index, i)}
                                                    style={{
                                                        color: "#ef4444",
                                                        backgroundColor: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        padding: "0 4px"
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        className="no-print"
                                        onClick={() => handleAddBullet(index)}
                                        style={{
                                            color: colors.accent,
                                            backgroundColor: "transparent",
                                            border: "none",
                                            fontWeight: 600,
                                            fontSize: "0.9rem",
                                            cursor: "pointer",
                                            marginTop: "16px"
                                        }}
                                    >
                                        ➕ Add key point
                                    </button>
                                </div>

                                {/* Slide Visual / Diagram Preview */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <DiagramWidget
                                        suggestion={slide.visual_suggestion || ""}
                                        content={slide.content}
                                        colors={colors}
                                    />
                                    
                                    {/* Edit Recommendation Box */}
                                    <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <label style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.muted }}>
                                            Visual Suggestion Text:
                                        </label>
                                        <textarea
                                            value={slide.visual_suggestion || ""}
                                            onChange={(e) => handleUpdateVisual(index, e.target.value)}
                                            style={{
                                                fontSize: "0.85rem",
                                                color: colors.text,
                                                backgroundColor: colors.bg,
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: "6px",
                                                padding: "8px",
                                                resize: "vertical"
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button
                        className="no-print"
                        onClick={handleAddSlide}
                        style={{
                            border: `2px dashed ${colors.border}`,
                            color: colors.muted,
                            backgroundColor: "transparent",
                            padding: "20px",
                            borderRadius: "16px",
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        ➕ Add New Blank Slide
                    </button>
                </div>
            )}
        </div>
    );
}

// Interactive CSS Diagram Generator Widget
function DiagramWidget({ suggestion, content, colors }: { suggestion: string; content: string[]; colors: any }) {
    const text = (suggestion || "").toLowerCase();
    
    // 1. Process Flow / Timeline
    if (text.includes("process") || text.includes("timeline") || text.includes("flowchart") || text.includes("workflow") || text.includes("step")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase" }}>
                    🔄 Flow Sequence Diagram
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
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
                                maxWidth: "160px",
                                textAlign: "center"
                            }}>
                                <span style={{ color: colors.accent, marginRight: "4px" }}>{idx + 1}.</span>
                                {point.length > 30 ? point.slice(0, 30) + "..." : point}
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
    
    // 2. Matrix / Quad categories
    if (text.includes("matrix") || text.includes("compare") || text.includes("grid") || text.includes("quadrant") || text.includes("table")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase" }}>
                    📊 Widescreen Comparison Grid
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
                                Block {idx + 1}
                            </div>
                            {point.length > 45 ? point.slice(0, 45) + "..." : point}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 3. Central Node / Relationship map
    if (text.includes("mind") || text.includes("central") || text.includes("relationship") || text.includes("architecture") || text.includes("structure")) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.accent, textTransform: "uppercase" }}>
                    🧠 Hub-and-Spoke Diagram
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
                        Core Focus
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
                                {point.length > 25 ? point.slice(0, 25) + "..." : point}
                            </div>
                        ))}
                    </div>
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
                <span>💡 Layout Suggestion</span>
            </div>
            <p style={{
                fontSize: "0.95rem",
                color: colors.text,
                lineHeight: "1.5",
                margin: 0,
                fontStyle: "italic"
            }}>
                "{suggestion || "Standard Bullet List Layout"}"
            </p>
        </div>
    );
}