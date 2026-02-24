# MinecraftJJTools
即JiuBookAiGetNewestNews & JsonToMcbbsMarkdown两个工具  
主要功能为通过AI翻译Minecraft新闻，并导出成json，格式转换成BBcode或Markdown  

# JBAiGNN(Python)
全称为JiuBookAiGetNewestNews  
通过AI翻译Minecraft新闻，并导出成json  
可在config文件配置翻译API  
如无配置，则输出最新新闻，不做Ai翻译  

# J2MM(HTML)
全称为JsonToMcbbsMarkdown  
将导出的json格式转换成BBcode或Markdown  
[**点我进行网页试用**](https://jiubook.github.io/MinecraftJJTools/J2MM_JsonToMcbbsMarkdown.html)  
```
{
  "title": "Another step towards Vibrant Visuals",
  "translated_title": "迈向 Vibrant Visuals 的又一步",
  "release_date": "2026-02-18T15:00:34Z",
  "url": "https://...",
  "author": "Staff",
  "description": "We’re still hard at work...",
  "blocks": [
    {"id":"b0001","type":"p","source_text":"We’re still hard at work...","translated_text":"我们仍在努力..."},
    {"id":"b0003","type":"h2","source_text":"What are we changing?","translated_text":"我们要改变什么？"}
  ]
}
```

```
**NEWS**
# 迈向 Vibrant Visuals 的又一步
_Another step towards Vibrant Visuals_
- 时间：2026/2/18 23:00:34
- 作者：Staff
- 原文：https://...
- 简介：We’re still hard at work...
---
我们仍在努力...
> We’re still hard at work...
---
## 我们要改变什么？
> What are we changing?
```

```
[align=center][size=5][b]NEWS[/b][/size][/align]
[align=center][size=6][b]迈向 Vibrant Visuals 的又一步[/b][/size][/align]
[align=center][size=4]Another step towards Vibrant Visuals[/size][/align]
[quote][b]时间：[/b] 2026/2/18 23:00:34
[b]作者：[/b] Staff
[b]原文：[/b] [url=https://...]https://...[/url]
[b]简介：[/b][i]We’re still hard at work...[/i][/quote]
[hr]
我们仍在努力...
[color=#bcbcbc]We’re still hard at work...[/color]
[hr]
[size=6][b]我们要改变什么？
[color=#bcbcbc]What are we changing?[/color]
[/b][/size]
```

# 未来计划
- ~~逐句人工校对修改~~ √ 已添加
- ~~头尾自定义模块~~ √ 已添加
- 图片爬取
- Gui界面
- 整合为单个程序
- 打包到docker并每日自动化爬取
- 自动发布到MCBBS.co、MCZWLT.net、Bilibili、贴吧
- 移除 HIM
- 修复可能存在的bug
