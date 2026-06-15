import json
import sys

title = sys.argv[1]

if "research" in title.lower():
    slides = [
        title,
        "Literature Review",
        "Methodology",
        "Results",
        "Conclusion"
    ]
elif "business" in title.lower():
    slides = [
        title,
        "Market Analysis",
        "Strategy",
        "Financial Plan",
        "Conclusion"
    ]
else:
    slides = [
        title,
        "Overview",
        "Analysis",
        "Key Findings",
        "Conclusion"
    ]

print(json.dumps(slides))