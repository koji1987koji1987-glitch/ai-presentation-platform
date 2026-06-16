import json
import sys

content = sys.argv[1]

slides = []

content = " ".join(content.split())

checks = [
    ("problem", "Problem Statement"),
    ("background", "Background"),
    ("presentation editor", "Presentation Editor"),
    ("export layer", "Export Layer"),
    ("expected outcome", "Expected Outcome")
]

for keyword, slide in checks:
    if keyword in content.lower():
        slides.append(slide)

slides = list(dict.fromkeys(slides))

if not slides:
    slides = [
        "Introduction",
        "Key Insights",
        "Recommendations",
        "Conclusion"
    ]

print("DEBUG:")
print(content[:300])
print("----------------")

print(json.dumps(slides))