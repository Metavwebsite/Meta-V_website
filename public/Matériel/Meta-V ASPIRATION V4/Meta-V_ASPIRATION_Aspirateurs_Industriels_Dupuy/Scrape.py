import json
import os
import re
import time
from datetime import datetime
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


API_KEY = os.getenv("FIRECRAWL_API_KEY", "fc-38c015a362d64f1484a6fdf1d9f143af")
BASE_DOMAIN = "https://ales-solutions.ma"
OUTPUT_FILE = "Meta-V_ASPIRATION_Aspirateurs_Industriels_Dupuy.json"
CHECKPOINT_FILE = "Meta-V SOLUTIONS - checkpoint.json"

BATCH_SIZE = 250  # nombre de produits à traiter par run


CATEGORY_URLS = [
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/aspirateurs-industriels-a-silos/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/aspirateurs-a-air-comprime/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/aspirateurs-a-haute-puissance/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/aspirateurs-wet-dry-professionnels/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/aspirateurs-atex-certifies/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/aspirateurs-industriels-oil/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/aspirateurs-industriels-monophases/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/aspirateurs-industriels-triphases/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/collecteur-de-brouillard-dhuile/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/depoussierage-industriel/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/extracteurs-de-fumees-de-soudage/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/installations-daspiration-centralisees/",
    "https://ales-solutions.ma/product-category/nettoyage-aspiration/aspirateurs-industriels-dupuy/unites-aspirantes-fixe-a-bord-des-machines/"
]


DELAY_LISTING = 1.0
DELAY_PRODUCT = 1.2
REQUEST_TIMEOUT = 45


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    "Accept-Encoding": "identity",
    "Connection": "keep-alive",
}


PRODUCT_SCHEMA = {
    "type": "object",
    "properties": {
        "url": {"type": "string"},
        "name": {"type": "string"},
        "subtitle": {"type": "string"},
        "main_image_url": {"type": "string"},
        "image_urls": {
            "type": "array",
            "items": {"type": "string"}
        },
        "categories": {"type": "array", "items": {"type": "string"}},
        "tags": {"type": "array", "items": {"type": "string"}},
        "description_text": {"type": "string"},
        "bullet_points": {"type": "array", "items": {"type": "string"}},
        "technical_sheet": {
            "type": "object",
            "properties": {
                "type": {"type": "string"},
                "pdf_url": {"type": "string"},
                "content_text": {"type": "string"},
                "technical_specs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "label": {"type": "string"},
                            "unit": {"type": "string"},
                            "value": {"type": "string"},
                        },
                        "required": ["label", "unit", "value"],
                    },
                },
            },
            "required": ["type", "pdf_url", "content_text", "technical_specs"],
        },
        "related_products": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "category_label": {"type": "string"},
                },
                "required": ["name", "category_label"],
            },
        },
    },
    "required": [
        "url",
        "name",
        "subtitle",
        "main_image_url",
        "image_urls",
        "categories",
        "tags",
        "description_text",
        "bullet_points",
        "technical_sheet",
        "related_products",
    ],
}


PRODUCT_PROMPT = """
Tu es sur une fiche produit WooCommerce.
Retourne exactement les champs suivants :
url, name, subtitle, main_image_url, image_urls, categories, tags, description_text, bullet_points, technical_sheet, related_products.


Règles :
- url = URL complète de la page courante
- name = nom exact du produit visible sur la page
- subtitle = sous-titre visible s'il existe, sinon ''
- main_image_url = image principale du produit si identifiable, sinon première image de image_urls, sinon ''
- image_urls = liste complète de toutes les images visibles du produit (galerie incluse), URLs absolues, sans doublons
- categories = catégories visibles du produit
- tags = tags visibles du produit
- description_text = texte propre et complet de la description produit visible
- bullet_points = liste des puces visibles
- technical_sheet doit toujours exister avec:
  {type, pdf_url, content_text, technical_specs}
- Si la fiche technique est écrite dans la page:
  type='inline', content_text contient le contenu technique visible,
  technical_specs contient les lignes structurées possibles,
  pdf_url=''
- Si la fiche technique est fournie par PDF:
  type='pdf', pdf_url contient le lien absolu du PDF,
  content_text='', technical_specs=[]
- Si aucune fiche technique n'existe:
  type='none', pdf_url='', content_text='', technical_specs=[]
- related_products = produits liés visibles avec seulement:
  {name, category_label}
N'ajoute aucun autre champ.
"""


session = requests.Session()
session.headers.update(HEADERS)


def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")


def normalize_url(url):
    if not url:
        return ""
    url = str(url).strip().strip("`").strip()
    if url.startswith("…/"):
        url = "/" + url[2:]
    return urljoin(BASE_DOMAIN, url)


def clean_text(text):
    return re.sub(r"\s+", " ", (text or "")).strip()


def dedupe_strings(items):
    seen = set()
    out = []
    for item in items or []:
        value = normalize_url(item)
        if value and value not in seen:
            seen.add(value)
            out.append(value)
    return out


def get_client(api_key):
    try:
        from firecrawl import Firecrawl
        return Firecrawl(api_key=api_key), "v2"
    except Exception:
        from firecrawl import FirecrawlApp
        return FirecrawlApp(api_key=api_key), "legacy"


def extract_json_payload(result, sdk_mode):
    if sdk_mode == "v2":
        if isinstance(result, dict):
            data = result.get("data", {})
            if isinstance(data, dict):
                return data.get("json", {}) or data.get("extract", {}) or {}
            return result.get("json", {}) or {}
        if hasattr(result, "data") and isinstance(result.data, dict):
            return result.data.get("json", {}) or result.data.get("extract", {}) or {}
        if hasattr(result, "json") and isinstance(result.json, dict):
            return result.json
        return {}

    if isinstance(result, dict):
        return result.get("extract", {}) or {}
    if hasattr(result, "extract") and isinstance(result.extract, dict):
        return result.extract
    return {}


def scrape_json(client, sdk_mode, url, schema, prompt):
    if sdk_mode == "v2":
        result = client.scrape(
            url,
            formats=[{"type": "json", "schema": schema, "prompt": prompt}],
            only_main_content=True,
            timeout=120000,
        )
    else:
        result = client.scrape_url(
            url,
            params={
                "formats": ["extract"],
                "extract": {"schema": schema, "prompt": prompt},
                "onlyMainContent": True,
                "waitFor": 2500,
            },
        )
    return extract_json_payload(result, sdk_mode)


def is_product_url(url):
    return "/product/" in url


def dedupe_by_url(items):
    seen = set()
    out = []
    for item in items:
        u = item.get("url", "").strip()
        if u and u not in seen:
            seen.add(u)
            out.append(item)
    return out


def fetch_html(url, retries=3):
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            response = session.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response.text
        except Exception as e:
            last_error = e
            log(f"retry {attempt}/{retries} sur {url} -> {e}")
            time.sleep(1.5 * attempt)
    raise last_error


def extract_products_from_soup(soup):
    items = []

    selectors = [
        "li.product a.woocommerce-LoopProduct-link",
        "li.product a[href*='/product/']",
        ".products li.product a[href*='/product/']",
        "ul.products li.product a[href*='/product/']",
        "article.product a[href*='/product/']",
        "a[href*='/product/']",
    ]

    seen = set()

    for selector in selectors:
        for a in soup.select(selector):
            href = normalize_url(a.get("href") or "")
            if not href or not is_product_url(href):
                continue
            if href in seen:
                continue

            name = ""
            title_el = a.select_one("h2, h3, .woocommerce-loop-product__title, .product-title")
            if title_el:
                name = clean_text(title_el.get_text(" ", strip=True))

            if not name:
                name = clean_text(a.get_text(" ", strip=True))

            if not name:
                img = a.select_one("img")
                if img:
                    name = clean_text(img.get("alt") or "")

            seen.add(href)
            items.append({
                "name": name,
                "url": href
            })

    return dedupe_by_url(items)


def find_next_page(soup):
    next_selectors = [
        "a.next",
        "a.next.page-numbers",
        ".woocommerce-pagination a.next",
        "a.page-numbers.next",
    ]

    for selector in next_selectors:
        a = soup.select_one(selector)
        if a and a.get("href"):
            return normalize_url(a["href"])

    return None


def collect_product_links():
    all_items = []

    for category_url in CATEGORY_URLS:
        current_url = category_url if category_url.endswith("/") else category_url + "/"
        visited_pages = set()

        while current_url and current_url not in visited_pages:
            visited_pages.add(current_url)
            log(f"Listing → {current_url}")

            try:
                html = fetch_html(current_url)
                soup = BeautifulSoup(html, "html.parser")

                page_items = extract_products_from_soup(soup)
                all_items.extend(page_items)

                log(f"produits trouvés sur la page: {len(page_items)}")

                next_page = find_next_page(soup)
                if next_page and next_page not in visited_pages:
                    log(f"pagination → {next_page}")
                    current_url = next_page
                else:
                    current_url = None

            except Exception as e:
                log(f"❌ Listing error: {e}")
                current_url = None

            time.sleep(DELAY_LISTING)

    return dedupe_by_url(all_items)


def ensure_shape(data, fallback_url="", fallback_name=""):
    data = data if isinstance(data, dict) else {}
    technical_sheet = data.get("technical_sheet", {}) if isinstance(data.get("technical_sheet", {}), dict) else {}

    sheet_type = technical_sheet.get("type", "") or "none"
    if sheet_type not in {"inline", "pdf", "none"}:
        sheet_type = "none"

    image_urls = dedupe_strings(data.get("image_urls", []) or [])
    main_image_url = normalize_url(data.get("main_image_url", "") or "")

    if not main_image_url and image_urls:
        main_image_url = image_urls[0]

    if main_image_url and main_image_url not in image_urls:
        image_urls.insert(0, main_image_url)

    return {
        "url": data.get("url", "") or fallback_url,
        "name": data.get("name", "") or fallback_name,
        "subtitle": data.get("subtitle", "") or "",
        "main_image_url": main_image_url,
        "image_urls": image_urls,
        "categories": data.get("categories", []) or [],
        "tags": data.get("tags", []) or [],
        "description_text": data.get("description_text", "") or "",
        "bullet_points": data.get("bullet_points", []) or [],
        "technical_sheet": {
            "type": sheet_type,
            "pdf_url": normalize_url(technical_sheet.get("pdf_url", "") or ""),
            "content_text": technical_sheet.get("content_text", "") or "",
            "technical_specs": [
                {
                    "label": s.get("label", "") or "",
                    "unit": s.get("unit", "") or "",
                    "value": s.get("value", "") or "",
                }
                for s in (technical_sheet.get("technical_specs", []) or [])
                if isinstance(s, dict)
            ],
        },
        "related_products": [
            {
                "name": r.get("name", "") or "",
                "category_label": r.get("category_label", "") or "",
            }
            for r in (data.get("related_products", []) or [])
            if isinstance(r, dict)
        ],
    }


def load_checkpoint():
    """
    Lit l'index de départ dans le fichier de checkpoint.
    Si le fichier n'existe pas, retourne 0.
    """
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return int(data.get("start_index", 0))
        except Exception:
            return 0
    return 0


def save_checkpoint(next_start_index):
    """
    Sauvegarde l'index de départ pour le prochain run.
    """
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump({"start_index": next_start_index}, f, ensure_ascii=False, indent=2)


def main():
    client, sdk_mode = get_client(API_KEY)
    log(f"SDK détecté: {sdk_mode}")

    # 1) Récupérer tous les liens une seule fois
    links = collect_product_links()
    log(f"Total produits uniques: {len(links)}")

    # 2) Charger le checkpoint
    start_index = load_checkpoint()
    if start_index >= len(links):
        log(f"✅ Tous les produits ont déjà été traités (start_index={start_index}, total={len(links)}).")
        return

    # 3) Déterminer la fenêtre à traiter sur ce run
    end_index = min(start_index + BATCH_SIZE, len(links))
    batch_links = links[start_index:end_index]
    log(f"Traitement du batch {start_index + 1} → {end_index} (sur {len(links)})")

    # 4) Charger éventuellement le JSON existant pour l'enrichir
    existing_results = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                existing_results = json.load(f)
        except Exception as e:
            log(f"⚠️ Impossible de lire {OUTPUT_FILE}, on repart de zéro : {e}")
            existing_results = []

    # S'assurer que existing_results a la même taille que links,
    # en le remplissant de None pour les index manquants.
    if len(existing_results) < len(links):
        existing_results.extend([None] * (len(links) - len(existing_results)))

    # 5) Traiter uniquement le batch courant
    for local_i, product in enumerate(batch_links, 1):
        global_index = start_index + local_i - 1
        log(f"[{global_index + 1}/{len(links)}] Produit → {product['url']}")

        try:
            data = scrape_json(client, sdk_mode, product["url"], PRODUCT_SCHEMA, PRODUCT_PROMPT)
            item = ensure_shape(
                data if isinstance(data, dict) else {},
                product["url"],
                product.get("name", ""),
            )
            log("✅ ok")
        except Exception as e:
            log(f"❌ Product error: {e}")
            item = ensure_shape({}, product["url"], product.get("name", ""))

        # Stocker le résultat à la bonne position
        existing_results[global_index] = item

        time.sleep(DELAY_PRODUCT)

    # 6) Sauvegarder le JSON mis à jour (tous les résultats connus)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(existing_results, f, ensure_ascii=False, indent=2)

    # 7) Mettre à jour le checkpoint pour le prochain run
    save_checkpoint(end_index)
    log(f"✅ Batch terminé → {OUTPUT_FILE}")
    log(f"📌 Prochain run commencera à l'index {end_index + 1} (0-based {end_index})")


if __name__ == "__main__":
    main()

