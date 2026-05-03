"""ReportLab PDF report generation service."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
import os
import logging

logger = logging.getLogger(__name__)

# Font Registration
FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "fonts")

try:
    pdfmetrics.registerFont(TTFont("NotoSans", os.path.join(FONT_DIR, "NotoSans-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("NotoSansDevanagari", os.path.join(FONT_DIR, "NotoSansDevanagari-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("NotoSansKannada", os.path.join(FONT_DIR, "NotoSansKannada-Regular.ttf")))
    logger.info("Multilingual fonts registered successfully")
except Exception as e:
    logger.error(f"Failed to register multilingual fonts: {e}")



class ReportService:
    """Service for generating PDF analysis reports via ReportLab."""

    def generate_pdf(self, analysis_data: dict) -> bytes:
        """Generate a styled PDF report from analysis data. Returns raw bytes."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                topMargin=0.75*inch, bottomMargin=0.75*inch)
        
        # Determine Font
        lang = analysis_data.get("tts_language", "en-IN")
        if lang == "hi-IN":
            main_font = "NotoSansDevanagari"
        elif lang == "kn-IN":
            main_font = "NotoSansKannada"
        else:
            main_font = "NotoSans"

        # Initialize Styles
        base_styles = getSampleStyleSheet()
        
        # Create custom styles using the chosen font
        styles = {
            "Title": ParagraphStyle("CustomTitle", parent=base_styles["Title"], fontName=f"{main_font}", fontSize=18, spaceAfter=20),
            "Heading2": ParagraphStyle("CustomHeading2", parent=base_styles["Heading2"], fontName=f"{main_font}", fontSize=14, spaceBefore=12, spaceAfter=6),
            "Normal": ParagraphStyle("CustomNormal", parent=base_styles["Normal"], fontName=f"{main_font}", fontSize=10, leading=14),
        }
        
        story = []

        # Title
        story.append(Paragraph("FORGE — Material Analysis Report", styles["Title"]))
        story.append(Spacer(1, 12))

        # Recommendation
        rec = analysis_data.get("recommendation", {})
        story.append(Paragraph(f"Recommended Material: {rec.get('name', 'N/A')}", styles["Heading2"]))
        story.append(Paragraph(rec.get("explanation", ""), styles["Normal"]))
        if rec.get("grade"):
            story.append(Paragraph(f"Grade: {rec['grade']}", styles["Normal"]))
        story.append(Spacer(1, 12))

        # Alternatives
        alternatives = analysis_data.get("alternatives", [])
        if alternatives:
            story.append(Paragraph("Alternative Materials", styles["Heading2"]))
            for alt in alternatives:
                cost_diff = alt.get('cost_difference', '')
                story.append(Paragraph(
                    f"• {alt.get('name', 'N/A')}: {alt.get('reason', '')} "
                    f"({cost_diff})",
                    styles["Normal"]
                ))
            story.append(Spacer(1, 12))

        # Standards Compliance
        standards = analysis_data.get("standards", {})
        if standards:
            status = "PASSED" if standards.get("passed") else "FAILED"
            story.append(Paragraph(f"Standards Compliance: {status}", styles["Heading2"]))
            for detail in standards.get("details", []):
                color = "green" if detail.get("status") == "PASS" else "red"
                story.append(Paragraph(
                    f'<font color="{color}">{detail["standard"]}: {detail["status"]}</font>'
                    f' — {detail["note"]}',
                    styles["Normal"]
                ))
            story.append(Spacer(1, 12))

        # Failure Analysis
        failure = analysis_data.get("failure", {})
        if failure:
            story.append(Paragraph(f"Risk Level: {failure.get('risk_level', 'N/A')}", styles["Heading2"]))
            for mode in failure.get("failure_modes", []):
                story.append(Paragraph(
                    f"• {mode['type']} ({mode['severity']}): {mode['description']}",
                    styles["Normal"]
                ))
                story.append(Paragraph(f"  Prevention: {mode['prevention']}", styles["Normal"]))
            story.append(Spacer(1, 12))

        # Cost Comparison Table
        cost = analysis_data.get("cost", {})
        comparison = cost.get("comparison", [])
        if comparison:
            story.append(Paragraph("Cost Comparison", styles["Heading2"]))
            cost_data = [["Material", "Price Range", "Tier"]]
            for entry in comparison:
                price_text = entry["price_display"]
                cost_data.append([
                    Paragraph(entry["name"], styles["Normal"]),
                    Paragraph(price_text, styles["Normal"]),
                    Paragraph(entry["tier"], styles["Normal"])
                ])

            table = Table(cost_data, colWidths=[2.5*inch, 2*inch, 1.5*inch])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A1A2E")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTNAME", (0, 0), (-1, 0), main_font),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(table)
            story.append(Spacer(1, 12))

        # Conflict Warning
        conflict = analysis_data.get("conflict_warning", {})
        if conflict.get("detected"):
            story.append(Paragraph("⚠ Conflict Warning", styles["Heading2"]))
            for c in conflict.get("conflicts", []):
                story.append(Paragraph(f"• {c}", styles["Normal"]))
            if conflict.get("resolution"):
                story.append(Paragraph(f"Resolution: {conflict['resolution']}", styles["Normal"]))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        logger.info(f"PDF report generated: {len(pdf_bytes)} bytes")
        return pdf_bytes


report_service = ReportService()
