"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
    const [fileName, setFileName] = useState("");
    const router = useRouter();

    function generatePresentation() {
        if (!fileName) return;

        localStorage.setItem("uploadedFile", fileName);

        router.push("/presentation");
    }

    return (
        <div>
            <h1>Upload Document</h1>

            <input
                type="file"
                onChange={async (event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                        setFileName(file.name);

                        const text = await file.text();

                        localStorage.setItem(
                            "uploadedContent",
                            text
                        );
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