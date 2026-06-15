"use client";

import { useEffect, useState } from "react";

export default function PresentationsPage() {
    const [presentations, setPresentations] =
        useState<string[]>([]);

    useEffect(() => {
        const saved =
            JSON.parse(
                localStorage.getItem("presentations") || "[]"
            );

        setPresentations(saved);
    }, []);

    return (
        <div>
            <h1>Saved Presentations</h1>

            {presentations.map((presentation, index) => (
                <p key={index}>{presentation}</p>
            ))}
        </div>
    );
}