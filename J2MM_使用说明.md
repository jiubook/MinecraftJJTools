# J2MM - JSON to MCBBS Markdown 使用说明

将 Minecraft 官网新闻 JSON 转换为 MCBBS BBCode 和 Markdown 格式。

J2MM 提供两个版本：
- **HTML 版**（`J2MM_JsonToMcbbsMarkdown.html`）：交互式网页工具，支持逐句校对
- **Python 版**（`J2MM.py`）：命令行工具，支持批量转换（v0.1.4 新增）

---

## HTML 版（J2MM_JsonToMcbbsMarkdown.html）

### 使用方式

**在线使用**（推荐）：
- 访问 [J2MM 在线工具](https://jiubook.github.io/MinecraftJJTools/J2MM_JsonToMcbbsMarkdown.html)

**本地使用**：
- 双击打开 `J2MM_JsonToMcbbsMarkdown.html`，在浏览器中使用

### 主要功能

- 将 JSON 转换为 **BBCode**（适用于 MCBBS 等论坛）
- 将 JSON 转换为 **Markdown**（适用于 GitHub、博客等）
- 支持**逐句人工校对修改**：可在界面中逐条对照原文和译文并手动修改
- 支持**自定义头尾模块**：内置多种文章类型模板（快照、预发布、基岩版等）

### 输出示例

Markdown 格式：
```markdown
**NEWS**
# 迈向 ... 的又一步
_Another step towards ..._
- 时间：2026/2/18 00:00:00
- 作者：Staff
- 原文：https://...
---
我们仍在努力...
> We're still hard at work...
```

BBCode 格式：
```bbcode
[align=center][size=5][b]NEWS[/b][/size][/align]
[align=center][size=6][b]迈向 ... 的又一步[/b][/size][/align]
[align=center][size=4]Another step towards ...[/size][/align]
[quote][b]时间：[/b] 2026/2/18 00:00:00
[b]作者：[/b] Staff
[b]原文：[/b] [url=https://...]https://...[/url]
[b]简介：[/b][i]We're still hard at work...[/i][/quote]
[hr]
我们仍在努力...
[color=#bcbcbc]We're still hard at work...[/color]
```

### 文件说明

| 文件 | 说明 |
|------|------|
| `J2MM_JsonToMcbbsMarkdown.html` | 主页面 |
| `J2MM.js` | 核心转换脚本 |
| `J2MM.css` | 页面样式 |

---

## Python 版（J2MM.py）

v0.1.4 新增，提供命令行接口，适合批量处理或集成到脚本工作流。

### 用法

```bash
# 单文件转换（同时输出 .txt BBCode 和 .md Markdown）
python J2MM.py <input.json>

# 仅输出 BBCode
python J2MM.py <input.json> --bbcode-only

# 仅输出 Markdown
python J2MM.py <input.json> --markdown-only

# 批量转换目录下所有 JSON
python J2MM.py --batch <目录>

# 指定输出目录
python J2MM.py --batch <目录> -o <输出目录>

# 指定模块配置文件
python J2MM.py <input.json> -m modules_config.json
```

### 文件说明

| 文件 | 说明 |
|------|------|
| `J2MM.py` | 主程序（转换器 + CLI + 批量处理） |
| `modules_config.json` | 开头/结尾模块配置 |

### 模块配置（modules_config.json）

程序会自动检测文章类型（基于标题关键词），并自动包含对应模块：

| 文章类型 | 触发关键词 |
|----------|-----------|
| java_snapshot | Snapshot |
| java_prerelease | Pre-Release / Pre Release |
| java_rc | Release Candidate |
| java_release | Java Edition |
| bedrock_beta | Beta / Preview |
| bedrock_release | Bedrock |
| commentary | 时评 / Commentary |
| normal | 其他 |

每个模块的关键字段：
- `enabled: true` — 始终包含（如署名、开源协议声明）
- `enabled: false` — 仅当文章类型匹配时自动包含
- `position` — `"start"` 或 `"end"`（位于文章正文前或后）
- `order` — 输出顺序（start 模块：1001 最上；end 模块：2001 最下）
- `custom_modules` — 可在此数组中添加自定义模块

### JSON 输入格式

```json
{
  "title": "Minecraft 26.1 Pre-Release 2",
  "translated_title": "Minecraft 26.1 预发布版 2",
  "release_date": "2026-03-13T16:00:00Z",
  "author": "Mojang",
  "url": "https://www.minecraft.net/...",
  "description": "简介",
  "blocks": [
    { "type": "p", "source_text": "原文", "translated_text": "译文" },
    { "type": "h2", "source_text": "标题", "translated_text": "标题译文" },
    { "type": "li", "source_text": "列表项", "translated_text": "译文", "meta": { "indent_level": 0 } },
    { "type": "img", "source_text": "", "translated_text": "", "meta": { "src": "https://...", "alt": "" } }
  ]
}
```

支持的 block 类型：`p`、`h1`-`h4`、`li`、`img`、`pre`/`code`、`blockquote`
