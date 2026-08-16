#!/usr/bin/env python3
"""
build.py — The Simulation Log article builder
----------------------------------------------
Reads every JSON file in data/articles/
Generates a static HTML page at posts/<slug>/index.html
Generates articles-index.json for the homepage feed

Run: python build.py
"""

import json
import os
import re
import shutil
from datetime import datetime
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────
ROOT      = Path(__file__).parent
DATA_DIR  = ROOT / "data" / "articles"
POSTS_DIR = ROOT / "posts"
TEMPLATE  = ROOT / "article-template.html"
INDEX_OUT = ROOT / "articles-index.json"


# ── Helpers ────────────────────────────────────────────────────────
def load_template():
    return TEMPLATE.read_text(encoding="utf-8")


def content_to_html(content_blocks):
    """Convert content array to HTML string."""
    html = ""
    for block in content_blocks:
        t = block.get("type", "p")
        text = block.get("text", "")
        if t == "p":
            html += f"<p>{text}</p>\n"
        elif t == "h2":
            html += f"<h2>{text}</h2>\n"
        elif t == "blockquote":
            html += f"<blockquote>{text}</blockquote>\n"
        elif t == "ul":
            items = block.get("items", [])
            items_html = "".join(f"<li>{i}</li>" for i in items)
            html += f"<ul>{items_html}</ul>\n"
    return html


def tags_to_html(tags):
    """Render tags as small pill spans."""
    if not tags:
        return ""
    pills = "".join(
        f'<span style="font-size:.7rem;font-weight:600;padding:.15rem .45rem;'
        f'border-radius:3px;background:var(--bg-2);color:var(--ink-3);'
        f'border:1px solid var(--border);margin-left:.3rem;">#{t}</span>'
        for t in tags
    )
    return pills


def source_box_html(source_url, source_label):
    """Render the primary source reference box."""
    if not source_url:
        return ""
    return (
        f'<div class="post-source">'
        f'  <span>Primary source: <strong>{source_label or source_url}</strong></span>'
        f'  <a href="{source_url}" target="_blank" rel="noopener" class="read-btn">'
        f'  View Source &rarr;</a>'
        f'</div>'
    )


def related_html(all_articles, current_slug):
    """Build 2 related article cards, excluding the current article."""
    others = [a for a in all_articles if a["slug"] != current_slug][:2]
    if not others:
        return ""
    cards = ""
    for a in others:
        cat_class = a.get("category_class", "ai")
        cat_name  = a.get("category", "")
        cards += (
            f'<a href="/posts/{a["slug"]}/" class="related-card">'
            f'  <span class="related-card-cat" style="color:var(--blue);">{cat_name}</span>'
            f'  <span class="related-card-title">{a["title"]}</span>'
            f'  <span class="related-card-date">{a["date"]}</span>'
            f'</a>'
        )
    return cards


# ── Main builder ───────────────────────────────────────────────────
def build():
    if not DATA_DIR.exists():
        print(f"[ERROR] Data directory not found: {DATA_DIR}")
        return

    template = load_template()
    article_files = sorted(DATA_DIR.glob("*.json"))

    if not article_files:
        print("[WARN] No article JSON files found in data/articles/")
        return

    # Load all articles first (needed for related links)
    all_articles = []
    for f in article_files:
        try:
            article = json.loads(f.read_text(encoding="utf-8"))
            all_articles.append(article)
        except json.JSONDecodeError as e:
            print(f"[ERROR] {f.name}: {e}")

    # Sort by date descending for related articles
    def parse_date(a):
        try:
            return datetime.strptime(a.get("date_iso", "2000-01-01"), "%Y-%m-%d")
        except:
            return datetime.min

    all_articles.sort(key=parse_date, reverse=True)

    built = []

    for article in all_articles:
        slug = article.get("slug", "")
        if not slug:
            print(f"[SKIP] Article missing slug: {article.get('title', '?')}")
            continue

        # Build output directory
        out_dir = POSTS_DIR / slug
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / "index.html"

        # Generate HTML parts
        content_html  = content_to_html(article.get("content", []))
        tags_html      = tags_to_html(article.get("tags", []))
        src_box        = source_box_html(
            article.get("source_url", ""),
            article.get("source_label", "")
        )
        related        = related_html(all_articles, slug)

        # Replace placeholders in template
        html = template
        replacements = {
            "{{ARTICLE_SLUG}}":         slug,
            "{{ARTICLE_TITLE}}":        article.get("title", ""),
            "{{ARTICLE_SUBTITLE}}":     article.get("subtitle", ""),
            "{{ARTICLE_AUTHOR}}":       article.get("author", "Editorial Team"),
            "{{ARTICLE_DATE}}":         article.get("date", ""),
            "{{ARTICLE_CATEGORY}}":     article.get("category", ""),
            "{{CATEGORY_CLASS}}":       article.get("category_class", "ai"),
            "{{ARTICLE_READING_TIME}}": article.get("reading_time", ""),
            "{{ARTICLE_TAGS_HTML}}":    tags_html,
            "{{ARTICLE_CONTENT_HTML}}": content_html,
            "{{ARTICLE_SOURCE_BOX}}":   src_box,
            "{{RELATED_ARTICLES_HTML}}":related,
            "{{META_DESCRIPTION}}":     article.get("meta_description", article.get("subtitle", "")),
        }
        for placeholder, value in replacements.items():
            html = html.replace(placeholder, value)

        out_file.write_text(html, encoding="utf-8")
        built.append(slug)
        print(f"[OK]  posts/{slug}/index.html")

    # Generate articles-index.json for homepage feed
    index = []
    for a in all_articles:
        index.append({
            "slug":           a.get("slug", ""),
            "title":          a.get("title", ""),
            "subtitle":       a.get("subtitle", ""),
            "author":         a.get("author", "Editorial Team"),
            "date":           a.get("date", ""),
            "date_iso":       a.get("date_iso", ""),
            "category":       a.get("category", ""),
            "category_class": a.get("category_class", "ai"),
            "tags":           a.get("tags", []),
            "reading_time":   a.get("reading_time", ""),
            "meta_description": a.get("meta_description", ""),
        })

    INDEX_OUT.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[OK]  articles-index.json ({len(index)} articles)")
    print(f"\nBuild complete: {len(built)} article pages generated.")


if __name__ == "__main__":
    build()
