"use client";

import { useEffect, useState } from "react";

type Slide = {
    title: string;
    content: string[];
};

export default function PresentationPage() {
    const [slides, setSlides] = useState<Slide[]>([]);

    useEffect(() => {
        const savedSlides =
            localStorage.getItem("slides");

        if (savedSlides) {
            setSlides(JSON.parse(savedSlides));
        }
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h1>Generated Presentation</h1>

            {slides.map((slide, index) => (
                <div
                    key={index}
                    style={{
                        border: "1px solid #ccc",
                        padding: "20px",
                        marginBottom: "20px",
                        borderRadius: "8px",
                    }}
                >
                    <h2>
                        Slide {index + 1}: {slide.title}
                    </h2>

                    <ul>
                        {slide.content.map((point, i) => (
                            <li key={i}>{point}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}