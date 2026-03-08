# MinecraftJJTools
Minecraft 新闻翻译工具集  

## 📋 项目介绍

MinecraftJJTools 是一套完整的 Minecraft 新闻翻译工具集，包含两个核心工具：

- **JBAiGNN** (JiuBookAiGetNewestNews) - 使用 AI 自动翻译 Minecraft 官方新闻
- **J2MM** (JsonToMcbbsMarkdown) - 将翻译结果转换为 BBCode 或 Markdown 格式

## 🚀 快速开始

### 方式一：自动安装（推荐新手）

1. 双击运行 `START.BAT`
2. 脚本会自动检测并安装所需环境
3. 按照提示操作即可

### 方式二：快速启动（适合已配置环境）

1. 双击运行 `START_QUICK.BAT`
2. 直接运行程序

### 方式三：命令行运行

```bash
python JBAiGNN_JiuBookAiGetNewestNews.py
```

## 🛠️ 工具详解

### 1️⃣ JBAiGNN - AI 新闻翻译工具 (Python)

**主要功能**：
- 自动获取 Minecraft 官方网站最新新闻
- 使用 AI 翻译成简体中文
- 导出为结构化 JSON 格式
- 支持代理服务器访问

**输出格式**：
```json
{
  "title": "原标题",
  "translated_title": "翻译后的标题",
  "release_date": "2026-02-18T15:00:34Z",
  "url": "https://...",
  "author": "Staff",
  "blocks": [
    {"id": "b0001", "type": "p", "source_text": "原文", "translated_text": "译文"}
  ],
  "content": "原文纯文本",
  "translated_content": "译文纯文本"
}
```

### 2️⃣ J2MM - 格式转换工具 (HTML)

**主要功能**：
- 将 JSON 格式转换为 BBCode（适用于 MCBBS 等论坛）
- 将 JSON 格式转换为 Markdown（适用于 GitHub、博客等）
- 支持逐句人工校对修改
- 支持自定义头尾模块

**在线试用**：[点击这里在线使用 J2MM](https://jiubook.github.io/MinecraftJJTools/J2MM_JsonToMcbbsMarkdown.html)

**输出示例**：

Markdown 格式：
```markdown
**NEWS**
# 迈向 Vibrant Visuals 的又一步
_Another step towards Vibrant Visuals_
- 时间：2026/2/18 23:00:34
- 作者：Staff
- 原文：https://...
---
我们仍在努力...
> We're still hard at work...
```

BBCode 格式：
```bbcode
[align=center][size=5][b]NEWS[/b][/size][/align]
[align=center][size=6][b]迈向 Vibrant Visuals 的又一步[/b][/size][/align]
[hr]
我们仍在努力...
[color=#bcbcbc]We're still hard at work...[/color]
```

## ⚙️ 配置说明

### 首次使用前，请编辑 `config.json` 文件：

#### 1. 配置 API 信息（必需）

```json
"openai_compat": {
  "host": "www.你的API网站.com",
  "api_key": "sk-你的API密钥",
  "model": "你的模型名称"
}
```

**说明**：
- `host` - API 服务器地址（必填）
- `api_key` - API 密钥（必填，如留空则使用环境变量）
- `model` - 模型名称（必填）
- `endpoint` - API 端点（默认 `/v1/chat/completions`，一般无需修改）
- `max_tokens` - 最大令牌数（默认 10000）
- `timeout` - 超时时间（默认 120 秒）

**如不配置 API**：程序将输出英文原文，不进行 AI 翻译。

#### 2. 配置代理服务器（可选）

```json
"http": {
  "proxies": {
    "http": "http://127.0.0.1:7890",
    "https": "http://127.0.0.1:7890"
  }
}
```

**说明**：
- 如需使用代理，填写代理地址（如 `http://127.0.0.1:7890`）
- 如不使用代理，留空即可（`""`）

#### 3. 其他配置

```json
"pageSize": 20,           // 获取的新闻数量
"timeout": 0,             // 用户选择超时时间（0 表示自动选择最新）
"save_dir": "minecraft_news"  // 保存目录
```

## 📦 依赖库

程序需要以下 Python 库（`START.BAT` 会自动安装）：

- requests >= 2.31.0
- beautifulsoup4 >= 4.12.0
- urllib3 >= 2.0.0

## 🔧 手动安装依赖

如果自动安装失败，可以手动安装：

```bash
# 使用国内镜像源（推荐）
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 或使用默认源
pip install -r requirements.txt
```

## 📁 文件说明

```
MinecraftJJTools/
├── JBAiGNN_JiuBookAiGetNewestNews.py  # 主程序（Python）
├── J2MM_JsonToMcbbsMarkdown.html      # 格式转换工具（HTML）
├── J2MM.js                             # 格式转换核心脚本
├── config.json                         # 配置文件
├── requirements.txt                    # 依赖库列表
├── START.BAT                           # 自动安装启动脚本（推荐新手）
├── START_QUICK.BAT                     # 快速启动脚本（适合已配置环境）
├── JBAiGNN_使用说明.md                 # JBAiGNN 详细使用说明
├── README.md                           # 本文件
└── minecraft_news/                     # 翻译结果保存目录
```

## ❓ 常见问题

### 1. 提示"未检测到 Python"

**解决方法**：
- 访问 https://www.python.org/downloads/ 下载 Python 3.8+
- 安装时务必勾选 "Add Python to PATH"

### 2. 依赖安装失败

**解决方法**：
```bash
# 尝试升级 pip
python -m pip install --upgrade pip

# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 3. 翻译失败

**可能原因**：
- API 配置错误（检查 config.json 中的 host、api_key、model）
- 网络连接问题（检查代理设置）
- API 额度不足或服务不可用

### 4. 中文乱码

**解决方法**：
- 确保使用 UTF-8 编码打开文件
- 使用支持 UTF-8 的文本编辑器（如 VS Code、Notepad++）

### 5. 如何使用 J2MM 工具？

**方法一**：在线使用
- 访问 https://jiubook.github.io/MinecraftJJTools/J2MM_JsonToMcbbsMarkdown.html
- 粘贴 JSON 内容，选择输出格式即可

**方法二**：本地使用
- 双击打开 `J2MM_JsonToMcbbsMarkdown.html`
- 在浏览器中使用

## 🎯 使用流程

1. **配置环境**：编辑 `config.json`，填写 API 信息
2. **运行 JBAiGNN**：双击 `START.BAT` 或运行 Python 脚本
3. **选择新闻**：从列表中选择要翻译的新闻
4. **等待翻译**：程序自动翻译并保存为 JSON
5. **格式转换**：使用 J2MM 工具将 JSON 转换为所需格式
6. **发布内容**：将转换后的内容发布到论坛或博客

## 🔄 更新日志

### JBAiGNN v0.0.8
- 优化代码结构，添加详细注释
- 改进错误处理和用户提示
- 删除无用代码，提升性能
- 新增自动安装脚本

### J2MM v0.0.9
- 支持逐句人工校对修改
- 支持自定义头尾模块
- 优化输出格式

## 🚧 未来计划

- [x] 逐句人工校对修改
- [x] 头尾自定义模块
- [x] 代理服务器支持
- [ ] 图片自动爬取
- [ ] GUI 图形界面
- [ ] 整合为单个程序
- [ ] Docker 容器化部署
- [ ] 每日自动化爬取
- [ ] 自动发布到 MCBBS、MCZWLT、Bilibili、贴吧
- [ ] 修复可能存在的 bug

## 📧 联系方式

如有问题或建议，欢迎：
- 提交 Issue 进行讨论
- 联系：JiuBook

## 📄 许可证

本项目遵循开源协议，欢迎使用和贡献。

---

**祝使用愉快！** 🎮✨
