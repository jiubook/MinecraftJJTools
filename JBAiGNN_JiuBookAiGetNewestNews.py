# -*- coding: utf-8 -*-
"""
Minecraft 新闻翻译工具

功能：
    - 从 Minecraft 官方网站获取最新新闻
    - 解析文章页面，提取结构化内容
    - 调用 AI 翻译 API 进行中文翻译
    - 保存为 JSON 格式

配置：
    - 所有配置项已抽离到 config.json（默认位于脚本同目录）
    - 支持通过环境变量覆盖 API Key
    - 详细配置说明请参考 config.json

使用方法：
    python JBAiGNN_JiuBookAiGetNewestNews.py

作者：JiuBook AI
版本：008
"""

import http.client
import requests
import json
import os
from datetime import datetime
import re
import urllib3
import hashlib
from urllib.parse import urljoin
from bs4 import BeautifulSoup, NavigableString, Tag
import time

# 禁用 SSL 警告（如果配置中关闭了 SSL 验证）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


# =============================================================================
# 默认配置
# =============================================================================
# 如果 config.json 不存在或某些配置项缺失，将使用以下默认值

DEFAULT_CONFIG = {
    # OpenAI 兼容 API 配置
    "openai_compat": {
        "host": "www.任意API网站.com",           # API 主机地址（不含 https://）
        "endpoint": "/v1/chat/completions",     # API 端点路径
        "api_key_env": "OPENAI_API_KEY",        # 环境变量名（用于读取 API Key）
        "api_key": "",                          # API 密钥（环境变量优先）
        "model": "*******这里填写你要调用的Model名字******",  # 模型名称
        "max_tokens": 10000,                    # 最大生成 token 数
        "timeout": 120                          # 请求超时时间（秒）
    },

    # 翻译提示词配置
    "prompts": {
        # 默认翻译提示词
        "translate_text_default": (
            "你是专业的 Minecraft 游戏翻译。请将下面文本翻译成简体中文。\n"
            "翻译规则（非常重要）：\n"
            "1. 使用 Minecraft 官方中文译名（Java版）。\n"
            "2. 不要直译游戏术语。\n"
            "要求：\n"
            "- 保留版本号/编号（如 MC-12345）、URL、代码片段、反引号内容不被改写\n"
            "- 如包含 Markdown 链接 [text](url)，请只翻译 visible text\n"
            "- 仅输出译文，不要解释"
        ),
        # 批量翻译提示词
        "translate_blocks_system": (
            "你是 Minecraft 官方更新日志翻译专家，请把用户提供的 JSON 数组逐条翻译成简体中文。保持游戏特有的语气，专业且简洁。\n"
            "翻译规则（非常重要）：\n"
            "1. 使用 Minecraft 官方中文译名（Java版）。\n"
            "2. 不要直译游戏术语。\n"
            "输出要求：\n"
            "1. 只输出 JSON 数组\n"
            "2. 每项格式：{\"id\":..., \"translated_text\":...}\n"
            "3. 不要输出任何解释\n"
            "4. 保留 URL / MC-编号 / 代码\n"
            "5. 保留换行\n"
        ),
        # 标题翻译提示词
        "translate_title_system": (
            "请将 Minecraft 新闻标题翻译成简体中文。要求：保留版本号/编号/专有名词的拼写，不要添加额外解释，只输出译文标题。"
        )
    },

    # Minecraft API 配置
    "minecraft_api": {
        "search_url": "https://net-secondary.web.minecraft-services.net/api/v1.0/zh-cn/search",
        "pageSize": 3,                          # 获取的新闻数量
        "sortType": "Recent",                   # 排序方式
        "category": "News",                     # 分类
        "site_base": "https://www.minecraft.net"  # 网站基础 URL
    },

    # HTTP 请求配置
    "http": {
        "verify_ssl": False,                    # 是否验证 SSL 证书
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "proxies": {
            "http": "",                         # HTTP 代理（留空表示不使用）
            "https": ""                         # HTTPS 代理（留空表示不使用）
        }
    },

    # 输出配置
    "output": {
        "save_dir": "minecraft_news"            # 保存目录
    }
}


def _deep_merge(a: dict, b: dict) -> dict:
    """
    深度合并两个字典

    将字典 b 的内容合并到字典 a 中。对于嵌套的字典，会递归合并；
    对于其他类型的值，b 中的值会覆盖 a 中的值。

    Args:
        a: 基础字典
        b: 要合并的字典，其值会覆盖 a 中的同名键

    Returns:
        合并后的新字典（不修改原字典）
    """
    if not b:
        return dict(a)

    result = dict(a)
    for key, value in b.items():
        # 如果两边都是字典，递归合并
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = _deep_merge(result[key], value)
        else:
            # 否则直接覆盖
            result[key] = value
    return result


def load_config(config_path: str = None) -> dict:
    """
    加载配置文件

    从 JSON 文件中读取配置，并与默认配置合并。
    支持通过环境变量覆盖 API Key。

    Args:
        config_path: 配置文件路径，默认为脚本同目录下的 config.json

    Returns:
        合并后的配置字典

    配置优先级：
        1. 环境变量中的 API Key（最高优先级）
        2. config.json 中的配置
        3. DEFAULT_CONFIG 中的默认配置（最低优先级）
    """
    # 确定配置文件路径
    if config_path is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(script_dir, "config.json")

    # 从默认配置开始
    config = dict(DEFAULT_CONFIG)

    # 尝试加载用户配置文件
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                user_config = json.load(f)
            config = _deep_merge(config, user_config)
            print(f"[配置] 已加载配置文件: {config_path}")
        except json.JSONDecodeError as e:
            print(f"[配置] JSON 解析失败，使用默认配置: {config_path} -> {e}")
        except IOError as e:
            print(f"[配置] 文件读取失败，使用默认配置: {config_path} -> {e}")
    else:
        print(f"[配置] 配置文件不存在，使用默认配置: {config_path}")

    # 环境变量覆盖 API Key（优先级最高）
    env_var_name = config.get("openai_compat", {}).get("api_key_env", "OPENAI_API_KEY")
    if env_var_name:
        env_api_key = os.getenv(env_var_name)
        if env_api_key:
            config["openai_compat"]["api_key"] = env_api_key
            print(f"[配置] 已从环境变量 {env_var_name} 读取 API Key")

    return config


# =============================================================================
# 配置加载和初始化
# =============================================================================

# 加载配置文件
CFG = load_config()

# 处理代理配置：如果所有代理值都为空，则设为 None
PROXIES = CFG["http"].get("proxies")
if PROXIES and not any(PROXIES.values()):
    PROXIES = None

# 构建 HTML 请求头
HEADERS_HTML = {
    "User-Agent": CFG["http"]["user_agent"],
    "Accept": CFG["http"]["accept"]
}


# =============================================================================
# 工具函数
# =============================================================================

# =============================================================================
# 翻译功能
# =============================================================================

def translate_text(text, system_prompt=None):
    """
    调用 OpenAI 兼容的 API 进行文本翻译

    通过配置文件中指定的 API 端点进行翻译。
    支持任何兼容 OpenAI Chat Completions 格式的 API。

    Args:
        text: 待翻译的文本
        system_prompt: 系统提示词，默认使用配置文件中的翻译提示词

    Returns:
        str: 翻译后的文本，失败时返回 None

    配置要求：
        - openai_compat.host: API 主机地址
        - openai_compat.endpoint: API 端点路径
        - openai_compat.api_key: API 密钥
        - openai_compat.model: 模型名称
    """
    print(f"[翻译] 正在翻译: {text[:50]}...")

    # 获取配置
    system_prompt = system_prompt or CFG["prompts"]["translate_text_default"]
    host = CFG["openai_compat"]["host"]
    endpoint = CFG["openai_compat"]["endpoint"]
    api_key = CFG["openai_compat"]["api_key"]
    model = CFG["openai_compat"]["model"]
    max_tokens = int(CFG["openai_compat"].get("max_tokens", 10000))
    timeout = int(CFG["openai_compat"].get("timeout", 120))
    verify_ssl = CFG["http"]["verify_ssl"]

    # 验证必要的配置项
    if not api_key or "********" in api_key:
        print("[翻译] 错误: 未配置 API Key")
        print("       请在 config.json 中设置 openai_compat.api_key")
        print("       或设置环境变量（默认为 OPENAI_API_KEY）")
        return None

    if not host or "任意" in host:
        print("[翻译] 错误: 未配置 API Host")
        print("       请在 config.json 中设置 openai_compat.host")
        return None

    if not model or "*******" in model:
        print("[翻译] 错误: 未配置 Model")
        print("       请在 config.json 中设置 openai_compat.model")
        return None

    # 构建 API 请求
    api_url = f"https://{host}{endpoint}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ],
        "max_tokens": max_tokens
    }

    # 发送请求
    try:
        print(f"[翻译] 请求超时设置: {timeout}秒")
        response = requests.post(
            api_url,
            json=payload,
            headers=headers,
            timeout=timeout,
            verify=verify_ssl,
            proxies=PROXIES
        )
        response.raise_for_status()

        # 解析响应
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        print(f"[翻译] 成功: {content[:50]}...")
        return content

    except requests.exceptions.Timeout:
        print(f"[翻译] 请求超时（{timeout}秒）")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"[翻译] 连接失败: {e}")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"[翻译] HTTP 错误: {e}")
        if hasattr(response, 'text'):
            print(f"[翻译] 响应内容: {response.text[:200]}")
        return None
    except (KeyError, IndexError) as e:
        print(f"[翻译] 响应格式错误: {e}")
        if 'response' in locals():
            print(f"[翻译] 原始响应: {response.text[:200]}")
        return None
    except json.JSONDecodeError as e:
        print(f"[翻译] JSON 解析失败: {e}")
        if 'response' in locals():
            print(f"[翻译] 原始响应: {response.text[:200]}")
        return None


# =============================================================================
# 新闻获取和解析
# =============================================================================

def get_latest_news_via_api():
    """
    通过 Minecraft 官方 API 获取最新新闻列表

    从 Minecraft 官方搜索 API 获取指定数量的最新新闻。
    新闻按发布时间倒序排列。

    Returns:
        list: 新闻列表，每个元素包含以下字段：
            - title: 标题
            - author: 作者
            - imageAltText: 图片替代文本
            - description: 描述
            - release_date: 发布日期
            - url: 新闻链接
        失败时返回空列表
    """
    api_url = CFG["minecraft_api"]["search_url"]
    params = {
        "pageSize": CFG["minecraft_api"]["pageSize"],
        "sortType": CFG["minecraft_api"]["sortType"],
        "category": CFG["minecraft_api"]["category"]
    }

    try:
        print(f"[API] 正在获取新闻列表...")
        response = requests.get(
            api_url,
            params=params,
            headers=HEADERS_HTML,
            timeout=120,
            verify=CFG["http"]["verify_ssl"],
            proxies=PROXIES
        )
        print(f"[API] 响应状态码: {response.status_code}")
        response.raise_for_status()

        # 解析响应
        result = response.json()
        items = result.get("result", {}).get("results", [])

        if not items:
            print("[API] 未返回任何新闻条目")
            return []

        # 构建新闻列表
        news_list = []
        site_base = CFG["minecraft_api"]["site_base"]
        for item in items:
            news_url = item.get("url", "")
            # 补全相对路径
            if news_url and news_url.startswith("/"):
                news_url = site_base + news_url

            news_list.append({
                "title": item.get("title", ""),
                "author": item.get("author", ""),
                "imageAltText": item.get("imageAltText", ""),
                "description": item.get("description", ""),
                "release_date": item.get("publishDate", ""),
                "url": news_url
            })

        print(f"[API] 成功获取 {len(news_list)} 条新闻")
        return news_list

    except requests.exceptions.Timeout:
        print("[API] 请求超时")
        return []
    except requests.exceptions.ConnectionError as e:
        print(f"[API] 连接失败: {e}")
        return []
    except requests.exceptions.HTTPError as e:
        print(f"[API] HTTP 错误: {e}")
        return []
    except (KeyError, json.JSONDecodeError) as e:
        print(f"[API] 响应解析失败: {e}")
        return []


def _normalize_whitespace(s: str) -> str:
    """
    标准化字符串中的空白字符

    将连续的空白字符（空格、制表符、换行符等）替换为单个空格，
    并去除首尾空白。

    Args:
        s: 待处理的字符串

    Returns:
        处理后的字符串，如果输入为 None 则返回空字符串
    """
    if not s:
        return ""
    return re.sub(r"\s+", " ", s).strip()


def _extract_text_preserve_links(tag: Tag, base_url: str = "") -> str:
    """
    从 HTML 标签中提取文本，保留链接和换行

    递归遍历 HTML 标签树，提取可翻译的文本内容。
    特殊处理：
    - <a> 标签转换为 Markdown 链接格式 [text](url)
    - <br> 标签转换为换行符
    - <code>, <kbd>, <samp> 标签内容用反引号包裹
    - <p>, <li>, <blockquote> 标签后添加换行

    Args:
        tag: BeautifulSoup 标签对象
        base_url: 基础 URL，用于补全相对链接

    Returns:
        提取并格式化后的文本
    """
    parts = []

    def walk(node):
        """递归遍历节点树"""
        # 处理文本节点
        if isinstance(node, NavigableString):
            text = str(node)
            if text:
                parts.append(text)
            return

        if not isinstance(node, Tag):
            return

        tag_name = (node.name or "").lower()

        # 换行标签
        if tag_name == "br":
            parts.append("\n")
            return

        # 链接标签：转换为 Markdown 格式
        if tag_name == "a":
            href = node.get("href", "").strip()
            # 补全相对链接
            href = urljoin(base_url, href) if base_url else href
            visible_text = _normalize_whitespace(node.get_text(" ", strip=True))

            if href and visible_text:
                parts.append(f"[{visible_text}]({href})")
            elif visible_text:
                parts.append(visible_text)
            return

        # 代码标签：用反引号包裹
        if tag_name in ("code", "kbd", "samp"):
            code_text = _normalize_whitespace(node.get_text(" ", strip=True))
            if code_text:
                parts.append(f"`{code_text}`")
            return

        # 递归处理子节点
        for child in node.children:
            walk(child)

        # 块级元素后添加换行
        if tag_name in ("p", "li", "blockquote"):
            parts.append("\n")

    walk(tag)

    # 合并文本片段
    raw_text = "".join(parts)
    # 标准化每一行的空白
    lines = [_normalize_whitespace(line) for line in raw_text.split("\n")]
    result = "\n".join(lines)
    # 合并多余的空行（最多保留一个空行）
    result = re.sub(r"\n{3,}", "\n\n", result).strip()

    return result


def extract_blocks_in_order(container: Tag, blocks: list, base_url: str = ""):
    """
    从 HTML 容器中按顺序提取结构化内容块

    遍历容器中的所有元素，将不同类型的内容（段落、标题、列表、图片等）
    提取为结构化的 block 对象。每个 block 包含类型、原文、元数据等信息。

    Args:
        container: BeautifulSoup 容器标签
        blocks: 用于存储提取结果的列表（会被修改）
        base_url: 基础 URL，用于补全相对链接

    Block 结构：
        {
            "id": "b0001",              # 唯一标识符
            "type": "p|h2|li|img|...",  # 内容类型
            "source_text": "...",       # 原文（图片为空）
            "translated_text": "",      # 译文（初始为空）
            "meta": {...}               # 元数据（如图片的 src 和 alt）
        }
    """
    if not container:
        return

    def add_text_block(block_type: str, source_text: str, meta=None):
        """添加文本类型的 block"""
        source_text = (source_text or "").strip()
        if not source_text:
            return

        # 按换行拆分为多个 block（每行一个 block）
        lines = [line.strip() for line in source_text.split("\n") if line.strip()]

        for line in lines:
            if not line:
                continue

            block_id = f"b{len(blocks)+1:04d}"
            blocks.append({
                "id": block_id,
                "type": block_type,
                "source_text": line,
                "translated_text": "",
                "meta": meta or {}
            })

    def add_img_block(src: str, alt: str = "", meta=None):
        """添加图片类型的 block"""
        src = (src or "").strip()
        if not src:
            return

        # 补全相对路径
        src = urljoin(base_url, src) if base_url else src

        block_id = f"b{len(blocks)+1:04d}"
        img_meta = {"src": src, "alt": alt or ""}
        if meta:
            img_meta.update(meta)

        blocks.append({
            "id": block_id,
            "type": "img",
            "source_text": "",
            "translated_text": "",
            "meta": img_meta
        })

    def walk(node):
        """递归遍历节点树，提取各类内容"""
        # 处理文本节点
        if isinstance(node, NavigableString):
            text = _normalize_whitespace(str(node))
            if text:
                add_text_block("text", text)
            return

        if not isinstance(node, Tag):
            return

        tag_name = (node.name or "").lower()

        # 图片
        if tag_name == "img":
            add_img_block(node.get("src"), node.get("alt", ""))
            return

        # 列表：提取每个列表项
        if tag_name in ("ul", "ol"):
            for li in node.find_all("li", recursive=False):
                li_text = _extract_text_preserve_links(li, base_url=base_url)
                add_text_block("li", li_text)
            return

        # 标题
        if tag_name in ("h1", "h2", "h3", "h4"):
            heading_text = _extract_text_preserve_links(node, base_url=base_url)
            add_text_block(tag_name, heading_text)
            return

        # 段落和引用
        if tag_name in ("p", "blockquote"):
            para_text = _extract_text_preserve_links(node, base_url=base_url)
            add_text_block(tag_name, para_text)
            return

        # 代码块
        if tag_name == "pre":
            code_text = node.get_text("\n", strip=True).strip()
            if code_text:
                add_text_block("pre", code_text)
            return

        # 递归处理其他标签的子节点
        for child in node.children:
            walk(child)

    # 遍历容器的所有子节点
    for child in container.children:
        walk(child)


def parse_article_page(article_url):
    """
    解析 Minecraft 新闻文章页面

    从文章页面提取标题、发布日期和结构化内容块。
    自动去重相同的内容块。

    Args:
        article_url: 文章页面的 URL

    Returns:
        dict: 包含以下字段的字典：
            - title: 文章标题
            - release_date: 发布日期（ISO 8601 格式）
            - blocks: 内容块列表
        失败时返回 None
    """
    if not article_url:
        print("[解析] 错误: 文章 URL 为空")
        return None

    try:
        print(f"[解析] 正在获取文章: {article_url}")
        response = requests.get(
            article_url,
            headers=HEADERS_HTML,
            timeout=120,
            verify=CFG["http"]["verify_ssl"],
            proxies=PROXIES
        )
        response.raise_for_status()

        # 解析 HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # 提取标题
        title_tag = soup.find("h1")
        title = title_tag.get_text(strip=True) if title_tag else ""

        # 提取发布日期
        date_tag = soup.find("meta", {"property": "article:published_time"})
        release_date = date_tag["content"] if date_tag else ""

        # 提取内容块
        blocks = []
        seen_containers = set()  # 用于去重

        def _container_signature(tag):
            """生成容器的唯一签名（基于内容的 SHA1 哈希）"""
            if not tag:
                return None
            text = tag.get_text("\n", strip=True)
            text = re.sub(r"\s+", " ", text or "").strip()
            if not text:
                return None
            return hashlib.sha1(text.encode("utf-8")).hexdigest()

        # 查找所有内容容器
        candidates = []
        # 文章引言部分
        intro = soup.find("div", class_="article-text")
        if intro:
            candidates.append(intro)
        # 文章主体部分
        candidates.extend(soup.find_all("div", class_="article-section"))

        # 提取每个容器的内容（去重）
        for container in candidates:
            signature = _container_signature(container)
            if signature and signature in seen_containers:
                continue  # 跳过重复的容器
            if signature:
                seen_containers.add(signature)
            extract_blocks_in_order(container, blocks, base_url=article_url)

        # 去除连续重复的 block
        deduplicated_blocks = []
        prev_key = None
        for block in blocks:
            # 生成 block 的唯一键
            key = (
                block.get("type"),
                (block.get("source_text") or "").strip(),
                json.dumps(block.get("meta") or {}, sort_keys=True, ensure_ascii=False),
            )
            if key == prev_key:
                continue  # 跳过重复的 block
            deduplicated_blocks.append(block)
            prev_key = key

        print(f"[解析] 成功提取 {len(deduplicated_blocks)} 个内容块")
        return {
            "title": title,
            "release_date": release_date,
            "blocks": deduplicated_blocks
        }

    except requests.exceptions.Timeout:
        print("[解析] 请求超时")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"[解析] 连接失败: {e}")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"[解析] HTTP 错误: {e}")
        return None
    except Exception as e:
        print(f"[解析] 未知错误: {e}")
        return None


def _chunk_items_for_translation(items, max_chars=1000, max_items=10):
    """
    将翻译项分批，避免单次请求过大

    根据字符数和项目数限制，将翻译项列表分成多个批次。
    每个批次不超过指定的字符数和项目数。

    Args:
        items: 待翻译的项目列表
        max_chars: 每批最大字符数
        max_items: 每批最大项目数

    Returns:
        list: 批次列表，每个批次是一个项目列表
    """
    batches = []
    current_batch = []
    current_length = 0

    for item in items:
        # 计算项目的 JSON 字符串长度
        item_json = json.dumps(item, ensure_ascii=False)
        item_length = len(item_json)

        # 如果当前批次已满，开始新批次
        if current_batch and (
            len(current_batch) >= max_items or
            current_length + item_length > max_chars
        ):
            batches.append(current_batch)
            current_batch = []
            current_length = 0

        current_batch.append(item)
        current_length += item_length

    # 添加最后一个批次
    if current_batch:
        batches.append(current_batch)

    return batches


def translate_blocks(blocks: list) -> list:
    """
    批量翻译内容块

    将所有文本类型的 block 提取出来，分批调用翻译 API，
    然后将翻译结果填充回原 block 的 translated_text 字段。

    Args:
        blocks: 内容块列表

    Returns:
        list: 更新后的内容块列表（原地修改）

    处理逻辑：
        1. 提取所有需要翻译的文本（跳过图片）
        2. 分批发送翻译请求
        3. 解析翻译结果（支持 JSON 和纯文本格式）
        4. 将译文填充回对应的 block
    """
    if not blocks:
        return blocks

    # 提取需要翻译的文本
    items_to_translate = []
    for block in blocks:
        # 跳过图片
        if block.get("type") == "img":
            continue
        source_text = (block.get("source_text") or "").strip()
        if not source_text:
            continue
        items_to_translate.append({
            "id": block.get("id"),
            "text": source_text
        })

    if not items_to_translate:
        print("[翻译] 没有需要翻译的内容")
        return blocks

    print(f"[翻译] 开始翻译 {len(items_to_translate)} 个文本块")

    # 批量翻译
    system_prompt = CFG["prompts"]["translate_blocks_system"]
    id_to_translation = {}

    for batch in _chunk_items_for_translation(items_to_translate):
        batch_json = json.dumps(batch, ensure_ascii=False, indent=0)
        translated_result = translate_text(batch_json, system_prompt=system_prompt)

        if not translated_result:
            print(f"[翻译] 警告: 批次翻译失败，跳过 {len(batch)} 个项目")
            continue

        # 尝试解析 JSON 格式的翻译结果
        parsed_result = None
        try:
            parsed_result = json.loads(translated_result)
        except json.JSONDecodeError:
            # 如果不是标准 JSON，尝试清理 Markdown 代码块标记
            cleaned = translated_result.strip()
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            try:
                parsed_result = json.loads(cleaned)
            except json.JSONDecodeError:
                print("[翻译] 警告: JSON 解析失败，尝试按行匹配")

        # 处理 JSON 格式的结果
        if isinstance(parsed_result, list):
            for obj in parsed_result:
                if isinstance(obj, dict) and "id" in obj and "translated_text" in obj:
                    id_to_translation[str(obj["id"])] = str(obj["translated_text"])
        else:
            # 降级处理：按行匹配
            lines = [line.strip() for line in translated_result.splitlines() if line.strip()]
            for item, line in zip(batch, lines):
                id_to_translation[str(item["id"])] = line

    # 将翻译结果填充回 blocks
    translated_count = 0
    for block in blocks:
        block_id = str(block.get("id"))
        if block_id in id_to_translation:
            block["translated_text"] = id_to_translation[block_id]
            translated_count += 1

    print(f"[翻译] 完成，成功翻译 {translated_count}/{len(items_to_translate)} 个文本块")
    return blocks


def blocks_to_plaintext(blocks: list, field: str = "source_text") -> str:
    """
    将内容块列表转换为纯文本

    将结构化的 block 列表转换为可读的纯文本格式。
    图片会转换为 Markdown 链接格式。

    Args:
        blocks: 内容块列表
        field: 要提取的字段名，可以是 "source_text" 或 "translated_text"

    Returns:
        str: 合并后的纯文本，各块之间用双换行分隔
    """
    text_parts = []

    for block in blocks or []:
        block_type = block.get("type")

        # 处理图片
        if block_type == "img":
            meta = block.get("meta") or {}
            src = meta.get("src", "")
            alt = meta.get("alt", "")
            if src:
                # 转换为 Markdown 图片格式
                if alt:
                    text_parts.append(f"[IMAGE:{alt}]({src})")
                else:
                    text_parts.append(f"[IMAGE]({src})")
            continue

        # 处理文本
        text = (block.get(field) or "").strip()
        if text:
            text_parts.append(text)

    return "\n\n".join(text_parts).strip()


def save_to_json(data):
    """
    将新闻数据保存为 JSON 文件

    Args:
        data: 包含新闻数据的字典，必须包含 title 和 release_date 字段

    Returns:
        bool: 保存成功返回 True，失败返回 False
    """
    if not data:
        print("[保存] 无内容可保存")
        return False

    title = data.get("title", "untitled")
    release_date = data.get("release_date", "")

    # 生成时间戳字符串
    try:
        if 'T' in release_date:
            # ISO 8601 格式：2024-03-08T12:30:00Z
            date_part, time_part = release_date.split('T')
            time_part = time_part.replace(':', '_').replace('Z', '')
            timestamp = f"{date_part}_{time_part}"
        else:
            # 其他格式
            timestamp = release_date.replace(':', '_').replace(' ', '_')
    except (ValueError, AttributeError):
        # 如果日期格式无法解析，使用当前时间
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # 清理标题，移除文件名中的非法字符
    safe_title = title.replace(' ', '_')
    illegal_chars = ['\\', '/', ':', '*', '?', '"', '<', '>', '|']
    for char in illegal_chars:
        safe_title = safe_title.replace(char, '_')
    # 合并连续的下划线
    safe_title = re.sub(r'_+', '_', safe_title).strip('_')
    timestamp = re.sub(r'_+', '_', timestamp).strip('_')

    # 构建保存路径
    save_dir = CFG["output"]["save_dir"]
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, f"news_{safe_title}_{timestamp}.json")

    # 保存文件
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[保存] 成功: {file_path}")
        return True
    except IOError as e:
        print(f"[保存] 文件写入失败: {e}")
        return False


def main():
    """
    主函数：获取并翻译 Minecraft 最新新闻

    工作流程：
        1. 通过 API 获取最新新闻列表
        2. 让用户选择要翻译的新闻（或自动选择最新的）
        3. 解析文章页面，提取结构化内容
        4. 翻译标题和内容
        5. 保存为 JSON 文件

    配置项：
        - minecraft_api.timeout: 用户选择超时时间（秒），0 表示不等待
        - minecraft_api.pageSize: 获取的新闻数量
    """
    print("=" * 60)
    print("Minecraft 新闻翻译工具")
    print("=" * 60)
    print()

    # 1. 获取新闻列表
    print("[步骤 1/5] 获取最新新闻列表...")
    news_list = get_latest_news_via_api()

    if not news_list:
        print("[错误] 无法获取新闻列表，程序退出")
        return

    page_size = CFG["minecraft_api"]["pageSize"]
    print(f"\n获取到 {len(news_list)} 条新闻：")
    for i, news in enumerate(news_list):
        print(f"  {i+1}. {news['title']}")

    # 2. 选择要翻译的新闻
    print(f"\n[步骤 2/5] 选择要翻译的新闻...")
    timeout = CFG.get("minecraft_api", {}).get("timeout", 0)

    if timeout == 0:
        # 自动选择最新的新闻
        selected_news = news_list[0]
        print(f"配置为自动模式（timeout=0），选择最新新闻: {selected_news['title']}")
    else:
        # 等待用户输入
        print(f"请在 {timeout} 秒内选择...")
        start_time = time.time()
        user_choice = None

        while time.time() - start_time < timeout:
            try:
                choice_input = input(f"请输入编号（1-{len(news_list)}），或按回车选择最新: ")
                if choice_input.strip() == "":
                    user_choice = 0
                    print("选择最新新闻")
                    break
                choice_num = int(choice_input)
                if 1 <= choice_num <= len(news_list):
                    user_choice = choice_num - 1
                    break
                else:
                    print(f"无效输入，请输入 1 到 {len(news_list)} 之间的数字")
            except ValueError:
                print("无效输入，请输入数字")
            except KeyboardInterrupt:
                print("\n用户取消，退出程序")
                return

        if user_choice is None:
            print(f"\n超时，自动选择最新新闻")
            user_choice = 0

        selected_news = news_list[user_choice]

    print(f"已选择: {selected_news['title']}")

    # 3. 解析文章页面
    print(f"\n[步骤 3/5] 解析文章页面...")
    article_data = parse_article_page(selected_news["url"])

    if not article_data:
        print("[错误] 无法解析文章页面，程序退出")
        return

    # 4. 翻译标题
    print(f"\n[步骤 4/5] 翻译标题...")
    title_to_translate = article_data["title"] or selected_news["title"]
    translated_title = translate_text(
        title_to_translate,
        system_prompt=CFG["prompts"]["translate_title_system"]
    ) or ""

    if translated_title:
        print(f"原标题: {title_to_translate}")
        print(f"译标题: {translated_title}")

    # 5. 翻译内容
    print(f"\n[步骤 5/5] 翻译内容...")
    blocks = article_data.get("blocks", [])
    translate_blocks(blocks)

    # 生成纯文本版本
    source_content = blocks_to_plaintext(blocks, field="source_text")
    translated_content = blocks_to_plaintext(blocks, field="translated_text")

    # 组装完整数据
    full_data = {
        "title": title_to_translate,
        "translated_title": translated_title,
        "release_date": article_data.get("release_date") or selected_news.get("release_date", ""),
        "url": selected_news.get("url", ""),
        "author": selected_news.get("author", ""),
        "imageAltText": selected_news.get("imageAltText", ""),
        "description": selected_news.get("description", ""),
        "blocks": blocks,
        "content": source_content,
        "translated_content": translated_content
    }

    # 保存文件
    print()
    save_to_json(full_data)

    print()
    print("=" * 60)
    print("任务完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
