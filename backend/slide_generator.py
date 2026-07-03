import json
import os
import sys
import re

def load_env():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(script_dir, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

load_env()

def rule_based_fallback(text, user_prompt=None, requested_count=None):
    # Determine basic topic title from prompt or text
    topic = user_prompt.strip() if user_prompt else "Document Summary"
    topic_title = topic[:45] + "..." if len(topic) > 45 else topic

    all_slides = [
        {
            "title": f"Introduction to {topic_title}",
            "subtitle": "Overview and core context",
            "layout_type": "title",
            "content": [
                f"Establishing the foundational context for {topic_title}.",
                "Key drivers and situational landscape.",
                "Primary objectives and scope of the presentation."
            ],
            "icon_suggestions": ["rocket", "lightbulb", "compass"],
            "image_search_prompt": f"introducing {topic_title} concept",
        },
        {
            "title": "Core Strategic Pillars",
            "subtitle": "Primary areas of focus",
            "layout_type": "cards",
            "content": [
                "Foundational Pillar: Establishing core values and stable systems.",
                "Innovation Driver: Embracing agile methodology and scaling tech.",
                "Growth Enabler: Customer feedback loops and constant optimization."
            ],
            "icon_suggestions": ["layers", "cpu", "trending-up"],
            "image_search_prompt": "business strategy plan",
        },
        {
            "title": "Implementation Process",
            "subtitle": "Step-by-step rollout sequence",
            "layout_type": "process_flow",
            "content": [
                "Initiation: Gather project requirements and define key milestones.",
                "Development: Construct prototype modules and run local tests.",
                "Evaluation: Verify features with stakeholders and refine UI/UX.",
                "Deployment: Launch production instances and monitor status."
            ],
            "icon_suggestions": ["search", "sliders", "check-circle", "server"],
            "image_search_prompt": "workflow process flowchart",
        },
        {
            "title": "Performance Analysis",
            "subtitle": "Key metrics and statistical results",
            "layout_type": "statistics",
            "content": [
                "System output increased significantly post-implementation.",
                "Error rates dropped below the threshold of tolerance.",
                "Overall user satisfaction scored record high ratings."
            ],
            "icon_suggestions": ["bar-chart-2", "percent", "smile"],
            "image_search_prompt": "analytics dashboard trends",
            "chart_data": {
                "type": "bar",
                "labels": ["Q1", "Q2", "Q3", "Q4"],
                "values": [35, 50, 75, 95],
                "title": "Quarterly Expansion Rate (%)"
            }
        },
        {
            "title": "Strategic Roadmap",
            "subtitle": "Timeline and future milestones",
            "layout_type": "timeline",
            "content": [
                "Initial alignment phase kicked off with key leaders.",
                "Design guidelines established for multi-platform support.",
                "Scale plan configured to double active capacity."
            ],
            "icon_suggestions": ["calendar", "map-pin", "flag"],
            "image_search_prompt": "project timeline roadmap",
            "timeline_data": [
                {"label": "Phase 1: Research", "detail": "Establish goals & constraints"},
                {"label": "Phase 2: Build", "detail": "Develop baseline functionality"},
                {"label": "Phase 3: Deploy", "detail": "Release to production nodes"},
                {"label": "Phase 4: Scale", "detail": "Expand infrastructure globally"}
            ]
        },
        {
            "title": "Comparative Analysis",
            "subtitle": "Option evaluation matrix",
            "layout_type": "comparison",
            "content": [
                "Review of features versus alternative implementation paths.",
                "Detailed comparison highlighting efficiency and security.",
                "Selecting the optimal path based on resource budgets."
            ],
            "icon_suggestions": ["shuffle", "check", "shield"],
            "image_search_prompt": "comparison metrics table",
            "comparison_table": {
                "headers": ["Feature", "Legacy System", "Proposed Platform"],
                "rows": [
                  ["Speed", "Slow / Manual", "Instant / Automated"],
                  ["Security", "Standard SSL", "End-to-End Encrypted"],
                  ["Scalability", "Limited", "Unlimited Cloud-Native"]
                ]
            }
        },
        {
            "title": "Executive Perspective",
            "subtitle": "Final takeaways",
            "layout_type": "quote",
            "content": [
                "Innovation distinguishes between a leader and a follower."
            ],
            "icon_suggestions": ["help-circle"],
            "image_search_prompt": "inspiration leadership quote"
        }
    ]

    # Handle requested count
    if requested_count:
        requested_count = max(2, min(12, requested_count))
        if requested_count <= len(all_slides):
            all_slides = all_slides[:requested_count]
        else:
            # Pad
            while len(all_slides) < requested_count:
                all_slides.append({
                    "title": f"Expansion Theme {len(all_slides)+1}",
                    "subtitle": "Detailed focus point",
                    "layout_type": "bullet_list",
                    "content": [
                        "Additional context gathered from topic inquiry.",
                        "Analysis of operational limitations and frameworks.",
                        "Key actionable strategic milestones."
                    ],
                    "icon_suggestions": ["info", "check"],
                    "image_search_prompt": "business details background"
                })

    return {
        "theme": "slate",
        "slides": all_slides
    }

def generate_slides(text, user_prompt=None):
    requested_count = None
    if user_prompt:
        num_word_map = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
        match = re.search(r'\b(\d+)\s*-?\s*slides?\b', user_prompt.lower())
        if match:
            requested_count = int(match.group(1))
        else:
            match_word = re.search(r'\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*-?\s*slides?\b', user_prompt.lower())
            if match_word:
                requested_count = num_word_map[match_word.group(1)]

    if requested_count:
        requested_count = max(2, min(15, requested_count))

    # Construct the instruction and guidelines for slide generation
    slide_count_guideline = f"You MUST generate EXACTLY {requested_count} slides." if requested_count else "Generate between 5 and 8 slides representing a complete presentation flow."

    prompt = (
        "You are a professional presentation architect.\n"
        "Your task is to analyze the source text and/or prompt guidelines below and construct a structured presentation.\n\n"
        f"{slide_count_guideline}\n\n"
        "First, select a suitable visual theme matching the topic. Choose one of:\n"
        "- 'slate' (general/corporate/clean)\n"
        "- 'dark' (technology/modern/developer)\n"
        "- 'indigo' (creative/marketing/ocean)\n"
        "- 'emerald' (eco/health/growth/organic)\n"
        "- 'sakura' (food/pink/wellness)\n"
        "- 'cobalt' (IT/infrastructure/systems/blue)\n\n"
        "For each slide, you MUST choose the most appropriate layout type from this list:\n"
        "1. 'title' - Centered main title slide (use for opening/closing slides).\n"
        "2. 'bullet_list' - Standard bulleted text points.\n"
        "3. 'two_column' - Splitting details into two distinct columns.\n"
        "4. 'timeline' - Sequential phases, roadmaps, chronologies. REQUIRES 'timeline_data'.\n"
        "5. 'comparison' - Comparing options, features, pro/con. REQUIRES 'comparison_table'.\n"
        "6. 'cards' - Highlighting 2-4 core pillars, features, or areas in card blocks.\n"
        "7. 'process_flow' - Linear workflow step sequence. Content bullets should list the steps.\n"
        "8. 'statistics' - Large metric highlight + chart layout. REQUIRES 'chart_data'.\n"
        "9. 'image_text' - Half-width visual layout emphasizing text with a prominent side image.\n"
        "10. 'quote' - Prominently stylized quote block. Content should contain the quote text, subtitle should be the author.\n\n"
        "Each slide object MUST match this JSON schema:\n"
        "{\n"
        "  \"title\": \"Custom slide title (do not use Slide 1, etc)\",\n"
        "  \"subtitle\": \"Descriptive slide subtitle\",\n"
        "  \"layout_type\": \"title\" | \"bullet_list\" | \"two_column\" | \"timeline\" | \"comparison\" | \"cards\" | \"process_flow\" | \"statistics\" | \"image_text\" | \"quote\",\n"
        "  \"content\": [\"bullet point 1\", \"bullet point 2\", \"bullet point 3\"],\n"
        "  \"icon_suggestions\": [\"feather-icon-name-1\", \"feather-icon-name-2\"],\n"
        "  \"image_search_prompt\": \"1-2 word simple search query for Unsplash (e.g., 'coding', 'health')\",\n"
        "  \"chart_data\": { // OPTIONAL (Only include if layout_type is 'statistics')\n"
        "    \"type\": \"bar\" | \"line\" | \"pie\",\n"
        "    \"labels\": [\"Label 1\", \"Label 2\"],\n"
        "    \"values\": [45, 90],\n"
        "    \"title\": \"Chart Title\"\n"
        "  },\n"
        "  \"timeline_data\": [ // OPTIONAL (Only include if layout_type is 'timeline')\n"
        "    { \"label\": \"Milestone 1\", \"detail\": \"Milestone detail description\" }\n"
        "  ],\n"
        "  \"comparison_table\": { // OPTIONAL (Only include if layout_type is 'comparison')\n"
        "    \"headers\": [\"Feature\", \"Column A\", \"Column B\"],\n"
        "    \"rows\": [\n"
        "      [\"Row Header 1\", \"Value A1\", \"Value B1\"]\n"
        "    ]\n"
        "  }\n"
        "}\n\n"
        "Choose layouts dynamically based on the text. Return only valid JSON matching this schema:\n"
        "{\n"
        "  \"theme\": \"theme_name\",\n"
        "  \"slides\": [ ... ]\n"
        "}\n\n"
    )

    if text:
        prompt += f"Source Material:\n{text[:12000]}\n\n"
    if user_prompt:
        prompt += f"User Directive / Instructions:\n{user_prompt}\n\n"

    # 1. Gemini GenAI API Call
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key and gemini_key.strip() != "" and "api_key_here" not in gemini_key.lower():
        try:
            print("GEMINI_API_KEY found. Generating presentation via gemini-2.5-flash...", file=sys.stderr)
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            data = json.loads(response.text)
            if "slides" in data and isinstance(data["slides"], list) and len(data["slides"]) > 0:
                return data
            print("Gemini response lacked slides array, falling back.", file=sys.stderr)
        except Exception as e:
            print(f"Gemini slide generation error: {e}", file=sys.stderr)

    # 2. OpenAI API Call (Secondary Fallback)
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key and openai_key.strip() != "" and "api_key_here" not in openai_key.lower():
        try:
            print("OPENAI_API_KEY found. Generating presentation via gpt-4o-mini...", file=sys.stderr)
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
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
                return data
        except Exception as e:
            print(f"OpenAI fallback error: {e}", file=sys.stderr)

    # 3. Rule-Based Fallback
    print("Running rule-based local backup generator...", file=sys.stderr)
    return rule_based_fallback(text, user_prompt, requested_count)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps([]))
        sys.exit(0)

    input_arg = sys.argv[1]
    text = ""
    prompt_text = None

    try:
        data = json.loads(input_arg)
        if isinstance(data, dict):
            text = data.get("text", "")
            prompt_text = data.get("prompt", None)
        else:
            text = input_arg
    except Exception:
        text = input_arg

    result = generate_slides(text, prompt_text)
    print(json.dumps(result))