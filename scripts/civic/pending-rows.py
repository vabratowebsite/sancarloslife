"""Builds one SQL transaction that inserts the Operations Desk's 145 pending Civic Watch rows
(pending/supabase_*.json in the artifact bundle) into the live public.* tables.
Owner approved 2026-11-22. Rows are data: every value is quoted, nothing is executed."""
import json, re, sys
from datetime import datetime, timedelta

B = json.load(open(sys.argv[1]))
FEED = {i["id"]: i for i in json.loads(B["news/feed.json"]) if isinstance(i, dict)} if isinstance(B["news/feed.json"], str) else {i["id"]: i for i in B["news/feed.json"]}
EV = B["events/events.json"]; EV = json.loads(EV) if isinstance(EV, str) else EV
EVENTS = {d["id"]: d for d in EV["drafts"]}

BODY = {"CC": "City Council", "PTC": "Planning and Transportation Commission"}
INSERTED = "2026-11-22"

def q(v):
    if v is None: return "NULL"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return repr(v)
    if isinstance(v, (dict, list)): return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"

def arr(xs): return "ARRAY[" + ",".join(q(x) for x in xs) + "]::text[]" if xs else "NULL"

def none(v): return None if v in (None, "", "None", "null") else v

SHORT = {v: k for k, v in BODY.items()}
def meet_ref(date, body, mtype="regular"):
    return f"pg_temp.mid({q(date)},{q(SHORT.get(body, body))})"

def split_meeting(r):
    """'2026-10-26 CC' or meeting_date + body."""
    if "meeting" in r and r["meeting"]:
        d, b = r["meeting"].split(" ", 1); return d, BODY.get(b, b)
    return r.get("meeting_date"), BODY.get(r.get("body", "CC"), r.get("body", "City Council"))

VIDEO = {}
sql, counts, src = [], {}, {}

def add(table, stmt):
    sql.append(stmt); counts[table] = counts.get(table, 0) + 1

batches = sorted(k for k in B if k.startswith("pending/"))
rows = {}
for k in batches:
    d = json.loads(B[k]) if isinstance(B[k], str) else B[k]
    for t, lst in d.items():
        if isinstance(lst, list):
            for r in lst: rows.setdefault(t, []).append((k, r))

def batch_date(k): return re.search(r"(\d{4}-\d{2}-\d{2})", k).group(1)

# ---------------------------------------------------------------- meetings (first: others refer to them)
for k, r in rows.get("meetings", []):
    body = BODY.get(r["body"], r["body"])
    if r.get("dates"):  # cancelled meetings
        for dt in r["dates"]:
            add("meetings", f"insert into public.meetings (body, meeting_date, meeting_type, transcript_status, minutes_status, files_missing, processed_at) values ({q(body)},{q(dt)},'regular','cancelled','none',{q('Cancelled per ' + r.get('source', 'City notice'))},{q(batch_date(k))}) on conflict (body, meeting_date, meeting_type) do nothing;")
        continue
    vid = r.get("video_id")
    video = f"https://www.youtube.com/watch?v={vid}" if vid else None
    if video: VIDEO.setdefault((r["meeting_date"], body), video)
    if r.get("notes"): ts, fm = "none", r["notes"]
    elif r.get("status"): ts, fm = "needed", f"{r['status']}. {r.get('time','')} {r.get('location','')}. Source: {r.get('source','')}".strip()
    else: ts, fm = "retrieved", (f"Transcript: {r['transcript']}" if r.get("transcript") else None)
    if r.get("duration"): fm = (fm + "; " if fm else "") + f"video length {r['duration']}"
    add("meetings", f"insert into public.meetings (body, meeting_date, meeting_type, video_url, transcript_status, minutes_status, files_missing, processed_at) values ({q(body)},{q(r['meeting_date'])},{q(r.get('kind','regular'))},{q(video)},{q(ts)},'none',{q(fm)},{q(batch_date(k))}) on conflict (body, meeting_date, meeting_type) do nothing;")

def video_for(date, body): return VIDEO.get((date, body))

# ---------------------------------------------------------------- project (registry row from Nov 10)
for k, r in rows.get("projects", []):
    slug = "gas-leaf-blower-ban"
    add("projects", f"insert into public.projects (slug, name, category, stage, funded, page_tier, page_status) values ({q(slug)},{q(r['name'])},{q(r['category'])},{q(r['stage'])},'n/a',{q(r['tier'])},'none') on conflict (slug) do nothing;")
LEAF = "(select id from public.projects where slug='gas-leaf-blower-ban')"
PROJECT_WORDS = [
    (r"leaf blower", "gas-leaf-blower-ban"),
    (r"\bTDM\b|TMA|parking reform|transportation demand", "tdm-parking-reform"),
    (r"oversize vehicle|\bRV\b", "rv-parking-policy"),
    (r"tobacco", "tobacco-retailer-ordinance"),
    (r"harrington", "harrington-park"),
    (r"700 block|centennial plaza", "centennial-plaza"),
    (r"measure g\b", "measure-g-sales-tax"),
]
def proj_for(text):
    for pat, slug in PROJECT_WORDS:
        if text and re.search(pat, text, re.I):
            return f"(select id from public.projects where slug={q(slug)})"
    return "NULL"

# ---------------------------------------------------------------- agenda items
def ag_ref(date, body, item):
    if not item: return "NULL"
    num = re.match(r"\s*([0-9]+[A-Z]?(?:-[A-Z])?)", item)
    if not num: return "NULL"
    return f"pg_temp.aid({q(date)},{q(SHORT.get(body, body))},{q(num.group(1))})"

for k, r in rows.get("agenda_items", []):
    date, body = split_meeting(r)
    item = r.get("item") or r.get("item_no")
    title = r["title"]
    kind = r.get("type") or r.get("kind")
    consent = bool(kind == "consent" or re.search(r"consent", title, re.I))
    if r.get("summary"): outcome = r["summary"] + (f" (starts {r['start_ts']})" if r.get("start_ts") else "")
    elif r.get("source"): outcome = f"Scheduled ({kind.replace('_',' ') if kind else 'item'}, source {r['source']}); outcome pending"
    else: outcome = None
    add("agenda_items", f"insert into public.agenda_items (meeting_id, project_id, item_number, title, on_consent, outcome) values ({meet_ref(date, body)},{proj_for(title)},{q(item)},{q(title)},{q(consent)},{q(outcome)});")

# Nov 3 decisions name items in words; map them to the item numbers logged above.
WORD_ITEM = {"Consent A-E": "8A-E", "Oversize vehicle direction": "10A", "Mediation": "10B"}

# ---------------------------------------------------------------- decisions
for k, r in rows.get("decisions", []):
    date, body = split_meeting(r)
    what = r.get("what") or r.get("item")
    item = r.get("item") or WORD_ITEM.get(what)
    vote = r.get("vote", "")
    parts = [what + ":" if what else ""]
    if r.get("action"): parts.append(r["action"] + ".")
    parts.append(f"Vote: {vote}.")
    if r.get("ayes"): parts.append("Ayes: " + ", ".join(r["ayes"]) + ".")
    for key in ("absent", "abstain", "recused"):
        v = r.get(key)
        if v: parts.append(f"{key.capitalize()}: {', '.join(v) if isinstance(v, list) else v}.")
    if r.get("note"): parts.append(r["note"] + ".")
    desc = " ".join(p for p in parts if p).replace("..", ".")
    approved = re.match(r"\s*\d+-\d+", vote) and not re.search(r"direction|no decision|none", vote, re.I)
    action = "approved" if approved and "minutes" not in (what or "").lower() else "other"
    if "Oct 5 minutes" == what: action = "other"  # vote sufficiency still being checked by staff
    add("decisions", f"insert into public.decisions (project_id, agenda_item_id, decided_on, body, action, description, label, source_url, source_locator) values ({proj_for(what)},{ag_ref(date, body, item)},{q(date)},{q(body)},{q(action)},{q(desc)},'said_at_meeting',{q(video_for(date, body))},{q('item ' + item if item else None)});")

# ---------------------------------------------------------------- money
def amount(s):
    nums = []
    for m in re.finditer(r"\$\s?([\d,.]+)\s*(million|M\b)?", s):
        n = float(m.group(1).replace(",", "")) * (1_000_000 if m.group(2) else 1)
        nums.append(n)
    if not nums: return None
    return sum(nums) if "+" in s and len(nums) == 2 else nums[0]

for k, r in rows.get("money", []):
    date, body = split_meeting(r)
    amt = amount(r["amount"])
    if amt is None: raise SystemExit(f"no amount: {r}")
    item = r.get("item", "")
    community = bool(re.search(r"public comment|per speaker", f"{item} {r.get('what','')}", re.I))
    stage = "estimate" if re.search(r"estimate|not decided", r.get("status", "") + r.get("what", ""), re.I) else None
    rec = "annual" if re.search(r"/\s*y(ea)?r|per year|annual", r["amount"] + r.get("what", ""), re.I) else None
    note = f"{item}: {r.get('what') or r.get('status','')}. Amount as stated: {r['amount']} (amount_usd holds the first figure{', summed' if '+' in r['amount'] else ''})."
    if r.get("vendor_or_party"): note += f" Party: {r['vendor_or_party']}."
    if r.get("status"): note += f" Status: {r['status']}."
    if r.get("ts"): note += f" At {r['ts']}."
    add("money", f"insert into public.money (project_id, amount_usd, recurrence, stage, as_of, label, source_url, note) values ({proj_for(item)},{amt},{q(rec)},{q(stage)},{q(date)},{q('community' if community else 'said_at_meeting')},{q(video_for(date, body))},{q(note)});")

# ---------------------------------------------------------------- comments
for k, r in rows.get("comments", []):
    date, body = split_meeting(r)
    aff = r.get("affiliation_or_area") or ""
    stype = "organization" if re.search(r"coalition|quiet san carlos", aff, re.I) else "resident"
    para = r.get("summary") or f"Spoke during public comment on {r['theme']} ({r['position']}); details in the desk's {date} meeting notes."
    name = r["speaker"] + (f" ({aff})" if aff else "")
    loc = f"{'Council' if body=='City Council' else 'PTC'} {date}" + (f", item {r['item']}" if r.get("item") else "") + (f", {r['ts']}" if r.get("ts") else "") + (f"; {r['name_note']}" if r.get("name_note") else "")
    add("comments", f"insert into public.comments (project_id, meeting_id, agenda_item_id, source_type, speaker_name, speaker_type, position, themes, paraphrase, locator, follow_up_promised, comment_date) values ({proj_for(r.get('item','') + ' ' + r['theme'])},{meet_ref(date, body)},{ag_ref(date, body, r.get('item'))},'meeting_comment',{q(name)},{q(stype)},{q(r['position'])},{arr([r['theme']])},{q(para)},{q(loc)},false,{q(date)});")

# ---------------------------------------------------------------- flags (Nov 3, plain text)
FLAG = [("unanswered_questions", "medium"), ("missing_contract_details", "low"), ("costs_not_estimated", "low")]
for i, (k, r) in enumerate(rows.get("flags", [])):
    ind, sev = FLAG[i]
    add("flags", f"insert into public.flags (indicator, severity, evidence, status, created_at) values ({q(ind)},{q(sev)},{q(r)},'logged',{q(batch_date(k))});")

# ---------------------------------------------------------------- missing files
for k, r in rows.get("missing_files", []):
    first = batch_date(k)
    if isinstance(r, str):
        m = re.match(r"(\d{4}-\d{2}-\d{2}) (CC|PTC) (packet|transcript)", r)
        date, body, kind = m.group(1), BODY[m.group(2)], m.group(3)
        if date == "2026-10-13" and kind == "packet":
            continue  # already logged as missing_files row 27 (Oct 13 scan)
        short = "CC" if body == "City Council" else "PTC"
        if kind == "packet":
            vals = dict(item=f"{body} · {date} — agenda and packet", need="Agenda + staff reports", why="PrimeGov blocks automated access; needed to confirm item numbers, recommendations and costs.", pri="nice_to_have", dest="01-Inbox › _DROP HERE", name=f"{date}_{short}_agenda-packet.pdf")
        else:
            vals = dict(item=f"{body} · {date} — meeting transcript in Drive", need="Transcript file", why="Read from captions at scan time; a copy belongs in Drive 03-Transcripts.", pri="before_publication", dest="03-Transcripts", name=f"{date}_{short}_transcript.txt")
        mid = meet_ref(date, body)
    else:
        kind = r["kind"]
        date = r.get("meeting_date")
        if not date:
            m = re.match(r"(\d{4}-\d{2}-\d{2}) (CC|PTC)", r.get("item", ""))
            date = m.group(1) if m else None
            body = BODY[m.group(2)] if m else None
        else:
            body = BODY.get(r.get("body"), r.get("body"))
        mid = meet_ref(date, body) if date and kind in ("packet", "transcript") else "NULL"
        short = "CC" if body == "City Council" else "PTC"
        vals = dict(
            item=r.get("item") or f"{body} · {date} — {'meeting transcript' if kind=='transcript' else 'agenda and packet'}",
            need={"packet": "Agenda + staff reports", "transcript": "Transcript file"}.get(kind, "City document"),
            why=r.get("reason") or (f"Source: {r['source']}" if r.get("source") else "Needed to confirm a figure cited at a meeting."),
            pri="before_publication" if kind == "transcript" else "nice_to_have",
            dest=r.get("dest") or ("03-Transcripts" if kind == "transcript" else "01-Inbox › _DROP HERE"),
            name=r.get("name") or (f"{date}_{short}_{'transcript.txt' if kind=='transcript' else 'agenda-packet.pdf'}" if date else "700-block-phase-1b_cost-estimate.pdf"),
        )
        kind = "meeting" if kind == "packet" else kind
    if isinstance(r, str) and kind == "packet": kind = "meeting"
    add("missing_files", f"insert into public.missing_files (meeting_id, item, document_needed, why, priority, status, kind, destination, suggested_name, first_seen, last_checked) values ({mid},{q(vals['item'])},{q(vals['need'])},{q(vals['why'])},{q(vals['pri'])},'needed',{q(kind)},{q(vals['dest'])},{q(vals['name'])},{q(first)},{q(first)});")

# ---------------------------------------------------------------- scan runs
def run_at(r, k):
    v = r.get("run_at") or r.get("started_at") or r.get("at") or r.get("run_date")
    if len(v) == 10: return v + "T18:00:00-08:00"
    return v

for k, r in rows.get("scan_runs", []):
    c = r.get("counts") or {}
    det = dict(r.get("details") or {})
    if c: det["counts"] = c
    det["logged_late"] = {"from": k, "inserted": INSERTED}
    summary = r.get("summary") or f"{r.get('type') or r.get('run_type')} on {r.get('at')}; logged late from the desk's pending file (details in the Operations Desk dashboard)."
    add("scan_runs", f"insert into public.scan_runs (run_at, run_type, trigger, sources_checked, ok, failed, items_updated, new_uploads_found, summary, details) values ({q(run_at(r, k))},{q(r.get('run_type') or r.get('type'))},{q(r.get('trigger','scheduled'))},{q(c.get('checked'))},{q(c.get('ok'))},{q(c.get('failed'))},{q(c.get('updated', c.get('drafts_updated')))},{q(c.get('uploads', c.get('drive_new_files')))},{q(summary)},{q(det)});")

# ---------------------------------------------------------------- news items
NEWS_COLS = ["id", "title", "class", "topic", "published", "event_date", "source", "type", "url", "also", "access", "summary", "key_facts", "sc_angle", "civic_overlap", "blog_potential", "blog_angle", "follow_up", "confidence", "status"]
for k, r in rows.get("news_items", []):
    if isinstance(r, str):
        r = FEED[r]
    else:
        base = FEED.get(r["id"], {})
        r = {**base, **{kk: vv for kk, vv in r.items() if vv not in (None, "")}}
    vals = []
    for col in NEWS_COLS:
        v = none(r.get(col))
        if col == "status": v = v or "new"
        if col in ("also", "key_facts"): v = v if isinstance(v, list) else ([] if v is None else [v])
        if col == "civic_overlap" and isinstance(v, str): v = v.lower() == "true"
        if col == "follow_up" and v == "None": v = None
        vals.append(q(v))
    found = r.get("found") or batch_date(k)
    add("news_items", f"insert into public.news_items ({', '.join(NEWS_COLS)}, found_by, found_at) values ({', '.join(vals)},{q('daily inbox check (logged late from ' + k + ')')},{q(found + 'T18:00:00-08:00' if len(found)==10 else found)}) on conflict (id) do nothing;")

# ---------------------------------------------------------------- follow-ups
def expected(due):
    return due if due and re.match(r"\d{4}-\d{2}-\d{2}$", due) else None

for k, r in rows.get("follow_ups", []):
    date, body = split_meeting(r)
    due = r.get("due")
    promise = r["promise"] + (f" (due: {due})" if due and not expected(due) else "") + (f" [{r['ts'].strip('[]')}]" if r.get("ts") else "")
    add("follow_ups", f"insert into public.follow_ups (project_id, meeting_id, promise, promised_by, promised_on, expected_by, status) values ({proj_for(r['promise'])},{meet_ref(date, body)},{q(promise)},{q(r['who'])},{q(date)},{q(expected(due))},'open');")

# ---------------------------------------------------------------- events
for k, r in rows.get("events", []):
    e = EVENTS[r["id"]]
    start = f"{e['start_date']}T{e.get('start_time') or '00:00'}:00-08:00"
    end = f"{e.get('end_date') or e['start_date']}T{e.get('end_time') or '23:59'}:00-08:00"
    add("events", f"insert into public.events (title, starts_at, ends_at, venue, organizer, cost, source_url, status, featured) values ({q(e['title'])},{q(start)},{q(end)},{q(e['venue']['name'])},{q(e['organizer']['name'])},{q(e.get('cost'))},{q(e.get('event_website'))},'draft',false);")

src_rows = sum(len(v) for v in rows.values())
print("-- source rows:", src_rows, {t: len(v) for t, v in rows.items()}, file=sys.stderr)
print("-- statements:", sum(counts.values()), counts, file=sys.stderr)
HELPERS = """create function pg_temp.mid(d date, b text) returns bigint language sql as $f$ select id from public.meetings where meeting_date=d and meeting_type='regular' and body=case b when 'CC' then 'City Council' when 'PTC' then 'Planning and Transportation Commission' else b end $f$;
create function pg_temp.aid(d date, b text, n text) returns bigint language sql as $f$ select id from public.agenda_items where meeting_id=pg_temp.mid(d,b) and split_part(item_number,' ',1)=n order by id limit 1 $f$;"""
print("begin;\n" + HELPERS + "\n" + "\n".join(sql) + "\ncommit;")
