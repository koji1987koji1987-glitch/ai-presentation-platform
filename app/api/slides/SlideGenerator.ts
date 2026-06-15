export class SlideGenerator {
    generate(title: string) {
        if (title.toLowerCase().includes("research")) {
            return [
                title,
                "Literature Review",
                "Methodology",
                "Results",
                "Conclusion",
            ];
        }

        if (title.toLowerCase().includes("business")) {
            return [
                title,
                "Market Analysis",
                "Strategy",
                "Financial Plan",
                "Conclusion",
            ];
        }

        return [
            title,
            "Overview",
            "Analysis",
            "Key Findings",
            "Conclusion",
        ];
    }
}