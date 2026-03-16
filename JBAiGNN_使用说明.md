# Minecraft 新闻翻译工具 - 使用说明 (v0.1.3)

## 📋 功能介绍

本工具可以自动获取 Minecraft 官方网站的最新新闻和 Feedback 网站的更新日志，并使用 AI 翻译成简体中文。

### v0.1.3 新增功能

- 🔧 **HTML解析优化**：改进了Feedback文章的HTML内容解析逻辑
- 🔗 **链接处理增强**：优化了相对链接补全和Markdown链接格式转换
- 🆔 **ID自动重排**：新增blocks ID重新索引功能，确保唯一性和连续性
- 📝 **代码块改进**：优化了代码块和嵌套列表的提取处理
- ✨ **文本清理**：自动清理翻译文本中的多余转义字符

### v0.1.2 新增功能

- 🌐 **Feedback 网站爬虫**：支持从 feedback.minecraft.net 获取更新日志
- 📝 **多分类支持**：正式版、测试版、快照版、教育版更新日志
- 🔧 **灵活配置**：可自定义每个分类的启用状态和获取数量

### v0.1.1 新增功能

- ✨ **翻译自动重试机制**：翻译失败时自动重试，提高成功率
- ⚡ **并发翻译支持**：多线程并发翻译，大幅提升翻译速度
- 📋 **嵌套列表支持**：J2MM 工具支持多层级列表渲染

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

## ⚙️ 配置说明

### 首次使用前，请编辑 `config.json` 文件：

1. **配置 API 信息**（必需）：
   ```json
   "openai_compat": {
     "host": "你的API网站.com",
     "api_key": "你的API密钥",
     "model": "模型名称"
   }
   ```

2. **配置代理**（可选）：
   ```json
   "http": {
     "proxies": {
       "http": "http://127.0.0.1:7890",
       "https": "http://127.0.0.1:7890"
     }
   }
   ```

3. **Feedback 网站配置**（v0.1.2 新增）：
   ```json
   "feedback_site": {
     "enabled": true,                    // 是否启用 Feedback 网站爬取
     "sections": [
       {
         "name": "Release Changelogs",
         "name_cn": "正式版更新日志",
         "section_id": "360001186971",
         "enabled": true,                // 是否启用该分类
         "articles_count": 6             // 获取文章数量
       },
       {
         "name": "Beta and Preview Information and Changelogs",
         "name_cn": "测试版更新日志",
         "section_id": "360001185332",
         "enabled": true,
         "articles_count": 6
       },
       {
         "name": "Snapshot Information and Changelogs",
         "name_cn": "快照版更新日志",
         "section_id": "360002267532",
         "enabled": true,
         "articles_count": 6
       },
       {
         "name": "Minecraft Education Changelogs",
         "name_cn": "教育版更新日志",
         "section_id": "360001293291",
         "enabled": false,               // 默认关闭
         "articles_count": 3
       }
     ]
   }
   ```

   **说明**：
   - `enabled` - 是否启用 Feedback 网站爬取
   - `sections` - 更新日志分类列表
   - 每个分类可单独启用/禁用
   - `articles_count` - 每个分类获取的文章数量（建议 3-10）

4. **重试和并发配置**（v0.1.1 新增）：
   ```json
   "retry": {
     "translation": {
       "max_retries": 3,           // 翻译失败时的最大重试次数
       "wait_for_input": false     // 多次失败后是否等待用户输入
     },
     "download": {
       "max_retries": 3,           // 下载失败时的最大重试次数
       "wait_for_input": true      // 多次失败后是否等待用户输入
     }
   },
   "concurrency": {
     "translation_workers": 3      // 翻译时的并发线程数（1=串行，>1=并发）
   }
   ```

   **说明**：
   - `max_retries` - 失败后的最大重试次数（建议 3-5 次）
   - `wait_for_input` - 多次失败后是否暂停等待用户输入
   - `translation_workers` - 并发翻译的线程数（1=串行翻译，建议 2-5）

5. **其他配置**：
   - `pageSize`: 获取的新闻数量（默认 20）
   - `timeout`: 用户选择超时时间（0 表示自动选择最新）
   - `save_dir`: 保存目录（默认 minecraft_news）

## 📦 依赖库

程序需要以下 Python 库（`START.BAT` 会自动安装）：

- requests >= 2.31.0
- beautifulsoup4 >= 4.12.0
- urllib3 >= 2.0.0
- curl_cffi >= 0.5.0（v0.1.2 新增，用于 Feedback 网站爬取）

## 🔧 手动安装依赖

如果自动安装失败，可以手动安装：

```bash
# 使用国内镜像源（推荐）
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 或使用默认源
pip install -r requirements.txt
```

## 📁 文件说明

- `JBAiGNN_JiuBookAiGetNewestNews.py` - 主程序
- `config.json` - 配置文件
- `requirements.txt` - 依赖库列表
- `START.BAT` - 自动安装启动脚本（推荐新手）
- `START_QUICK.BAT` - 快速启动脚本（适合已配置环境）
- `minecraft_news/` - 翻译结果保存目录

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
- API 配置错误（检查 config.json）
- 网络连接问题（检查代理设置）
- API 额度不足

**v0.1.1 改进**：
- 程序会自动重试失败的翻译（默认最多 3 次）
- 可在 `config.json` 中调整 `retry.translation.max_retries` 配置
- 如需手动干预，可设置 `retry.translation.wait_for_input` 为 `true`

### 4. 中文乱码

**解决方法**：
- 确保使用 UTF-8 编码打开文件
- 使用支持 UTF-8 的文本编辑器（如 VS Code、Notepad++）

### 5. Feedback 网站爬取失败（v0.1.2）

**可能原因**：
- curl_cffi 库未安装（运行 `pip install curl_cffi>=0.5.0`）
- 网络连接问题（检查代理设置）
- Cloudflare 防护更新（等待工具更新）

**解决方法**：
- 确保已安装 curl_cffi 库
- 检查 `config.json` 中的 `feedback_site.enabled` 是否为 `true`
- 如不需要 Feedback 网站功能，可设置 `enabled: false` 禁用

## 📝 输出格式

翻译结果保存为 JSON 格式，包含：

- `title` - 原标题
- `translated_title` - 译标题
- `release_date` - 发布日期
- `url` - 原文链接
- `blocks` - 结构化内容块（支持嵌套列表）
- `content` - 原文纯文本
- `translated_content` - 译文纯文本

**v0.1.2 新增**：Feedback 网站的更新日志也会保存为相同格式，方便统一处理。

## ⚡ 性能优化 (v0.1.1)

### 并发翻译

通过配置 `concurrency.translation_workers` 可以启用多线程并发翻译：

- `translation_workers: 1` - 串行翻译（默认，适合 API 限流严格的情况）
- `translation_workers: 3` - 3 个线程并发（推荐，速度提升约 3 倍）
- `translation_workers: 5` - 5 个线程并发（适合 API 性能好的情况）

**注意**：并发数过高可能触发 API 限流，建议根据实际情况调整。

### 自动重试

翻译失败时会自动重试，无需手动重新运行：

- 默认最多重试 3 次
- 可通过 `retry.translation.max_retries` 调整
- 设置 `retry.translation.wait_for_input: true` 可在多次失败后暂停等待用户输入

## 📧 联系方式

如有问题或建议，请联系：JiuBook AI

---

**祝使用愉快！** 🎮
