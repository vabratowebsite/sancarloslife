#!/usr/bin/env python3
"""Writes the "Living in San Carlos, CA: The Complete Guide" page as a layout file
(src/content/divi/living-in-san-carlos-ca-the-complete-guide.json) rendered by DiviPage,
so it shares the look of the rebuilt WordPress pages. The live page is empty; this is new copy.

Facts: 2020 Census (population, land area), City of San Carlos (incorporation, motto),
Caltrain (electrified service since Sept 2024), San Carlos School District / California
Department of Education school directory, and this site's own pages (income, homes,
events, parks). Edit the copy here and re-run:  python3 scripts/content/living-guide.py
"""
import json
from pathlib import Path

UP = "https://sancarloslife.com/wp-content/uploads/"
OUT = Path(__file__).resolve().parents[2] / "src/content/divi/living-in-san-carlos-ca-the-complete-guide.json"


def text(html, **look):
    item = {"t": "text", "html": html}
    if look:
        item["look"] = look
    return item


def label(s):  # small teal Oswald label above a section title (the site's "eyebrow")
    return text(f"<p>{s}</p>", b={"f": "label", "s": 20, "c": "teal-700", "tt": "uppercase", "ls": 1})


def title(s):
    return text(f"<h2>{s}</h2>", h2={"f": "heading", "s": 42, "ps": 30})


def image(path, alt):
    return {"t": "image", "src": UP + path, "alt": alt, "href": ""}


def button(t, href):
    return {"t": "button", "text": t, "href": href}


def two(left, right, flip=False):
    a, b = ({"w": "1/2", "items": left}, {"w": "1/2", "items": right})
    return {"rows": [{"cols": [b, a] if flip else [a, b]}]}


def counter(n, t, prefix=""):
    return {"t": "counter", "number": n, "title": t, "prefix": prefix}


def cta(name, href, photo):
    return {"t": "cta", "title": "", "html": f"<p>{name}</p>", "button": {"text": "Browse Neighborhood", "href": href}, "bg": UP + photo}


def faq(q, a):
    return {"t": "toggle", "title": q, "html": a, "open": False}


sections = [
    {"id": "intro", "rows": [{"cols": [{"w": "4/4", "items": [
        text('<h3 style="text-align: center;"><span class="blue">Living in</span> San Carlos, California</h3>'),
        text("<p>San Carlos sits halfway between San Francisco and San Jose, between Belmont and Redwood City. "
             "It calls itself the <strong>City of Good Living</strong>, and the reasons are easy to list: "
             "top-ranked public schools, a walkable downtown on Laurel Street, a Caltrain station, "
             "hillside trails and parks in every neighborhood, and a calendar of hometown events that people "
             "actually go to. This guide puts what you need to know in one place, with links to the rest of "
             "San Carlos Life for the details.</p>", m={"ta": "center"}),
        text('<p style="text-align: center;"><a href="#neighborhoods">Neighborhoods</a> · <a href="#schools">Schools</a> · '
             '<a href="#getting-around">Getting around</a> · <a href="#downtown">Downtown</a> · <a href="#parks">Parks</a> · '
             '<a href="#events">Events</a> · <a href="#homes">Homes</a> · <a href="#faq">Questions</a></p>'),
    ]}]}]},
    {"id": "facts", "rows": [{"cols": [
        {"w": "1/4", "items": [counter("30,722", "Residents (2020 Census)")]},
        {"w": "1/4", "items": [counter("5.41", "Square miles of land")]},
        {"w": "1/4", "items": [counter("1925", "Incorporated July 8")]},
        {"w": "1/4", "items": [counter("6", "Neighborhoods")]},
    ]}]},
    {"id": "neighborhoods", "rows": [{"cols": [{"w": "4/4", "items": [
        label("Where to live"), title("The six neighborhoods"),
        text("<p>San Carlos is small enough to cross in ten minutes, but each part of town feels different. "
             "The flatlands near downtown have tree-lined streets of older bungalows within walking distance of "
             "Laurel Street and the train. The hills to the west trade that walkability for quiet streets, "
             "larger lots and views of the Bay.</p>"
             "<ul><li><a href=\"/howard-park/\">Howard Park</a>: closest to downtown, Burton Park and Caltrain.</li>"
             "<li><a href=\"/el-sereno/\">El Sereno &amp; White Oaks</a>: residential streets southeast of downtown.</li>"
             "<li><a href=\"/clearfield-park/\">Clearfield Park</a>: around the Caltrain station, east of El Camino Real.</li>"
             "<li><a href=\"/cordes/\">Cordes</a>: the northern hills by Arguello Park.</li>"
             "<li><a href=\"/beverly-terrace/\">Beverly Terrace</a>: hillside homes near Big Canyon and Crestview parks.</li>"
             "<li><a href=\"/alder-manor/\">Alder Manor</a>: the southern hills, with views across the Bay.</li></ul>"
             "<p>Click a neighborhood on the map to open its page.</p>"),
        {"t": "map", "id": "18"},
    ]}]}]},
    {"rows": [{"cols": [
        {"w": "1/3", "items": [cta("Howard Park", "/howard-park/", "2022/08/howard-park-san-carlos-ca-v.jpg")]},
        {"w": "1/3", "items": [cta("El Sereno", "/el-sereno/", "2022/08/el-sereno-corte-in-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg")]},
        {"w": "1/3", "items": [cta("Clearfield Park", "/clearfield-park/", "2022/08/clearfield-park-in-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg")]},
        {"w": "1/3", "items": [cta("Cordes", "/cordes/", "2022/08/cordes-in-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg")]},
        {"w": "1/3", "items": [cta("Beverly Terrace", "/beverly-terrace/", "2022/08/beverley-terraces-in-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg")]},
        {"w": "1/3", "items": [cta("Alder Manor", "/alder-manor/", "2022/08/alder-manor-in-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg")]},
    ]}]},
    dict(id="schools", **two([
        label("Schools"), title("Public schools families move here for"),
        text("<p>The <strong>San Carlos School District</strong> runs the town's public schools from kindergarten "
             "through eighth grade. Children start at one of four lower elementary schools (Arundel, Brittan Acres, "
             "Heather or White Oaks), move to Arroyo or Mariposa for grades 4 and 5, and finish at Central or "
             "Tierra Linda middle school. San Carlos Charter Learning Center, the first charter school in "
             "California, is also part of the district.</p>"
             "<p>For high school, students go on to the <strong>Sequoia Union High School District</strong>, "
             "most often Carlmont High School in Belmont or Sequoia High School in Redwood City.</p>"
             "<p>School assignments follow your address, so check the district's school locator before you "
             "choose a home.</p>"),
        button("More about San Carlos schools", "/about-san-carlos/"),
    ], [image("2022/08/central-middle-school-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg",
              "Central Middle School sign in San Carlos")])),
    dict(id="getting-around", **two([
        label("Commuting"), title("Getting around"),
        text("<p><strong>Caltrain</strong> stops at the historic San Carlos depot, a short walk from Laurel Street. "
             "Electric trains have run the corridor since September 2024, with faster and more frequent service "
             "to San Francisco, Palo Alto and San Jose. Caltrain's own headquarters is in San Carlos.</p>"
             "<p>By car, <strong>US-101</strong> runs along the east side of town and <strong>I-280</strong> along "
             "the hills to the west, so both the Bay side and the Peninsula's spine are minutes away. "
             "El Camino Real crosses the city north to south.</p>"
             "<p>San Carlos Airport serves small planes, and the Hiller Aviation Museum sits beside it. "
             "Commercial flights leave from SFO to the north or San Jose to the south.</p>"),
    ], [image("2022/09/the-caltrain-san-carlos-station-south-pacific-station-at-clearfield-park-san-carlos-ca-photo-by-vabrato-real-estate-services.jpg",
              "The historic San Carlos Caltrain station")], flip=True)),
    dict(id="downtown", **two([
        label("Downtown"), title("Laurel Street, the heart of town"),
        text("<p>Downtown San Carlos runs along Laurel Street and San Carlos Avenue, with most shops and "
             "restaurants owned by local people. You'll find cuisines from around the world, coffee and gelato, "
             "bookstores, toy shops and a long-running music store, and the car-free 700 block of Laurel Street "
             "is set up for dining outdoors.</p>"
             "<p>Every Sunday the farmers market fills Laurel Street from 9 a.m. to 1 p.m.</p>"),
        button("Restaurants and services", "/restaurants-and-services/"),
    ], [image("2022/09/mark-martinho-and-viv-kelvin-at-mama-coco-laurel-street-san-carlos-ca.jpg",
              "Mark Martinho and Viv Kelvin on Laurel Street in downtown San Carlos")])),
    dict(id="parks", **two([
        label("Outdoors"), title("Parks, trails and the weather"),
        text("<p>The City looks after 17 parks, from Burton Park in the middle of town (playgrounds, ball fields, "
             "summer concerts and movies) to hillside open space with hiking trails in Big Canyon, Eaton and "
             "Crestview parks. Edgewood Park and Natural Preserve and Pulgas Ridge are a short drive away, and "
             "Filoli's gardens are in nearby Woodside.</p>"
             "<p>The climate is mild and Mediterranean: dry, sunny summers, cool wet winters and no snow, so "
             "the parks get used all year.</p>"),
        button("Parks and trails", "/parks-of-san-carlos/"),
    ], [image("2022/10/frank-d-harrington-park-in-howard-park-san-carlos-ca-with-mark-martinho-and-viv-kelvin-photo-by-vabrato-real-estate.png",
              "Frank D. Harrington Park in downtown San Carlos")], flip=True)),
    dict(id="events", **two([
        label("Community"), title("A year of hometown events"),
        text("<ul><li><strong>Every Sunday</strong>: farmers market on Laurel Street.</li>"
             "<li><strong>May</strong>: Hometown Days, the town's festival and parade since 1979.</li>"
             "<li><strong>Summer</strong>: Music in the Park on Friday nights and movies at Burton Park.</li>"
             "<li><strong>October</strong>: the Art and Wine Faire downtown on the first weekend.</li>"
             "<li><strong>December</strong>: the Night of Holiday Lights and Christmas Tree Lane on Eucalyptus Avenue.</li></ul>"),
        button("This week in San Carlos", "/events/"),
    ], [image("2022/11/music-in-the-park-at-burton-park-san-carlos-ca-photo-by-san-carlos-parks-and-recreation-dept.jpg",
              "Music in the Park at Burton Park, San Carlos")])),
    dict(id="homes", **two([
        label("Real estate"), title("Homes in San Carlos"),
        text("<p>San Carlos has about 11,894 homes, most of them single-family houses on quiet residential streets, "
             "with condos and townhomes closer to El Camino Real and downtown. Good schools and the location "
             "between San Francisco and Silicon Valley keep demand steady, and homes in popular neighborhoods "
             "often sell quickly.</p>"
             "<p>Prices change month to month, so look at current listings and recent sales rather than "
             "averages. Viv Kelvin and Mark Martinho of Vabrato Real Estate live and work here and can walk "
             "you through any neighborhood.</p>"),
        button("Homes for sale", "/homes-for-sale-in-san-carlos-ca/"),
    ], [image("2024/07/Mark-and-Viv-Vabrato-2024-Cropped.jpg", "Viv Kelvin and Mark Martinho of Vabrato Real Estate")], flip=True)),
    {"id": "faq", "rows": [{"cols": [{"w": "4/4", "items": [
        label("Questions"), title("Living in San Carlos: common questions"),
        faq("Is San Carlos a good place to live?",
            "<p>For many families, yes: highly rated K–8 public schools, low-key neighborhoods, a walkable downtown, "
            "Caltrain and quick freeway access, and parks across town. The trade-off is cost, as with most of the Peninsula.</p>"),
        faq("Where is San Carlos?",
            "<p>On the San Francisco Peninsula in San Mateo County, about halfway between San Francisco and San Jose, "
            "between Belmont and Redwood City.</p>"),
        faq("Which schools serve San Carlos?",
            "<p>The San Carlos School District (kindergarten to grade 8) and, for high school, the Sequoia Union High "
            "School District, usually Carlmont or Sequoia High School. Your address decides the school.</p>"),
        faq("How do people commute from San Carlos?",
            "<p>Many take Caltrain from the San Carlos station; others drive US-101 or I-280. Downtown is walkable "
            "from the neighborhoods nearest the station.</p>"),
        faq("Which neighborhood is closest to downtown?",
            "<p>Howard Park, followed by El Sereno &amp; White Oaks and Clearfield Park. The hill neighborhoods "
            "(Cordes, Beverly Terrace, Alder Manor) are a short drive up.</p>"),
        faq("What is there to do on a weekend?",
            "<p>The Sunday farmers market, lunch on Laurel Street, a hike in the hillside parks, the Hiller Aviation "
            "Museum, or one of the town's seasonal events.</p>"),
    ]}]}]},
    {"id": "sources", "rows": [{"cols": [{"w": "4/4", "items": [
        text("<h4>Sources</h4><ul>"
             "<li>U.S. Census Bureau, QuickFacts: San Carlos city, California (2020 Census population and land area).</li>"
             "<li>City of San Carlos, About San Carlos (incorporation July 8, 1925; \"City of Good Living\").</li>"
             "<li>Caltrain, electrified service (began September 2024).</li>"
             "<li>California Department of Education school directory and San Carlos School District.</li>"
             "<li>San Carlos Life: <a href=\"/about-san-carlos/\">About San Carlos</a>, <a href=\"/events-and-activities/\">Events and Activities</a>, "
             "<a href=\"/parks-of-san-carlos/\">Parks and Trails</a> and <a href=\"/city-projects/\">City Projects</a>.</li></ul>",
             b={"s": 14, "c": "ink-500"}),
    ]}]}]},
]

doc = {"slug": "living-in-san-carlos-ca-the-complete-guide", "title": "Living in San Carlos, CA: The Complete Guide",
       "banner": UP + "2022/07/san-carlos-ca-bay-area.png", "sections": sections}
OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1))
print("wrote", OUT)
