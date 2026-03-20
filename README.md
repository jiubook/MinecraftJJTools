# MinecraftJJTools
Minecraft 新闻翻译工具集

## 工具介绍

- **JBAiGNN** (JiuBookAiGetNewestNews) — 自动获取 Minecraft 官方新闻并 AI 翻译，输出结构化 JSON
- **J2MM** (JsonToMcbbsMarkdown) — 将 JSON 转换为 BBCode 或 Markdown，提供 HTML 和 Python 两个版本

## 使用流程

1. 配置 `JBAiGNN/config.json`，填写 AI API 信息
2. 运行 JBAiGNN，翻译新闻并保存为 JSON
3. 使用 J2MM 将 JSON 转换为 BBCode / Markdown
4. 将结果发布到论坛或博客

## 快速启动

### JBAiGNN

```bash
# 推荐新手：双击 START.BAT（自动安装依赖）
# 已配置环境：双击 START_QUICK.BAT
# 命令行：
python JBAiGNN_JiuBookAiGetNewestNews.py
```

详细配置说明见 `JBAiGNN/JBAiGNN_使用说明.md`

### J2MM

**HTML 版**（交互式，支持逐句校对）：
- 在线使用：[J2MM 在线工具](https://jiubook.github.io/MinecraftJJTools/J2MM_JsonToMcbbsMarkdown.html)
- 本地使用：双击打开 `J2MM/J2MM_JsonToMcbbsMarkdown.html`

**Python 版**（命令行，支持批量转换，v0.1.4 新增）：
```bash
python J2MM/J2MM.py <input.json>
python J2MM/J2MM.py --batch <目录>
```

详细说明见 `J2MM/J2MM_使用说明.md`

## 文件结构

```
MinecraftJJTools/
├── JBAiGNN/
│   ├── JBAiGNN_JiuBookAiGetNewestNews.py   # 主程序
│   ├── config.json                          # 配置文件（需填写 API 信息）
│   ├── requirements.txt                     # 依赖库列表
│   ├── START.BAT                            # 自动安装启动（推荐新手）
│   ├── START_QUICK.BAT                      # 快速启动
│   ├── JBAiGNN_使用说明.md
│   └── minecraft_news/                      # 翻译结果保存目录
├── J2MM/
│   ├── J2MM_JsonToMcbbsMarkdown.html        # HTML 版转换工具
│   ├── J2MM.py                              # Python 版转换工具（v0.1.4 新增）
│   ├── J2MM.js                              # HTML 版核心脚本
│   ├── J2MM.css                             # HTML 版样式
│   ├── modules_config.json                  # 模块配置（v0.1.4 新增）
│   └── J2MM_使用说明.md
├── LICENSE
└── README.md
```

## 版本更新

### v0.1.4 (2026-03-21)

新增 J2MM Python 命令行版本（`J2MM.py`），支持单文件和批量转换，自动根据文章类型选择对应模块。

### v0.1.3 (2026-03-16)

优化 Feedback 网站内容解析：改进 HTML 解析逻辑、链接处理、blocks ID 自动重排、代码块和嵌套列表处理、翻译文本转义字符清理。

### v0.1.2 (2026-03-16)

新增 Feedback 网站爬虫，支持从 feedback.minecraft.net 获取正式版、测试版、快照版更新日志，使用 curl_cffi 绕过 Cloudflare 防护。

### v0.1.1

新增翻译自动重试机制、并发翻译支持、嵌套列表渲染。

## 联系 / 许可证

- Issue 反馈 / 邮件：JiuBook@qq.com
- 本项目遵循 GPL-3.0 开源协议
