import json
import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def apply_text_styling(paragraph, font_name="Arial", size_pt=18, color_rgb=(51, 65, 85), bold=False, italic=False):
    paragraph.font.name = font_name
    paragraph.font.size = Pt(size_pt)
    paragraph.font.color.rgb = RGBColor(*color_rgb)
    paragraph.font.bold = bold
    paragraph.font.italic = italic

def draw_diagram(slide, suggestion, content):
    text = (suggestion or "").lower()
    
    # Helper to truncate text inside shapes
    def trunc(s, max_len=30):
        return s[:max_len] + "..." if len(s) > max_len else s

    accent_rgb = (99, 102, 241)     # Indigo 500
    accent_light_rgb = (238, 242, 255) # Indigo 50
    text_dark_rgb = (15, 23, 42)      # Slate 900
    text_light_rgb = (255, 255, 255)  # White
    border_rgb = (199, 210, 254)      # Indigo 200

    # 1. Process Flow / Business Workflow
    if any(x in text for x in ["process", "workflow", "flowchart"]):
        top_offset = Inches(1.8)
        for i, point in enumerate(content[:4]):
            # Draw Step Rounded Rectangle
            shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.3), top_offset, Inches(3.8), Inches(0.8))
            shape.fill.solid()
            shape.fill.fore_color.rgb = RGBColor(*accent_light_rgb)
            shape.line.color.rgb = RGBColor(*border_rgb)
            tf = shape.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = f"Step {i+1}: {trunc(point, 40)}"
            apply_text_styling(p, font_name="Arial", size_pt=11, color_rgb=text_dark_rgb, bold=True)
            
            top_offset += Inches(0.8)
            
            # Draw down connector arrow (unless last)
            if i < len(content[:4]) - 1:
                arrow = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(10.1), top_offset, Inches(0.2), Inches(0.3))
                arrow.fill.solid()
                arrow.fill.fore_color.rgb = RGBColor(*accent_rgb)
                arrow.line.fill.background()
                top_offset += Inches(0.3)
        return

    # 2. Timeline
    if any(x in text for x in ["timeline", "schedule", "history"]):
        # Draw vertical timeline bar
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(8.5), Inches(1.8), Inches(0.1), Inches(4.5))
        bar.fill.solid()
        bar.fill.fore_color.rgb = RGBColor(*accent_rgb)
        bar.line.fill.background()
        
        top_offset = Inches(1.9)
        for i, point in enumerate(content[:4]):
            # Draw circle dot on line
            circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(8.35), top_offset + Inches(0.15), Inches(0.4), Inches(0.4))
            circle.fill.solid()
            circle.fill.fore_color.rgb = RGBColor(255, 255, 255)
            circle.line.color.rgb = RGBColor(*accent_rgb)
            circle.line.width = Pt(3)
            
            # Draw milestone card details
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.9), top_offset, Inches(3.2), Inches(0.7))
            card.fill.solid()
            card.fill.fore_color.rgb = RGBColor(*accent_light_rgb)
            card.line.color.rgb = RGBColor(*border_rgb)
            tf = card.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = trunc(point, 45)
            apply_text_styling(p, font_name="Arial", size_pt=10, color_rgb=text_dark_rgb)
            
            top_offset += Inches(1.1)
        return

    # 3. Organizational Chart / Hierarchy
    if any(x in text for x in ["organ", "hierarchy", "chart"]):
        # Root Node
        root = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.2), Inches(1.8), Inches(2.0), Inches(0.7))
        root.fill.solid()
        root.fill.fore_color.rgb = RGBColor(*accent_rgb)
        root.line.fill.background()
        p_root = root.text_frame.paragraphs[0]
        p_root.text = "Root Level"
        apply_text_styling(p_root, font_name="Arial", size_pt=11, color_rgb=text_light_rgb, bold=True)
        
        # Vertical line down
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(10.15), Inches(2.5), Inches(0.05), Inches(0.6))
        line.fill.solid()
        line.fill.fore_color.rgb = RGBColor(*accent_rgb)
        line.line.fill.background()
        
        # Horizontal branching line
        hbar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(8.3), Inches(3.1), Inches(3.8), Inches(0.05))
        hbar.fill.solid()
        hbar.fill.fore_color.rgb = RGBColor(*accent_rgb)
        hbar.line.fill.background()
        
        # Branch children boxes
        for i, point in enumerate(content[:3]):
            x_pos = Inches(7.8) + i * Inches(1.4)
            vline = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x_pos + Inches(0.55), Inches(3.15), Inches(0.05), Inches(0.45))
            vline.fill.solid()
            vline.fill.fore_color.rgb = RGBColor(*accent_rgb)
            vline.line.fill.background()
            
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x_pos, Inches(3.6), Inches(1.2), Inches(1.2))
            card.fill.solid()
            card.fill.fore_color.rgb = RGBColor(*accent_light_rgb)
            card.line.color.rgb = RGBColor(*border_rgb)
            tf = card.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = f"Div {i+1}:\n{trunc(point, 18)}"
            apply_text_styling(p, font_name="Arial", size_pt=9, color_rgb=text_dark_rgb)
        return

    # 4. Mind Map
    if any(x in text for x in ["mind", "concept"]):
        # Central hub oval
        center = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9.2), Inches(3.3), Inches(1.8), Inches(1.0))
        center.fill.solid()
        center.fill.fore_color.rgb = RGBColor(*accent_rgb)
        center.line.fill.background()
        p_c = center.text_frame.paragraphs[0]
        p_c.text = "Core Concept"
        apply_text_styling(p_c, font_name="Arial", size_pt=11, color_rgb=text_light_rgb, bold=True)
        
        spokes = [
            (Inches(7.8), Inches(1.8)),
            (Inches(10.6), Inches(1.8)),
            (Inches(9.2), Inches(4.8))
        ]
        for i, point in enumerate(content[:3]):
            x, y = spokes[i]
            # Draw line to spoke
            conn = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, (x + Inches(9.2))/2 + Inches(0.45), (y + Inches(3.3))/2 + Inches(0.25), Inches(0.05), Inches(0.4))
            conn.fill.solid()
            conn.fill.fore_color.rgb = RGBColor(*border_rgb)
            conn.line.fill.background()
            
            node = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(1.8), Inches(0.8))
            node.fill.solid()
            node.fill.fore_color.rgb = RGBColor(*accent_light_rgb)
            node.line.color.rgb = RGBColor(*border_rgb)
            tf = node.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = trunc(point, 25)
            apply_text_styling(p, font_name="Arial", size_pt=9, color_rgb=text_dark_rgb)
        return

    # 5. Decision Tree
    if any(x in text for x in ["decision", "tree", "branch"]):
        # Decision diamond
        cond = slide.shapes.add_shape(MSO_SHAPE.DIAMOND, Inches(9.2), Inches(1.8), Inches(2.0), Inches(1.0))
        cond.fill.solid()
        cond.fill.fore_color.rgb = RGBColor(*accent_rgb)
        cond.line.fill.background()
        p_cond = cond.text_frame.paragraphs[0]
        p_cond.text = "Decision"
        apply_text_styling(p_cond, font_name="Arial", size_pt=11, color_rgb=text_light_rgb, bold=True)
        
        # YES card (Green border)
        left_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(3.8), Inches(1.8), Inches(1.2))
        left_card.fill.solid()
        left_card.fill.fore_color.rgb = RGBColor(*accent_light_rgb)
        left_card.line.color.rgb = RGBColor(34, 197, 94)
        left_card.line.width = Pt(2)
        tf_l = left_card.text_frame
        tf_l.word_wrap = True
        p_l = tf_l.paragraphs[0]
        p_l.text = f"[YES BRANCH]\n{trunc(content[0] if len(content) > 0 else 'Action A', 24)}"
        apply_text_styling(p_l, font_name="Arial", size_pt=9, color_rgb=text_dark_rgb)
        
        # NO card (Red border)
        right_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.6), Inches(3.8), Inches(1.8), Inches(1.2))
        right_card.fill.solid()
        right_card.fill.fore_color.rgb = RGBColor(*accent_light_rgb)
        right_card.line.color.rgb = RGBColor(239, 68, 68)
        right_card.line.width = Pt(2)
        tf_r = right_card.text_frame
        tf_r.word_wrap = True
        p_r = tf_r.paragraphs[0]
        p_r.text = f"[NO BRANCH]\n{trunc(content[1] if len(content) > 1 else 'Action B', 24)}"
        apply_text_styling(p_r, font_name="Arial", size_pt=9, color_rgb=text_dark_rgb)
        return

    # 6. System Architecture (3-tier stack)
    if any(x in text for x in ["architecture", "infrastructure", "system"]):
        layers = [
            ("🖥️ Client UI", accent_light_rgb, text_dark_rgb),
            ("🚀 App API Server", accent_rgb, text_light_rgb),
            ("🗄️ Storage DB", accent_light_rgb, text_dark_rgb)
        ]
        
        top_offset = Inches(1.8)
        for i, (label, bg_rgb, fg_rgb) in enumerate(layers):
            layer = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.3), top_offset, Inches(3.8), Inches(0.8))
            layer.fill.solid()
            layer.fill.fore_color.rgb = RGBColor(*bg_rgb)
            layer.line.color.rgb = RGBColor(*border_rgb)
            tf = layer.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            desc = content[i] if len(content) > i else "System components layer"
            p.text = f"{label}: {trunc(desc, 30)}"
            apply_text_styling(p, font_name="Arial", size_pt=10, color_rgb=fg_rgb, bold=True)
            
            top_offset += Inches(0.8)
            if i < 2:
                arrow = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(10.1), top_offset, Inches(0.2), Inches(0.3))
                arrow.fill.solid()
                arrow.fill.fore_color.rgb = RGBColor(*accent_rgb)
                arrow.line.fill.background()
                top_offset += Inches(0.3)
        return

    # 7. Data Relationship / ERD
    if any(x in text for x in ["relationship", "database", "data", "erd"]):
        # Entity A
        tbl_a = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(2.2), Inches(1.8), Inches(2.2))
        tbl_a.fill.solid()
        tbl_a.fill.fore_color.rgb = RGBColor(255, 255, 255)
        tbl_a.line.color.rgb = RGBColor(*accent_rgb)
        tbl_a.line.width = Pt(2)
        tf_a = tbl_a.text_frame
        tf_a.word_wrap = True
        p_ah = tf_a.paragraphs[0]
        p_ah.text = "Entity_A"
        apply_text_styling(p_ah, font_name="Arial", size_pt=11, color_rgb=accent_rgb, bold=True)
        p_ah.space_after = Pt(6)
        for field in ["id (PK)", "name", "desc"]:
            p = tf_a.add_paragraph()
            p.text = f"• {field}"
            apply_text_styling(p, font_name="Arial", size_pt=9, color_rgb=text_dark_rgb)
            
        # Entity B
        tbl_b = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.7), Inches(2.2), Inches(1.8), Inches(2.2))
        tbl_b.fill.solid()
        tbl_b.fill.fore_color.rgb = RGBColor(255, 255, 255)
        tbl_b.line.color.rgb = RGBColor(*accent_rgb)
        tbl_b.line.width = Pt(2)
        tf_b = tbl_b.text_frame
        tf_b.word_wrap = True
        p_bh = tf_b.paragraphs[0]
        p_bh.text = "Entity_B"
        apply_text_styling(p_bh, font_name="Arial", size_pt=11, color_rgb=accent_rgb, bold=True)
        p_bh.space_after = Pt(6)
        for field in ["id (PK)", "fk_id (FK)", "value"]:
            p = tf_b.add_paragraph()
            p.text = f"• {field}"
            apply_text_styling(p, font_name="Arial", size_pt=9, color_rgb=text_dark_rgb)

        # Connector relation line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.6), Inches(3.2), Inches(1.1), Inches(0.04))
        line.fill.solid()
        line.fill.fore_color.rgb = RGBColor(*accent_rgb)
        line.line.fill.background()
        return

    # 8. Comparison Matrix (2x2 grid)
    if any(x in text for x in ["matrix", "compare", "grid", "quadrant", "table"]):
        coords = [
            (Inches(7.8), Inches(1.8)),
            (Inches(10.2), Inches(1.8)),
            (Inches(7.8), Inches(4.1)),
            (Inches(10.2), Inches(4.1))
        ]
        for i, point in enumerate(content[:4]):
            x, y = coords[i]
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(2.2), Inches(2.0))
            card.fill.solid()
            card.fill.fore_color.rgb = RGBColor(*accent_light_rgb)
            card.line.color.rgb = RGBColor(*border_rgb)
            tf = card.text_frame
            tf.word_wrap = True
            
            p_h = tf.paragraphs[0]
            p_h.text = f"Quadrant {i+1}"
            apply_text_styling(p_h, font_name="Arial", size_pt=11, color_rgb=accent_rgb, bold=True)
            p_h.space_after = Pt(4)
            
            p_b = tf.add_paragraph()
            p_b.text = trunc(point, 50)
            apply_text_styling(p_b, font_name="Arial", size_pt=9, color_rgb=text_dark_rgb)
        return

    # Default fallback: visual layout suggestion textbox
    visual_box = slide.shapes.add_textbox(Inches(7.8), Inches(1.8), Inches(4.7), Inches(4.8))
    tf_visual = visual_box.text_frame
    tf_visual.word_wrap = True
    
    p_vis_lbl = tf_visual.paragraphs[0]
    p_vis_lbl.text = "RECOMMENDED VISUAL LAYOUT:"
    apply_text_styling(p_vis_lbl, font_name="Arial", size_pt=12, color_rgb=accent_rgb, bold=True)
    p_vis_lbl.space_after = Pt(10)
    
    p_vis_val = tf_visual.add_paragraph()
    p_vis_val.text = suggestion
    apply_text_styling(p_vis_val, font_name="Arial", size_pt=14, color_rgb=(71, 85, 105), italic=True)

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 ppt_exporter.py <slides_json_or_file> <output_pptx_path>")
        sys.exit(1)

    json_input = sys.argv[1]
    output_path = sys.argv[2]

    # Load JSON from file or parse directly
    try:
        if os.path.exists(json_input):
            with open(json_input, 'r', encoding='utf-8') as f:
                slides = json.load(f)
        else:
            slides = json.loads(json_input)
    except Exception as e:
        print(f"Error loading JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    # Allow slides key wrapping or direct array
    if isinstance(slides, dict) and "slides" in slides:
        slides = slides["slides"]

    prs = Presentation()
    # Set slide size to widescreen 16:9
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Use blank layout for custom placement to make it look premium
    blank_layout = prs.slide_layouts[6]

    for idx, slide_data in enumerate(slides):
        slide = prs.slides.add_slide(blank_layout)
        
        title_text = slide_data.get("title", f"Slide {idx + 1}")
        content_points = slide_data.get("content", [])
        visual_suggestion = slide_data.get("visual_suggestion", "")

        if idx == 0:
            # Title Slide: Dark Slate theme (#0F172A)
            background = slide.background
            fill = background.fill
            fill.solid()
            fill.fore_color.rgb = RGBColor(15, 23, 42)
            
            # Text box for title & description
            txBox = slide.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.333), Inches(4.0))
            tf = txBox.text_frame
            tf.word_wrap = True
            
            p_title = tf.paragraphs[0]
            p_title.text = title_text
            apply_text_styling(p_title, font_name="Georgia", size_pt=44, color_rgb=(255, 255, 255), bold=True)
            p_title.space_after = Pt(20)
            
            if content_points:
                p_sub = tf.add_paragraph()
                p_sub.text = " • ".join(content_points)
                apply_text_styling(p_sub, font_name="Arial", size_pt=18, color_rgb=(148, 163, 184))
        else:
            # Content Slide: Light slate background (#F8FAFC)
            background = slide.background
            fill = background.fill
            fill.solid()
            fill.fore_color.rgb = RGBColor(248, 250, 252)
            
            # Slide Header Title
            title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(11.7), Inches(1.0))
            tf_title = title_box.text_frame
            tf_title.word_wrap = True
            p_title = tf_title.paragraphs[0]
            p_title.text = title_text
            apply_text_styling(p_title, font_name="Georgia", size_pt=32, color_rgb=(15, 23, 42), bold=True)
            
            # Left Column: Content Points
            content_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(6.5), Inches(4.8))
            tf_content = content_box.text_frame
            tf_content.word_wrap = True
            
            for p_idx, point in enumerate(content_points):
                p = tf_content.add_paragraph() if p_idx > 0 else tf_content.paragraphs[0]
                p.text = f"•  {point}"
                apply_text_styling(p, font_name="Arial", size_pt=16, color_rgb=(51, 65, 85))
                p.space_after = Pt(14)
                
            # Right Column: Draw dynamic diagram if suggestion exists
            if visual_suggestion:
                draw_diagram(slide, visual_suggestion, content_points)

    prs.save(output_path)
    print(f"PowerPoint saved successfully to: {output_path}")

if __name__ == "__main__":
    main()
