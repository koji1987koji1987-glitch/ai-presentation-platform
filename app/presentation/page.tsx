"use client";

import { useEffect, useState } from "react";

export default function PresentationPage() {
    const [slides, setSlides] = useState<string[]>([]);

    useEffect(() => {
        async function loadSlides() {
            const content =
                localStorage.getItem("uploadedContent") ||
                "No content";

            const saved =
                JSON.parse(
                    localStorage.getItem("presentations") || "[]"
                );

            if (!saved.includes("Generated Presentation")) {
                saved.push("Generated Presentation");

                localStorage.setItem(
                    "presentations",
                    JSON.stringify(saved)
                );
            }

            const response = await fetch(
                `/api/slides?content=${encodeURIComponent(content)}`
            );

            const data = await response.json();

            console.log(data);

            setSlides(data);
        }

        loadSlides();
    }, []);

    return (
        <div>
            <h1>Generated Presentation</h1>

            {slides.map((slide, index) => (
                <div key={index}>
                    <h2>
                        Slide {index + 1}: {slide}
                    </h2>
                </div>
            ))}
        </div>
    );
}