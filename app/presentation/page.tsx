"use client";

import { useEffect, useState } from "react";

export default function PresentationPage() {
    const [slides, setSlides] = useState<string[]>([]);

    useEffect(() => {
        async function loadSlides() {
            const fileName =
                localStorage.getItem("uploadedFile") ||
                "Document.pdf";

            const response = await fetch(
                `/api/slides?file=${encodeURIComponent(fileName)}`
            );

            const data = await response.json();

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