import json
import sys

content = sys.argv[1]

content = " ".join(content.split())

slides = [
    {
        "title": "Problem Statement",
        "content": [
            "Professionals spend significant time converting reports into presentations",
            "Existing tools require extensive manual effort",
            "Presentation creation remains inefficient"
        ]
    },
    {
        "title": "Background",
        "content": [
            "Organizations create large volumes of reports",
            "Important insights are often buried in documents",
            "Presentation creation is repetitive and time-consuming"
        ]
    },
    {
        "title": "Presentation Editor",
        "content": [
            "Drag-and-drop editing",
            "Theme customization",
            "Collaborative editing support"
        ]
    },
    {
        "title": "Export Layer",
        "content": [
            "PowerPoint export",
            "PDF export",
            "Cloud sharing"
        ]
    },
    {
        "title": "Expected Outcome",
        "content": [
            "Reduce presentation creation time",
            "Improve presentation quality",
            "Automate slide generation workflow"
        ]
    }
]

print(json.dumps(slides))