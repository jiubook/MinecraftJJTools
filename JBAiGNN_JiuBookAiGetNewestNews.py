# -*- coding: utf-8 -*-
"""
Refactor notes:
- 可配置项已抽离到 config.json（默认同目录）。每次运行会自动读取。
- 支持用环境变量覆盖 API Key（默认读取 OPENAI_API_KEY；可在 config.json 中改 api_key_env）。
"""

import http.client
import requests
import json
import os
from datetime import datetime
import re
import urllib3
import base64
import hashlib
from urllib.parse import urljoin
from bs4 import BeautifulSoup, NavigableString, Tag


# -----------------------------
# Config
# -----------------------------

DEFAULT_CONFIG = {
    "openai_compat": {
        "host": "www.任意API网站.com",
        "endpoint": "/v1/chat/completions",
        "api_key_env": "OPENAI_API_KEY",
        "api_key": "",
        "model": "*******这里填写你要调用的Model名字******",
        "max_tokens": 10000,
        "timeout": 30
    },
    "prompts": {
        "translate_text_default": (
            "请将下面文本翻译成中文，并尽量保持原有格式（换行、项目符号、标点）。\n"
            "要求：\n"
            "- 保留版本号/编号（如 MC-12345）、URL、代码片段不被改写\n"
            "- 如包含 Markdown 链接 [text](url)，请保留链接结构，只翻译可见文字\n"
            "- 仅输出译文正文，不要额外解释"
        ),
        "translate_blocks_system": (
            "你是专业技术文档译者。请把用户提供的 JSON 数组逐条翻译成简体中文。\n"
            "输出要求（非常重要）：\n"
            "1) 只输出一个 JSON 数组，数组元素为 {\"id\":..., \"translated_text\":...}；不要输出任何额外文字。\n"
            "2) 必须保留并原样输出每个 id。\n"
            "3) 保留版本号/编号（如 MC-12345）、URL、代码片段、反引号包裹内容不改写。\n"
            "4) 如果原文包含 Markdown 链接 [text](url)，请保留链接结构，只翻译可见文字 text。\n"
            "5) 保留原有换行与列表语气，避免把多行合并成一行。"
        ),
        "translate_title_system": (
            "请将下面标题翻译成简体中文。要求：保留版本号/编号/专有名词的拼写，不要添加额外解释，只输出译文标题。"
        )
    },
    "minecraft_api": {
        "search_url": "https://net-secondary.web.minecraft-services.net/api/v1.0/zh-cn/search",
        "pageSize": 3,
        "sortType": "Recent",
        "category": "News",
        "site_base": "https://www.minecraft.net"
    },
    "http": {
        "verify_ssl": False,
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
    },
    "output": {
        "save_dir": "minecraft_news"
    }
}


def _deep_merge(a: dict, b: dict) -> dict:
    """Return merged dict (a <- b)."""
    out = dict(a)
    for k, v in (b or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def load_config(config_path: str = None) -> dict:
    """
    读取 config.json。默认路径：脚本同目录/config.json。
    """
    if config_path is None:
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

    cfg = dict(DEFAULT_CONFIG)
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                user_cfg = json.load(f)
            cfg = _deep_merge(cfg, user_cfg)
        except Exception as e:
            print(f"[Config] 读取失败，将使用默认配置：{config_path} -> {e}")

    # API Key：环境变量优先，其次 config.json 的 api_key
    env_name = cfg.get("openai_compat", {}).get("api_key_env", "OPENAI_API_KEY")
    env_key = os.getenv(env_name) if env_name else None
    if env_key:
        cfg["openai_compat"]["api_key"] = env_key

    return cfg


CFG = load_config()

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS_HTML = {
    "User-Agent": CFG["http"]["user_agent"],
    "Accept": CFG["http"]["accept"]
}


# -----------------------------
# Utils
# -----------------------------

def get_base64_from_image(image_url):
    try:
        resp = requests.get(image_url, timeout=10, verify=CFG["http"]["verify_ssl"])
        resp.raise_for_status()
        img_bytes = resp.content
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        ext = image_url.split('.')[-1].lower()
        mime = "jpeg" if ext in ["jpg", "jpeg"] else ext
        return f"data:image/{mime};base64,{b64}"
    except Exception as e:
        print(f"[图片 Base64 转换失败] {image_url} -> {e}")
        return None


# -----------------------------
# OpenAI-compatible translate
# -----------------------------

def translate_text(text, system_prompt=None):
    """
    调用兼容 OpenAI Chat Completions 接口的翻译函数（通过 config.json 配置）。
    返回：译文字符串（message.content）
    """
    system_prompt = system_prompt or CFG["prompts"]["translate_text_default"]

    host = CFG["openai_compat"]["host"]
    endpoint = CFG["openai_compat"]["endpoint"]
    api_key = CFG["openai_compat"]["api_key"]
    model = CFG["openai_compat"]["model"]
    max_tokens = int(CFG["openai_compat"].get("max_tokens", 10000))
    timeout = int(CFG["openai_compat"].get("timeout", 30))

    if not api_key or "********" in api_key:
        print("[Translate] 未配置 API Key。请在 config.json 填写 openai_compat.api_key 或设置环境变量。")
        return None

    if not host or "任意" in host:
        print("[Translate] 未配置 API Host。请在 config.json 填写 openai_compat.host。")
        return None

    if not model or "*******" in model:
        print("[Translate] 未配置 Model。请在 config.json 填写 openai_compat.model。")
        return None

    conn = http.client.HTTPSConnection(host, timeout=timeout)

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ],
        "max_tokens": max_tokens
    })

    conn.request("POST", endpoint, payload, headers)
    res = conn.getresponse()
    data = res.read().decode("utf-8")

    # 可选：调试输出
    print("返回原始结果:", data)

    try:
        result = json.loads(data)
    except json.JSONDecodeError as e:
        print("解析 JSON 失败！", e)
        return None

    try:
        content = result["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as e:
        print("返回结果结构与预期不符！", e)
        return None

    return content


# -----------------------------
# Minecraft news fetch
# -----------------------------

def get_latest_news_via_api():
    """通过官方 API 获取最新新闻列表，并返回第一个新闻的详细信息 URL 和 meta"""
    api_url = CFG["minecraft_api"]["search_url"]
    params = {
        "pageSize": CFG["minecraft_api"]["pageSize"],
        "sortType": CFG["minecraft_api"]["sortType"],
        "category": CFG["minecraft_api"]["category"]
    }

    try:
        response = requests.get(
            api_url, params=params, headers=HEADERS_HTML,
            timeout=10, verify=CFG["http"]["verify_ssl"]
        )
        print("API Response Code:", response.status_code)
        response.raise_for_status()

        result = response.json()
        items = result.get("result", {}).get("results", [])
        if not items:
            print("API 中未返回任何新闻条目")
            return None
        #***************************
        # 最新一个新闻项为0，第二个为1
        #***************************
        latest = items[0]

        news_url = latest.get("url")
        if news_url and news_url.startswith("/"):
            news_url = CFG["minecraft_api"]["site_base"] + news_url

        return {
            "title": latest.get("title"),
            "author": latest.get("author"),
            "imageAltText": latest.get("imageAltText"),
            "description": latest.get("description"),
            "release_date": latest.get("publishDate"),
            "url": news_url
        }

    except Exception as e:
        print("获取 API 新闻时出错:", e)
        return None


def _normalize_whitespace(s: str) -> str:
    s = re.sub(r"\s+", " ", s or "")
    return s.strip()


def _extract_text_preserve_links(tag: Tag, base_url: str = "") -> str:
    """提取可翻译文本：尽量保留换行与链接 href（转成 Markdown 链接）。"""
    parts = []

    def walk(node):
        if isinstance(node, NavigableString):
            txt = str(node)
            if txt:
                parts.append(txt)
            return

        if not isinstance(node, Tag):
            return

        name = (node.name or "").lower()

        if name == "br":
            parts.append("\n")
            return

        if name == "a":
            href = node.get("href", "").strip()
            href = urljoin(base_url, href) if base_url else href
            visible = _normalize_whitespace(node.get_text(" ", strip=True))
            if href and visible:
                parts.append(f"[{visible}]({href})")
            elif visible:
                parts.append(visible)
            return

        if name in ("code", "kbd", "samp"):
            txt = _normalize_whitespace(node.get_text(" ", strip=True))
            if txt:
                parts.append(f"`{txt}`")
            return

        for ch in node.children:
            walk(ch)

        if name in ("p", "li", "blockquote"):
            parts.append("\n")

    walk(tag)

    raw = "".join(parts)
    raw = "\n".join([_normalize_whitespace(line) for line in raw.split("\n")])
    raw = re.sub(r"\n{3,}", "\n\n", raw).strip()
    return raw


def extract_blocks_in_order(container: Tag, blocks: list, base_url: str = ""):
    """从一个容器中按顺序抽取结构化 blocks（p/h2/li/img/...）。"""
    if not container:
        return

    def add_text_block(block_type: str, source_text: str, meta=None):
        source_text = (source_text or "").strip()
        if not source_text:
            return
        block_id = f"b{len(blocks)+1:04d}"
        blocks.append({
            "id": block_id,
            "type": block_type,
            "source_text": source_text,
            "translated_text": "",
            "meta": meta or {}
        })

    def add_img_block(src: str, alt: str = "", meta=None):
        src = (src or "").strip()
        if not src:
            return
        src = urljoin(base_url, src) if base_url else src
        block_id = f"b{len(blocks)+1:04d}"
        m = {"src": src, "alt": alt or ""}
        if meta:
            m.update(meta)
        blocks.append({
            "id": block_id,
            "type": "img",
            "source_text": "",
            "translated_text": "",
            "meta": m
        })

    def walk(node):
        if isinstance(node, NavigableString):
            txt = _normalize_whitespace(str(node))
            if txt:
                add_text_block("text", txt)
            return

        if not isinstance(node, Tag):
            return

        name = (node.name or "").lower()

        if name == "img":
            add_img_block(node.get("src"), node.get("alt", ""))
            return

        if name in ("ul", "ol"):
            for li in node.find_all("li", recursive=False):
                li_txt = _extract_text_preserve_links(li, base_url=base_url)
                add_text_block("li", li_txt)
            return

        if name in ("h1", "h2", "h3", "h4"):
            add_text_block(name, _extract_text_preserve_links(node, base_url=base_url))
            return

        if name in ("p", "blockquote"):
            add_text_block(name, _extract_text_preserve_links(node, base_url=base_url))
            return

        if name in ("pre",):
            txt = node.get_text("\n", strip=True).strip()
            if txt:
                add_text_block("pre", txt)
            return

        for ch in node.children:
            walk(ch)

    for child in container.children:
        walk(child)


def parse_article_page(article_url):
    if not article_url:
        print("文章 URL 为空")
        return None

    try:
        response = requests.get(
            article_url, headers=HEADERS_HTML, timeout=10,
            verify=CFG["http"]["verify_ssl"]
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        title_tag = soup.find("h1")
        title = title_tag.get_text(strip=True) if title_tag else ""

        date_tag = soup.find("meta", {"property": "article:published_time"})
        date = date_tag["content"] if date_tag else ""

        blocks = []
        seen_containers = set()

        def _container_sig(tag):
            if not tag:
                return None
            txt = tag.get_text("\n", strip=True)
            txt = re.sub(r"\s+", " ", txt or "").strip()
            if not txt:
                return None
            return hashlib.sha1(txt.encode("utf-8")).hexdigest()

        candidates = []
        intro = soup.find("div", class_="article-text")
        if intro:
            candidates.append(intro)
        candidates.extend(soup.find_all("div", class_="article-section"))

        for c in candidates:
            sig = _container_sig(c)
            if sig and sig in seen_containers:
                continue
            if sig:
                seen_containers.add(sig)
            extract_blocks_in_order(c, blocks, base_url=article_url)

        deduped = []
        prev_key = None
        for b in blocks:
            key = (
                b.get("type"),
                (b.get("source_text") or "").strip(),
                json.dumps(b.get("meta") or {}, sort_keys=True, ensure_ascii=False),
            )
            if key == prev_key:
                continue
            deduped.append(b)
            prev_key = key
        blocks = deduped

        return {
            "title": title,
            "release_date": date,
            "blocks": blocks
        }

    except Exception as e:
        print("解析文章页面失败:", e)
        return None


def _chunk_items_for_translation(items, max_chars=6000, max_items=30):
    batches = []
    cur = []
    cur_len = 0
    for it in items:
        s = json.dumps(it, ensure_ascii=False)
        if cur and (len(cur) >= max_items or cur_len + len(s) > max_chars):
            batches.append(cur)
            cur = []
            cur_len = 0
        cur.append(it)
        cur_len += len(s)
    if cur:
        batches.append(cur)
    return batches


def translate_blocks(blocks: list) -> list:
    if not blocks:
        return blocks

    items = []
    for b in blocks:
        if b.get("type") == "img":
            continue
        src = (b.get("source_text") or "").strip()
        if not src:
            continue
        items.append({"id": b.get("id"), "text": src})

    if not items:
        return blocks

    system_prompt = CFG["prompts"]["translate_blocks_system"]
    id_to_translation = {}

    for batch in _chunk_items_for_translation(items):
        batch_json = json.dumps(batch, ensure_ascii=False, indent=0)
        translated = translate_text(batch_json, system_prompt=system_prompt)
        if not translated:
            continue

        parsed = None
        try:
            parsed = json.loads(translated)
        except Exception:
            cleaned = translated.strip()
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            try:
                parsed = json.loads(cleaned)
            except Exception:
                parsed = None

        if isinstance(parsed, list):
            for obj in parsed:
                if isinstance(obj, dict) and "id" in obj and "translated_text" in obj:
                    id_to_translation[str(obj["id"])] = str(obj["translated_text"])
        else:
            lines = [ln.strip() for ln in translated.splitlines() if ln.strip()]
            for it, ln in zip(batch, lines):
                id_to_translation[str(it["id"])] = ln

    for b in blocks:
        bid = str(b.get("id"))
        if bid in id_to_translation:
            b["translated_text"] = id_to_translation[bid]

    return blocks


def blocks_to_plaintext(blocks: list, field: str = "source_text") -> str:
    out = []
    for b in blocks or []:
        t = b.get("type")
        if t == "img":
            meta = b.get("meta") or {}
            src = meta.get("src", "")
            alt = meta.get("alt", "")
            if src:
                out.append(f"[IMAGE:{alt}]({src})" if alt else f"[IMAGE]({src})")
            continue
        txt = (b.get(field) or "").strip()
        if not txt:
            continue
        out.append(txt)
    return "\n\n".join(out).strip()


def save_to_json(data):
    if not data:
        print("无内容可保存")
        return False

    title = data["title"]
    release_date = data["release_date"]

    try:
        if 'T' in release_date:
            date_part, time_part = release_date.split('T')
            time_part = time_part.replace(':', '_').replace('Z', '')
            timestamp = f"{date_part}_{time_part}"
        else:
            timestamp = release_date.replace(':', '_').replace(' ', '_')
    except Exception:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    title = title.replace(' ', '_')
    for char in ['\\', '/', ':', '*', '?', '"', '<', '>', '|']:
        title = title.replace(char, '_')
    title = re.sub(r'_+', '_', title).strip('_')
    timestamp = re.sub(r'_+', '_', timestamp).strip('_')

    save_dir = CFG["output"]["save_dir"]
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, f"news_{title}_{timestamp}.json")

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("保存成功:", file_path)
        return True
    except Exception as e:
        print("保存文件失败:", e)
        return False


def check_for_updates(news_info):
    local_news_folder = CFG["output"]["save_dir"]
    if not os.path.isdir(local_news_folder):
        return False

    for filename in os.listdir(local_news_folder):
        if filename.endswith(".json"):
            try:
                with open(os.path.join(local_news_folder, filename), 'r', encoding='utf-8') as f:
                    local_data = json.load(f)
                if local_data.get("title") == news_info["title"]:
                    print("暂无新闻更新")
                    return True
            except Exception:
                continue
    return False


def main():
    print("开始通过 API 获取 Minecraft 最新新闻...\n")
    news_info = get_latest_news_via_api()
    if not news_info:
        print("无法通过 API 获取新闻")
        return

    print("API 获取到新闻 Meta:", news_info)

    if check_for_updates(news_info):
        return

    article_data = parse_article_page(news_info["url"])
    if not article_data:
        print("无法解析文章详情页")
        return

    title_to_translate = article_data["title"] or news_info["title"]
    translated_title = translate_text(
        title_to_translate,
        system_prompt=CFG["prompts"]["translate_title_system"]
    ) or ""

    blocks = article_data.get("blocks", [])
    translate_blocks(blocks)

    source_content = blocks_to_plaintext(blocks, field="source_text")
    translated_content = blocks_to_plaintext(blocks, field="translated_text")

    full_data = {
        "title": title_to_translate,
        "translated_title": translated_title,
        "release_date": article_data.get("release_date") or news_info.get("release_date", ""),
        "url": news_info.get("url", ""),
        "author": news_info.get("author", ""),
        "imageAltText": news_info.get("imageAltText", ""),
        "description": news_info.get("description", ""),
        "blocks": blocks,
        "content": source_content,
        "translated_content": translated_content
    }

    save_to_json(full_data)
    print("\n任务完成！")


if __name__ == "__main__":
    main()
