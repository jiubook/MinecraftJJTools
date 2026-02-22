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

def get_base64_from_image(image_url):
    try:
        resp = requests.get(image_url, timeout=10)
        resp.raise_for_status()
        img_bytes = resp.content
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        # 根据 URL 后缀设置 MIME 类型
        ext = image_url.split('.')[-1].lower()
        mime = "jpeg" if ext in ["jpg", "jpeg"] else ext
        return f"data:image/{mime};base64,{b64}"
    except Exception as e:
        print(f"[图片 Base64 转换失败] {image_url} -> {e}")
        return None

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def translate_text(text, system_prompt="请将下面文本翻译成中文，并尽量保持原有格式（换行、项目符号、标点）。\n要求：\n- 保留版本号/编号（如 MC-12345）、URL、代码片段不被改写\n- 如包含 Markdown 链接 [text](url)，请保留链接结构，只翻译可见文字\n- 仅输出译文正文，不要额外解释"):
    """调用兼容 OpenAI Chat Completions 接口的翻译函数。
    - text: 需要翻译的文本（或批量翻译的 JSON 字符串）
    - system_prompt: 翻译规则/约束
    返回：译文字符串（接口返回的 message.content）
    """
    conn = http.client.HTTPSConnection("www.任意API网站.com")
    #**********************
    # 这里填写你的Api网址
    #**********************
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer sk-********这里填写你的api Key*********",
        #**********************
        # 这里填写你的api Key
        #**********************
        "Content-Type": "application/json"
    }

    payload = json.dumps({
        "model": "*******这里填写你要调用的Model名字******",
        #***********************
        # 这里填写你要用的Model
        #***********************
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ],
        "max_tokens": 10000
    })

    conn.request("POST", "/v1/chat/completions", payload, headers)
    #***********************
    # 这里填写你的Model的实际调用后缀
    #***********************
    res = conn.getresponse()

    data = res.read().decode("utf-8")

    # 打印看看返回内容（可选）
    print("返回原始结果:", data)

    # 解析 JSON
    try:
        result = json.loads(data)
    except json.JSONDecodeError as e:
        print("解析 JSON 失败！", e)
        return None

    # 提取 content
    try:
        content = result["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as e:
        print("返回结果结构与预期不符！", e)
        return None

    return content

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
}

def get_latest_news_via_api():
    """通过官方 API 获取最新新闻列表，并返回第一个新闻的详细信息 URL 和 meta"""
    api_url = "https://net-secondary.web.minecraft-services.net/api/v1.0/zh-cn/search"
    params = {
        "pageSize": 3,
        "sortType": "Recent",
        "category": "News"
    }

    try:
        response = requests.get(api_url, params=params, headers=headers, timeout=10, verify=False)
        print("API Response Code:", response.status_code)
        response.raise_for_status()

        result = response.json()
        # result["data"] 结构示例：
        # { "result": { "results": [ ... ] } }
        items = result.get("result", {}).get("results", [])
        if not items:
            print("API 中未返回任何新闻条目")
            return None
        
        #***************************
        # 最新一个新闻项为0，第二个为1
        #***************************
        latest = items[0]

        # 新闻详情页 URL
        news_url = latest.get("url")
        if news_url and news_url.startswith("/"):
            news_url = "https://www.minecraft.net" + news_url

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

        # 默认：继续递归
        for ch in node.children:
            walk(ch)

        # 段落/列表项等结束时补一个换行，方便保持结构
        if name in ("p", "li", "blockquote"):
            parts.append("\n")

    walk(tag)

    # 合并并清理：保留 \n，但压缩多余空格
    raw = "".join(parts)
    # 先把连续空格压缩（不跨行）
    raw = "\n".join([_normalize_whitespace(line) for line in raw.split("\n")])
    # 移除多余空行
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
            # 纯文本节点通常是排版空白或零散文本：尝试收集，但避免碎片化
            txt = _normalize_whitespace(str(node))
            if txt:
                add_text_block("text", txt)
            return

        if not isinstance(node, Tag):
            return

        name = (node.name or "").lower()

        # 图片
        if name == "img":
            add_img_block(node.get("src"), node.get("alt", ""))
            return

        # 列表：li 作为独立块
        if name in ("ul", "ol"):
            for li in node.find_all("li", recursive=False):
                li_txt = _extract_text_preserve_links(li, base_url=base_url)
                add_text_block("li", li_txt)
            return

        # 常见块级：标题/段落/引用/代码块
        if name in ("h1", "h2", "h3", "h4"):
            add_text_block(name, _extract_text_preserve_links(node, base_url=base_url))
            return

        if name in ("p", "blockquote"):
            add_text_block(name, _extract_text_preserve_links(node, base_url=base_url))
            return

        if name in ("pre",):
            # pre 里可能包含 code；尽量原样
            txt = node.get_text("\n", strip=True)
            txt = txt.strip()
            if txt:
                add_text_block("pre", txt)
            return

        # 其他容器：继续往下找块级元素
        for ch in node.children:
            walk(ch)

    for child in container.children:
        walk(child)

def parse_article_page(article_url):
    if not article_url:
        print("文章 URL 为空")
        return None

    try:
        response = requests.get(article_url, headers=headers, timeout=10, verify=False)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # 标题
        title_tag = soup.find("h1")
        title = title_tag.get_text(strip=True) if title_tag else ""

        # 发布日期
        date_tag = soup.find("meta", {"property": "article:published_time"})
        date = date_tag["content"] if date_tag else ""

        blocks = []

        # 文章页面有时会在不同容器中“重复渲染”一份相同正文（例如桌面/移动端各一份或隐藏备份 DOM），
        # 这里对容器做一次签名去重，避免 blocks 里出现整篇文章重复两遍。
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

        # 1) <div class="article-text"> 常是引言/第一段
        intro = soup.find("div", class_="article-text")
        if intro:
            candidates.append(intro)

        # 2) <div class="article-section"> 正文分段
        candidates.extend(soup.find_all("div", class_="article-section"))

        for c in candidates:
            sig = _container_sig(c)
            if sig and sig in seen_containers:
                continue
            if sig:
                seen_containers.add(sig)
            extract_blocks_in_order(c, blocks, base_url=article_url)

        # 额外保险：去掉“相邻的完全重复块”（同类型 + 同文本 + 同 meta）
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
    """把待翻译条目按字符数/条目数分批，减少单次请求太大。"""
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
    """按 block 翻译：对非 img 且 source_text 非空的块进行翻译，结果写回 translated_text。"""
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

    system_prompt = (
        "你是专业技术文档译者。请把用户提供的 JSON 数组逐条翻译成简体中文。\n"
        "输出要求（非常重要）：\n"
        "1) 只输出一个 JSON 数组，数组元素为 {\"id\":..., \"translated_text\":...}；不要输出任何额外文字。\n"
        "2) 必须保留并原样输出每个 id。\n"
        "3) 保留版本号/编号（如 MC-12345）、URL、代码片段、反引号包裹内容不改写。\n"
        "4) 如果原文包含 Markdown 链接 [text](url)，请保留链接结构，只翻译可见文字 text。\n"
        "5) 保留原有换行与列表语气，避免把多行合并成一行。"
    )

    id_to_translation = {}

    for batch in _chunk_items_for_translation(items):
        batch_json = json.dumps(batch, ensure_ascii=False, indent=0)
        translated = translate_text(batch_json, system_prompt=system_prompt)
        if not translated:
            continue

        # 尝试解析模型返回的 JSON
        parsed = None
        try:
            parsed = json.loads(translated)
        except Exception:
            # 容错：有时会包裹 ```json ... ```
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
            # 最后兜底：按顺序一行一条（不推荐，但避免完全不可用）
            lines = [ln.strip() for ln in translated.splitlines() if ln.strip()]
            for it, ln in zip(batch, lines):
                id_to_translation[str(it["id"])] = ln

    # 写回 blocks
    for b in blocks:
        bid = str(b.get("id"))
        if bid in id_to_translation:
            b["translated_text"] = id_to_translation[bid]

    return blocks

def blocks_to_plaintext(blocks: list, field: str = "source_text") -> str:
    """把 blocks 拼成纯文本（方便兼容旧渲染/调试）。"""
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
    """将最终结果保存为 JSON 文件"""
    if not data:
        print("无内容可保存")
        return False

    title = data["title"]
    release_date = data["release_date"]
    # 将release_date格式化为适合文件名的格式
    # 移除时间部分的冒号，并将T替换为下划线
    try:
        # 如果是ISO 8601格式，例如"2026-02-20T17:00:56Z"
        if 'T' in release_date:
            # 分离日期和时间部分
            date_part, time_part = release_date.split('T')
            # 移除时间中的秒和Z，并将冒号替换为下划线
            time_part = time_part.replace(':', '_').replace('Z', '')
            timestamp = f"{date_part}_{time_part}"
        else:
            # 如果不是标准格式，直接使用并移除可能的非法字符
            timestamp = release_date.replace(':', '_').replace(' ', '_')
    except:
        # 如果格式化失败，使用当前时间戳作为备选
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 清理标题：将空格替换为下划线，并移除其他非法字符
    # 1. 首先将空格替换为下划线
    title = title.replace(' ', '_')

    # 2. 然后替换其他Windows文件名中的非法字符
    illegal_chars = ['\\', '/', ':', '*', '?', '"', '<', '>', '|']
    for char in illegal_chars:
        title = title.replace(char, '_')

    # 3. 使用正则表达式将多个连续的下划线合并为一个
    title = re.sub(r'_+', '_', title)
    timestamp = re.sub(r'_+', '_', timestamp)

    # 4. 移除开头和结尾的下划线
    title = title.strip('_')
    timestamp = timestamp.strip('_')

    save_dir = "minecraft_news"
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
    # 获取本地文件夹中的所有文件
    local_news_folder = './minecraft_news'
    for filename in os.listdir(local_news_folder):
        if filename.endswith(".json"):  # 只处理 .json 文件
            with open(os.path.join(local_news_folder, filename), 'r', encoding='utf-8') as f:
                local_data = json.load(f)
                # 比较本地文件中的标题和最新新闻标题
                if local_data.get("title") == news_info["title"]:
                    print("暂无新闻更新")
                    return True  # 找到相同的标题，认为没有更新
    return False  # 没有找到相同的标题，表示有新新闻

def main():
    print("开始通过 API 获取 Minecraft 最新新闻...\n")

    news_info = get_latest_news_via_api()
    if not news_info:
        print("无法通过 API 获取新闻")
        return

    print("API 获取到新闻 Meta:", news_info)

    # 清理新闻标题，确保文件名一致
    title = news_info["title"].replace(' ', '_')
    title = re.sub(r'[\\/*?:"<>|]', "_", title)  # 替换非法字符
    title = title.strip('_')

    # 检查是否有新新闻
    if check_for_updates(news_info):
        return  # 如果没有更新，直接返回

    # 访问详情页提取结构化 blocks
    article_data = parse_article_page(news_info["url"])
    if not article_data:
        print("无法解析文章详情页")
        return

    # 翻译标题
    title_to_translate = article_data["title"] or news_info["title"]
    translated_title = translate_text(
        title_to_translate,
        system_prompt="请将下面标题翻译成简体中文。要求：保留版本号/编号/专有名词的拼写，不要添加额外解释，只输出译文标题。"
    ) or ""

    # 翻译 blocks
    blocks = article_data.get("blocks", [])
    translate_blocks(blocks)

    # 兼容：拼回纯文本（可选，用于旧逻辑/调试）
    source_content = blocks_to_plaintext(blocks, field="source_text")
    translated_content = blocks_to_plaintext(blocks, field="translated_text")

    # 新 JSON schema：以 blocks 为主
    full_data = {
        "title": title_to_translate,
        "translated_title": translated_title,
        "release_date": article_data.get("release_date") or news_info.get("release_date", ""),
        "url": news_info.get("url", ""),
        "author": news_info.get("author", ""),
        "imageAltText": news_info.get("imageAltText", ""),
        "description": news_info.get("description", ""),
        "blocks": blocks,

        # （可选）保留旧字段，方便你还没改渲染器时继续使用
        "content": source_content,
        "translated_content": translated_content
    }

    save_to_json(full_data)
    print("\n任务完成！")

if __name__ == "__main__":
    main()
