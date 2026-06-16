"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
    const [fileName, setFileName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const router = useRouter();

    async function generatePresentation() {
        if (!file) return;

        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        const slides = await response.json();

        localStorage.setItem(
            "slides",
            JSON.stringify(slides)
        );

        router.push("/presentation");
    }

    return (
        <div>
            <h1>Upload Document</h1>

            <input
                type="file"
                onChange={(event) => {
                    const selectedFile = event.target.files?.[0];

                    if (selectedFile) {
                        setFile(selectedFile);
                        setFileName(selectedFile.name);
                    }
                }}
            />

            <p>{fileName}</p>

            <button onClick={generatePresentation}>
                Generate Presentation
            </button>
        </div>
    );
}