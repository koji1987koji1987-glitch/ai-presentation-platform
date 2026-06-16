import json
import os
import sys

def rule_based_fallback(text):
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    slide_titles = [
        "Introduction & Overview",
        "Problem Statement & Background",
        "Key Insights & Analysis",
        "Recommendations & Strategy",
        "Summary & Next Steps"
    ]
    
    # If text is virtually empty or generic
    if len(lines) < 5:
        return [
            {
                "title": "Overview",
                "content": [
                    "No document text could be extracted or text was too short.",
                    "Please upload a longer PDF with selectable text.",
                    "Generating default slides context."
                ],
                "visual_suggestion": "A conceptual diagram of document ingestion workflow"
            },
            {
                "title": "Problem Statement",
                "content": [
                    "Professionals spend significant time converting reports into presentations",
                    "Existing tools require extensive manual effort",
                    "Presentation creation remains inefficient"
                ],
                "visual_suggestion": "A frustration icon alongside slide metrics"
            },
            {
                "title": "Presentation Editor",
                "content": [
                    "Drag-and-drop editing",
                    "Theme customization",
                    "Collaborative editing support"
                ],
                "visual_suggestion": "An illustration showing UI/UX mockup elements"
            },
            {
                "title": "Export Layer",
                "content": [
                    "PowerPoint export",
                    "PDF export",
                    "Cloud sharing"
                ],
                "visual_suggestion": "A diagram mapping input files to export output formats"
            },
            {
                "title": "Expected Outcome",
                "content": [
                    "Reduce presentation creation time",
                    "Improve presentation quality",
                    "Automate slide generation workflow"
                ],
                "visual_suggestion": "A line graph showing decreasing time spent vs quality"
            }
        ]
        
    sentences = []
    for line in lines:
        for part in line.split(". "):
            if part.strip():
                sentences.append(part.strip())
                
    chunk_size = max(2, len(sentences) // 5)
    slides = []
    
    for idx, title in enumerate(slide_titles):
        start = idx * chunk_size
        end = start + chunk_size
        points = [s for s in sentences[start:end] if len(s) > 10][:4]
        
        if not points:
            points = [f"Key summary point {j+1} extracted from the document." for j in range(3)]
        
        # Tailored visual suggestions for each standard section
        if "problem" in title.lower():
            visual = "A bar chart comparing current process bottlenecks and delays"
        elif "insight" in title.lower() or "analysis" in title.lower():
            visual = "A dashboard layout displaying key metrics and data trends"
        elif "recommendation" in title.lower() or "strategy" in title.lower():
            visual = "A timeline roadmap illustrating phased deployment strategies"
        elif "summary" in title.lower():
            visual = "A checklist flowchart highlighting deliverables and milestones"
        else:
            visual = "A conceptual overview diagram of the system's core categories"
            
        slides.append({
            "title": title,
            "content": points,
            "visual_suggestion": visual
        })
        
    return slides

def generate_slides(text):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI_API_KEY not found in environment, running rule-based fallback.", file=sys.stderr)
        return rule_based_fallback(text)
        
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        prompt = (
            "You are a professional presentation generation system. "
            "Your task is to summarize the document content below and output a structured presentation "
            "as a JSON object containing a 'slides' key which holds an array of slide objects. "
            "Generate between 5 and 10 slides that represent a comprehensive and logical flow of the document. "
            "Each slide object in the array MUST have the following keys:\n"
            "- 'title': The slide title.\n"
            "- 'content': An array of 3 to 5 concise and meaningful bullet points.\n"
            "- 'visual_suggestion': A clear recommendation for a diagram, flowchart, matrix, chart, or image that "
            "visually explains this slide's content.\n\n"
            f"Document Content:\n{text[:12000]}\n\n"
            "Return only valid JSON matching this schema: "
            '{"slides": [{"title": "Title", "content": ["point 1", "point 2"], "visual_suggestion": "Description..."}]}'
        )
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        data = json.loads(response.choices[0].message.content)
        if "slides" in data and isinstance(data["slides"], list) and len(data["slides"]) > 0:
            return data["slides"]
            
        print("API output did not match expected schema, running fallback.", file=sys.stderr)
        return rule_based_fallback(text)
    except Exception as e:
        print(f"OpenAI generation error: {e}", file=sys.stderr)
        return rule_based_fallback(text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps([]))
        sys.exit(0)
        
    input_text = sys.argv[1]
    result = generate_slides(input_text)
    print(json.dumps(result))