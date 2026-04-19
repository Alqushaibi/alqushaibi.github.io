#!/usr/bin/env python3
"""
update_citations.py
===================
Fetches updated citation counts from Google Scholar and updates
assets/data/publications.json.

Runs weekly via GitHub Actions (.github/workflows/update_citations.yml).
Can also be run manually: python scripts/update_citations.py
"""

import json
import os
import time
import datetime
from pathlib import Path

SCHOLAR_ID    = "7B_-M3YAAAAJ"
DATA_FILE     = Path(__file__).parent.parent / "assets" / "data" / "publications.json"
MAX_RETRIES   = 3
RETRY_DELAY   = 10  # seconds between retries


def load_current_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[✓] Saved updated data to {DATA_FILE}")


def fetch_scholar_data():
    """Fetch author and publication data from Google Scholar via scholarly."""
    try:
        from scholarly import scholarly, ProxyGenerator
    except ImportError:
        print("[!] scholarly not installed. Run: pip install scholarly")
        return None

    # Try free proxies to avoid rate-limiting
    try:
        pg = ProxyGenerator()
        success = pg.FreeProxies()
        if success:
            scholarly.use_proxy(pg)
            print("[i] Using free proxy for Scholar requests")
        else:
            print("[i] No free proxies available, proceeding without proxy")
    except Exception as e:
        print(f"[i] Proxy setup failed ({e}), proceeding without proxy")

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"[i] Fetching author profile (attempt {attempt}/{MAX_RETRIES})...")
            author = scholarly.search_author_id(SCHOLAR_ID)
            author = scholarly.fill(author, sections=["basics", "indices", "publications"])
            print(f"[✓] Fetched profile for: {author.get('name', 'Unknown')}")
            return author
        except Exception as e:
            print(f"[!] Attempt {attempt} failed: {e}")
            if attempt < MAX_RETRIES:
                print(f"[i] Retrying in {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)

    print("[✗] All attempts failed. Skipping update.")
    return None


def update_publication_citations(author, current_data):
    """Match publications and update citation counts."""
    scholar_pubs = {
        pub.get("bib", {}).get("title", "").lower().strip(): pub
        for pub in author.get("publications", [])
    }

    updated_count  = 0
    not_found      = []

    for pub in current_data["publications"]:
        title_key = pub["title"].lower().strip()
        matched   = None

        # Exact match
        if title_key in scholar_pubs:
            matched = scholar_pubs[title_key]
        else:
            # Fuzzy match: check if our title is contained in any scholar title or vice versa
            for s_title, s_pub in scholar_pubs.items():
                if title_key[:60] in s_title or s_title[:60] in title_key:
                    matched = s_pub
                    break

        if matched:
            new_cites = matched.get("num_citations", pub["citations"])
            if new_cites != pub["citations"]:
                print(f"  [↑] {pub['title'][:70]}... : {pub['citations']} → {new_cites}")
                pub["citations"] = new_cites
                updated_count += 1
        else:
            not_found.append(pub["title"][:70])

    if not_found:
        print(f"\n[i] {len(not_found)} publication(s) not matched in Scholar:")
        for t in not_found[:5]:
            print(f"    – {t}")
        if len(not_found) > 5:
            print(f"    … and {len(not_found)-5} more")

    print(f"\n[✓] Updated {updated_count} publication(s) with new citation counts")
    return updated_count


def update_metrics(author, current_data):
    """Update overall Scholar metrics."""
    cites_all  = author.get("citedby", 0)
    h_index    = author.get("hindex",  current_data["metrics"]["h_index"])
    i10_index  = author.get("i10index", current_data["metrics"]["i10_index"])

    old = current_data["metrics"]
    print(f"\n[i] Metrics update:")
    print(f"    Citations : {old['citations']} → {cites_all}")
    print(f"    h-index   : {old['h_index']}  → {h_index}")
    print(f"    i10-index : {old['i10_index']} → {i10_index}")

    current_data["metrics"]["citations"] = cites_all
    current_data["metrics"]["h_index"]   = h_index
    current_data["metrics"]["i10_index"] = i10_index


def main():
    print("=" * 60)
    print(" Google Scholar Citation Updater")
    print(f" Scholar ID : {SCHOLAR_ID}")
    print(f" Data file  : {DATA_FILE}")
    print("=" * 60)

    try:
        current_data = load_current_data()
    except Exception as e:
        print(f"[✗] Could not load {DATA_FILE}: {e}")
        print("[i] Nothing to update. Exiting cleanly.")
        return

    author = fetch_scholar_data()

    if author is None:
        print("[✗] Could not fetch Scholar data. Keeping existing data unchanged.")
        print("[i] This is normal when GitHub Actions IPs are blocked by Google.")
        return

    try:
        update_metrics(author, current_data)
        update_publication_citations(author, current_data)
        current_data["last_updated"] = datetime.date.today().isoformat()
        save_data(current_data)
        print("\n[✓] Update complete!")
    except Exception as e:
        print(f"[✗] Error during update: {e}")
        print("[i] Keeping existing data unchanged.")


if __name__ == "__main__":
    main()
