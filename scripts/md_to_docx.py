"""Convert DOCUMENTATION.md to Word (.docx) on Desktop."""
import re
import sys
from pathlib import Path

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = Path(__file__).resolve().parent.parent
MD_PATH = ROOT / "DOCUMENTATION.md"
OUT_PATH = Path.home() / "Desktop" / "Mertem-Grup-E-Ticaret-Dokumantasyon.docx"


def set_cell_shading(cell, color="E8E8E8"):
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), color)
    shading.set(qn("w:val"), "clear")
    cell._tc.get_or_add_tcPr().append(shading)


def add_formatted_run(paragraph, text):
    """Parse **bold** and `code` inline formatting."""
    pattern = re.compile(r"(\*\*[^*]+\*\*|`[^`]+`)")
    pos = 0
    for match in pattern.finditer(text):
        if match.start() > pos:
            paragraph.add_run(text[pos : match.start()])
        chunk = match.group(0)
        if chunk.startswith("**"):
            run = paragraph.add_run(chunk[2:-2])
            run.bold = True
        elif chunk.startswith("`"):
            run = paragraph.add_run(chunk[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(9)
            run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        pos = match.end()
    if pos < len(text):
        paragraph.add_run(text[pos:])


def parse_table_lines(lines):
    rows = []
    for line in lines:
        line = line.strip()
        if not line.startswith("|"):
            continue
        if re.match(r"^\|[\s\-:|]+\|$", line):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        rows.append(cells)
    return rows


def convert(md_text: str, doc: Document):
    lines = md_text.splitlines()
    i = 0
    in_code = False
    code_lang = ""
    code_lines = []

    while i < len(lines):
        line = lines[i]

        # Code block
        if line.strip().startswith("```"):
            if not in_code:
                in_code = True
                code_lang = line.strip()[3:].strip()
                code_lines = []
            else:
                in_code = False
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.25)
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(4)
                run = p.add_run("\n".join(code_lines))
                run.font.name = "Consolas"
                run.font.size = Pt(8)
                if code_lang == "mermaid":
                    note = doc.add_paragraph()
                    note_run = note.add_run("(Mermaid diyagram — Word'de metin olarak gösterilmiştir)")
                    note_run.italic = True
                    note_run.font.size = Pt(8)
                    note_run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
                code_lines = []
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        stripped = line.strip()

        # Horizontal rule
        if stripped in ("---", "***", "___"):
            doc.add_paragraph("_" * 60)
            i += 1
            continue

        # Headings
        m = re.match(r"^(#{1,4})\s+(.+)$", line)
        if m:
            level = len(m.group(1))
            text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", m.group(2))
            doc.add_heading(text, level=min(level, 4))
            i += 1
            continue

        # Table
        if stripped.startswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            rows = parse_table_lines(table_lines)
            if rows:
                col_count = max(len(r) for r in rows)
                rows = [r + [""] * (col_count - len(r)) for r in rows]
                table = doc.add_table(rows=len(rows), cols=col_count)
                table.style = "Table Grid"
                for r_idx, row in enumerate(rows):
                    for c_idx, cell_text in enumerate(row):
                        cell = table.rows[r_idx].cells[c_idx]
                        cell.text = ""
                        p = cell.paragraphs[0]
                        add_formatted_run(p, cell_text)
                        if r_idx == 0:
                            for run in p.runs:
                                run.bold = True
                            set_cell_shading(cell)
                doc.add_paragraph()
            continue

        # Bullet list
        if re.match(r"^[-*]\s+", stripped):
            text = re.sub(r"^[-*]\s+", "", stripped)
            text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
            p = doc.add_paragraph(style="List Bullet")
            add_formatted_run(p, text)
            i += 1
            continue

        # Numbered list (simple)
        if re.match(r"^\d+\.\s+", stripped):
            text = re.sub(r"^\d+\.\s+", "", stripped)
            text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
            p = doc.add_paragraph(style="List Number")
            add_formatted_run(p, text)
            i += 1
            continue

        # Blockquote / checkbox list
        if stripped.startswith("- [ ]") or stripped.startswith("- [x]"):
            text = stripped[6:].strip()
            p = doc.add_paragraph(style="List Bullet")
            add_formatted_run(p, text)
            i += 1
            continue

        # Empty line
        if not stripped:
            i += 1
            continue

        # Normal paragraph
        text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", stripped)
        p = doc.add_paragraph()
        add_formatted_run(p, text)
        i += 1


def main():
    if not MD_PATH.exists():
        print(f"Bulunamadı: {MD_PATH}", file=sys.stderr)
        sys.exit(1)

    md_text = MD_PATH.read_text(encoding="utf-8")
    doc = Document()

    # Title page style
    title = doc.add_heading("Mertem Grup E-Ticaret", 0)
    title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    subtitle = doc.add_paragraph("Teknik Dokümantasyon")
    subtitle.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    subtitle.runs[0].font.size = Pt(14)
    subtitle.runs[0].italic = True
    doc.add_paragraph()

    convert(md_text, doc)

    # Footer note
    doc.add_paragraph()
    footer = doc.add_paragraph("Kaynak: DOCUMENTATION.md — Mertem Grup E-Ticaret v1.0.0")
    footer.runs[0].font.size = Pt(9)
    footer.runs[0].italic = True
    footer.runs[0].font.color.rgb = RGBColor(0x88, 0x88, 0x88)

    doc.save(str(OUT_PATH))
    print(f"Kaydedildi: {OUT_PATH}")


if __name__ == "__main__":
    main()
