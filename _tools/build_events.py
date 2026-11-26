#!/usr/bin/env python3
"""Build VGW news + events pages from _tools/news.csv, _tools/news/*.txt and _tools/events.csv.

Usage (from the project folder):  python3 _tools/build_events.py

- _tools/events.csv   : one row per event (Excel, UTF-8).
- _tools/news.csv     : one row per news item (list data: date, source, title...).
- _tools/news/<id>.txt: article text for each news item (plain text, see README).
                        Event news without a text file get a short text built
                        from the event data.
- Updates the news + programme blocks on index.html.
- Regenerates news.html (news list), news-<id>.html (one page per article) and
  events.html (all events). Header and footer are copied from index.html.

Static output only: no backend, no database. Every value is HTML-escaped and
external links must be https://. This folder is NOT uploaded.
"""
import csv
import datetime as dt
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EVENTS_CSV = ROOT / "_tools" / "events.csv"
NEWS_CSV = ROOT / "_tools" / "news.csv"
NEWS_TXT = ROOT / "_tools" / "news"
PHOTO_DIR = "vgw_website_assets/7_events/"
# 活動照片暫不顯示：卡片改用紅色「?」佔位；要恢復照片改成 True
SHOW_EVENT_PHOTOS = False
HOME = "index.html"
NEWS_PAGE = "news.html"
EVENTS_PAGE = "events.html"
OLD_PAGES = ["news-events.html", "en-news-events.html", "en-events.html"]


def article_page(nid):
    return f"news-{nid}.html"


TYPES = {
    "forum": "國際論壇", "talk": "主題講座", "pitch": "Pitch", "workshop": "工作坊",
    "competition": "競賽活動", "activity": "現場活動", "ceremony": "典禮",
}
STATUS = {
    "open":     {"label": "報名中",     "btn": None},
    "upcoming": {"label": "即將開放",   "btn": "即將開放報名"},
    "full":     {"label": "已額滿",     "btn": "已額滿"},
    "closed":   {"label": "報名已截止", "btn": "報名已截止"},
    "tba":      {"label": "待公布",     "btn": "敬請期待"},
}
SOURCES = {"official": "官網公告", "facebook": "Facebook", "instagram": "Instagram", "event": "活動"}
TBA = "日期待公布"
WEEK_ZH = "一二三四五六日"
NW = "（站外連結，另開新視窗）"
COMING = "敬請期待！"
DASH = '<span aria-hidden="true">-</span><span class="visually-hidden">待公布</span>'
SURVEYCAKE_NOTE = "活動報名系統為站外網站（站外連結），個人資料僅用於該場活動報名。"

SVG = {
    "forum": '<svg viewBox="0 0 400 250" fill="none" stroke="currentColor" stroke-width="1.5" focusable="false"><circle cx="200" cy="125" r="78"/><ellipse cx="200" cy="125" rx="30" ry="78"/><ellipse cx="200" cy="125" rx="56" ry="78"/><path d="M122 125h156M132 86h136M132 164h136"/><g stroke-width="1" opacity=".7"><path d="M60 60l80 30M340 52l-74 40M52 196l92-34M348 200l-86-40"/></g><g fill="currentColor" stroke="none"><circle cx="60" cy="60" r="5"/><circle cx="340" cy="52" r="5"/><circle cx="52" cy="196" r="5"/><circle cx="348" cy="200" r="5"/></g></svg>',
    "talk": '<svg viewBox="0 0 400 250" fill="none" stroke="currentColor" stroke-width="1.5" focusable="false"><rect x="176" y="62" width="48" height="84" rx="24"/><path d="M160 120a40 40 0 0 0 80 0M200 160v34M176 194h48"/><g opacity=".75"><path d="M262 92a48 48 0 0 1 0 68"/><path d="M284 74a76 76 0 0 1 0 104"/><path d="M306 56a104 104 0 0 1 0 140"/><path d="M138 92a48 48 0 0 0 0 68"/><path d="M116 74a76 76 0 0 0 0 104"/><path d="M94 56a104 104 0 0 0 0 140"/></g></svg>',
    "pitch": '<svg viewBox="0 0 400 250" fill="none" stroke="currentColor" stroke-width="1.5" focusable="false"><path d="M70 200h270M70 200V48"/><g opacity=".8"><rect x="96" y="160" width="34" height="40"/><rect x="146" y="134" width="34" height="66"/><rect x="196" y="112" width="34" height="88"/><rect x="246" y="82" width="34" height="118"/></g><path d="M100 150l60-34 50 12 92-78" stroke-width="2.5"/><path d="M286 50h20v20" stroke-width="2.5"/></svg>',
    "workshop": '<svg viewBox="0 0 400 250" fill="none" stroke="currentColor" stroke-width="1.5" focusable="false"><rect x="110" y="56" width="180" height="120" rx="6"/><path d="M110 152h180M170 176l-14 30M230 176l14 30M140 206h120"/><g opacity=".8"><path d="M140 84h70M140 104h110M140 124h50"/><circle cx="262" cy="96" r="14"/><path d="M252 96l7 7 13-13" stroke-width="2"/></g></svg>',
}
SVG["competition"] = SVG["pitch"]
SVG["activity"] = SVG["workshop"]
SVG["ceremony"] = SVG["forum"]
BACK_SVG = ('<svg viewBox="0 0 24 24" width="18" height="18" focusable="false"><path d="M15 5l-7 7 7 7" '
            'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>')

e = html.escape
HTTPS = re.compile(r"https://[^\s\"'<>]+")


def fail(name, msg):
    sys.exit(f"[{name}] {msg}")


def read_csv(path):
    if not path.exists():
        fail(path.name, f"找不到 {path}")
    with path.open(encoding="utf-8-sig", newline="") as f:
        rows = [{k: (v or "").strip() for k, v in r.items()} for r in csv.DictReader(f)]
    return [r for r in rows if any(r.values())]


def parse_date(name, i, value):
    try:
        return dt.date.fromisoformat(value)
    except ValueError:
        fail(name, f"第 {i} 列日期格式需為 YYYY-MM-DD：{value}")


# ---------------------------------------------------------------- events
def load_events():
    rows, seen = read_csv(EVENTS_CSV), set()
    for i, r in enumerate(rows, start=2):
        if (r.get("status") or "").strip() == "hidden":
            r["_hidden"] = True   # kept in the CSV but not published anywhere
            continue
        for k in ("id", "type", "status", "title_zh"):
            if not r.get(k):
                fail("events.csv", f"第 {i} 列缺少「{k}」")
        if not re.fullmatch(r"[a-z0-9-]+", r["id"]) or r["id"] in seen:
            fail("events.csv", f"第 {i} 列 id 只能用小寫英數與連字號，且不可重複：{r['id']}")
        seen.add(r["id"])
        r["_row"] = i
        r["_date"] = parse_date("events.csv", i, r["date"]) if r.get("date") else None
        if r.get("start") and not r["_date"]:
            fail("events.csv", f"第 {i} 列有時間但沒有日期")
        for k in ("start", "end"):
            if r.get(k) and not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", r[k]):
                fail("events.csv", f"第 {i} 列時間格式需為 HH:MM：{r[k]}")
        if r["type"] not in TYPES:
            fail("events.csv", f"第 {i} 列 type 需為 {', '.join(TYPES)}：{r['type']}")
        if r["status"] not in STATUS:
            fail("events.csv", f"第 {i} 列 status 需為 {', '.join(STATUS)}：{r['status']}")
        if r.get("register_url") and not HTTPS.fullmatch(r["register_url"]):
            fail("events.csv", f"第 {i} 列報名網址必須是 https:// 開頭的完整網址")
        if r["status"] == "open" and not r.get("register_url"):
            fail("events.csv", f"第 {i} 列狀態為 open（報名中）但沒有報名網址")
        if r.get("image"):
            if not re.fullmatch(r"[A-Za-z0-9_.-]+\.(webp|jpg|jpeg|png)", r["image"]):
                fail("events.csv", f"第 {i} 列圖片檔名只能用英數字：{r['image']}")
            if not (ROOT / PHOTO_DIR / r["image"]).exists():
                fail("events.csv", f"第 {i} 列找不到圖片 {PHOTO_DIR}{r['image']}")
            if not r.get("image_alt_zh"):
                fail("events.csv", f"第 {i} 列有圖片但缺少替代文字 image_alt_zh")
    rows = [r for r in rows if not r.get("_hidden")]
    rows.sort(key=lambda r: (r["_date"] or dt.date.max, r.get("start") or "99:99"))
    return rows


def day_key(d):
    return d.isoformat() if d else "tba"


def day_label(d):
    return TBA if d is None else f"{d.year}/{d.month}/{d.day}（{WEEK_ZH[d.weekday()]}）"


def when_text(r):
    """Plain-text date/time of an event, or None when the date is TBA."""
    if r["_date"] and r.get("start"):
        return day_label(r["_date"]) + " " + r["start"] + (("–" + r["end"]) if r.get("end") else "")
    if r["_date"]:
        return day_label(r["_date"])
    return None


def event_card(r, hlevel, anchor):
    st = STATUS[r["status"]]
    title = r["title_zh"]
    if r["_date"] and r.get("start"):
        when_html = f'<time datetime="{r["date"]}T{r["start"]}">{e(when_text(r))}</time>'
    elif r["_date"]:
        when_html = f'<time datetime="{r["date"]}">{e(when_text(r))}</time>'
    else:
        when_html = COMING
    facts = [("時間", when_html),
             ("地點", e(r["venue_zh"]) if r.get("venue_zh") else DASH),
             ("講者", e(r["speaker_zh"]) if r.get("speaker_zh") else DASH)]
    cap = []
    if r.get("capacity"):
        cap.append(f'{e(r["capacity"])} 人')
    if r.get("language_zh"):
        cap.append(e(r["language_zh"]))
    if cap:
        facts.append(("名額", "・".join(cap)))
    dl = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in facts)
    if not SHOW_EVENT_PHOTOS:
        visual = '<div class="event-photo event-tba" aria-hidden="true"><span class="tba-mark">?</span><span class="tba-label">COMING SOON</span></div>'
    elif r.get("image"):
        visual = (f'<img class="event-photo" src="{PHOTO_DIR}{e(r["image"])}" alt="{e(r["image_alt_zh"])}" '
                  f'width="800" height="450" loading="lazy">')
    else:
        visual = f'<div class="event-visual" aria-hidden="true">{SVG[r["type"]]}</div>'
    if r["status"] == "open":
        action = (f'<a class="button button-primary event-register" href="{e(r["register_url"])}" target="_blank" '
                  f'rel="noopener noreferrer">立即報名<span class="visually-hidden">：{e(title)}{NW}</span> '
                  f'<span aria-hidden="true">↗</span></a>')
    else:
        action = f'<p class="event-register is-disabled">{st["btn"]}</p>'
    summary = f'<p class="event-summary">{e(r["summary_zh"])}</p>' if r.get("summary_zh") else ""
    idattr = f' id="event-{r["id"]}"' if anchor else ""
    return (f'<li class="event-card event-tile"{idattr} data-date="{day_key(r["_date"])}" data-type="{r["type"]}">{visual}'
            f'<div class="event-body"><p class="event-meta"><span class="event-type">{e(TYPES[r["type"]])}</span>'
            f'<span class="event-state state-{r["status"]}">{st["label"]}</span></p>'
            f'<h{hlevel} class="event-title">{e(title)}</h{hlevel}><dl class="event-facts">{dl}</dl>{summary}'
            f'<div class="event-actions">{action}</div></div></li>')


# ------------------------------------------------------------------ news
def load_news(events):
    by_id = {r["id"]: r for r in events}
    rows, seen = read_csv(NEWS_CSV), set()
    for i, r in enumerate(rows, start=2):
        if not r.get("id") or not re.fullmatch(r"[a-z0-9-]+", r["id"]) or r["id"] in seen:
            fail("news.csv", f"第 {i} 列 id 必填、只能用小寫英數與連字號且不可重複")
        seen.add(r["id"])
        if r.get("source") not in SOURCES:
            fail("news.csv", f"第 {i} 列 source 需為 {', '.join(SOURCES)}")
        if r.get("url") and not HTTPS.fullmatch(r["url"]):
            fail("news.csv", f"第 {i} 列連結必須是 https:// 開頭的完整網址")
        if r["source"] == "event" or r.get("event_id"):
            ev = by_id.get(r.get("event_id", ""))
            if not ev:
                fail("news.csv", f"第 {i} 列 event_id 找不到對應活動：{r.get('event_id')}")
            r["source"] = "event"
            r["_event"] = ev
            r["title_zh"] = r.get("title_zh") or ev["title_zh"]
            r["_date"] = parse_date("news.csv", i, r["date"]) if r.get("date") else ev["_date"]
        else:
            r["_event"] = None
            if not r.get("title_zh"):
                fail("news.csv", f"第 {i} 列缺少中文標題 title_zh")
            if not r.get("date"):
                fail("news.csv", f"第 {i} 列缺少日期")
            r["_date"] = parse_date("news.csv", i, r["date"])
        txt = NEWS_TXT / f'{r["id"]}.txt'
        r["_text"] = txt.read_text(encoding="utf-8-sig") if txt.exists() else ""
        if not r["_text"].strip() and not r["_event"]:
            fail("news.csv", f"第 {i} 列找不到內文檔 _tools/news/{r['id']}.txt")
    rows.sort(key=lambda r: r["_date"] or dt.date.min, reverse=True)
    return rows


def render_text(src):
    """Plain text → HTML. Blank line = new block; '## ' = subheading;
    lines starting with '- ' = bullet list, '1. ' = numbered list;
    [文字](vgw_website_assets/…) = 站內檔案下載連結.
    Everything is escaped; e-mail addresses and https:// URLs become links."""
    def inline(t):
        t = e(t)
        # [文字](vgw_website_assets/...) → 站內下載連結
        t = re.sub(r"\[([^\]]+)\]\((vgw_website_assets/[^)\s]+)\)",
                   lambda m: f'<a href="{m.group(2)}" download>{m.group(1)}</a>', t)
        t = re.sub(r"(https://[^\s<>&\"']+)",
                   lambda m: f'<a href="{m.group(1)}" target="_blank" rel="noopener noreferrer">{m.group(1)}'
                             f'<span class="visually-hidden">{NW}</span></a>', t)
        return re.sub(r"\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b", r'<a href="mailto:\1">\1</a>', t)
    out = []
    for block in re.split(r"\n\s*\n", src.strip()):
        lines = [l.strip() for l in block.splitlines() if l.strip()]
        if not lines:
            continue
        if lines[0].startswith("## ") and len(lines) == 1:
            out.append(f"<h2>{inline(lines[0][3:])}</h2>")
        elif all(l.startswith("- ") for l in lines):
            out.append("<ul>" + "".join(f"<li>{inline(l[2:])}</li>" for l in lines) + "</ul>")
        elif all(re.match(r"\d+\.\s", l) for l in lines):
            out.append("<ol>" + "".join("<li>" + inline(re.sub(r"^\d+\.\s+", "", l)) + "</li>" for l in lines) + "</ol>")
        else:
            out.append("<p>" + "<br>".join(inline(l) for l in lines) + "</p>")
    return "\n            ".join(out)


def auto_event_text(ev):
    title, when, venue = ev["title_zh"], when_text(ev), ev.get("venue_zh")
    if when and venue:
        first = f"{title}將於 {when} 在{venue}舉行。"
    elif when:
        first = f"{title}將於 {when} 舉行，地點將於確認後公布。"
    else:
        first = f"{title}的日期與地點將於確認後公布，敬請持續關注放視大賞最新消息。"
    parts = [first]
    if ev.get("summary_zh"):
        parts.append(ev["summary_zh"])
    parts.append({
        "open": "現正開放報名，名額有限，請點選下方「立即報名」。",
        "upcoming": "報名將於近期開放，屆時可直接在本頁或活動總覽報名。",
        "full": "本場活動已額滿，感謝大家的支持。",
        "closed": "本場活動報名已截止。",
    }[ev["status"]])
    return "\n\n".join(parts)


def news_row(n, first):
    d = n["_date"]
    date_html = (f'<time datetime="{d.isoformat()}">{d.strftime("%Y.%m.%d")}</time>' if d
                 else f'<span class="post-date-tba">{TBA}</span>')
    new = '<span class="post-new">最新</span>' if first else ""
    src = f'<span class="post-source{" is-event" if n["source"] == "event" else ""}">{SOURCES[n["source"]]}</span>'
    return (f'<li class="post-row"><a href="{article_page(n["id"])}">{date_html}<span class="post-tags">{new}{src}</span>'
            f'<span class="post-title">{e(n["title_zh"])}</span><span class="post-arrow" aria-hidden="true">→</span></a></li>')


# ------------------------------------------------------------ home page
def section_bounds(s, cls):
    a = s.index(f'<section class="{cls} section-pad"')
    return a, s.index("</section>", a)


def update_home(events, news):
    path = ROOT / HOME
    s = path.read_text(encoding="utf-8")
    home_news = [n for n in news if n.get("home", "").upper() == "Y"] or news
    rows = "\n            ".join(news_row(n, i == 0) for i, n in enumerate(home_news[:3]))
    a, b = section_bounds(s, "updates")
    sec = re.sub(r'<ul class="post-rows">.*?</ul>', f'<ul class="post-rows">\n            {rows}\n          </ul>', s[a:b], count=1, flags=re.S)
    sec = re.sub(r'<p class="news-all">.*?</p>',
                 f'<p class="news-all"><a href="{NEWS_PAGE}">查看所有消息</a></p>', sec, count=1, flags=re.S)
    s = s[:a] + sec + s[b:]
    # featured cards keep the row order of events.csv; fallback = nearest dates
    picked = sorted((r for r in events if r.get("featured", "").upper() == "Y"), key=lambda r: r["_row"]) or events
    cards = "\n            ".join(event_card(r, 3, False) for r in picked[:3])
    a, b = section_bounds(s, "events")
    sec = re.sub(r'<ul class="event-(?:grid|cards)"[^>]*>.*?</ul>', f'<ul class="event-cards">\n            {cards}\n          </ul>', s[a:b], count=1, flags=re.S)
    note = (f'<p class="event-note">{SURVEYCAKE_NOTE}</p>'
            f'<p class="event-more"><a class="button button-outline-neon" href="{EVENTS_PAGE}">查看全部活動 <span aria-hidden="true">→</span></a></p>')
    sec = re.sub(r'(<p class="event-note">.*?</p>)(\s*<p class="event-more">.*?</p>)?', note, sec, count=1, flags=re.S)
    path.write_text(s[:a] + sec + s[b:], encoding="utf-8")


# ---------------------------------------------------------- page shell
def shell(title, desc, main, current=None, scripts=()):
    """Wrap <main> with index.html's head, header and footer."""
    s = (ROOT / HOME).read_text(encoding="utf-8")
    top = s[: s.index('<main id="main">')]
    bottom = s[s.index("</main>") + len("</main>"):]
    full = f"{title}｜放視大賞 Vision Get Wild"
    top = re.sub(r"<title>.*?</title>", f"<title>{e(full)}</title>", top)
    for attr in ('name="description"', 'property="og:title"', 'property="og:description"'):
        val = full if "title" in attr else desc
        top = re.sub(rf'<meta {attr} content="[^"]*">', f'<meta {attr} content="{e(val)}">', top)
    top = re.sub(r'<a href="#([a-z]+)">', lambda m: f'<a href="{HOME}#{m.group(1)}">', top)
    cur = ' aria-current="page"'
    top = top.replace(f'<a href="{HOME}#news">', f'<a href="{NEWS_PAGE}"' + (cur if current == "news" else "") + ">")
    top = top.replace(f'<a href="{HOME}#events">', f'<a href="{EVENTS_PAGE}"' + (cur if current == "events" else "") + ">")
    top = top.replace('class="brand" href="#top"', f'class="brand" href="{HOME}"')
    bottom = bottom.replace('class="brand footer-brand" href="#top"', f'class="brand footer-brand" href="{HOME}"')
    bottom = re.sub(r'\s*<script src="(judges|news|events-filter|follow-eyes|follow-wave)\.js" defer></script>', "", bottom)
    extra = "".join(f'\n    <script src="{x}" defer></script>' for x in scripts)
    bottom = bottom.replace("\n  </body>", extra + "\n  </body>", 1)
    return top + main + bottom


def back_button(href, label):
    return (f'<p class="events-back"><a class="back-home" href="{href}"><span class="back-home-icon" aria-hidden="true">'
            f'{BACK_SVG}</span><span class="back-home-text">{label}</span></a></p>')


def eyebrow(t):
    return f'<p class="eyebrow" lang="en">{t}</p>'


# ------------------------------------------------------------ news list
def build_news_list(news):
    rows = "\n            ".join(news_row(n, i == 0) for i, n in enumerate(news))
    main = f'''<main id="main">
      <section class="page-head section-pad" id="top" aria-label="頁面導覽">
        <div class="container">
          {back_button(HOME, "回到首頁")}
        </div>
      </section>

      <section class="updates section-pad" id="news-list" aria-labelledby="page-title">
        <div class="container news-layout">
          <div class="news-side">
            <div class="section-heading"><div>{eyebrow("NEWS")}<h1 id="page-title" class="page-h1">最新消息</h1><p class="section-subtitle">放視大賞官網公告與活動消息，點選標題閱讀全文。</p></div></div>
          </div>
          <ul class="post-rows">
            {rows}
          </ul>
        </div>
      </section>
    </main>'''
    (ROOT / NEWS_PAGE).write_text(shell("最新消息", "放視大賞最新公告與活動消息。", main, "news"), encoding="utf-8")


# --------------------------------------------------------- article page
def build_article(n, prev_n, next_n):
    d = n["_date"]
    date_html = (f'<time datetime="{d.isoformat()}">{d.strftime("%Y.%m.%d")}</time>' if d
                 else f'<span class="post-date-tba">{TBA}</span>')
    src = f'<span class="post-source{" is-event" if n["source"] == "event" else ""}">{SOURCES[n["source"]]}</span>'
    text = n["_text"] if n["_text"].strip() else auto_event_text(n["_event"])
    body = render_text(text)
    extra = ""
    if n["_event"]:
        ev = n["_event"]
        extra = (f'<section class="article-event" aria-labelledby="article-event-title">'
                 f'<h2 id="article-event-title" class="article-aside-title">活動資訊</h2>'
                 f'<ul class="event-cards article-event-card">{event_card(ev, 3, False)}</ul>'
                 f'<p class="event-note">{SURVEYCAKE_NOTE}</p>'
                 f'<p class="article-more"><a href="{EVENTS_PAGE}#event-{ev["id"]}">在活動總覽查看 <span aria-hidden="true">→</span></a></p>'
                 f'</section>')

    def pager(item, rel, label):
        if not item:
            return f'<span class="pager-empty" aria-hidden="true"></span>'
        return (f'<a class="pager-link pager-{rel}" href="{article_page(item["id"])}" rel="{rel}">'
                f'<span class="pager-label">{label}</span><span class="pager-title">{e(item["title_zh"])}</span></a>')
    main = f'''<main id="main">
      <section class="page-head section-pad" id="top" aria-label="頁面導覽">
        <div class="container article-wrap">
          {back_button(NEWS_PAGE, "回到最新消息")}
        </div>
      </section>

      <article class="news-article section-pad" aria-labelledby="page-title">
        <div class="container article-wrap">
          <header class="article-head">
            <p class="article-meta">{date_html}{src}</p>
            <h1 id="page-title" class="article-title">{e(n["title_zh"])}</h1>
          </header>
          <div class="article-body">
            {body}
          </div>
          {extra}
          <nav class="article-pager" aria-label="其他消息">{pager(next_n, "prev", "上一則（較新）")}{pager(prev_n, "next", "下一則（較舊）")}</nav>
        </div>
      </article>
    </main>'''
    desc = re.sub(r"\s+", " ", re.sub(r"^## .*$", "", text, flags=re.M)).strip()[:100]
    (ROOT / article_page(n["id"])).write_text(shell(n["title_zh"], desc or n["title_zh"], main, "news"), encoding="utf-8")


# ----------------------------------------------------------- events page
def build_events_page(events):
    days = sorted({r["_date"] for r in events}, key=lambda d: d or dt.date.max)

    def btns(kind, values, labels):
        out = [f'<button type="button" class="filter-btn" data-filter="{kind}" data-value="all" aria-pressed="true">全部</button>']
        out += [f'<button type="button" class="filter-btn" data-filter="{kind}" data-value="{v}" aria-pressed="false">{e(l)}</button>'
                for v, l in zip(values, labels)]
        return "".join(out)

    filters = (
        '<div class="filter-bar" hidden>'
        '<div class="filter-group" role="group" aria-label="依日期篩選活動"><span class="filter-label" aria-hidden="true">日期</span>'
        f'{btns("date", [day_key(d) for d in days], [day_label(d) for d in days])}</div>'
        '<p class="filter-status" role="status" aria-live="polite" data-template="共 {n} 場活動" data-empty="沒有符合條件的活動"></p>'
        '</div>')
    groups = []
    for d in days:
        items = "\n              ".join(event_card(r, 3, True) for r in events if r["_date"] == d)
        groups.append(f'<section class="event-day" data-date="{day_key(d)}" aria-labelledby="day-{day_key(d)}">'
                      f'<h2 class="event-day-title" id="day-{day_key(d)}">{day_label(d)}</h2>'
                      f'<ul class="event-cards">\n              {items}\n            </ul></section>')
    main = f'''<main id="main">
      <section class="page-head section-pad" id="top" aria-label="頁面導覽">
        <div class="container">
          {back_button(HOME, "回到首頁")}
        </div>
      </section>

      <section class="events-page section-pad" id="program" aria-labelledby="page-title">
        <div class="container">
          <div class="section-heading"><div>{eyebrow("PROGRAM")}<h1 id="page-title" class="page-h1">主題活動</h1><p class="section-subtitle">國際論壇、主題講座、工作坊與現場活動，選擇場次後即可報名。</p></div></div>
          {filters}
          {"".join(groups)}
          <p class="event-note">{SURVEYCAKE_NOTE}</p>
        </div>
      </section>
    </main>'''
    (ROOT / EVENTS_PAGE).write_text(shell("主題活動", "放視大賞國際論壇、主題講座、工作坊等活動場次與報名資訊。", main, "events",
                                          ("events-filter.js",)), encoding="utf-8")


# --------------------------------------------------------- static pages
# Content fragments live in _tools/pages/<slug>.html (trusted, hand-maintained HTML).
STATIC_PAGES = [
    ("privacy", "隱私權及資訊安全政策", "PRIVACY", "放視大賞網站隱私權及資訊安全政策。"),
    ("copyright", "著作權聲明", "COPYRIGHT", "放視大賞網站著作權聲明。"),
    ("faq", "常見問題", "FAQ", "放視大賞參展常見問題。"),
]


def build_static_pages():
    for slug, title, code, desc in STATIC_PAGES:
        frag = (ROOT / "_tools" / "pages" / f"{slug}.html").read_text(encoding="utf-8").strip()
        main = f'''<main id="main">
      <section class="page-head section-pad" id="top" aria-label="頁面導覽">
        <div class="container article-wrap">
          {back_button(HOME, "回到首頁")}
        </div>
      </section>

      <section class="article section-pad" aria-labelledby="page-title">
        <div class="container article-wrap">
          <div class="section-heading"><div>{eyebrow(code)}<h1 id="page-title" class="page-h1">{e(title)}</h1></div></div>
          <div class="policy-body">
{frag}
          </div>
        </div>
      </section>
    </main>'''
        (ROOT / f"{slug}.html").write_text(shell(title, desc, main), encoding="utf-8")


# ------------------------------------------------------ last-updated date
def stamp_updated():
    """Set the footer "最後更新" date in index.html to today (copied to every sub-page)."""
    path = ROOT / HOME
    s = path.read_text(encoding="utf-8")
    today = dt.date.today()
    new = (f'最後更新：<time datetime="{today.isoformat()}">'
           f'{today.year} 年 {today.month} 月 {today.day} 日</time>')
    s, n = re.subn(r'最後更新：<time datetime="[^"]*">[^<]*</time>', new, s)
    if n != 1:
        fail(HOME, "找不到頁尾「最後更新」日期")
    path.write_text(s, encoding="utf-8")


# ------------------------------------------------------------- site map
SITEMAP_PAGE = "sitemap.html"
HOME_SECTIONS = [("news", "最新消息"), ("exhibit", "報名參展"), ("competition", "報名競賽"), ("events", "主題活動"),
                 ("visit", "參觀資訊"), ("partners", "競賽評審團"), ("sponsors", "感謝名單"), ("follow", "追蹤我們"),
                 ("contact", "聯絡執行單位")]


def build_sitemap(news):
    def li(href, text, sub=""):
        return f'<li><a href="{href}">{e(text)}</a>{sub}</li>'
    home_sub = "<ul>" + "".join(li(f"{HOME}#{i}", t) for i, t in HOME_SECTIONS) + "</ul>"
    news_sub = "<ul>" + "".join(li(article_page(n["id"]), n["title_zh"]) for n in news) + "</ul>"
    items = "".join([
        li(HOME, "首頁", home_sub),
        li(NEWS_PAGE, "最新消息", news_sub),
        li(EVENTS_PAGE, "主題活動"),
        *[li(f"{slug}.html", title) for slug, title, _c, _d in STATIC_PAGES],
        li(SITEMAP_PAGE, "網站導覽"),
    ])
    main = f'''<main id="main">
      <section class="page-head section-pad" id="top" aria-label="頁面導覽">
        <div class="container article-wrap">
          {back_button(HOME, "回到首頁")}
        </div>
      </section>

      <section class="article section-pad" aria-labelledby="page-title">
        <div class="container article-wrap">
          <div class="section-heading"><div>{eyebrow("SITE MAP")}<h1 id="page-title" class="page-h1">網站導覽</h1><p class="section-subtitle">本網站所有頁面與首頁各區塊的連結。</p></div></div>
          <nav class="sitemap" aria-labelledby="page-title"><ul>{items}</ul></nav>
        </div>
      </section>
    </main>'''
        
    (ROOT / SITEMAP_PAGE).write_text(shell("網站導覽", "放視大賞網站所有頁面與區塊連結。", main), encoding="utf-8")


def main():
    events = load_events()
    news = load_news(events)
    stamp_updated()
    update_home(events, news)
    build_news_list(news)
    keep = set()
    for i, n in enumerate(news):
        build_article(n, news[i + 1] if i + 1 < len(news) else None, news[i - 1] if i > 0 else None)
        keep.add(article_page(n["id"]))
    build_events_page(events)
    build_static_pages()
    build_sitemap(news)
    # remove pages of deleted news items and retired page names
    for p in ROOT.glob("news-*.html"):
        if p.name not in keep:
            p.unlink()
    for old in OLD_PAGES:
        if (ROOT / old).exists():
            (ROOT / old).unlink()
    print(f"完成：{len(news)} 則消息、{len(events)} 場活動 → {HOME}, {NEWS_PAGE}, {EVENTS_PAGE}, {len(keep)} 個消息內頁、{len(STATIC_PAGES)} 個政策／說明頁、網站導覽")


if __name__ == "__main__":
    main()
