"use client";

import { useState } from "react";
import Link from "next/link";

export default function UploadPage() {
    const [fileName, setFileName] = useState("");

    return (
        <div>
            <h1>Upload Document</h1>

            <input
                type="file"
                onChange={(event) => {
                    const name =
                        event.target.files?.[0]?.name || "";

                    setFileName(name);

                    localStorage.setItem("uploadedFile", name);
                }}
            />

            <p>{fileName}</p>

            <Link href="/presentation">
                <button>Generate Presentation</button>
            </Link>
        </div>
    );
}