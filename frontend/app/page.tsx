"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [demoState, setDemoState] = useState<"idle" | "scanning" | "done">("idle");

    const startDemoAnimation = () => {
        if (demoState !== "idle") return;
        setDemoState("scanning");
        setTimeout(() => {
            setDemoState("done");
        }, 3000);
    };

    const resetDemo = () => {
        setDemoState("idle");
    };

    return (
        <div style={{
            backgroundColor: "#070b15",
            color: "#f8fafc",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            minHeight: "100vh",
            overflowX: "hidden",
            position: "relative"
        }}>
            {/* Custom CSS Keyframes and Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scan {
                    0% { top: 0%; opacity: 0.8; }
                    50% { top: 100%; opacity: 0.8; }
                    100% { top: 0%; opacity: 0.8; }
                }
                @keyframes float-particles {
                    0% { transform: translateY(0px) scale(1); opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { transform: translateY(-120px) scale(0.6); opacity: 0; }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.2); }
                    50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
                }
                .glow-circle {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    z-index: 0;
                    pointer-events: none;
                }
                .hero-gradient {
                    background: linear-gradient(to right, #818cf8, #a78bfa, #f472b6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .glass-card {
                    background: rgba(17, 24, 39, 0.4);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .glass-card:hover {
                    border-color: rgba(99, 102, 241, 0.3);
                    transform: translateY(-6px);
                    box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.15);
                }
                .primary-btn {
                    background: linear-gradient(to right, #6366f1, #8b5cf6);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 14px 28px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
                }
                .primary-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
                }
                .secondary-btn {
                    background: rgba(255, 255, 255, 0.03);
                    color: #e2e8f0;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 14px 28px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .secondary-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }
                .slide-preview-3d {
                    transform: perspective(1000px) rotateY(-15deg) rotateX(10deg);
                    box-shadow: -20px 20px 40px rgba(0,0,0,0.5);
                    transition: all 0.5s ease;
                }
                .slide-preview-3d:hover {
                    transform: perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }
                `
            }} />

            {/* Glowing backgrounds */}
            <div className="glow-circle" style={{ width: "400px", height: "400px", background: "rgba(99, 102, 241, 0.15)", top: "10%", left: "5%" }} />
            <div className="glow-circle" style={{ width: "500px", height: "500px", background: "rgba(168, 85, 247, 0.12)", bottom: "20%", right: "5%" }} />

            {/* Top Navbar */}
            <header style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "24px 20px",
                position: "relative",
                zIndex: 10
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                        background: "linear-gradient(to right, #6366f1, #ec4899)",
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "1.2rem"
                    }}>P</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>PrismAI</span>
                </div>

                <nav style={{ display: "flex", gap: "32px", fontSize: "0.95rem", fontWeight: 600 }}>
                    <a href="#features" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} className="hover:text-white">Features</a>
                    <a href="#how-it-works" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} className="hover:text-white">How It Works</a>
                </nav>

                <button
                    onClick={() => router.push("/upload")}
                    className="primary-btn"
                    style={{ padding: "10px 20px", fontSize: "0.9rem" }}
                >
                    Get Started Free
                </button>
            </header>

            {/* Hero Section */}
            <section style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "80px 20px 100px 20px",
                textAlign: "center",
                position: "relative",
                zIndex: 10
            }}>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: "999px",
                    padding: "6px 16px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#818cf8",
                    marginBottom: "28px"
                }}>
                    ✨ Next-Gen Presentation Generation Engine
                </div>

                <h1 style={{
                    fontSize: "3.75rem",
                    fontWeight: 900,
                    lineHeight: "1.15",
                    letterSpacing: "-0.03em",
                    maxWidth: "900px",
                    margin: "0 auto 24px auto"
                }}>
                    Transform Documents into <span className="hero-gradient">Stunning Slide Decks</span> in Seconds
                </h1>

                <p style={{
                    fontSize: "1.25rem",
                    color: "#94a3b8",
                    lineHeight: "1.6",
                    maxWidth: "700px",
                    margin: "0 auto 40px auto"
                }}>
                    Upload reports, project outline PDFs, or simply write a text topic. Our AI reads the context and drafts widescreen presentations with live structured diagrams instantly.
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
                    <button onClick={() => router.push("/upload")} className="primary-btn">
                        Create Presentation
                    </button>
                    <a href="#demo" className="secondary-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        Watch Demo
                    </a>
                </div>
            </section>

            {/* Interactive Visual Demo Section */}
            <section id="demo" style={{
                maxWidth: "1100px",
                margin: "0 auto",
                padding: "40px 20px 100px 20px",
                position: "relative",
                zIndex: 10
            }}>
                <div style={{
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "24px",
                    padding: "48px",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                }}>
                    <div style={{ textAlign: "center", marginBottom: "36px" }}>
                        <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>See AI Convert Documents in Real Time</h2>
                        <p style={{ fontSize: "1rem", color: "#64748b", marginTop: "8px" }}>Click the play button below to trigger the interactive simulation.</p>
                    </div>

                    {/* Animation Workspace */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 80px 1.2fr",
                        gap: "20px",
                        alignItems: "center",
                        width: "100%",
                        maxWidth: "850px",
                        minHeight: "360px",
                        backgroundColor: "#0b0f19",
                        borderRadius: "20px",
                        border: "1px solid rgba(255,255,255,0.03)",
                        padding: "40px",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        {/* 1. Left Side: Document Card */}
                        <div style={{
                            backgroundColor: "#111827",
                            border: "1.5px solid rgba(255,255,255,0.05)",
                            borderRadius: "14px",
                            padding: "20px",
                            height: "260px",
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            opacity: demoState === "done" ? 0.4 : 1,
                            transition: "all 0.5s ease"
                        }}>
                            {/* Scanning Beam effect */}
                            {demoState === "scanning" && (
                                <div style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    height: "6px",
                                    background: "linear-gradient(to right, transparent, #818cf8, transparent)",
                                    boxShadow: "0 0 15px #818cf8",
                                    animation: "scan 2s infinite linear",
                                    zIndex: 5
                                }} />
                            )}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1" }}>PROPOSAL.PDF</span>
                                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>12 KB</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <div style={{ height: "12px", width: "80%", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "4px" }} />
                                    <div style={{ height: "10px", width: "95%", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "3px" }} />
                                    <div style={{ height: "10px", width: "90%", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "3px" }} />
                                    <div style={{ height: "10px", width: "40%", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "3px", marginTop: "8px" }} />
                                    <div style={{ height: "10px", width: "85%", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "3px" }} />
                                    <div style={{ height: "10px", width: "70%", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "3px" }} />
                                </div>
                            </div>
                            <div style={{
                                backgroundColor: "rgba(99, 102, 241, 0.1)",
                                border: "1px dashed rgba(99, 102, 241, 0.3)",
                                borderRadius: "8px",
                                padding: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <span style={{ fontSize: "1.2rem" }}>🎯</span>
                                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                                    Prompt: <span style={{ color: "#a5b4fc" }}>&ldquo;Focus on solar cell timelines&rdquo;</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Middle Side: Conversion Action */}
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            position: "relative"
                        }}>
                            {/* Particles floating when scanning */}
                            {demoState === "scanning" && (
                                <>
                                    <div style={{ position: "absolute", width: "6px", height: "6px", backgroundColor: "#818cf8", borderRadius: "50%", animation: "float-particles 2.5s infinite linear", left: "10px" }} />
                                    <div style={{ position: "absolute", width: "4px", height: "4px", backgroundColor: "#ec4899", borderRadius: "50%", animation: "float-particles 1.8s infinite linear", right: "20px" }} />
                                    <div style={{ position: "absolute", width: "5px", height: "5px", backgroundColor: "#a78bfa", borderRadius: "50%", animation: "float-particles 2.2s infinite linear", bottom: "10px", left: "30px" }} />
                                </>
                            )}
                            <div style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                backgroundColor: demoState === "scanning" ? "#6366f1" : "rgba(255,255,255,0.05)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `1.5px solid ${demoState === "scanning" ? "#818cf8" : "rgba(255,255,255,0.1)"}`,
                                boxShadow: demoState === "scanning" ? "0 0 20px rgba(99, 102, 241, 0.4)" : "none",
                                transition: "all 0.3s ease"
                            }}>
                                <span style={{ fontSize: "1.4rem", color: demoState === "scanning" ? "white" : "#64748b" }}>
                                    {demoState === "scanning" ? "⚡" : "⚙️"}
                                </span>
                            </div>
                            <span style={{
                                fontSize: "0.65rem",
                                color: demoState === "scanning" ? "#818cf8" : "#475569",
                                fontWeight: 700,
                                marginTop: "8px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                            }}>
                                {demoState === "scanning" ? "Synthesizing" : "Standby"}
                            </span>
                        </div>

                        {/* 3. Right Side: Multi-slide deck stack (3D previewed) */}
                        <div style={{
                            position: "relative",
                            height: "260px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            {demoState === "idle" && (
                                <div style={{ fontSize: "0.9rem", color: "#475569", textAlign: "center" }}>
                                    Slides will appear here...
                                </div>
                            )}

                            {demoState === "scanning" && (
                                <div style={{ fontSize: "0.9rem", color: "#818cf8", animation: "pulse 1.5s infinite", fontWeight: 600 }}>
                                    Constructing layout framework...
                                </div>
                            )}

                            {demoState === "done" && (
                                <div className="slide-preview-3d" style={{
                                    width: "280px",
                                    height: "175px",
                                    backgroundColor: "#1e293b",
                                    border: "1.5px solid rgba(255,255,255,0.1)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between"
                                }}>
                                    {/* Small slide details */}
                                    <div>
                                        <div style={{ fontSize: "0.5rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                                            Slide 03: Implementation Timeline
                                        </div>
                                        <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#f8fafc", marginBottom: "8px", fontFamily: "Georgia, serif" }}>
                                            Strategic Outlook
                                        </div>
                                        {/* Miniature Timeline timeline visual */}
                                        <div style={{ display: "flex", gap: "6px", marginTop: "14px" }}>
                                            <div style={{ flexGrow: 1, backgroundColor: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "6px", padding: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
                                                <div style={{ height: "4px", width: "40%", backgroundColor: "#818cf8", borderRadius: "1px" }} />
                                                <div style={{ height: "3px", width: "80%", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "1px" }} />
                                            </div>
                                            <div style={{ flexGrow: 1, backgroundColor: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "6px", padding: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
                                                <div style={{ height: "4px", width: "40%", backgroundColor: "#818cf8", borderRadius: "1px" }} />
                                                <div style={{ height: "3px", width: "85%", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "1px" }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "0.5rem", color: "#64748b" }}>Cobalt Ocean Theme</span>
                                        <span style={{ fontSize: "0.6rem", fontWeight: "bold", color: "#6366f1" }}>PrismAI</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Demo Controller Buttons */}
                    <div style={{ display: "flex", gap: "16px", marginTop: "32px" }}>
                        <button
                            onClick={startDemoAnimation}
                            disabled={demoState !== "idle"}
                            className="primary-btn"
                            style={{
                                padding: "10px 24px",
                                opacity: demoState !== "idle" ? 0.5 : 1,
                                cursor: demoState !== "idle" ? "not-allowed" : "pointer"
                            }}
                        >
                            {demoState === "scanning" ? "AI Generating..." : demoState === "done" ? "Generation Complete" : "▶ Start Demo Pipeline"}
                        </button>

                        {demoState === "done" && (
                            <button
                                onClick={resetDemo}
                                className="secondary-btn"
                                style={{ padding: "10px 24px" }}
                            >
                                Reset Demo
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Feature Section */}
            <section id="features" style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "80px 20px",
                position: "relative",
                zIndex: 10
            }}>
                <div style={{ textAlign: "center", marginBottom: "60px" }}>
                    <h2 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Core Capabilities</h2>
                    <p style={{ fontSize: "1.1rem", color: "#94a3b8", marginTop: "12px", maxWidth: "600px", margin: "12px auto 0 auto" }}>
                        A presentation deck builder built from the ground up to craft visual, accurate, and ready-to-share slides.
                    </p>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "32px"
                }}>
                    <div className="glass-card" style={{ padding: "40px" }}>
                        <span style={{ fontSize: "2rem" }}>🎯</span>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "16px 0 10px 0" }}>Context-Aligned Relevance</h3>
                        <p style={{ color: "#94a3b8", lineHeight: "1.6", margin: 0 }}>
                            Provide document inputs and specific guidelines side by side. Our custom dual-payload AI processes instructions relative to document context, keeping generated slides directly on topic.
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: "40px" }}>
                        <span style={{ fontSize: "2rem" }}>📊</span>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "16px 0 10px 0" }}>Dynamic Structured Diagrams</h3>
                        <p style={{ color: "#94a3b8", lineHeight: "1.6", margin: 0 }}>
                            Slides are automatically mapped into suitable layouts, outputting interactive process flowcharts, matrixes, organizational hierarchies, mind maps, or entity relation grids.
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: "40px" }}>
                        <span style={{ fontSize: "2rem" }}>🎨</span>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "16px 0 10px 0" }}>Gamma-Style Editor UI</h3>
                        <p style={{ color: "#94a3b8", lineHeight: "1.6", margin: 0 }}>
                            Navigate through slides seamlessly using our split-pane navigation outline sidebar. Reorder slides, add new points, and live-preview layouts instantly inside widescreen slide layouts.
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: "40px" }}>
                        <span style={{ fontSize: "2rem" }}>💾</span>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "16px 0 10px 0" }}>One-Click PowerPoint Export</h3>
                        <p style={{ color: "#94a3b8", lineHeight: "1.6", margin: 0 }}>
                            Export your presentation instantly to editable PPTX formats. All text boxes, bullet formatting, colors, and diagram structures are preserved as native PowerPoint shapes.
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "80px 20px 140px 20px",
                position: "relative",
                zIndex: 10
            }}>
                <div style={{ textAlign: "center", marginBottom: "80px" }}>
                    <h2 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>How It Works</h2>
                    <p style={{ fontSize: "1.1rem", color: "#94a3b8", marginTop: "12px" }}>From plain documents or prompt ideas to presentation-ready structures in four steps.</p>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "24px"
                }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(99, 102, 241, 0.1)",
                            border: "1px solid rgba(99, 102, 241, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.25rem",
                            fontWeight: "bold",
                            color: "#818cf8",
                            margin: "0 auto 20px auto"
                        }}>1</div>
                        <h4 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 8px 0" }}>Provide Input</h4>
                        <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>Upload PDF/docx documents, or write outline prompts.</p>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(99, 102, 241, 0.1)",
                            border: "1px solid rgba(99, 102, 241, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.25rem",
                            fontWeight: "bold",
                            color: "#818cf8",
                            margin: "0 auto 20px auto"
                        }}>2</div>
                        <h4 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 8px 0" }}>AI Structuring</h4>
                        <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>The AI analyzes themes and maps custom slide content.</p>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(99, 102, 241, 0.1)",
                            border: "1px solid rgba(99, 102, 241, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.25rem",
                            fontWeight: "bold",
                            color: "#818cf8",
                            margin: "0 auto 20px auto"
                        }}>3</div>
                        <h4 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 8px 0" }}>Live Editor UI</h4>
                        <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>Navigate the outline and edit titles, colors, and layouts.</p>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(99, 102, 241, 0.1)",
                            border: "1px solid rgba(99, 102, 241, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.25rem",
                            fontWeight: "bold",
                            color: "#818cf8",
                            margin: "0 auto 20px auto"
                        }}>4</div>
                        <h4 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 8px 0" }}>PowerPoint Export</h4>
                        <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>Export slides instantly into native edit-ready PPTX formats.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: "1px solid rgba(255,255,255,0.05)",
                padding: "40px 20px",
                textAlign: "center",
                color: "#475569",
                fontSize: "0.9rem",
                position: "relative",
                zIndex: 10
            }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>© 2026 PrismAI presentation platform. All rights reserved.</div>
                    <div style={{ display: "flex", gap: "24px" }}>
                        <a href="#features" style={{ color: "#475569", textDecoration: "none" }} className="hover:text-white">Features</a>
                        <a href="#how-it-works" style={{ color: "#475569", textDecoration: "none" }} className="hover:text-white">How It Works</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}