"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
    const [fileName, setFileName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [promptText, setPromptText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [slideCount, setSlideCount] = useState(7);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const router = useRouter();

    async function generatePresentation(countToUse = slideCount) {
        if (!file && !promptText.trim()) {
            setErrorMsg("Please upload a file or write a text prompt first.");
            return;
        }

        setIsGenerating(true);
        setErrorMsg("");

        const controller = new AbortController();
        setAbortController(controller);

        try {
            const formData = new FormData();
            if (file) {
                formData.append("file", file);
                localStorage.setItem("uploadedFile", file.name);
            }
            if (promptText.trim()) {
                formData.append("prompt", promptText);
                if (!file) {
                    localStorage.setItem("uploadedFile", "Prompt Outline.pdf");
                }
            }
            formData.append("slideCount", countToUse.toString());

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
                signal: controller.signal
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to generate presentation");
            }

            const responseData = await response.json();
            if (responseData && typeof responseData === "object" && "slides" in responseData) {
                localStorage.setItem("slides", JSON.stringify(responseData.slides));
                if (responseData.theme) {
                    localStorage.setItem("theme", responseData.theme);
                }
            } else {
                localStorage.setItem("slides", JSON.stringify(responseData));
            }
            router.push("/presentation");
        } catch (error: any) {
            if (error.name === "AbortError") {
                console.log("Generation aborted by user");
                return;
            }
            const err = error as Error;
            console.error("Generation failed:", err);
            setErrorMsg(err.message || "Something went wrong during generation.");
        } finally {
            setIsGenerating(false);
            setAbortController(null);
        }
    }

    const handleStop = () => {
        if (abortController) {
            abortController.abort();
            setIsGenerating(false);
            setAbortController(null);
            setErrorMsg("Generation was stopped by the user.");
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#0f172a",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            color: "#f8fafc"
        }}>
            <div style={{
                maxWidth: "800px",
                width: "100%",
                textAlign: "center",
                marginBottom: "40px"
            }}>
                <h1 style={{
                    fontSize: "3rem",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    background: "linear-gradient(to right, #818cf8, #c084fc)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    margin: 0
                }}>
                    AI Presentation Generator
                </h1>
                <p style={{
                    fontSize: "1.2rem",
                    color: "#94a3b8",
                    marginTop: "12px",
                    lineHeight: "1.5"
                }}>
                    Transform PDFs, Word DOCX documents, or plain text prompts into completely editable slides instantly.
                </p>
            </div>

            <div style={{
                maxWidth: "800px",
                width: "100%",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                marginBottom: "32px",
                alignItems: "stretch"
            }}>
                {/* PDF/DOCX Card */}
                <div style={{
                    backgroundColor: "#1e293b",
                    borderRadius: "16px",
                    border: file ? "2px solid #6366f1" : "1px solid #334155",
                    padding: "32px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.3s ease",
                    boxShadow: file ? "0 0 20px rgba(99, 102, 241, 0.2)" : "none"
                }}>
                    <div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px 0", color: "#e2e8f0" }}>
                            Document Upload
                        </h2>
                        <p style={{ fontSize: "0.95rem", color: "#94a3b8", margin: "0 0 24px 0", lineHeight: "1.4" }}>
                            Upload reports, research papers, or proposals in PDF or Word format.
                        </p>
                    </div>

                    <div style={{
                        border: "2px dashed #475569",
                        borderRadius: "12px",
                        padding: "30px 20px",
                        textAlign: "center",
                        cursor: "pointer",
                        position: "relative",
                        backgroundColor: "#0f172a",
                        transition: "border-color 0.2s ease"
                    }}>
                        <input
                            type="file"
                            accept=".pdf,.docx,.txt,.md"
                            onChange={(event) => {
                                const selectedFile = event.target.files?.[0];
                                if (selectedFile) {
                                    setFile(selectedFile);
                                    setFileName(selectedFile.name);
                                    setErrorMsg("");
                                }
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                opacity: 0,
                                cursor: "pointer"
                            }}
                        />
                        <span style={{ fontSize: "2rem" }}>📄</span>
                        <p style={{ margin: "10px 0 0 0", fontSize: "0.9rem", color: "#cbd5e1", fontWeight: 500 }}>
                            {fileName ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                    {fileName}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setFile(null);
                                            setFileName("");
                                        }}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#ef4444",
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                            fontSize: "1.2rem",
                                            lineHeight: 1,
                                            padding: "0 4px"
                                        }}
                                        title="Clear file"
                                    >
                                        ×
                                    </button>
                                </span>
                            ) : "Click to select PDF, DOCX, TXT, or MD"}
                        </p>
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                            Max file size 20MB
                        </p>
                    </div>
                </div>

                {/* Text Prompt Card */}
                <div style={{
                    backgroundColor: "#1e293b",
                    borderRadius: "16px",
                    border: promptText.trim() ? "2px solid #c084fc" : "1px solid #334155",
                    padding: "32px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.3s ease",
                    boxShadow: promptText.trim() ? "0 0 20px rgba(192, 132, 252, 0.2)" : "none"
                }}>
                    <div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px 0", color: "#e2e8f0" }}>
                            Prompt / Outline
                        </h2>
                        <p style={{ fontSize: "0.95rem", color: "#94a3b8", margin: "0 0 24px 0", lineHeight: "1.4" }}>
                            Enter a topic, write an outline, or paste raw text to guide the presentation structure.
                        </p>
                    </div>

                    <textarea
                        rows={5}
                        placeholder="e.g. Focus on pricing, outline core details, or guide the presentation layout..."
                        value={promptText}
                        onChange={(e) => {
                            setPromptText(e.target.value);
                            setErrorMsg("");
                        }}
                        style={{
                            width: "100%",
                            padding: "16px",
                            backgroundColor: "#0f172a",
                            border: "1px solid #475569",
                            borderRadius: "12px",
                            color: "#f8fafc",
                            fontFamily: "inherit",
                            fontSize: "0.95rem",
                            resize: "none",
                            boxSizing: "border-box"
                        }}
                    />
                </div>
            </div>

            {errorMsg && (
                <div style={{
                    maxWidth: "800px",
                    width: "100%",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    color: "#991b1b",
                    fontSize: "0.95rem",
                    marginBottom: "24px",
                    textAlign: "center"
                }}>
                    ⚠️ {errorMsg}
                </div>
            )}

            {isGenerating ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "16px",
                        padding: "16px 32px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)"
                    }}>
                        <div className="spinner" style={{
                            width: "24px",
                            height: "24px",
                            border: "3px solid rgba(99,102,241,0.2)",
                            borderTop: "3px solid #6366f1",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite"
                        }} />
                        <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#e2e8f0" }}>
                            Generating {slideCount} Slide Presentation...
                        </span>
                    </div>
                    <button
                        onClick={handleStop}
                        style={{
                            backgroundColor: "#ef4444",
                            color: "#ffffff",
                            padding: "10px 24px",
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            borderRadius: "10px",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: "0 4px 10px rgba(239,68,68,0.3)"
                        }}
                    >
                        🛑 Stop Generation
                    </button>
                    <style jsx global>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            ) : (
                <button
                    onClick={() => {
                        if (!file && !promptText.trim()) {
                            setErrorMsg("Please upload a file or write a text prompt first.");
                            return;
                        }
                        setShowPromptModal(true);
                    }}
                    disabled={(!file && !promptText.trim())}
                    style={{
                        backgroundColor: "#4f46e5",
                        backgroundImage: "linear-gradient(to right, #6366f1, #a855f7)",
                        color: "#ffffff",
                        padding: "16px 48px",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        borderRadius: "12px",
                        border: "none",
                        cursor: (!file && !promptText.trim()) ? "not-allowed" : "pointer",
                        boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)",
                        transition: "all 0.2s ease"
                    }}
                >
                    Generate Presentation
                </button>
            )}

            {showPromptModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.85)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: "#1e293b",
                        border: "1.5px solid #334155",
                        borderRadius: "24px",
                        padding: "40px",
                        maxWidth: "480px",
                        width: "90%",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px"
                    }}>
                        <div>
                            <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 8px 0" }}>
                                Customize Slide Count
                            </h3>
                            <p style={{ fontSize: "0.95rem", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                                Specify how many slides you want the AI to create for this presentation.
                            </p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <button
                                    onClick={() => setSlideCount(prev => Math.max(3, prev - 1))}
                                    style={{
                                        backgroundColor: "#334155",
                                        color: "#f8fafc",
                                        border: "none",
                                        width: "44px",
                                        height: "44px",
                                        borderRadius: "50%",
                                        fontSize: "1.5rem",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    min={3}
                                    max={20}
                                    value={slideCount}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val)) {
                                            setSlideCount(Math.max(2, Math.min(25, val)));
                                        }
                                    }}
                                    style={{
                                        width: "80px",
                                        height: "48px",
                                        backgroundColor: "#0f172a",
                                        border: "1.5px solid #475569",
                                        borderRadius: "12px",
                                        color: "#f8fafc",
                                        fontSize: "1.4rem",
                                        fontWeight: 800,
                                        textAlign: "center",
                                        outline: "none"
                                    }}
                                />
                                <button
                                    onClick={() => setSlideCount(prev => Math.min(20, prev + 1))}
                                    style={{
                                        backgroundColor: "#334155",
                                        color: "#f8fafc",
                                        border: "none",
                                        width: "44px",
                                        height: "44px",
                                        borderRadius: "50%",
                                        fontSize: "1.5rem",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    +
                                </button>
                            </div>
                            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                Recommended: 5 - 15 slides
                            </span>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={() => setShowPromptModal(false)}
                                style={{
                                    flex: 1,
                                    backgroundColor: "transparent",
                                    border: "1.5px solid #334155",
                                    color: "#94a3b8",
                                    padding: "12px",
                                    fontSize: "0.95rem",
                                    fontWeight: 600,
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowPromptModal(false);
                                    generatePresentation();
                                }}
                                style={{
                                    flex: 1,
                                    backgroundColor: "#4f46e5",
                                    backgroundImage: "linear-gradient(to right, #6366f1, #a855f7)",
                                    border: "none",
                                    color: "#ffffff",
                                    padding: "12px",
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                Start Generating
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}