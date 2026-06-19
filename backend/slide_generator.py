import json
import os
import sys

def rule_based_fallback(text):
    import re
    from collections import Counter
    
    # 1. Clean and split into lines and sentences
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    sentences = []
    for line in lines:
        for part in line.split(". "):
            part_clean = part.strip()
            if part_clean:
                # remove trailing periods for sentences
                if part_clean.endswith("."):
                    part_clean = part_clean[:-1]
                if part_clean:
                    sentences.append(part_clean)
                    
    # Handle extremely short inputs
    if len(sentences) < 3:
        return [
            {
                "title": "Document Overview",
                "content": [
                    text if text.strip() else "No readable document text could be extracted.",
                    "Please upload a longer PDF/Word document with selectable text.",
                    "Ensure files are not scanned images without OCR text."
                ],
                "visual_suggestion": "A conceptual icon of document parsing"
            }
        ]

    # 2. Extract potential section headings from the text
    # A candidate heading is a short line (<= 6 words) that doesn't end in period, and starts with letter/number
    heading_candidates = []
    for line in lines:
        words_count = len(line.split())
        if 1 <= words_count <= 6 and not line.endswith(".") and re.match(r'^[A-Za-z0-9]', line):
            if not line.startswith("-") and not line.startswith("*") and not line.strip().lower() in ["and", "or", "the", "but"]:
                heading_candidates.append(line)
                
    # Filter duplicate or very similar headings
    seen = set()
    unique_headings = []
    for h in heading_candidates:
        h_lower = h.lower()
        if h_lower not in seen and len(h) > 3:
            seen.add(h_lower)
            unique_headings.append(h)

    # Gather top keywords in case we need them to pad the slide list to at least 5 slides
    words = re.findall(r'\b\w{4,15}\b', text.lower())
    stop_words = {
        "using", "should", "could", "would", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "cannot", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "if", "in", "into", "is", "it", "its", "itself", "let", "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with", "you", "your", "yours", "yourself", "yourselves", "project", "program", "system", "severe", "encountering", "optimizing", "proposed", "planning", "making", "about", "other", "some", "more", "first", "second", "third", "next", "also", "then", "very", "done", "need", "should", "must", "want", "like", "work", "files", "here", "there", "report", "document", "present", "presentation", "slide", "slides"
    }
    filtered_words = [w for w in words if w not in stop_words]
    word_freq = Counter(filtered_words)
    top_keywords = [item[0].capitalize() for item in word_freq.most_common(8)]
    while len(top_keywords) < 8:
        top_keywords.append("Overview")

    slide_titles = []
    # If we have 3 or more clear unique headings, use them!
    if len(unique_headings) >= 3:
        slide_titles = list(unique_headings[:8]) # limit to 8 slides max
        
        # If we have headings but they are fewer than 5, pad them with top keywords to reach 5 slides
        kw_idx = 0
        while len(slide_titles) < 5:
            candidate_kw = top_keywords[kw_idx]
            # Ensure keyword isn't already inside any heading to avoid duplication
            if not any(candidate_kw.lower() in t.lower() for t in slide_titles):
                if kw_idx % 2 == 0:
                    slide_titles.append(f"Analysis of {candidate_kw}")
                else:
                    slide_titles.append(f"Strategic {candidate_kw} Outlook")
            kw_idx += 1
            if kw_idx >= len(top_keywords):
                # Hard fallback to avoid infinite loop
                slide_titles.append(f"Key Insights Part {len(slide_titles)+1}")
    else:
        # Not enough unique headings, build purely from top keywords
        slide_titles = [
            f"{top_keywords[0]} & Executive Summary",
            f"Key Challenges in {top_keywords[1]}",
            f"Analysis of {top_keywords[2]} & Trends",
            f"Strategic Approach to {top_keywords[3]}",
            f"Optimizing {top_keywords[4]} & Outcomes"
        ]
        if len(top_keywords) >= 6:
            slide_titles.append(f"Future Outlook & {top_keywords[5]}")

    # 4. Context-Aware Sentence Assignment
    # For each sentence, we will assign it to a slide title based on keyword matching
    # and sequential document flow.
    num_slides = len(slide_titles)
    slides_content = [[] for _ in range(num_slides)]
    
    # Pre-tokenize title words for similarity matching
    title_word_sets = []
    for title in slide_titles:
        t_words = set(re.findall(r'\b\w{3,15}\b', title.lower()))
        title_word_sets.append(t_words)

    # Stop words for similarity checks
    local_stop_words = {
        "and", "the", "for", "with", "this", "that", "from", "are", "was", "were"
    }

    for idx, sentence in enumerate(sentences):
        s_words = set(re.findall(r'\b\w{3,15}\b', sentence.lower())) - local_stop_words
        
        # Calculate overlap score for each slide
        best_slide = 0
        best_score = -1.0
        
        # We also want to bias sentences to match their sequential position in the text.
        # This keeps the narrative order.
        # Expected relative position of this sentence in the document:
        rel_pos = idx / len(sentences)
        
        for s_idx in range(num_slides):
            overlap = len(s_words.intersection(title_word_sets[s_idx]))
            
            # Distance penalty: how far is this slide's index from the sentence's relative position
            expected_slide_idx = rel_pos * num_slides
            distance_penalty = abs(s_idx - expected_slide_idx) / num_slides
            
            # Combined score: overlap counts, position keeps the flow
            score = (overlap * 2.0) - (distance_penalty * 0.5)
            
            if score > best_score:
                best_score = score
                best_slide = s_idx
                
        slides_content[best_slide].append(sentence)

    # 5. Clean up slide contents (ensure each slide has at least 3 points and at most 5)
    # We will score sentences inside each slide bucket using TF-IDF-like keyword scoring to pick the best points
    words_all = re.findall(r'\b\w{4,15}\b', text.lower())
    stop_words_all = {
        "with", "they", "that", "this", "these", "those", "have", "from",
        "your", "will", "would", "their", "there", "about", "which", "when",
        "where", "what", "some", "more", "then", "them", "thence", "their"
    }
    word_freq_all = Counter([w for w in words_all if w not in stop_words_all])

    def rank_sentences(s_list):
        scored = []
        for s in s_list:
            s_words = re.findall(r'\b\w{4,15}\b', s.lower())
            score = sum(word_freq_all.get(w, 0) for w in s_words if w not in stop_words_all)
            norm_score = score / max(1, len(s_words))
            scored.append((s, norm_score))
        scored.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in scored]

    slides = []
    for s_idx, title in enumerate(slide_titles):
        raw_points = slides_content[s_idx]
        
        # If a slide has too few points, borrow from neighboring slides or use generic summary points
        if len(raw_points) < 3:
            # Try to grab some high-ranking sentences from sentences list based on matching this slide's title keywords
            backup_candidates = []
            for s in sentences:
                s_words = set(re.findall(r'\b\w{3,15}\b', s.lower()))
                overlap = len(s_words.intersection(title_word_sets[s_idx]))
                if overlap > 0:
                    backup_candidates.append(s)
            
            ranked_backups = rank_sentences(backup_candidates)
            for b in ranked_backups:
                if b not in raw_points:
                    raw_points.append(b)
                if len(raw_points) >= 3:
                    break
                    
        # If still empty or less than 3, add general context points
        while len(raw_points) < 3:
            raw_points.append(f"Key insight regarding {title.split(' & ')[0].split(' of ')[-1].lower()} from document analysis.")
            
        # If too many points, rank and take the top 5
        final_points = rank_sentences(raw_points)[:5]
        
        # Create visual suggestion and structured diagram based on keywords in title
        title_lower = title.lower()
        
        def extract_label_detail(p):
            p_clean = p.strip("• ")
            words = p_clean.split()
            if len(words) <= 3:
                return p_clean, p_clean
            label_words = []
            curr_len = 0
            for w in words[:3]:
                if curr_len + len(w) > 20:
                    break
                label_words.append(w)
                curr_len += len(w) + 1
            if not label_words:
                label_words = [words[0]]
            label = " ".join(label_words).strip(".,;:?!- ")
            return label, p_clean

        diagram = {"type": "none", "data": {"title": "", "items": []}}
        if any(w in title_lower for w in ["problem", "challenge", "issue", "risk"]):
            visual = f"A risk matrix or frustration icon comparing different {title.split(' ')[-1].lower()} bottlenecks"
            diagram = {
                "type": "matrix",
                "data": {
                    "title": "Risk / Issue Analysis Matrix",
                    "items": []
                }
            }
            for i, p in enumerate(final_points[:4]):
                lbl, dtl = extract_label_detail(p)
                diagram["data"]["items"].append({
                    "label": f"Risk {i+1}: {lbl}",
                    "detail": dtl,
                    "category": f"q{i+1}"
                })
        elif any(w in title_lower for w in ["strategy", "roadmap", "plan", "future"]):
            visual = "A horizontal timeline roadmap showing implementation stages"
            diagram = {
                "type": "timeline",
                "data": {
                    "title": "Strategic Timeline Roadmap",
                    "items": []
                }
            }
            for i, p in enumerate(final_points[:4]):
                lbl, dtl = extract_label_detail(p)
                diagram["data"]["items"].append({
                    "label": f"Phase {i+1}: {lbl}",
                    "detail": dtl
                })
        elif any(w in title_lower for w in ["analysis", "data", "metric", "insight"]):
            visual = "A dashboard visual showcasing analytics data and key performance indicators"
            diagram = {
                "type": "matrix",
                "data": {
                    "title": "Data Insights Summary",
                    "items": []
                }
            }
            for i, p in enumerate(final_points[:4]):
                lbl, dtl = extract_label_detail(p)
                diagram["data"]["items"].append({
                    "label": f"Insight {i+1}: {lbl}",
                    "detail": dtl,
                    "category": f"q{i+1}"
                })
        elif any(w in title_lower for w in ["structure", "architecture", "system"]):
            visual = "A layered system architecture diagram showing core components"
            diagram = {
                "type": "architecture",
                "data": {
                    "title": "System Architecture Overview",
                    "items": []
                }
            }
            tiers = ["Client UI", "App API Server", "Storage DB"]
            for i in range(3):
                p = final_points[i] if i < len(final_points) else final_points[0]
                lbl, dtl = extract_label_detail(p)
                diagram["data"]["items"].append({
                    "label": tiers[i],
                    "detail": dtl
                })
        elif any(w in title_lower for w in ["process", "flow", "workflow"]):
            visual = "A step-by-step flowchart diagram mapping operational stages"
            diagram = {
                "type": "flowchart",
                "data": {
                    "title": "Operational Workflow",
                    "items": []
                }
            }
            for i, p in enumerate(final_points[:4]):
                lbl, dtl = extract_label_detail(p)
                diagram["data"]["items"].append({
                    "label": f"Step {i+1}: {lbl}",
                    "detail": dtl
                })
        elif any(w in title_lower for w in ["decision", "tree", "branch", "choice", "option"]):
            visual = "A decision tree diagram mapping yes/no outcomes"
            diagram = {
                "type": "decision_tree",
                "data": {
                    "title": "Decision Outcomes Mapping",
                    "root": "Proposed Action",
                    "items": []
                }
            }
            p_yes = final_points[0]
            lbl_yes, dtl_yes = extract_label_detail(p_yes)
            diagram["data"]["items"].append({
                "label": f"Yes: {lbl_yes}",
                "detail": dtl_yes,
                "category": "yes"
            })
            p_no = final_points[1] if len(final_points) > 1 else final_points[0]
            lbl_no, dtl_no = extract_label_detail(p_no)
            diagram["data"]["items"].append({
                "label": f"No: {lbl_no}",
                "detail": dtl_no,
                "category": "no"
            })
        elif any(w in title_lower for w in ["relationship", "database", "data", "erd", "table"]):
            visual = "An entity-relationship diagram linking related records"
            diagram = {
                "type": "erd",
                "data": {
                    "title": "Entity Relationship Diagram",
                    "items": []
                }
            }
            p1 = final_points[0]
            lbl1, dtl1 = extract_label_detail(p1)
            diagram["data"]["items"].append({
                "label": f"Entity {lbl1[:10]}",
                "detail": "id (PK), name, description",
                "category": "entity_a"
            })
            p2 = final_points[1] if len(final_points) > 1 else final_points[0]
            lbl2, dtl2 = extract_label_detail(p2)
            diagram["data"]["items"].append({
                "label": f"Entity {lbl2[:10]}",
                "detail": "id (PK), fk_id (FK), status, value",
                "category": "entity_b"
            })
        elif any(w in title_lower for w in ["organ", "hierarchy", "chart", "management", "team"]):
            visual = "An organizational chart showing division roles"
            diagram = {
                "type": "org_chart",
                "data": {
                    "title": "Organizational Hierarchy",
                    "root": "Executive Board",
                    "items": []
                }
            }
            for i, p in enumerate(final_points[:3]):
                lbl, dtl = extract_label_detail(p)
                diagram["data"]["items"].append({
                    "label": f"Division {i+1}: {lbl}",
                    "detail": dtl
                })
        else:
            visual = f"A conceptual mind map centered on {title.split(' ')[0]}"
            diagram = {
                "type": "mind_map",
                "data": {
                    "title": f"{title.split(' ')[0]} Mind Map",
                    "root": title.split(' ')[0],
                    "items": []
                }
            }
            for i, p in enumerate(final_points[:3]):
                lbl, dtl = extract_label_detail(p)
                diagram["data"]["items"].append({
                    "label": lbl,
                    "detail": dtl
                })

        slides.append({
            "title": title,
            "content": final_points,
            "visual_suggestion": visual,
            "diagram": diagram
        })
        
    # Determine the theme based on keywords
    text_lower = text.lower()
    selected_theme = "slate"
    if any(w in text_lower for w in ["food", "beverage", "restaurant", "cook", "chef", "bakery", "sweet", "peach", "rose", "flower", "fruit", "recipe", "wellness", "spa", "pink"]):
        selected_theme = "sakura"
    elif any(w in text_lower for w in ["tech", "database", "network", "system", "logic", "code", "computing", "engineer", "developer", "software", "cyber", "security", "automation", "api", "programming", "server"]):
        selected_theme = "cobalt"
    elif any(w in text_lower for w in ["green", "eco", "forest", "tree", "plant", "environment", "sustain", "nature", "agriculture"]):
        selected_theme = "emerald"
    elif any(w in text_lower for w in ["dark", "night", "cyberpunk", "terminal"]):
        selected_theme = "dark"
    elif any(w in text_lower for w in ["ocean", "water", "sea", "river", "creative", "art", "music", "design", "marketing", "sales", "finance"]):
        selected_theme = "indigo"
        
    return {
        "theme": selected_theme,
        "slides": slides
    }

def generate_slides(text):
    prompt = (
        "You are a professional presentation generation system.\n"
        "Your task is to analyze the document content below, identify the main themes, and output a structured presentation "
        "as a JSON object containing 'theme' and 'slides' keys. "
        "You should generate between 5 and 10 slides that represent a comprehensive and logical flow of the document.\n"
        "Choose a suitable visual theme matching the document topic. Return one of: 'slate' (general/corporate/clean), 'dark' (technology/developer/modern), 'indigo' (creative/oceanic/professional), 'emerald' (eco/health/forest/growth), 'sakura' (food/wellness/peach/pink), or 'cobalt' (cool professional/IT/systems/blue).\n"
        "First, analyze the contents and create custom, descriptive titles for each slide based on the specific topics "
        "covered in the document (do not use generic titles like 'Slide 1' or 'Overview').\n"
        "Do not just copy blocks of text. Instead, summarize and recompose the text under these custom slide titles into "
        "brief, high-impact bullet points.\n\n"
        "For each slide, you must also provide a structured layout/diagram proposal to visually display slide themes in a diagram.\n"
        "Each slide object in the array MUST have the following keys:\n"
        "- 'title': A custom, descriptive slide title based on your analysis.\n"
        "- 'content': An array of 3 to 5 concise and meaningful bullet points summarizing the insights for that slide.\n"
        "- 'visual_suggestion': A short description of a diagram, flowchart, matrix, chart, or image that visually explains this slide's content.\n"
        "- 'diagram': A structured JSON object describing the diagram elements. It MUST conform to this format:\n"
        "  {\n"
        "    \"type\": \"flowchart\" | \"timeline\" | \"org_chart\" | \"mind_map\" | \"decision_tree\" | \"architecture\" | \"erd\" | \"matrix\" | \"none\",\n"
        "    \"data\": {\n"
        "      \"title\": \"A short title for the diagram\",\n"
        "      \"root\": \"Optional main central concept/choice/root node label (only for mind_map, decision_tree, org_chart)\",\n"
        "      \"items\": [\n"
        "        {\n"
        "          \"label\": \"A very short high-impact label (1-3 words, e.g., 'Step 1: Init', 'Q2 Milestone', 'Frontend Tier', 'Entity Name')\",\n"
        "          \"detail\": \"A short description or sentence of what this item represents\",\n"
        "          \"category\": \"Optional category tag (use 'yes' or 'no' for decision_tree; 'entity_a' or 'entity_b' for erd; 'q1', 'q2', 'q3', 'q4' for matrix)\"\n"
        "        }\n"
        "      ]\n"
        "    }\n"
        "  }\n\n"
        "Choose the diagram type that fits the slide contents best. For example:\n"
        "- Use 'flowchart' for linear step-by-step processes or workflows.\n"
        "- Use 'timeline' for roadmaps, history, and schedules.\n"
        "- Use 'org_chart' for administrative structures or hierarchical breakdowns.\n"
        "- Use 'mind_map' for exploring multiple facets of a single central concept.\n"
        "- Use 'decision_tree' for logic paths with branching decisions (must have 2 items with 'yes' and 'no' categories).\n"
        "- Use 'architecture' for technical infrastructure layers (usually 3 items: e.g. Client UI, App Server, Storage DB).\n"
        "- Use 'erd' for data relationship entity mappings (must have 2 items with 'entity_a' and 'entity_b' categories).\n"
        "- Use 'matrix' for comparative 2x2 grids, quadrant analyses, tables, or risk mappings (up to 4 items with categories 'q1', 'q2', 'q3', 'q4').\n"
        "- Use 'none' if no diagram is suitable.\n\n"
        f"Document Content:\n{text[:12000]}\n\n"
        "Return only valid JSON matching this schema: "
        '{"theme": "slate", "slides": [{"title": "Custom Slide Title", "content": ["point 1", "point 2"], "visual_suggestion": "Description...", '
        '"diagram": {"type": "flowchart", "data": {"title": "Title", "items": [{"label": "Step 1", "detail": "Init"}]}}}]}'
    )

    # 1. Check for Google Gemini API key
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key and gemini_key.strip() != "" and "api_key_here" not in gemini_key.lower():
        try:
            print("GEMINI_API_KEY found. Generating slides using gemini-2.5-flash...", file=sys.stderr)
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
                if "theme" not in data or data["theme"] not in ["slate", "dark", "indigo", "emerald", "sakura", "cobalt"]:
                    data["theme"] = "slate"
                return data
                
            print("Gemini API output did not match expected schema, falling back.", file=sys.stderr)
        except Exception as e:
            print(f"Gemini generation error: {e}", file=sys.stderr)

    # 2. Check for OpenAI API key
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key and openai_key.strip() != "" and "api_key_here" not in openai_key.lower():
        try:
            print("OPENAI_API_KEY found. Generating slides using gpt-4o-mini...", file=sys.stderr)
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
                if "theme" not in data or data["theme"] not in ["slate", "dark", "indigo", "emerald", "sakura", "cobalt"]:
                    data["theme"] = "slate"
                return data
                
            print("OpenAI API output did not match expected schema, falling back.", file=sys.stderr)
        except Exception as e:
            print(f"OpenAI generation error: {e}", file=sys.stderr)

    # 3. Local Rule-Based Fallback
    print("No valid API keys configured (Gemini or OpenAI). Running rule-based fallback...", file=sys.stderr)
    return rule_based_fallback(text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps([]))
        sys.exit(0)
        
    input_text = sys.argv[1]
    result = generate_slides(input_text)
    print(json.dumps(result))