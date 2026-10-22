from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "generated" / "ceramic_artwork_pages.pdf"

ARTWORKS = [
    {
        "image": ROOT / "assets/workpics/imbusy/ImBusy13x14x15.jpeg",
        "year": "2026",
    },
    {
        "image": ROOT / "assets/workpics/Reachingforfeelings/Reachingforfeeling8_11_102026.jpg",
        "year": "2026",
    },
    {
        "image": ROOT / "assets/workpics/SuperStressed/SuperStressed16_14_5.jpeg",
        "year": "2026",
    },
    {
        "image": ROOT / "assets/workpics/TripleFace/TripleFace7x8x12.jpeg",
        "year": "2026",
    },
    {
        "image": ROOT / "assets/workpics/FallenWatcher/FallenWatcher10_14_6.jpeg",
        "year": "2024",
    },
]

PAGE_W, PAGE_H = 2550, 3300
MARGIN = 210
IMAGE_BOX_W = PAGE_W - (MARGIN * 2)
IMAGE_BOX_H = 1700

FONT_REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


TITLE_FONT = font(FONT_BOLD, 88)
LABEL_FONT = font(FONT_BOLD, 50)
TEXT_FONT = font(FONT_REGULAR, 50)


def title_from_filename(path):
    stem = path.stem
    stem = re.sub(r"[_-]?(?:ceramic|2024|2025|2026)$", "", stem, flags=re.I)
    stem = re.sub(r"(?i)(\d+)[x_](\d+)[x_](\d+).*", "", stem).strip("_- ")
    stem = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", stem)
    stem = stem.replace("_", " ").replace("-", " ")
    return re.sub(r"\s+", " ", stem).strip()


def dimensions_from_filename(path):
    match = re.search(r"(\d+(?:\.\d+)?)\s*[x_]\s*(\d+(?:\.\d+)?)\s*[x_]\s*(\d+(?:\.\d+)?)", path.stem)
    if not match:
        return "N/A"
    return f"{match.group(1)} × {match.group(2)} × {match.group(3)} in."


def draw_field(draw, y, label, value):
    draw.text((MARGIN, y), f"{label}:", fill=(24, 24, 24), font=LABEL_FONT)
    label_w = draw.textlength(f"{label}: ", font=LABEL_FONT)
    draw.text((MARGIN + label_w + 10, y), value, fill=(24, 24, 24), font=TEXT_FONT)
    return y + 78


def make_page(item):
    page = Image.new("RGB", (PAGE_W, PAGE_H), "white")
    draw = ImageDraw.Draw(page)

    with Image.open(item["image"]) as src:
        src = src.convert("RGB")
        src.thumbnail((IMAGE_BOX_W, IMAGE_BOX_H), Image.Resampling.LANCZOS)
        x = (PAGE_W - src.width) // 2
        y = MARGIN
        page.paste(src, (x, y))

    line_y = MARGIN + IMAGE_BOX_H + 130
    title = title_from_filename(item["image"])
    dimensions = dimensions_from_filename(item["image"])

    draw.text((MARGIN, line_y), title, fill=(10, 10, 10), font=TITLE_FONT)
    line_y += 145
    line_y = draw_field(draw, line_y, "Title", title)
    line_y = draw_field(draw, line_y, "Year", item["year"])
    line_y = draw_field(draw, line_y, "Medium", "Ceramic and glaze")
    line_y = draw_field(draw, line_y, "Dimensions in H × W × D", dimensions)
    draw_field(draw, line_y, "Estimated value—or N/A", "$1,000")

    return page


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    pages = [make_page(item) for item in ARTWORKS]
    first, rest = pages[0], pages[1:]
    first.save(OUT, "PDF", resolution=300.0, save_all=True, append_images=rest)
    print(OUT)


if __name__ == "__main__":
    main()
