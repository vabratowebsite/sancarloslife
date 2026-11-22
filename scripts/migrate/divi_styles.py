"""Reads a page's Divi stylesheet (et-cache "unified" CSS saved in data/divi-css/<slug>.css) and
returns the look of each module: fonts, sizes, colors, alignment, left borders and backgrounds,
mapped to the site's design tokens. Used by 95-divi-layouts.py; the CSS is data, never executed.

Fonts: Book Antiqua -> heading (Playfair Display), Bebas Neue / Oswald -> label (Oswald),
everything else -> sans (Lato). Colors snap to the nearest token family.
"""
import colorsys
import re

GCID = {
    "00616bee": "#666666", "7bd3d264": "#008080", "39f79205": "#1a93a3", "a4bc79a9": "#d7e9e9",
    "9e34f3a0": "#f7f7ef", "4e9ddfa3": "#f7f7ef", "7ead45bc": "#a5cfe3", "76bb4047": "#ffffff",
    "3a8627e5": "#30afc0", "45d45c1f": "#217a86", "52bc4490": "#e7f6fc", "48c6d303": "#00aeae",
    "link-col": "#217a86", "primary-": "#66b2b2", "heading-": "#666666", "body-col": "#666666",
}

TARGET = re.compile(r"^\.et_pb_(text|blurb|heading|number_counter|button|toggle|accordion)_(\d+)(?:\.et_pb_[a-z_]+)*(?:\s+(.*))?$")


def _rgb(v):
    v = v.strip().lower().replace("!important", "").strip()
    m = re.match(r"var\(--gcid-([a-z0-9]{8})", v.replace("-color", "-col"))
    if m:
        v = GCID.get(m.group(1), "")
    if v in ("white",):
        return (255, 255, 255, 1)
    if v in ("black",):
        return (0, 0, 0, 1)
    m = re.match(r"#([0-9a-f]{3,8})$", v)
    if m:
        h = m.group(1)
        if len(h) in (3, 4):
            h = "".join(c * 2 for c in h)
        a = int(h[6:8], 16) / 255 if len(h) == 8 else 1
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)
    m = re.match(r"rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)", v)
    if m:
        return (float(m.group(1)), float(m.group(2)), float(m.group(3)), float(m.group(4) or 1))
    return None


def color_token(v, bg=False):
    """Nearest token for a text (or background) color; None when it can't be read."""
    rgb = _rgb(v)
    if not rgb or rgb[3] < 0.15:
        return None
    r, g, b = (x / 255 for x in rgb[:3])
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    hue = h * 360
    if bg:
        if l > 0.95 and s < 0.3:
            return "white"
        if l > 0.82:
            return "sand-100" if 40 <= hue <= 80 and s < 0.5 else "teal-50"
        if s > 0.25 and 150 <= hue <= 215:
            return "teal-700"
        if l < 0.3:
            return "ink-900"
        return "teal-50"
    if l > 0.88:
        return "white"
    if s > 0.3 and (hue < 20 or hue > 330):
        return "coral-700"
    if s > 0.2 and 70 <= hue <= 215:
        return "teal-700"
    if l < 0.3:
        return "ink-900"
    return "ink-500"


def family(v):
    v = v.lower()
    if "antiqua" in v or "playfair" in v or "georgia" in v:
        return "heading"
    if "bebas" in v or "oswald" in v:
        return "label"
    return "sans"


def px(v):
    m = re.match(r"\s*([\d.]+)px", v)
    return round(float(m.group(1))) if m else None


def strip_media(css):
    """Returns (desktop_css, phone_css): rules outside @media, and rules in max-width:767px."""
    desk, phone, i = [], [], 0
    while True:
        j = css.find("@media", i)
        if j < 0:
            desk.append(css[i:])
            break
        desk.append(css[i:j])
        k = css.find("{", j)
        depth, p = 1, k + 1
        while depth and p < len(css):
            depth += {"{": 1, "}": -1}.get(css[p], 0)
            p += 1
        if "max-width:767px" in css[j:k].replace(" ", ""):
            phone.append(css[k + 1 : p - 1])
        i = p
    return "".join(desk), "".join(phone)


def part(rest):
    rest = (rest or "").strip()
    if ":" in rest or "a" == rest.split(" ")[-1] or rest.endswith(" a"):
        return None
    if rest in ("", ".et_pb_text_inner", ".et_pb_heading_container", ".et_pb_blurb_content"):
        return "m" if rest == "" else "b"
    m = re.search(r"\b(h[1-6])\b", rest)
    if m:
        return "t" if "module_header" in rest else m.group(1)
    if "module_header" in rest:
        return "t"
    if rest.endswith(" p") or rest == "p" or "blurb_description" in rest:
        return "b"
    return None


def rules(css):
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        props = {}
        for decl in body.split(";"):
            if ":" in decl:
                k, v = decl.split(":", 1)
                props[k.strip().lower()] = v.strip()
        for s in sel.split(","):
            m = TARGET.match(s.strip())
            if m:
                p = part(m.group(3))
                if p:
                    yield f"et_pb_{m.group(1)}_{m.group(2)}", p, props


def looks(css):
    desk, phone = strip_media(css)
    out = {}
    for key, p, props in rules(desk):
        d = out.setdefault(key, {}).setdefault(p, {})
        for k, v in props.items():
            if k == "font-family":
                d["f"] = family(v)
            elif k == "font-size" and px(v):
                d["s"] = px(v)
            elif k == "font-weight":
                d["w"] = v.replace("!important", "")
            elif k == "color" and color_token(v):
                d["c"] = color_token(v)
            elif k == "text-transform":
                d["tt"] = v.replace("!important", "")
            elif k == "text-align" and v.replace("!important", "") in ("center", "right", "left"):
                d["ta"] = v.replace("!important", "")
            elif k == "letter-spacing" and px(v):
                d["ls"] = px(v)
            elif k in ("border-left-width",) and px(v):
                d["bl"] = 1
            elif k == "border-left-color" and color_token(v):
                d["blc"] = color_token(v)
            elif k in ("background-color",) and color_token(v, bg=True):
                d["bg"] = color_token(v, bg=True)
    for key, p, props in rules(phone):
        if "font-size" in props and px(props["font-size"]) and key in out and p in out[key]:
            out[key][p]["ps"] = px(props["font-size"])
    # drop empty and default-only entries
    return {k: {p: d for p, d in v.items() if d} for k, v in out.items() if any(v.values())}
