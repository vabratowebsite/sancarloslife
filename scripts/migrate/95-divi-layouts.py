#!/usr/bin/env python3
"""Turns the WordPress (Divi) pages in data/pages.json into layout files the site renders
section by section (src/content/divi/<slug>.json), so these pages keep the live site's exact
sections, order, headings, text and photos.

    python3 scripts/migrate/95-divi-layouts.py [slug ...]

The WordPress HTML is data: only known Divi modules are kept, scripts/styles/forms are
dropped, and module HTML is sanitized again when the page renders (sanitizeHtml).
Photos point at the WordPress originals; the renderer swaps in the media library copy.
"""
import json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import divi_styles  # noqa: E402
from bs4 import BeautifulSoup, Comment, Tag

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "scripts/migrate/data"
OUT = ROOT / "src/content/divi"

PAGES = ("about-san-carlos history-of-san-carlos restaurants-and-services attractions parks-of-san-carlos "
         "events-and-activities hometown-days san-carlos-centennial-2025-celebrating-100-years "
         "alder-manor beverly-terrace clearfield-park cordes el-sereno howard-park").split()

def cls(el):
    return el.get("class", []) if isinstance(el, Tag) else []

def has(el, c):
    return c in cls(el)

def text(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)) if el else ""

def clean_url(u):
    return (u or "").strip()

def img_src(img):
    if not img:
        return ""
    for a in ("data-src", "data-lazy-src", "src"):
        v = img.get(a)
        if v and not v.startswith("data:"):
            return re.sub(r"-\d+x\d+(?=\.\w+$)", "", v)  # full-size original, not a WP thumbnail
    return ""

def inner_html(el):
    if not el:
        return ""
    for bad in el.find_all(["script", "style", "form", "noscript", "input", "button"]):
        bad.decompose()
    for c in el.find_all(string=lambda t: isinstance(t, Comment)):
        c.extract()
    for ihf in el.find_all(attrs={"data-ihf-client-id": True}):
        ihf.decompose()
    return "".join(str(c) for c in el.contents).strip()

def youtube_id(src):
    m = re.search(r"(?:embed/|v=|youtu\.be/)([\w-]{11})", src or "")
    return m.group(1) if m else ""

HIDDEN = {}  # slug -> {"desktop": [keys], "phone": [keys]} read from the live site (data/divi-hidden.json)
CUR = {"hidden": {}, "bg": {}}
BG = {}  # background photos set by the live site's stylesheets (data/divi-bg.json)

def bg_of(el):
    f = CUR["bg"].get(live_key(el))
    return f"https://sancarloslife.com/wp-content/uploads/{f}" if f else ""

def key(el):
    return next((k for k in cls(el) if re.fullmatch(r"et_pb_[a-z_]+_\d+(_tb_body)?", k) and not k.startswith("et_pb_column_inner_") or re.fullmatch(r"et_pb_column_\d+", k)), "")

def live_key(el):
    """The element's class as the live page numbers it. The REST API numbers modules across every
    page it renders in one response, so indexes are shifted to start where the live page starts."""
    k = key(el)
    m = re.fullmatch(r"et_pb_([a-z_]+?)_(\d+)", k)
    if not m:
        return k
    t, n = m.group(1), int(m.group(2))
    return f"et_pb_{t}_{n - CUR['restbase'].get(t, 0) + CUR['livebase'].get(t, 0)}"

def bases(html):
    out = {}
    for t, n in re.findall(r"(?<=[\"\s])et_pb_([a-z_]+?)_(\d+)(?=[\"\s])", html):
        out[t] = min(out.get(t, 10**9), int(n))
    return out

def hidden(el):
    out = [d for d in ("phone", "tablet", "desktop") if f"et_pb_hidden_{d}" in cls(el)]
    k = live_key(el)
    for dev, keys in CUR["hidden"].items():
        if k and k in keys and dev not in out:
            out.append(dev)
    return out

def grid_cards(html):
    """The Grid plugin listings (restaurants, shops) become plain cards: photo, name, tags, link."""
    soup = BeautifulSoup(html, "html.parser")
    cards = []
    for a in soup.find_all("article", class_="tg-item"):
        img = a.find("img")
        bgimg = a.find(class_="tg-item-image", style=True)
        src = img_src(img) if img else ""
        if not src and bgimg:
            m = re.search(r"url\(([^)]+)\)", bgimg["style"])
            src = m.group(1).strip("'\"") if m else ""
        link = a.find("a", href=True, class_="tg-element-absolute")
        name = a.find(class_="tg-item-meta-data") or a.find(class_="tg-item-title")
        excerpt = a.find(class_="tg-item-excerpt")
        groups = [[t.get_text(" ", strip=True) for t in h.find_all(class_="tg-item-term")] for h in a.find_all(class_="tg-cats-holder")]
        title = name.get_text(" ", strip=True) if name else ""
        cards.append({"title": title, "href": link.get("href", "") if link else "",
                      "img": src, "alt": (img.get("alt", "") if img else "") or title,
                      "tags": [g for g in groups if g], "more": bool(a.find(class_="tg-element-4")),
                      "html": inner_html(excerpt) if excerpt else ""})
    return cards

def timeline(html):
    """Cool Timeline stories (history page) become entries: year, title, photo, text."""
    soup = BeautifulSoup(html, "html.parser")
    head = soup.find(class_="timeline-main-title")
    stories = []
    for st in soup.find_all(class_="ctl-story"):
        title = st.find(class_="ctl-title")
        img = st.find("img")
        desc = st.find(class_="ctl-description")
        stories.append({"year": text(st.find(class_="story-date") or st.find(class_="ctl-label-big")), "when": text(st.find(class_="ctl-label-small")), "title": title.get_text(" ", strip=True) if title else "",
                        "img": img_src(img) if img else "", "alt": img.get("alt", "") if img else "",
                        "html": inner_html(desc) if desc else "", "side": "left" if "ctl-story-left" in cls(st) else "right"})
    out = {"t": "timeline", "title": head.get_text(" ", strip=True) if head else "", "items": stories}
    if soup.find(class_="ctl-horizontal"):
        out["horizontal"] = True
    return out

def module(m):
    out = module_body(m)
    if out and out["t"] in ("text", "embed") and "ctl-story" in str(m):
        out = timeline(str(m))
    elif not out and "ctl-story" in str(m):
        out = timeline(str(m))
    if out and out["t"] == "text" and "tg-grid-wrapper" in str(m):
        out = {"t": "cards", "items": grid_cards(str(m))}
    if out and hidden(m):
        out["hide"] = hidden(m)
    if out and bg_of(m):
        out["bg"] = bg_of(m)
    look = CUR.get("looks", {}).get(live_key(m))
    if out and look and out["t"] in ("text", "blurb", "heading", "counter", "toggle"):
        out["look"] = look
    if out and out["t"] == "cta" and not out.get("bg"):
        name = re.sub(r"\s+", " ", BeautifulSoup(out.get("html") or "", "html.parser").get_text(" ", strip=True)).lower()
        f = BG.get("_neighborhoods", {}).get(name)
        if f:
            out["bg"] = f"https://sancarloslife.com/wp-content/uploads/{f}"
    if out and out["t"] == "counter":
        c = BG.get("_counters", {}).get(CUR["slug"], {}).get(live_key(m))
        if c:
            out["number"], out["prefix"] = c
    if out and out["t"] == "hero":
        out["poster"] = f"https://sancarloslife.com/wp-content/uploads/{BG.get('_hero', '')}"
    return out

def module_body(m):
    c = cls(m)
    if "et_pb_number_counter" in c:
        num = m.find(class_="percent-value") or m.find(class_="percent")
        value = m.get("data-number-value") or (num.get("data-number-value") if num else "") or text(num)
        return {"t": "counter", "title": text(m.find(re.compile(r"^h[1-6]$"))), "number": value, "sep": m.get("data-number-separator", ""),
                "suffix": "%" if "et_pb_with_title" in c and m.find(class_="percent") and "%" in text(m.find(class_="percent")) else ""}
    if "et_pb_social_media_follow" in c:
        return None
    if "et_pb_heading" in c:
        h = m.find(re.compile(r"^h[1-6]$"))
        return {"t": "heading", "level": int(h.name[1]) if h else 2, "text": text(h or m)}
    if "et_pb_text" in c:
        body = m.find(class_="et_pb_text_inner") or m
        html = inner_html(body)
        return {"t": "text", "html": html} if text(body) or "<img" in html else None
    if "et_pb_image" in c:
        img = m.find("img"); a = m.find("a")
        return {"t": "image", "src": img_src(img), "alt": (img.get("alt") or "") if img else "",
                "href": clean_url(a.get("href")) if a and not has(a, "et_pb_lightbox_image") else ""}
    if "et_pb_button_module_wrapper" in c or "et_pb_button" in c:
        a = m if m.name == "a" else m.find("a")
        return {"t": "button", "text": text(a), "href": clean_url(a.get("href") if a else "")}
    if "et_pb_blurb" in c:
        img = m.find("img"); a = m.find("a")
        title = m.find(class_="et_pb_module_header")
        return {"t": "blurb", "img": img_src(img), "alt": (img.get("alt") or "") if img else "",
                "title": text(title), "href": clean_url(a.get("href")) if a else "",
                "html": inner_html(m.find(class_="et_pb_blurb_description"))}
    if "et_pb_gallery" in c:
        imgs = [{"src": img_src(i), "alt": i.get("alt") or ""} for i in m.find_all("img")]
        return {"t": "gallery", "images": [i for i in imgs if i["src"]], "slider": "et_pb_gallery_fullwidth" in c}
    if "et_pb_video_slider" in c:
        vids = []
        for s in m.find_all(class_="et_pb_slide"):
            f = s.find("iframe")
            vid = youtube_id(f.get("src") or f.get("data-src") if f else "")
            if vid and vid not in vids:
                vids.append(vid)
        return {"t": "videos", "ids": vids}
    if "et_pb_video" in c:
        f = m.find("iframe")
        vid = youtube_id((f.get("src") or f.get("data-src")) if f else "")
        return {"t": "video", "id": vid} if vid else None
    if "et_pb_accordion" in c:
        return {"t": "accordion", "items": [toggle(i) for i in m.find_all(class_="et_pb_toggle")]}
    if "et_pb_toggle" in c:
        return toggle(m)
    if "et_pb_promo" in c:
        title = m.find(re.compile(r"^h[1-6]$")); a = m.find("a", class_="et_pb_promo_button")
        return {"t": "cta", "title": text(title), "html": inner_html(m.find(class_="et_pb_promo_description") and m.find(class_="et_pb_promo_description").find("div")),
                "button": {"text": text(a), "href": clean_url(a.get("href"))} if a else None}
    if "et_pb_divider" in c:
        return {"t": "divider"}
    if "et_pb_space" in c:
        return None
    if "et_pb_fullwidth_header" in c:
        title = m.find(class_="et_pb_module_header"); sub = m.find(class_="et_pb_fullwidth_header_subhead")
        btns = [{"text": text(a), "href": clean_url(a.get("href"))} for a in m.find_all("a", class_="et_pb_button")]
        return {"t": "hero", "title": text(title), "subtitle": text(sub),
                "html": inner_html(m.find(class_="et_pb_header_content_wrapper")), "buttons": btns}
    if "et_pb_slider" in c:
        slides = []
        for s in m.find_all(class_="et_pb_slide"):
            t = s.find(class_="et_pb_slide_title"); a = s.find("a", class_="et_pb_more_button")
            slides.append({"title": text(t), "html": inner_html(s.find(class_="et_pb_slide_content")),
                           "button": {"text": text(a), "href": clean_url(a.get("href"))} if a else None})
        return {"t": "slider", "slides": slides}
    if "et_pb_code" in c or "et_pb_fullwidth_code" in c:
        h = str(m)
        if "wpgmza" in h:
            mid = re.search(r'data-map-id="(\d+)"', h)
            return {"t": "map", "id": mid.group(1) if mid else ""}
        if re.search(r"ihf|ihomefinder|buyingbuddy|mbb2", h, re.I):
            return {"t": "listings"}
        f = m.find("iframe")
        if f:
            src = f.get("src") or f.get("data-src") or ""
            vid = youtube_id(src) if "youtu" in src else ""
            return {"t": "video", "id": vid} if vid else {"t": "embed", "src": clean_url(src), "title": f.get("title") or ""}
        body = m.find(class_=re.compile("et_pb_code_inner")) or m
        html = inner_html(body)
        return {"t": "text", "html": html} if text(body) else None
    if "et_pb_blog" in c or "et_pb_post" in c:
        return {"t": "posts"}
    return {"t": "unknown", "cls": " ".join(k for k in c if not re.search(r"_\d", k))[:80]}

def toggle(m):
    return {"t": "toggle", "title": text(m.find(class_="et_pb_toggle_title")),
            "html": inner_html(m.find(class_="et_pb_toggle_content")), "open": "et_pb_toggle_open" in cls(m)}

WIDTH = re.compile(r"^et_pb_column_(\d)_(\d)$")

def column(col):
    w = next((f"{m.group(1)}/{m.group(2)}" for k in cls(col) for m in [WIDTH.match(k)] if m), "1/1")
    items = []
    for child in col.find_all(recursive=False):
        if has(child, "et_pb_row_inner") or has(child, "et_pb_row"):
            r = {"t": "row", "cols": [column(c) for c in child.find_all(class_="et_pb_column", recursive=False)]}
            if hidden(child): r["hide"] = hidden(child)
            items.append(r)
            continue
        if has(child, "et_pb_module") or has(child, "et_pb_button_module_wrapper"):
            mod = module(child)
            if mod:
                items.append(mod)
    return {"w": w, "items": items}

def section(sec):
    if has(sec, "et_pb_fullwidth_section"):
        mods = [module(m) for m in sec.find_all(class_="et_pb_module", recursive=False)]
        return {"full": True, "rows": [{"cols": [{"w": "1/1", "items": [m for m in mods if m]}]}]}
    rows = []
    for row in sec.find_all(class_="et_pb_row", recursive=False):
        cols = [column(c) for c in row.find_all(class_="et_pb_column", recursive=False)]
        if any(c["items"] for c in cols):
            r = {"cols": cols}
            if hidden(row): r["hide"] = hidden(row)
            rows.append(r)
    # specialty sections hold columns directly under one row
    return {"rows": rows} if rows else None

def convert(html):
    soup = BeautifulSoup(html, "html.parser")
    secs = [s for s in soup.find_all(class_="et_pb_section") if not s.find_parent(class_="et_pb_section")]
    out = []
    for s in secs:
        sec = section(s)
        if sec:
            anchor = s.get("id")
            if anchor:
                sec["id"] = anchor
            if hidden(s):
                sec["hide"] = hidden(s)
            if bg_of(s):
                sec["bg"] = bg_of(s)
            par = s.find(class_="et-pb-parallax-background", recursive=True)
            if par and par.find_parent(class_="et_pb_section") is s and not sec.get("bg"):
                m = re.search(r"url\(([^)]+)\)", par.get("style", ""))
                if m:
                    sec["bg"] = m.group(1).strip("'\"")
                    style = par.get("style", "") + " ".join(g.get("style", "") for g in s.find_all(class_="et_parallax_gradient"))
                    sec["veil"] = "sand" if "247,247,239" in style.replace(" ", "") or "#f7f7ef" in style.lower() else "white"
            col = BG.get("_collage", {}).get(CUR["slug"], {}).get(live_key(s))
            if col:
                imgs = []
                for im in s.find_all(class_="et_pb_image"):
                    box = col["items"].get(live_key(im))
                    tag = im.find("img")
                    if box and tag:
                        x, y, w, h = box
                        imgs.append({"src": img_src(tag), "alt": tag.get("alt", ""),
                                     "box": [round(x / col["w"] * 100, 2), round(y / col["h"] * 100, 2), round(w / col["w"] * 100, 2), round(h / col["h"] * 100, 2)]})
                sec["rows"] = [{"cols": [{"w": "1/1", "items": [{"t": "collage", "ratio": round(col["w"] / col["h"], 3), "images": imgs}]}]}]
            out.append(sec)
    return out

def main():
    pages = {p["slug"]: p for p in json.load(open(DATA / "pages.json"))}
    bp = DATA / "divi-bg.json"
    if bp.exists():
        BG.update(json.load(open(bp)))
    hp = DATA / "divi-hidden.json"
    if hp.exists():
        HIDDEN.update(json.load(open(hp)))
    OUT.mkdir(parents=True, exist_ok=True)
    wanted = sys.argv[1:] or PAGES
    summary = {}
    for slug in wanted:
        p = pages[slug]
        CUR["hidden"] = HIDDEN.get(slug, {})
        CUR["bg"] = BG.get(slug, {})
        CUR["slug"] = slug
        CUR["restbase"] = bases(p["content"]["rendered"])
        css = DATA / "divi-css" / f"{slug}.css"
        CUR["looks"] = divi_styles.looks(css.read_text()) if css.exists() else {}
        CUR["livebase"] = BG.get("_livebase", {}).get(slug, {})
        secs = convert(p["content"]["rendered"])
        doc = {"slug": slug, "title": BeautifulSoup(p["title"]["rendered"], "html.parser").get_text(),
               "wpId": p["id"], "modified": p["modified"], "sections": secs}
        if slug in BG.get("_banner", []):
            doc["banner"] = "https://sancarloslife.com/wp-content/uploads/san-carlos-ca-bay-area.png"
        (OUT / f"{slug}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1))
        kinds = {}
        def walk(items):
            for it in items:
                if it["t"] == "row":
                    for c in it["cols"]:
                        walk(c["items"])
                else:
                    kinds[it["t"]] = kinds.get(it["t"], 0) + 1
                    if it["t"] == "unknown":
                        kinds.setdefault("_unknown", []).append(it["cls"])
        for s in secs:
            for r in s["rows"]:
                for c in r["cols"]:
                    walk(c["items"])
        summary[slug] = (len(secs), kinds)
    for k, v in summary.items():
        print(k, v[0], "sections", {a: b for a, b in v[1].items() if a != "_unknown"}, v[1].get("_unknown", [])[:3])

if __name__ == "__main__":
    main()
