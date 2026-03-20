(() => {
  'use strict';

  // ----------------------------
  // 状态
  // ----------------------------
  let originalJson = null;
  let editedBlocks = null;
  let customModules = [];
  let blockIdCounter = 0;

  // 默认模块配置（内容可写 BBCode / Markdown，输出时自动转）
  const defaultModulesConfig = [
    {
      id: 'module_sign',
      title: '工具署名',
      content: '[size=2][b]【本文Ai翻译及Ai排版借助了： [url=https://jiubook.github.io/MinecraftJJTools/J2MM_JsonToMcbbsMarkdown.html]J2MM[/url]、[url=https://github.com/jiubook/MinecraftJJTools]JBAiGNN[/url]、[url=https://chatgpt.com/]ChatGPT[/url]、[url=https://claude.com/]Claude[/url]等工具 】[/b][/size]',
      position: 'start',
      enabled: true
    },
    {
      id: 'module_java_snapshot_header',
      title: 'Java版 每周快照 - 开头',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=48,48]https://www.mcbbs.co/data/attachment/common/ea/common_64_icon.png[/img][/float][size=32px][b][color=#645944]每周快照[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][b]每周快照[/b]是 Minecraft Java 版的测试机制，用于新特性的展示和反馈收集。\n[*][color=#8E2609]快照有可能导致存档损坏，因此请注意备份，不要直接在你的主存档游玩快照。[/color]\n[*]转载本帖时须要注明原作者以及本帖地址。[size=0px]本帖来自www.mcbbs.co[/size]\n[*]部分新特性译名仅供参考，不代表最终结果。\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'start',
      enabled: false
    },
    {
      id: 'module_java_prerelease_header',
      title: 'Java版 预发布版 - 开头',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=48,48]https://www.mcbbs.co/data/attachment/common/ea/common_64_icon.png[/img][/float][size=32px][b][color=#645944]预发布版[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][b]预发布版[/b]是 Minecraft Java 版的测试机制，主要是为了收集漏洞反馈，为正式发布做好准备。\n[*][color=#8E2609]预发布版有可能导致存档损坏，因此请注意备份，不要直接在你的主存档游玩预发布版。[/color]\n[*]转载本帖时须要注明原作者以及本帖地址。[size=0px]本帖来自www.mcbbs.co[/size]\n[*]部分新特性译名仅供参考，不代表最终结果。\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'start',
      enabled: false
    },
    {
      id: 'module_java_rc_header',
      title: 'Java版 候选版本 - 开头',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=48,48]https://www.mcbbs.co/data/attachment/common/ea/common_64_icon.png[/img][/float][size=32px][b][color=#645944]候选版本[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][b]候选版本[/b]是 Minecraft Java 版的测试机制。如果没有重大漏洞，该版本将会被用于正式发布。\n[*][color=#8E2609]候选版本有可能导致存档损坏，因此请注意备份，不要直接在你的主存档游玩候选版本。[/color]\n[*]转载本帖时须要注明原作者以及本帖地址。[size=0px]本帖来自www.mcbbs.co[/size]\n[*]部分新特性译名仅供参考，不代表最终结果。\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'start',
      enabled: false
    },
    {
      id: 'module_java_release_header',
      title: 'Java 正式版 - 开头',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=46,48]https://ooo.0o0.ooo/2017/01/30/588f60bbaaf78.png[/img][/float][size=32px][b][color=#645944] Minecraft Java 版[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][b]Minecraft Java 版[/b]是指运行在 Windows、macOS 与 Linux 平台上，使用 Java 语言开发的 Minecraft 版本。\n[*][b]正式版[/b]包含所有特性且安全稳定，所有玩家都可以尽情畅享。\n[*]转载本帖时须要注明原作者以及本帖地址。[size=0px]本帖来自www.mcbbs.co[/size]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'start',
      enabled: false
    },
    {
      id: 'module_bedrock_beta_header',
      title: '基岩版 测试版 - 开头',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=48,48]https://www.mcbbs.co/data/attachment/common/ea/common_64_icon.png[/img][/float][size=32px][b][color=#645944]测试版[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][b]测试版[/b]是 Minecraft 基岩版的测试机制，主要用于下一个正式版的特性预览。\n[*][color=#8E2609]测试版有可能导致存档损坏，因此请注意备份，不要直接在你的主存档游玩测试版。[/color]\n[*]转载本帖时须要注明原作者以及本帖地址。[size=0px]本帖来自www.mcbbs.co[/size]\n[*]部分新特性译名仅供参考，不代表最终结果。\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'start',
      enabled: false
    },
    {
      id: 'module_bedrock_release_header',
      title: '基岩版 正式版 - 开头',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=46,48]https://ooo.0o0.ooo/2017/01/30/588f60bbaaf78.png[/img][/float][size=32px][b][color=#645944]Minecraft 基岩版[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][b]Minecraft 基岩版[/b]是指运行在移动平台（Android、iOS）、Windows 10、主机（Xbox One、Switch、PlayStation 4）上，使用「基岩引擎」（C++语言）开发的 Minecraft 版本。\n[*][b]正式版[/b]包含所有特性且安全稳定，所有玩家都可以尽情畅享。\n[*]转载本帖时须要注明原作者以及本帖地址。[size=0px]本帖来自www.mcbbs.co[/size]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'start',
      enabled: false
    },
    {
      id: 'module_commentary_header',
      title: '时评 - 开头',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=48,48]https://www.mcbbs.co/data/attachment/common/03/common_63_icon.png[/img][/float][size=32px][b][color=#645944]时评[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][b]时评[/b]为玩家对官方消息的分析与探讨，不代表官方意见\n[*]请在交流时保持心平气和\n[*]转载本帖时须要注明原作者以及本帖地址。[size=0px]本帖来自www.mcbbs.co[/size]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'start',
      enabled: false
    },
    {
      id: 'module_normal_header',
      title: '普通资讯/博文 - 开头',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/forum/202603/15/180957i6j4oo2mrn8s6btt.webp[/img][/float][size=24px][b][color=#645944] 转载须知[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*]转载本帖时须要注明原作者以及本帖地址。\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'start',
      enabled: false
    },
    {
      id: 'module_java_snapshot_footer',
      title: 'Java版 每周快照 - 结尾',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/9f/common_56_icon.png[/img][/float][size=24px][b][color=#645944] 实用链接[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://www.minecraft.net/zh-hans/download/server][color=Sienna]官方服务端 jar 下载地址[/color][/url]\n[*][url=https://www.minecraft.net/zh-hans/download/][color=Sienna]正版启动器下载地址[/color][/url]\n[*][url=https://bugs.mojang.com/projects/MC/summary][color=Sienna]漏洞报告站点（仅限英文）[/color][/url]\n[*][url=https://feedback.minecraft.net/][color=Sienna]官方反馈网站（仅限英文）[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/forum/202603/16/015357jo333134doqo4yyo.webp[/img][/float][size=24px][b][color=#645944] 如何游玩快照？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*]对于正版用户：请打开官方启动器，在「配置」选项卡中启用「快照」，选择「最新快照」即可。\n[*]对于非正版用户：请于[url=https://archives.mcbbs.co/read.php?tid=38297][color=Sienna]推荐启动器列表[/color][/url]寻找合适的启动器。目前绝大多数主流启动器都带有下载功能。如仍有疑惑请到[url=https://www.mcbbs.co/forum-59-1.html][color=Sienna]原版问答[/color][/url]板块提问。\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/6c/common_45_icon.png[/img][/float][size=24px][b][color=#645944] 想了解更多资讯？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://archives.mcbbs.co/read.php?tid=874677][color=Sienna]外部来源以及详细的更新条目追踪[/color][/url]\n[*][url=https://www.mcbbs.co/forum-news-1.html][color=Sienna]我的世界中文论坛 - 幻翼块讯板块[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'end',
      enabled: false
    },
    {
      id: 'module_java_prerelease_footer',
      title: 'Java版 预发布版 - 结尾',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/9f/common_56_icon.png[/img][/float][size=24px][b][color=#645944] 实用链接[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://www.minecraft.net/zh-hans/download/server][color=Sienna]官方服务端 jar 下载地址[/color][/url]\n[*][url=https://www.minecraft.net/zh-hans/download/][color=Sienna]正版启动器下载地址[/color][/url]\n[*][url=https://bugs.mojang.com/projects/MC/summary][color=Sienna]漏洞报告站点（仅限英文）[/color][/url]\n[*][url=https://feedback.minecraft.net/][color=Sienna]官方反馈网站（仅限英文）[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/forum/202603/16/015357jo333134doqo4yyo.webp[/img][/float][size=24px][b][color=#645944] 如何游玩预发布版？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*]对于正版用户：请打开官方启动器，在「配置」选项卡中启用「快照」，选择「最新快照」即可。\n[*]对于非正版用户：请于[url=https://archives.mcbbs.co/read.php?tid=38297][color=Sienna]推荐启动器列表[/color][/url]寻找合适的启动器。目前绝大多数主流启动器都带有下载功能。如仍有疑惑请到[url=https://www.mcbbs.co/forum-59-1.html][color=Sienna]原版问答[/color][/url]板块提问。\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/6c/common_45_icon.png[/img][/float][size=24px][b][color=#645944] 想了解更多资讯？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://archives.mcbbs.co/read.php?tid=874677][color=Sienna]外部来源以及详细的更新条目追踪[/color][/url]\n[*][url=https://www.mcbbs.co/forum-news-1.html][color=Sienna]我的世界中文论坛 - 幻翼块讯板块[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'end',
      enabled: false
    },
    {
      id: 'module_java_rc_footer',
      title: 'Java版 候选版本 - 结尾',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/9f/common_56_icon.png[/img][/float][size=24px][b][color=#645944] 实用链接[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://www.minecraft.net/zh-hans/download/server][color=Sienna]官方服务端 jar 下载地址[/color][/url]\n[*][url=https://www.minecraft.net/zh-hans/download/][color=Sienna]正版启动器下载地址[/color][/url]\n[*][url=https://bugs.mojang.com/projects/MC/summary][color=Sienna]漏洞报告站点（仅限英文）[/color][/url]\n[*][url=https://feedback.minecraft.net/][color=Sienna]官方反馈网站（仅限英文）[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/forum/202603/16/015357jo333134doqo4yyo.webp[/img][/float][size=24px][b][color=#645944] 如何游玩候选版本？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*]对于正版用户：请打开官方启动器，在「配置」选项卡中启用「快照」，选择「最新快照」即可。\n[*]对于非正版用户：请于[url=https://archives.mcbbs.co/read.php?tid=38297][color=Sienna]推荐启动器列表[/color][/url]寻找合适的启动器。目前绝大多数主流启动器都带有下载功能。如仍有疑惑请到[url=https://www.mcbbs.co/forum-59-1.html][color=Sienna]原版问答[/color][/url]板块提问。\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/6c/common_45_icon.png[/img][/float][size=24px][b][color=#645944] 想了解更多资讯？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://archives.mcbbs.co/read.php?tid=874677][color=Sienna]外部来源以及详细的更新条目追踪[/color][/url]\n[*][url=https://www.mcbbs.co/forum-news-1.html][color=Sienna]我的世界中文论坛 - 幻翼块讯板块[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'end',
      enabled: false
    },
    {
      id: 'module_java_release_footer',
      title: 'Java 正式版 - 结尾',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/9f/common_56_icon.png[/img][/float][size=24px][b][color=#645944] 实用链接[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://www.minecraft.net/zh-hans/download/server][color=Sienna]官方服务端 jar 下载地址[/color][/url]\n[*][url=https://www.minecraft.net/zh-hans/download/][color=Sienna]正版启动器下载地址[/color][/url]\n[*][url=https://bugs.mojang.com/projects/MC/summary][color=Sienna]漏洞报告站点（仅限英文）[/color][/url]\n[*][url=https://feedback.minecraft.net/][color=Sienna]官方反馈网站（仅限英文）[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/forum/202603/16/015357jo333134doqo4yyo.webp[/img][/float][size=24px][b][color=#645944] 如何游玩正式版？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*]对于正版用户：请打开官方启动器，选择「最新版本」即可。\n[*]对于非正版用户：请于[url=https://archives.mcbbs.co/read.php?tid=38297][color=Sienna]推荐启动器列表[/color][/url]寻找合适的启动器。目前绝大多数主流启动器都带有下载功能。如仍有疑惑请到[url=https://www.mcbbs.co/forum-59-1.html][color=Sienna]原版问答[/color][/url]板块提问。\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/6c/common_45_icon.png[/img][/float][size=24px][b][color=#645944] 想了解更多资讯？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://archives.mcbbs.co/read.php?tid=874677][color=Sienna]外部来源以及详细的更新条目追踪[/color][/url]\n[*][url=https://www.mcbbs.co/forum-news-1.html][color=Sienna]我的世界中文论坛 - 幻翼块讯板块[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'end',
      enabled: false
    },
    {
      id: 'module_bedrock_beta_footer',
      title: '基岩版 测试版 - 结尾',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/9f/common_56_icon.png[/img][/float][size=24px][b][color=#645944] 实用链接[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://bugs.mojang.com/projects/MC/summaryPE][color=Sienna]漏洞报告站点（仅限英文）[/color][/url]\n[*][url=https://feedback.minecraft.net/][color=Sienna]官方反馈网站（仅限英文）[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/forum/202603/16/015357jo333134doqo4yyo.webp[/img][/float][size=24px][b][color=#645944] 如何游玩测试版？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*]请访问[url=https://www.minecraft.net/zh-hans/get-minecraft][color=Sienna]官方游戏获取地址[/color][/url]，根据您所使用的平台获取游戏。\n[*]基岩测试版/预览版仅限于 Windows 10、Android、iOS、Xbox One 平台。请根据[url=https://archives.mcbbs.co/thread-1299939-1-1.html][color=Sienna]官方指引[/color][/url]启用/关闭测试版/预览版。\n[*]在新建/编辑地图时，请滑动到「实验性游戏内容（Experiments）」，即可体验最新内容。\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/6c/common_45_icon.png[/img][/float][size=24px][b][color=#645944] 想了解更多资讯？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://archives.mcbbs.co/read.php?tid=874677][color=Sienna]外部来源以及详细的更新条目追踪[/color][/url]\n[*][url=https://www.mcbbs.co/forum-news-1.html][color=Sienna]我的世界中文论坛 - 幻翼块讯板块[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'end',
      enabled: false
    },
    {
      id: 'module_bedrock_release_footer',
      title: '基岩版 正式版 - 结尾',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/9f/common_56_icon.png[/img][/float][size=24px][b][color=#645944] 实用链接[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://bugs.mojang.com/projects/MC/summaryPE][color=Sienna]漏洞报告站点（仅限英文）[/color][/url]\n[*][url=https://feedback.minecraft.net/][color=Sienna]官方反馈网站（仅限英文）[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/forum/202603/16/015357jo333134doqo4yyo.webp[/img][/float][size=24px][b][color=#645944] 如何游玩测试版？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*]请访问[url=https://www.minecraft.net/zh-hans/get-minecraft][color=Sienna]官方游戏获取地址[/color][/url]，根据您所使用的平台获取游戏。\n[*]在新建/编辑地图时，请滑动到「实验性游戏内容（Experiments）」，即可体验最新内容。\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/6c/common_45_icon.png[/img][/float][size=24px][b][color=#645944] 想了解更多资讯？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://archives.mcbbs.co/read.php?tid=874677][color=Sienna]外部来源以及详细的更新条目追踪[/color][/url]\n[*][url=https://www.mcbbs.co/forum-news-1.html][color=Sienna]我的世界中文论坛 - 幻翼块讯板块[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'end',
      enabled: false
    },
    {
      id: 'module_commentary_footer',
      title: '时评 - 结尾',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/9f/common_56_icon.png[/img][/float][size=24px][b][color=#645944] 本文所涉及的官方消息或媒体评论[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=地址][color=Sienna]标题[/color][/url]\n[*]（如有多项请自行添加）\n[/list][/size][/td][/tr]\n[/table][/font][/align]\n[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/6c/common_45_icon.png[/img][/float][size=24px][b][color=#645944] 想了解更多资讯？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://archives.mcbbs.co/read.php?tid=874677][color=Sienna]外部来源以及详细的更新条目追踪[/color][/url]\n[*][url=https://www.mcbbs.co/forum-news-1.html][color=Sienna]我的世界中文论坛 - 幻翼块讯板块[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'end',
      enabled: false
    },
    {
      id: 'module_normal_footer',
      title: '普通资讯/博文 - 结尾',
      content: '[align=center][font=-apple-system, BlinkMacSystemFont,Segoe UI, Roboto, Helvetica, Arial, sans-serif][table=85%]\n[tr=#E3C99E][td][float=left][img=32,32]https://www.mcbbs.co/data/attachment/common/6c/common_45_icon.png[/img][/float][size=24px][b][color=#645944] 想了解更多资讯？[/color][/b][/size][/td][/tr]\n[tr=#FDF6E5][td][size=16px][list]\n[*][url=https://archives.mcbbs.co/read.php?tid=874677][color=Sienna]外部来源以及详细的更新条目追踪[/color][/url]\n[*][url=https://www.mcbbs.co/forum-news-1.html][color=Sienna]我的世界中文论坛 - 新闻资讯板块[/color][/url]\n[/list][/size][/td][/tr]\n[/table][/font][/align]',
      position: 'end',
      enabled: false
    },
    {
      id: 'module_Agreement',
      title: '开源协议',
      content: '[size=2][b]【本Ai工具以 [url=https://www.gnu.org/licenses/gpl-3.0.zh-cn.html]GPL-3.0[/url] 协议发布】\n【本Ai翻译作品以 [url=https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans]CC BY-SA 4.0[/url] 协议发布】[/b][/size]',
      position: 'end',
      enabled: true
    }
  ];

  // ----------------------------
  // DOM
  // ----------------------------
  const $ = (id) => document.getElementById(id);

  const uploadSection = $('uploadSection');
  const fileInput = $('fileInput');
  const selectFileBtn = $('selectFileBtn');
  const demoBtn = $('demoBtn');

  const translationSection = $('translationSection');
  const translationPanel = $('translationPanel');
  const outputSection = $('outputSection');

  const regenerateBtn = $('regenerateBtn');
  const resetEditsBtn = $('resetEditsBtn');

  const defaultModulesStartContainer = $('defaultModulesStartContainer');
  const defaultModulesEndContainer = $('defaultModulesEndContainer');
  const customModulesContainer = $('customModulesContainer');
  const addCustomModuleBtn = $('addCustomModuleBtn');
  const saveCustomModulesBtn = $('saveCustomModulesBtn');
  const loadCustomModulesBtn = $('loadCustomModulesBtn');

  const bbcodeOutput = $('bbcodeOutput');
  const markdownOutput = $('markdownOutput');
  const previewArea = $('previewArea');
  const statusText = $('statusText');

  const copyMarkdownBtn = $('copyMarkdownBtn');
  const copyBBCodeBtn = $('copyBBCodeBtn');
  const refreshPreviewBtn = $('refreshPreviewBtn');

  // ----------------------------
  // 初始化
  // ----------------------------
  renderDefaultModules();
  loadCustomModulesFromLocalStorage(true);

  // ----------------------------
  // 事件
  // ----------------------------
  selectFileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileUpload);

  demoBtn.addEventListener('click', loadDemoData);

  regenerateBtn.addEventListener('click', generateOutput);
  resetEditsBtn.addEventListener('click', resetEdits);

  addCustomModuleBtn.addEventListener('click', addCustomModule);
  saveCustomModulesBtn.addEventListener('click', saveCustomModulesToLocalStorage);
  loadCustomModulesBtn.addEventListener('click', () => loadCustomModulesFromLocalStorage(false));

  copyMarkdownBtn.addEventListener('click', () => copyToClipboard(markdownOutput.value, copyMarkdownBtn));
  copyBBCodeBtn.addEventListener('click', () => copyToClipboard(bbcodeOutput.value, copyBBCodeBtn));
  refreshPreviewBtn.addEventListener('click', () => {
    previewArea.innerHTML = bbcodeToHtml(bbcodeOutput.value || '');
    updateStatus('预览已刷新', false);
  });

  // 默认模块管理事件（使用事件委托）
  defaultModulesStartContainer.addEventListener('change', handleDefaultModuleChange);
  defaultModulesEndContainer.addEventListener('change', handleDefaultModuleChange);

  function handleDefaultModuleChange(e) {
    const el = e.target;
    const id = el.dataset.mid;
    const field = el.dataset.field;
    if (!id || !field) return;

    const mod = defaultModulesConfig.find(x => x.id === id);
    if (!mod) return;

    if (field === 'enabled') {
      mod.enabled = !!el.checked;

      // 双向联动勾选逻辑
      let linkedModId = null;

      // 如果是开头模块，找到对应的结尾模块
      if (mod.position === 'start' && id.includes('_header')) {
        linkedModId = id.replace('_header', '_footer');
      }
      // 如果是结尾模块，找到对应的开头模块
      else if (mod.position === 'end' && id.includes('_footer')) {
        linkedModId = id.replace('_footer', '_header');
      }

      // 如果找到了关联模块，同步状态
      if (linkedModId) {
        const linkedMod = defaultModulesConfig.find(x => x.id === linkedModId);
        if (linkedMod) {
          linkedMod.enabled = mod.enabled; // 同步勾选状态（勾选或取消）
          renderDefaultModules(); // 重新渲染以更新UI
        }
      }
    }
    if (field === 'position') mod.position = String(el.value);

    generateOutput();
  }

  // 实时预览：BBCode 输出框变更即刷新预览
  const updatePreviewDebounced = debounce(() => {
    try {
      previewArea.innerHTML = bbcodeToHtml(bbcodeOutput.value || '');
    } catch (err) {
      previewArea.innerHTML = `<p style=”color: #e74c3c; padding: 20px;”>预览渲染错误: ${escapeHtml(err.message)}</p>`;
    }
  }, 120);
  bbcodeOutput.addEventListener('input', updatePreviewDebounced);

  // 拖拽上传
  ;['dragenter','dragover'].forEach(evt => {
    uploadSection.addEventListener(evt, (e) => {
      e.preventDefault(); e.stopPropagation();
      uploadSection.classList.add('dragover');
    });
  });
  ;['dragleave','drop'].forEach(evt => {
    uploadSection.addEventListener(evt, (e) => {
      e.preventDefault(); e.stopPropagation();
      uploadSection.classList.remove('dragover');
    });
  });
  uploadSection.addEventListener('drop', (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    fileInput.files = e.dataTransfer.files;
    handleFileUpload({ target: { files: [file] } });
  });

  // ----------------------------
  // 文件处理
  // ----------------------------
  function handleFileUpload(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    const isJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
    if (!isJson) return updateStatus('错误：请选择 JSON 文件', true);

    updateStatus(`正在处理: ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target.result || ''));
        if (!parsed.blocks || !Array.isArray(parsed.blocks)) throw new Error('JSON 必须包含 blocks 数组');

        // 补齐 id
        parsed.blocks.forEach(b => { if (!b.id) b.id = `block_${blockIdCounter++}`; });

        originalJson = parsed;
        editedBlocks = deepClone(parsed.blocks);

        renderTranslationPanel();
        translationSection.style.display = 'block';
        outputSection.style.display = 'flex';

        generateOutput();
        updateStatus('成功：文件已加载，请进行翻译校对并生成输出', false);
      } catch (err) {
        updateStatus(`错误：无效的 JSON 文件 - ${err.message}`, true);
      }
    };
    reader.readAsText(file);
  }

  function loadDemoData() {
    const demoJson = {
      "title": "Another step towards Vibrant Visuals",
      "translated_title": "迈向 Vibrant Visuals 的又一步",
      "release_date": "2026-02-18T15:00:34Z",
      "url": "https://www.minecraft.net/zh-hans/article/another-step-towards-vibrant-visuals-for-java-edition",
      "author": "Staff",
      "description": "We’re still hard at work getting Vibrant Visuals ready for Minecraft: Java Edition...",
      "blocks": [
        {"id":"b0001","type":"p","source_text":"We’re still hard at work getting Vibrant Visuals ready for Minecraft: Java Edition...","translated_text":"我们仍在努力为 Minecraft: Java 版准备 Vibrant Visuals..."},
        {"id":"b0002","type":"blockquote","source_text":"This is a quote block.","translated_text":"这是一个引用块。"},
        {"id":"b0003","type":"h2","source_text":"What are we changing?","translated_text":"我们要改变什么？"},
        {"id":"b0004","type":"p","source_text":"Today, Minecraft: Java Edition uses a technology called OpenGL...","translated_text":"目前，Minecraft: Java 版使用一种名为 OpenGL 的技术..."},
        {"id":"b0005","type":"ul","items":["Item 1","Item 2"],"translated_items":["项目 1","项目 2"]},
        {"id":"b0006","type":"code","source_text":"System.out.println(\"Hello\");","translated_text":""},
        {"id":"b0007","type":"h3","source_text":"Introducing: Vulkan","translated_text":"介绍：Vulkan"},
        {"id":"b0008","type":"p","source_text":"Vulkan is a graphics API that has a 10-year history...","translated_text":"Vulkan 是一种已有十年市场历史的图形 API..."}
      ]
    };

    originalJson = demoJson;
    editedBlocks = deepClone(demoJson.blocks);
    renderTranslationPanel();
    translationSection.style.display = 'block';
    outputSection.style.display = 'flex';
    generateOutput();
    updateStatus('成功：已加载示例数据，可进行翻译校对', false);
  }

  // ----------------------------
  // 翻译校对面板
  // ----------------------------
  /**
   * 渲染翻译面板：将编辑后的块渲染为可交互的UI元素
   * 功能：
   * - 为每个块创建可展开/折叠的编辑区域
   * - 支持列表类型(ul/ol)和普通文本类型的不同编辑界面
   * - 提供保存、上移、下移、删除等操作按钮
   * - 支持点击类型标签修改块类型
   */
  function renderTranslationPanel() {
    translationPanel.innerHTML = '';
    if (!editedBlocks) return;

    editedBlocks.forEach((block, index) => {
      const div = document.createElement('div');
      div.className = 'block-item';
      div.dataset.blockId = block.id;

      const typeLabel = String(block.type || 'p');

      // 构建预览文本：中文在上，英文在下（双行模式）
      let previewHtml = '';
      if (typeLabel === 'img' || typeLabel === 'image') {
        // 图片类型：显示缩略图和URL
        const imgSrc = block.meta && block.meta.src ? String(block.meta.src).trim() : '';
        const imgAlt = block.meta && block.meta.alt ? String(block.meta.alt).trim() : '';
        if (imgSrc) {
          previewHtml = `<div style="display: flex; align-items: center; gap: 10px;">
            <img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(imgAlt)}" style="max-width: 120px; max-height: 80px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;">
            <div style="flex: 1; font-size: 0.85rem; color: #555; word-break: break-all;">${escapeHtml(imgSrc)}</div>
          </div>`;
        } else {
          previewHtml = `<span style="color: #999; font-style: italic;">无图片URL</span>`;
        }
      } else if (typeLabel === 'ul' || typeLabel === 'ol') {
        const translatedItems = Array.isArray(block.translated_items) ? block.translated_items : [];
        const items = Array.isArray(block.items) ? block.items : [];
        const translatedText = translatedItems.join(', ').slice(0, 80);
        const sourceText = items.join(', ').slice(0, 80);

        if (translatedText && sourceText && translatedText !== sourceText) {
          previewHtml = `<span class="preview-translated">${escapeHtml(translatedText)}</span><span class="preview-source">${escapeHtml(sourceText)}</span>`;
        } else if (translatedText) {
          previewHtml = `<span class="preview-translated">${escapeHtml(translatedText)}</span>`;
        } else if (sourceText) {
          previewHtml = `<span class="preview-source">${escapeHtml(sourceText)}</span>`;
        }
      } else {
        const translated = String(block.translated_text || '').trim().slice(0, 80);
        const source = String(block.source_text || '').trim().slice(0, 80);

        if (translated && source && translated !== source) {
          previewHtml = `<span class="preview-translated">${escapeHtml(translated)}</span><span class="preview-source">${escapeHtml(source)}</span>`;
        } else if (translated) {
          previewHtml = `<span class="preview-translated">${escapeHtml(translated)}</span>`;
        } else if (source) {
          previewHtml = `<span class="preview-source">${escapeHtml(source)}</span>`;
        }
      }

      let editorHtml = '';
      if (typeLabel === 'img' || typeLabel === 'image') {
        // 图片类型：只显示URL和alt文本编辑，不需要原文译文
        const imgSrc = block.meta && block.meta.src ? String(block.meta.src).trim() : '';
        const imgAlt = block.meta && block.meta.alt ? String(block.meta.alt).trim() : '';
        editorHtml = `
          <div class="block-edit-area" style="grid-template-columns: 1fr;">
            <div>
              <label>图片URL:</label>
              <input type="text" class="block-img-src" value="${escapeAttr(imgSrc)}" placeholder="https://...">
            </div>
            <div>
              <label>图片描述 (Alt Text):</label>
              <textarea class="block-img-alt" style="min-height: 60px;">${escapeHtml(imgAlt)}</textarea>
            </div>
          </div>
        `;
      } else if (typeLabel === 'ul' || typeLabel === 'ol') {
        const items = Array.isArray(block.items) ? block.items : [];
        const translatedItems = Array.isArray(block.translated_items) ? block.translated_items : [];
        const rows = items.map((item, i) => `
          <li>
            <input type="text" data-field="source" data-idx="${i}" value="${escapeAttr(item)}" placeholder="原文 ${i+1}">
            <input type="text" data-field="translated" data-idx="${i}" value="${escapeAttr(translatedItems[i] || '')}" placeholder="译文 ${i+1}">
          </li>
        `).join('');
        editorHtml = `
          <div class="block-edit-area" style="grid-template-columns: 1fr;">
            <ul>${rows}</ul>
          </div>
        `;
      } else {
        editorHtml = `
          <div class="block-edit-area">
            <div>
              <label>原文 (Source):</label>
              <textarea class="block-source-edit">${escapeHtml(block.source_text || '')}</textarea>
            </div>
            <div>
              <label>译文 (Translated):</label>
              <textarea class="block-translated-edit">${escapeHtml(block.translated_text || '')}</textarea>
            </div>
          </div>
        `;
      }

      div.innerHTML = `
        <div class="block-header">
          <span>Block ${index + 1} <span class="block-type" title="点击修改类型">${escapeHtml(typeLabel)}</span></span>
          <span style="font-size: 0.85rem; color: #888;">ID: ${escapeHtml(block.id)}</span>
        </div>
        <div class="block-content-preview">${previewHtml || ''}</div>
        <div class="block-edit-area-wrapper" style="display:none;">
          ${editorHtml}
          <div class="block-actions">
            <button class="btn small secondary" data-action="save"><i class="fas fa-save"></i> 保存</button>
            <button class="btn small" data-action="up"><i class="fas fa-arrow-up"></i> 上移</button>
            <button class="btn small" data-action="down"><i class="fas fa-arrow-down"></i> 下移</button>
            <button class="btn small danger" data-action="remove"><i class="fas fa-trash"></i> 删除</button>
          </div>
        </div>
      `;

      div.addEventListener('click', (e) => {
        const tag = e.target.tagName;
        if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.closest('button')) return;

        const wrapper = div.querySelector('.block-edit-area-wrapper');
        const isExpanded = div.classList.contains('expanded');

        document.querySelectorAll('.block-item.expanded').forEach(item => {
          if (item !== div) {
            item.classList.remove('expanded');
            const w = item.querySelector('.block-edit-area-wrapper');
            if (w) w.style.display = 'none';
          }
        });

        div.classList.toggle('expanded', !isExpanded);
        wrapper.style.display = isExpanded ? 'none' : 'block';
      });

      div.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        e.stopPropagation();

        const action = btn.dataset.action;
        if (action === 'save') updateBlockFromUI(block.id);
        if (action === 'up') moveBlock(block.id, -1);
        if (action === 'down') moveBlock(block.id, 1);
        if (action === 'remove') removeBlock(block.id);
      });

      // 点击类型标签可修改 block.type（p/h1/h2/...）
      div.addEventListener('click', (e) => {
        const typeEl = e.target.closest('.block-type');
        if (!typeEl) return;
        e.stopPropagation();

        const allowedTypes = ['p','h1','h2','h3','h4','blockquote','ul','ol','code','img'];
        const current = String(block.type || 'p').toLowerCase();

        // 用 select 临时替换，修改后重渲染恢复为 span
        const sel = document.createElement('select');
        sel.className = 'block-type-select';
        allowedTypes.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t;
          opt.textContent = t;
          sel.appendChild(opt);
        });
        sel.value = allowedTypes.includes(current) ? current : 'p';

        typeEl.replaceWith(sel);
        sel.focus();

        const commit = () => {
          const newType = String(sel.value || 'p').toLowerCase();
          setBlockType(block.id, newType);
        };

        sel.addEventListener('change', commit);
        sel.addEventListener('blur', commit);
      });

      translationPanel.appendChild(div);
    });
  }


  /**
   * 规范化行：将文本按行分割，去除空行和首尾空白
   * @param {string} t - 输入文本
   * @returns {string[]} 规范化后的行数组
   */
  function normalizeLines(t) {
    return String(t || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);
  }

  /**
   * 设置块的类型：修改块的type属性并重新渲染
   * 支持类型转换：文本类型 <-> 列表类型(ul/ol)
   * @param {string} blockId - 块ID
   * @param {string} newType - 新类型(p/h1/h2/h3/h4/blockquote/ul/ol/code/img)
   */
  function setBlockType(blockId, newType) {
    if (!editedBlocks) return;
    const block = editedBlocks.find(b => b.id === blockId);
    if (!block) return;

    const oldType = String(block.type || 'p').toLowerCase();
    const nt = String(newType || 'p').toLowerCase();

    if (oldType === nt) {
      renderTranslationPanel();
      return;
    }

    // 转换为img类型
    if (nt === 'img' || nt === 'image') {
      if (!block.meta) block.meta = {};
      // 如果之前没有meta.src，尝试从source_text获取
      if (!block.meta.src && block.source_text) {
        block.meta.src = block.source_text;
      }
      block.source_text = '';
      block.translated_text = '';
      delete block.items;
      delete block.translated_items;
    }
    // 从img类型转换出来
    else if (oldType === 'img' || oldType === 'image') {
      const imgSrc = block.meta && block.meta.src ? block.meta.src : '';
      const imgAlt = block.meta && block.meta.alt ? block.meta.alt : '';
      if (nt === 'ul' || nt === 'ol') {
        block.items = imgSrc ? [imgSrc] : [];
        block.translated_items = imgAlt ? [imgAlt] : [];
        delete block.source_text;
        delete block.translated_text;
      } else {
        block.source_text = imgSrc;
        block.translated_text = imgAlt;
        delete block.items;
        delete block.translated_items;
      }
    }
    // ul/ol 需要 items；从文本类型切过来时自动按行拆分
    else if (nt === 'ul' || nt === 'ol') {
      const srcItems = Array.isArray(block.items) && block.items.length ? block.items : normalizeLines(block.source_text);
      const trItems  = Array.isArray(block.translated_items) && block.translated_items.length ? block.translated_items : normalizeLines(block.translated_text);
      block.items = srcItems;
      block.translated_items = trItems;
      delete block.source_text;
      delete block.translated_text;
    } else if (oldType === 'ul' || oldType === 'ol') {
      // 从列表切回文本：把 items 合并为多行文本
      block.source_text = (Array.isArray(block.items) ? block.items : []).join('\n');
      block.translated_text = (Array.isArray(block.translated_items) ? block.translated_items : []).join('\n');
      delete block.items;
      delete block.translated_items;
    }

    block.type = nt;

    renderTranslationPanel();
    generateOutput();
    updateStatus('已修改 block 类型', false);
  }

  /**
   * 从UI更新块数据：将用户在界面中的编辑保存到块对象
   * @param {string} blockId - 块ID
   */
  function updateBlockFromUI(blockId) {
    const block = editedBlocks.find(b => b.id === blockId);
    if (!block) return;

    const container = document.querySelector(`.block-item[data-block-id="${cssEscape(blockId)}"]`);
    if (!container) return;

    const type = String(block.type || 'p').toLowerCase();
    if (type === 'img' || type === 'image') {
      // 图片类型：保存到meta字段
      const srcInput = container.querySelector('.block-img-src');
      const altInput = container.querySelector('.block-img-alt');
      if (!block.meta) block.meta = {};
      if (srcInput) block.meta.src = srcInput.value;
      if (altInput) block.meta.alt = altInput.value;
      // 清空source_text和translated_text
      block.source_text = '';
      block.translated_text = '';
    } else if (type === 'ul' || type === 'ol') {
      const sources = [...container.querySelectorAll('input[data-field="source"]')];
      const trans = [...container.querySelectorAll('input[data-field="translated"]')];
      block.items = sources.map(i => i.value);
      block.translated_items = trans.map(i => i.value);
    } else {
      const sourceArea = container.querySelector('.block-source-edit');
      const transArea = container.querySelector('.block-translated-edit');
      if (sourceArea) block.source_text = sourceArea.value;
      if (transArea) block.translated_text = transArea.value;
    }

    updateStatus('已保存 block 更改', false);
    generateOutput();
  }

  /**
   * 移动块：在列表中上移或下移块的位置
   * @param {string} blockId - 块ID
   * @param {number} direction - 移动方向(-1:上移, 1:下移)
   */
  function moveBlock(blockId, direction) {
    const idx = editedBlocks.findIndex(b => b.id === blockId);
    if (idx < 0) return;
    const nidx = idx + direction;
    if (nidx < 0 || nidx >= editedBlocks.length) return;
    const tmp = editedBlocks[idx];
    editedBlocks[idx] = editedBlocks[nidx];
    editedBlocks[nidx] = tmp;
    renderTranslationPanel();
    generateOutput();
  }

  /**
   * 删除块：从列表中移除指定块
   * @param {string} blockId - 块ID
   */
  function removeBlock(blockId) {
    if (!confirm('确定要删除这个 block 吗？')) return;
    editedBlocks = editedBlocks.filter(b => b.id !== blockId);
    renderTranslationPanel();
    generateOutput();
  }

  /**
   * 重置编辑：恢复到原始JSON数据
   */
  function resetEdits() {
    if (!originalJson) return;
    editedBlocks = deepClone(originalJson.blocks);
    renderTranslationPanel();
    generateOutput();
    updateStatus('已重置所有编辑', false);
  }

  // ----------------------------
  // 模块管理
  // ----------------------------
  function renderDefaultModules() {
    defaultModulesStartContainer.innerHTML = '';
    defaultModulesEndContainer.innerHTML = '';

    // 分离开头和结尾模块
    const startModules = defaultModulesConfig.filter(m => m.position === 'start');
    const endModules = defaultModulesConfig.filter(m => m.position === 'end');

    // 将固定模块和普通模块分开
    const normalStartModules = startModules.filter(m => m.id !== 'module_sign');
    const fixedStartModule = startModules.find(m => m.id === 'module_sign');

    const normalEndModules = endModules.filter(m => m.id !== 'module_Agreement');
    const fixedEndModule = endModules.find(m => m.id === 'module_Agreement');

    // 渲染开头模块 - 先渲染普通模块，再渲染固定模块
    normalStartModules.forEach(m => {
      const div = document.createElement('div');
      div.className = 'module-item module-default module-compact';

      div.innerHTML = `
        <label class="module-checkbox">
          <input type="checkbox" ${m.enabled ? 'checked' : ''} data-mid="${escapeAttr(m.id)}" data-field="enabled">
          <span>${escapeHtml(m.title)}</span>
        </label>
      `;
      defaultModulesStartContainer.appendChild(div);
    });

    // 渲染固定的工具署名模块（放在最下方）
    if (fixedStartModule) {
      const div = document.createElement('div');
      div.className = 'module-item module-default module-compact';

      div.innerHTML = `
        <label class="module-checkbox module-fixed">
          <input type="checkbox" ${fixedStartModule.enabled ? 'checked' : ''} disabled data-mid="${escapeAttr(fixedStartModule.id)}" data-field="enabled">
          <span>${escapeHtml(fixedStartModule.title)}</span>
        </label>
      `;
      defaultModulesStartContainer.appendChild(div);
    }

    // 渲染结尾模块 - 先渲染普通模块，再渲染固定模块
    normalEndModules.forEach(m => {
      const div = document.createElement('div');
      div.className = 'module-item module-default module-compact';

      div.innerHTML = `
        <label class="module-checkbox">
          <input type="checkbox" ${m.enabled ? 'checked' : ''} data-mid="${escapeAttr(m.id)}" data-field="enabled">
          <span>${escapeHtml(m.title)}</span>
        </label>
      `;
      defaultModulesEndContainer.appendChild(div);
    });

    // 渲染固定的开源协议模块（放在最下方）
    if (fixedEndModule) {
      const div = document.createElement('div');
      div.className = 'module-item module-default module-compact';

      div.innerHTML = `
        <label class="module-checkbox module-fixed">
          <input type="checkbox" ${fixedEndModule.enabled ? 'checked' : ''} disabled data-mid="${escapeAttr(fixedEndModule.id)}" data-field="enabled">
          <span>${escapeHtml(fixedEndModule.title)}</span>
        </label>
      `;
      defaultModulesEndContainer.appendChild(div);
    }
  }

  function renderCustomModules() {
    customModulesContainer.innerHTML = '';
    customModules.forEach((m) => {
      const div = document.createElement('div');
      div.className = 'module-item';
      div.innerHTML = `
        <h4>${escapeHtml(m.title)}</h4>
        <input type="text" value="${escapeAttr(m.title)}" placeholder="模块标题" data-mid="${escapeAttr(m.id)}" data-field="title">
        <textarea placeholder="模块内容（支持 BBCode/Markdown）" data-mid="${escapeAttr(m.id)}" data-field="content">${escapeHtml(m.content)}</textarea>
        <div class="module-controls">
          <label><input type="checkbox" ${m.enabled ? 'checked' : ''} data-mid="${escapeAttr(m.id)}" data-field="enabled"> 启用</label>
          <label>位置：
            <select data-mid="${escapeAttr(m.id)}" data-field="position">
              <option value="start" ${m.position === 'start' ? 'selected' : ''}>开头</option>
              <option value="end" ${m.position === 'end' ? 'selected' : ''}>结尾</option>
            </select>
          </label>
          <button class="btn small danger" data-mid="${escapeAttr(m.id)}" data-action="remove"><i class="fas fa-trash"></i> 删除</button>
        </div>
      `;
      customModulesContainer.appendChild(div);
    });
  }

  customModulesContainer.addEventListener('input', debounce((e) => {
    const el = e.target;
    const id = el.dataset.mid;
    const field = el.dataset.field;
    if (!id || !field) return;

    const mod = customModules.find(x => x.id === id);
    if (!mod) return;

    if (field === 'title') mod.title = String(el.value || '');
    if (field === 'content') mod.content = String(el.value || '');
    generateOutput();
  }, 150));

  customModulesContainer.addEventListener('change', (e) => {
    const el = e.target;
    const id = el.dataset.mid;
    const field = el.dataset.field;
    if (!id || !field) return;

    const mod = customModules.find(x => x.id === id);
    if (!mod) return;

    if (field === 'enabled') mod.enabled = !!el.checked;
    if (field === 'position') mod.position = String(el.value);
    generateOutput();
  });

  customModulesContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.mid;
    const action = btn.dataset.action;
    if (action === 'remove') {
      customModules = customModules.filter(x => x.id !== id);
      renderCustomModules();
      generateOutput();
      updateStatus('自定义模块已删除', false);
    }
  });

  function addCustomModule() {
    const id = `custom_module_${Date.now()}`;
    customModules.push({
      id,
      title: `自定义模块 ${customModules.length + 1}`,
      content: '在此处输入自定义模块的内容...',
      position: 'end',
      enabled: true
    });
    renderCustomModules();
    generateOutput();
    updateStatus('已添加自定义模块', false);
  }

  function saveCustomModulesToLocalStorage() {
    try {
      localStorage.setItem('customModules', JSON.stringify(customModules));
      updateStatus('自定义模块配置已保存到本地', false);
    } catch (e) {
      updateStatus('保存失败：' + e.message, true);
    }
  }

  function loadCustomModulesFromLocalStorage(silent) {
    try {
      const saved = localStorage.getItem('customModules');
      if (saved) {
        const parsed = JSON.parse(saved);
        customModules = Array.isArray(parsed) ? parsed : [];
        renderCustomModules();
        if (!silent) {
          generateOutput();
          updateStatus('自定义模块配置已从本地加载', false);
        }
      } else if (!silent) {
        updateStatus('未找到保存的配置', true);
      }
    } catch (e) {
      if (!silent) updateStatus('加载失败：' + e.message, true);
    }
  }

  // ----------------------------
  // 输出生成：实时生成BBCode和Markdown输出
  // ----------------------------
  /**
   * 生成输出：将编辑后的块转换为BBCode和Markdown格式
   * 同时更新预览区域（使用BBCode转HTML）
   */
  function generateOutput() {
    if (!originalJson || !editedBlocks) return;

    try {
      const bbcode = convertJsonToBBCode(originalJson, editedBlocks);
      const markdown = convertJsonToMarkdown(originalJson, editedBlocks);

      bbcodeOutput.value = bbcode;
      markdownOutput.value = markdown;

      // 预览永远以 BBCode 输出为准
      previewArea.innerHTML = bbcodeToHtml(bbcode);

      updateStatus('输出已更新', false);
    } catch (err) {
      updateStatus(`生成输出时出错: ${err.message}`, true);
      previewArea.innerHTML = `<p style="color: #e74c3c; padding: 20px;">生成预览时出错: ${escapeHtml(err.message)}</p>`;
    }
  }

  /**
   * 将JSON数据转换为BBCode格式
   * @param {Object} json - 原始JSON数据（包含标题、作者等元信息）
   * @param {Array} blocks - 编辑后的块数组
   * @returns {string} BBCode格式的完整文本
   */
  function convertJsonToBBCode(json, blocks) {
    const title = String((json.translated_title || json.title || '')).trim();
    const enTitle = String((json.title || '')).trim();
    const url = String((json.url || '')).trim();
    const author = String((json.author || '')).trim();
    const desc = String((json.description || '')).trim();
    const release = formatDateTimeCN(json.release_date);

    let out = '';

    out += `[align=center][size=5][b]NEWS[/b][/size][/align]\n`;
    if (title) out += `[align=center][size=6][b]${escapeBB(title)}[/b][/size][/align]\n`;
    if (enTitle && enTitle !== title) out += `[align=center][size=4]${escapeBB(enTitle)}[/size][/align]\n\n`;

    const metaLines = [];
    if (release) metaLines.push(`[b]时间：[/b] ${escapeBB(release)}`);
    if (author) metaLines.push(`[b]作者：[/b] ${escapeBB(author)}`);
    if (url) metaLines.push(`[b]原文：[/b] [url=${escapeBB(url)}]${escapeBB(url)}[/url]`);
    if (desc) metaLines.push(`[b]简介：[/b][i]${escapeBB(desc)}[/i]`);
    if (metaLines.length) out += `[quote]${metaLines.join('\n')}[/quote]`;

    out += `\n`;

    if (!blocks || !blocks.length) {
      out += `[i]（未找到 blocks 或 blocks 为空）[/i]`;
      return insertModulesBBCode(out.trim());
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockType = String(block.type || 'p').toLowerCase();

      // 如果是 li 类型，收集连续的 li blocks 并构建嵌套列表
      if (blockType === 'li') {
        const listBlocks = [];
        let j = i;
        while (j < blocks.length && String(blocks[j].type || 'p').toLowerCase() === 'li') {
          listBlocks.push(blocks[j]);
          j++;
        }

        // 渲染嵌套列表
        out += renderNestedListBBCode(listBlocks) + '\n';

        // 跳过已处理的 li blocks
        i = j - 1;

        const next = blocks[i + 1];
        const nextType = next ? String(next.type || 'p').toLowerCase() : '';
        if (['h1','h2'].includes(nextType)) out += `\n[hr]\n`;
        continue;
      }

      out += renderBlockBBCode(block) + '\n';

      const next = blocks[i + 1];
      const nextType = next ? String(next.type || 'p').toLowerCase() : '';
      // 只在主要标题前添加分隔符
      if (['h1','h2'].includes(nextType)) out += `\n[hr]\n`;
    }

    return insertModulesBBCode(out.trim());
  }

  /**
   * 插入模块到BBCode内容：在主内容前后插入启用的模块
   * @param {string} mainBB - 主BBCode内容
   * @returns {string} 插入模块后的完整BBCode
   */
  function insertModulesBBCode(mainBB) {
    const modules = collectEnabledModules().map(m => ({
      position: m.position,
      content: sanitizeForBBCode(m.content)
    }));

    const start = modules.filter(x => x.position === 'start').map(x => x.content).filter(Boolean).join('\n\n');
    const end = modules.filter(x => x.position === 'end').map(x => x.content).filter(Boolean).join('\n\n');

    let final = '';
    if (start) final += start + '\n\n[hr]\n\n';
    final += mainBB;
    if (end) final += '\n\n[hr]\n\n' + end;
    return final.trim();
  }

  /**
   * 将JSON数据转换为Markdown格式
   * @param {Object} json - 原始JSON数据（包含标题、作者等元信息）
   * @param {Array} blocks - 编辑后的块数组
   * @returns {string} Markdown格式的完整文本
   */
  function convertJsonToMarkdown(json, blocks) {
    const title = String((json.translated_title || json.title || '')).trim();
    const enTitle = String((json.title || '')).trim();
    const url = String((json.url || '')).trim();
    const author = String((json.author || '')).trim();
    const desc = String((json.description || '')).trim();
    const release = formatDateTimeCN(json.release_date);

    let out = '';
    out += `**NEWS**\n\n`;
    if (title) out += `# ${title}\n`;
    if (enTitle && enTitle !== title) out += `_${enTitle}_\n`;
    out += `\n`;

    const meta = [];
    if (release) meta.push(`- 时间：${release}`);
    if (author) meta.push(`- 作者：${author}`);
    if (url) meta.push(`- 原文：${url}`);
    if (desc) meta.push(`- 简介：${stripNewlines(desc)}`);
    if (meta.length) out += meta.join('\n') + `\n\n`;

    if (!blocks || !blocks.length) return insertModulesMarkdown((out + `（未找到 blocks 或 blocks 为空）`).trim());

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockType = String(block.type || 'p').toLowerCase();

      // 如果是 li 类型，收集连续的 li blocks 并构建嵌套列表
      if (blockType === 'li') {
        const listBlocks = [];
        let j = i;
        while (j < blocks.length && String(blocks[j].type || 'p').toLowerCase() === 'li') {
          listBlocks.push(blocks[j]);
          j++;
        }

        // 渲染嵌套列表
        out += renderNestedListMarkdown(listBlocks) + '\n\n';

        // 跳过已处理的 li blocks
        i = j - 1;

        const next = blocks[i + 1];
        const nextType = next ? String(next.type || 'p').toLowerCase() : '';
        if (['h1','h2'].includes(nextType)) out += `---\n\n`;
        continue;
      }

      const next = blocks[i + 1];
      out += renderBlockMarkdown(block) + '\n\n';

      const nextType = next ? String(next.type || 'p').toLowerCase() : '';
      // 只在主要标题前添加分隔符
      if (['h1','h2'].includes(nextType)) out += `---\n\n`;
    }

    return insertModulesMarkdown(out.trim());
  }

  /**
   * 插入模块到Markdown内容：在主内容前后插入启用的模块
   * @param {string} mainMd - 主Markdown内容
   * @returns {string} 插入模块后的完整Markdown
   */
  function insertModulesMarkdown(mainMd) {
    const modules = collectEnabledModules().map(m => ({
      position: m.position,
      content: sanitizeForMarkdown(m.content)
    }));

    const start = modules.filter(x => x.position === 'start').map(x => x.content).filter(Boolean).join('\n\n');
    const end = modules.filter(x => x.position === 'end').map(x => x.content).filter(Boolean).join('\n\n');

    let final = '';
    if (start) final += start + '\n\n---\n\n';
    final += mainMd;
    if (end) final += '\n\n---\n\n' + end;
    return final.trim();
  }

  function collectEnabledModules() {
    const defaults = defaultModulesConfig.filter(m => m.enabled);
    const customs = customModules.filter(m => m.enabled);
    return [...defaults, ...customs];
  }

  // ----------------------------
  // block 渲染（正文）
  // ----------------------------
  /**
   * 渲染嵌套列表（BBCode格式）
   * @param {Array} listBlocks - 连续的 li 类型 blocks
   * @returns {string} BBCode格式的嵌套列表
   */
  function renderNestedListBBCode(listBlocks) {
    if (!listBlocks || !listBlocks.length) return '';

    const duo = (main, sub) => {
      if (main && sub && main === sub) return main;
      if (main && sub) return `${main}\n[color=#bcbcbc]${sub}[/color]`;
      return main || sub || '';
    };

    let output = '';
    let currentLevel = -1;
    const levelStack = []; // 跟踪每个层级的开始位置

    for (let i = 0; i < listBlocks.length; i++) {
      const block = listBlocks[i];
      const indentLevel = (block.meta && typeof block.meta.indent_level === 'number') ? block.meta.indent_level : 0;

      const src = normalizeText(block.source_text || '');
      const tr = normalizeText(block.translated_text || '');
      const srcBB = mdLinksToBBCode(src);
      const trBB = mdLinksToBBCode(tr);

      // 如果层级增加，打开新的 [list]
      while (indentLevel > currentLevel) {
        output += '[list]\n';
        currentLevel++;
        levelStack.push(currentLevel);
      }

      // 如果层级减少，关闭 [/list]
      while (indentLevel < currentLevel && levelStack.length > 0) {
        output += '[/list]\n';
        levelStack.pop();
        currentLevel--;
      }

      // 添加列表项
      const content = duo(escapeBB(trBB), escapeBB(srcBB));
      output += `[*]${content}\n`;
    }

    // 关闭所有未关闭的 [list]
    while (levelStack.length > 0) {
      output += '[/list]\n';
      levelStack.pop();
    }

    return output.trim();
  }

  /**
   * 渲染嵌套列表（Markdown格式）
   * @param {Array} listBlocks - 连续的 li 类型 blocks
   * @returns {string} Markdown格式的嵌套列表
   */
  function renderNestedListMarkdown(listBlocks) {
    if (!listBlocks || !listBlocks.length) return '';

    let output = '';

    for (let i = 0; i < listBlocks.length; i++) {
      const block = listBlocks[i];
      const indentLevel = (block.meta && typeof block.meta.indent_level === 'number') ? block.meta.indent_level : 0;

      const src = normalizeText(block.source_text || '');
      const tr = normalizeText(block.translated_text || '');

      // 生成缩进（每层 4 个空格）
      const indent = '    '.repeat(indentLevel);

      // 如果译文和原文相同，只输出一次
      if (tr && src && tr === src) {
        output += `${indent}- ${tr}\n`;
      } else if (tr && src) {
        // 译文和原文都存在，输出两行
        output += `${indent}- ${tr}\n`;
        output += `${indent}- ${src}\n`;
      } else if (tr) {
        // 只有译文
        output += `${indent}- ${tr}\n`;
      } else if (src) {
        // 只有原文
        output += `${indent}- ${src}\n`;
      }
    }

    return output.trim();
  }

  function renderBlockBBCode(block) {
    const type = String(block.type || 'p').toLowerCase();
    const src = normalizeText(block.source_text || '');
    const tr = normalizeText(block.translated_text || '');

    const srcBB = mdLinksToBBCode(src);
    const trBB  = mdLinksToBBCode(tr);

    const duo = (main, sub) => {
      // 如果原文和译文相同，只输出一次
      if (main && sub && main === sub) return main;
      if (main && sub) return `${main}\n[color=#bcbcbc]${sub}[/color]\n`;
      return main || sub || '';
    };

    if (type === 'ul' || type === 'ol') {
      const items = Array.isArray(block.items) ? block.items : [];
      const translatedItems = Array.isArray(block.translated_items) ? block.translated_items : [];
      const tag = type === 'ol' ? 'list=1' : 'list';
      const li = items.map((item, i) => {
        const itemSrc = mdLinksToBBCode(normalizeText(item));
        const itemTr = mdLinksToBBCode(normalizeText(translatedItems[i] || ''));
        // 如果原文和译文相同，只输出一次
        if (itemTr && itemSrc === itemTr) return `[*]${escapeBB(itemSrc)}`;
        if (itemTr) return `[*]${escapeBB(itemTr)}\n[color=#bcbcbc]${escapeBB(itemSrc)}[/color]`;
        return `[*]${escapeBB(itemSrc)}`;
      }).join('\n');
      return `[${tag}]\n${li}\n[/list]`;
    }

    if (type === 'h1') return `[size=6][b]${duo(escapeBB(trBB), escapeBB(srcBB))}[/b][/size]`;
    if (type === 'h2') return `[size=6][b]${duo(escapeBB(trBB), escapeBB(srcBB))}[/b][/size]`;
    if (type === 'h3') return `[size=5][b]${duo(escapeBB(trBB), escapeBB(srcBB))}[/b][/size]`;
    if (type === 'h4') return `[size=4][b]${duo(escapeBB(trBB), escapeBB(srcBB))}[/b][/size]`;
    if (type === 'blockquote' || type === 'quote') return `[quote]${duo(escapeBB(trBB), escapeBB(srcBB))}[/quote]`;
    if (type === 'code' || type === 'pre') return `[code]${escapeBB(src || tr || '')}[/code]`;
    if (type === 'img' || type === 'image') {
      const u = block.meta && block.meta.src ? String(block.meta.src).trim() : '';
      const alt = block.meta && block.meta.alt ? String(block.meta.alt).trim() : '';
      if (!u) return alt ? `[i]${escapeBB(alt)}[/i]` : '';
      return `[align=center][img]${escapeBB(u)}[/img][/align]`;
    }
    if (type === 'li') {
      // li 应该由 renderNestedListBBCode 处理，这里只是后备
      const duo = (main, sub) => {
        if (main && sub && main === sub) return main;
        if (main && sub) return `${main}\n[color=#bcbcbc]${sub}[/color]`;
        return main || sub || '';
      };
      return `[*]${duo(escapeBB(trBB), escapeBB(srcBB))}`;
    }
    return duo(escapeBB(trBB), escapeBB(srcBB));
  }

  function renderBlockMarkdown(block) {
    const type = String(block.type || 'p').toLowerCase();
    const src = normalizeText(block.source_text || '');
    const tr = normalizeText(block.translated_text || '');

    const duo = (main, sub) => {
      // 如果原文和译文相同，只输出一次
      if (main && sub && main === sub) return main;
      if (main && sub) return `${main}\n\n> ${sub.replace(/\n/g, '\n> ')}`;
      return main || (sub ? `> ${sub.replace(/\n/g, '\n> ')}` : '');
    };

    if (type === 'ul' || type === 'ol') {
      const items = Array.isArray(block.items) ? block.items : [];
      const translatedItems = Array.isArray(block.translated_items) ? block.translated_items : [];
      const ordered = type === 'ol';

      return items.map((it, i) => {
        const itemSrc = normalizeText(it);
        const itemTr = normalizeText(translatedItems[i] || '');
        // 如果原文和译文相同，只输出一次
        if (itemTr && itemSrc === itemTr) return ordered ? `${i+1}. ${itemSrc}` : `- ${itemSrc}`;
        if (itemTr) return ordered ? `${i+1}. ${itemTr}\n   > ${itemSrc}` : `- ${itemTr}\n  > ${itemSrc}`;
        return ordered ? `${i+1}. ${itemSrc}` : `- ${itemSrc}`;
      }).join('\n');
    }

    if (type === 'h1') return `# ${stripNewlines(tr || src)}${(src && tr && src !== tr) ? `\n\n> ${stripNewlines(src)}` : ''}`.trim();
    if (type === 'h2') return `## ${stripNewlines(tr || src)}${(src && tr && src !== tr) ? `\n\n> ${stripNewlines(src)}` : ''}`.trim();
    if (type === 'h3') return `### ${stripNewlines(tr || src)}${(src && tr && src !== tr) ? `\n\n> ${stripNewlines(src)}` : ''}`.trim();
    if (type === 'h4') return `#### ${stripNewlines(tr || src)}${(src && tr && src !== tr) ? `\n\n> ${stripNewlines(src)}` : ''}`.trim();

    if (type === 'blockquote' || type === 'quote') {
      const a = tr ? tr.replace(/\n/g, '\n> ') : '';
      const b = src ? src.replace(/\n/g, '\n> ') : '';
      // 如果原文和译文相同，只输出一次
      if (a && b && a === b) return `> ${a}`.trim();
      if (a && b) return `> ${a}\n>\n> ${b}`.trim();
      return (a || b) ? `> ${(a || b)}`.trim() : '';
    }

    if (type === 'code' || type === 'pre') {
      const code = src || tr || '';
      return `\`\`\`\n${code}\n\`\`\``;
    }

    if (type === 'img' || type === 'image') {
      const u = block.meta && block.meta.src ? String(block.meta.src).trim() : '';
      const alt = block.meta && block.meta.alt ? String(block.meta.alt).trim() : 'image';
      return u ? `\n![${alt}](${u})\n` : (alt ? `*${alt}*` : '');
    }

    if (type === 'li') {
      // li 应该由 renderNestedListMarkdown 处理，这里只是后备
      const duo = (main, sub) => {
        if (main && sub && main === sub) return main;
        if (main && sub) return `${main}\n  > ${sub.replace(/\n/g, '\n  > ')}`;
        return main || (sub ? `> ${sub.replace(/\n/g, '\n> ')}` : '');
      };
      return `- ${duo(tr, src)}`;
    }
    return duo(tr, src);
  }

  // ----------------------------
  // 模块内容：自动识别 + 转换，避免混杂
  // ----------------------------
  /**
   * 清理文本并转换为BBCode格式
   * 如果文本包含Markdown标记，则转换为BBCode；否则保持原样
   * @param {string} text - 输入文本
   * @returns {string} BBCode格式的文本
   */
  function sanitizeForBBCode(text) {
    const t = normalizeTextKeepLines(text);
    if (!t) return '';
    // 检测并转换Markdown标记
    const out = looksLikeMarkdown(t) ? markdownToBBCode(t) : t;
    return out.trim();
  }

  /**
   * 清理文本并转换为Markdown格式
   * 如果文本包含BBCode标记，则转换为Markdown；否则保持原样
   * @param {string} text - 输入文本
   * @returns {string} Markdown格式的文本
   */
  function sanitizeForMarkdown(text) {
    const t = normalizeTextKeepLines(text);
    if (!t) return '';
    // 检测并转换BBCode标记
    const out = looksLikeBBCode(t) ? bbcodeToMarkdown(t) : t;
    return out.trim();
  }

  /**
   * 检测文本是否包含BBCode标记
   * @param {string} t - 输入文本
   * @returns {boolean} 是否包含BBCode标记
   */
  function looksLikeBBCode(t) {
    return /\[(\/?)(b|i|u|s|url|img|quote|code|size|color|align|hr|ul|ol|\*)/i.test(t);
  }

  /**
   * 检测文本是否包含Markdown标记
   * 检测项：标题(#)、粗体(**)、引用(>)、链接、图片、代码块(```)、列表(-/*)
   * @param {string} t - 输入文本
   * @returns {boolean} 是否包含Markdown标记
   */
  function looksLikeMarkdown(t) {
    return /(^\s{0,3}#{1,6}\s+)|(\*\*[^*]+\*\*)|(^\s*>\s+)|(\[[^\]]+\]\([^)]+\))|(!\\[[^\]]*\]\([^)]+\))|(^\s*```)|(^\s*[-*]\s+)/m.test(t);
  }

  // ----------------------------
  // Markdown -> BBCode 转换器
  // ----------------------------
  /**
   * 将Markdown格式转换为BBCode格式
   * 支持：代码块、标题、图片、链接、粗体/斜体/删除线、行内代码、水平线、引用、列表
   * @param {string} md - Markdown格式文本
   * @returns {string} BBCode格式文本
   */
  function markdownToBBCode(md) {
    if (!md) return '';
    let s = String(md);

    // 代码块：```code``` -> [code]code[/code]
    s = s.replace(/```([\s\S]*?)```/g, (_, code) => `[code]${code.trim()}[/code]`);

    // 标题
    s = s.replace(/^\s*####\s+(.+)$/gm, (_, t) => `[size=4][b]${t.trim()}[/b][/size]`);
    s = s.replace(/^\s*###\s+(.+)$/gm, (_, t) => `[size=5][b]${t.trim()}[/b][/size]`);
    s = s.replace(/^\s*##\s+(.+)$/gm, (_, t) => `[size=6][b]${t.trim()}[/b][/size]`);
    s = s.replace(/^\s*#\s+(.+)$/gm, (_, t) => `[size=7][b]${t.trim()}[/b][/size]`);

    // 图片 ![alt](url)
    s = s.replace(/!\[[^\]]*]\(([^)]+)\)/g, '[img]$1[/img]');

    // 链接 [text](url)
    s = s.replace(/\[([^\]]+)]\((https?:\/\/[^)]+)\)/g, '[url=$2]$1[/url]');

    // 加粗/斜体/删除线（顺序很关键：先粗体再斜体）
    // 文本样式（处理顺序：粗体 -> 斜体 -> 删除线）
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1[i]$2[/i]');
    s = s.replace(/~~([\s\S]+?)~~/g, '[s]$1[/s]');

    // 行内代码 `x`
    s = s.replace(/`([^`\n]+)`/g, '[code]$1[/code]');

    // 水平线
    s = s.replace(/^\s*(---|\*\*\*)\s*$/gm, '[hr]');

    // 引用：合并连续的 > 行
    s = s.replace(/(^\s*>\s?.+(?:\n\s*>\s?.+)*)/gm, (m) => {
      const inner = m.replace(/^\s*>\s?/gm, '').trim();
      return inner ? `[quote]${inner}[/quote]` : m;
    });

    // 无序列表：- 或 *
    s = s.replace(/(^\s*(?:[-*])\s+.+(?:\n\s*(?:[-*])\s+.+)*)/gm, (m) => {
      const items = m.split('\n')
        .map(line => line.replace(/^\s*[-*]\s+/, '').trim())
        .filter(Boolean)
        .map(x => `[*]${x}`)
        .join('\n');
      return items ? `[list]\n${items}\n[/list]` : m;
    });

    // 有序列表：1. 2. 等数字开头的行
    s = s.replace(/(^\s*\d+\.\s+.+(?:\n\s*\d+\.\s+.+)*)/gm, (m) => {
      const items = m.split('\n')
        .map(line => line.replace(/^\s*\d+\.\s+/, '').trim())
        .filter(Boolean)
        .map(x => `[*]${x}`)
        .join('\n');
      return items ? `[list=1]\n${items}\n[/list]` : m;
    });

    return s;
  }

  // ----------------------------
  // BBCode -> Markdown 转换器
  // ----------------------------
  /**
   * 将BBCode格式转换为Markdown格式
   * 支持：代码块、图片、链接、文本样式、引用、水平线、对齐/颜色、尺寸、列表
   * @param {string} bb - BBCode格式文本
   * @returns {string} Markdown格式文本
   */
  function bbcodeToMarkdown(bb) {
    if (!bb) return '';
    let s = String(bb);

    // 先处理 code（避免内部再被替换）
    s = s.replace(/\[code]([\s\S]*?)\[\/code]/gi, (_, code) => `\`\`\`\n${code.trim()}\n\`\`\``);

    // 图片：直接删除（Markdown 输出不需要图片）
    s = s.replace(/\[img(?:=[^\]]+)?]([\s\S]*?)\[\/img]/gi, '');

    // 链接
    s = s.replace(/\[url=([^\]]+)]([\s\S]*?)\[\/url]/gi, (_, url, text) => `[${text.trim()}](${url.trim()})`);

    // 基础样式
    // [b] 标签：如果包含换行符，在每一行分别添加 **
    s = s.replace(/\[b]([\s\S]*?)\[\/b]/gi, (match, inner) => {
      if (/\n/.test(inner)) {
        // 包含换行符，在每一行分别添加 **
        return inner.split('\n').map(line => {
          const trimmed = line.trim();
          return trimmed ? `**${trimmed}**` : '';
        }).join('\n');
      } else {
        // 单行，先 trim 再添加 **，避免 ** 和文字之间有空格
        const trimmed = inner.trim();
        return trimmed ? `**${trimmed}**` : '';
      }
    });
    s = s.replace(/\[i]([\s\S]*?)\[\/i]/gi, (match, inner) => {
      const trimmed = inner.trim();
      return trimmed ? `*${trimmed}*` : '';
    });
    s = s.replace(/\[s]([\s\S]*?)\[\/s]/gi, (match, inner) => {
      const trimmed = inner.trim();
      return trimmed ? `~~${trimmed}~~` : '';
    });
    // 下划线：删除标签，保留内容（Markdown 不支持下划线）
    s = s.replace(/\[u]([\s\S]*?)\[\/u]/gi, '$1');

    // 引用
    s = s.replace(/\[quote]([\s\S]*?)\[\/quote]/gi, (_, inner) => {
      const lines = String(inner).trim().split('\n').map(x => `> ${x}`).join('\n');
      return lines;
    });

    // hr
    s = s.replace(/\[hr]/gi, '---');

    // align/color：删除这些标签，只保留内容（Markdown 不支持样式）
    // 使用循环处理嵌套标签，并 trim 内容避免多余空格
    let prevS2 = '';
    while (prevS2 !== s) {
      prevS2 = s;
      s = s.replace(/\[align=[^\]]+]([\s\S]*?)\[\/align]/gi, (_, inner) => inner.trim());
      s = s.replace(/\[color=[^\]]+]([\s\S]*?)\[\/color]/gi, (_, inner) => inner.trim());
    }

    // font：删除字体标签，只保留内容（Markdown 不支持字体）
    prevS2 = '';
    while (prevS2 !== s) {
      prevS2 = s;
      s = s.replace(/\[font=[^\]]+]([\s\S]*?)\[\/font]/gi, (_, inner) => inner.trim());
    }

    // table/tr/td：删除表格标签，只保留内容（Markdown 不支持复杂表格样式）
    prevS2 = '';
    while (prevS2 !== s) {
      prevS2 = s;
      s = s.replace(/\[table(?:=[^\]]+)?]([\s\S]*?)\[\/table]/gi, '$1');
      s = s.replace(/\[tr(?:=[^\]]+)?]([\s\S]*?)\[\/tr]/gi, '$1');
      s = s.replace(/\[td]([\s\S]*?)\[\/td]/gi, '$1');
    }

    // float：删除浮动标签，只保留内容（Markdown 不支持浮动）
    prevS2 = '';
    while (prevS2 !== s) {
      prevS2 = s;
      s = s.replace(/\[float=[^\]]+]([\s\S]*?)\[\/float]/gi, '$1');
    }

    // size -> 标题（简单映射），支持 [size=数字] 和 [size=数字px] 两种格式
    // 使用循环处理嵌套的 size 标签
    let prevS = '';
    while (prevS !== s) {
      prevS = s;
      s = s.replace(/\[size=(\d+)(?:px)?]([\s\S]*?)\[\/size]/gi, (_, size, inner) => {
        const n = parseInt(size, 10);
        // 检查内容是否包含换行符
        const hasNewlines = /\n/.test(inner);

        if (hasNewlines) {
          // 如果包含换行符，保留原样（只移除 size 标签）
          return inner;
        } else {
          // 如果是单行，尝试转换为标题
          const t = stripNewlines(inner);
          if (n >= 24) return `# ${t}`;  // 24px 及以上 -> h1
          if (n >= 20) return `## ${t}`; // 20px 及以上 -> h2
          if (n >= 16) return `### ${t}`; // 16px 及以上 -> h3
          if (n >= 7) return `# ${t}`;
          if (n === 6) return `## ${t}`;
          if (n === 5) return `### ${t}`;
          if (n === 4) return `#### ${t}`;
          return t;
        }
      });
    }

    // 列表：支持 [list] 和 [list=1]
    // 有序列表 [list=1]
    s = s.replace(/\[list=1\]([\s\S]*?)\[\/list\]/gi, (_, inner) => {
      const raw = String(inner);
      const items = raw.split(/\n/).map(x => x.trim()).filter(Boolean);
      let idx = 1;
      const lines = items.map(line => {
        const m = line.match(/^\[\*\](.*)$/);
        if (!m) return null;
        const content = m[1].trim();
        return `${idx++}. ${content}`;
      }).filter(Boolean);
      return lines.join('\n');
    });
    // 无序列表 [list]
    s = s.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, inner) => {
      const raw = String(inner);
      const items = raw.split(/\n/).map(x => x.trim()).filter(Boolean);
      const lines = items.map(line => {
        const m = line.match(/^\[\*\](.*)$/);
        if (!m) return null;
        const content = m[1].trim();
        return `- ${content}`;
      }).filter(Boolean);
      return lines.join('\n');
    });
    // 兼容旧格式 [ul] 和 [ol]
    s = s.replace(/\[(ul|ol)\]([\s\S]*?)\[\/\1\]/gi, (_, tag, inner) => {
      const raw = String(inner);
      const items = raw.split(/\n/).map(x => x.trim()).filter(Boolean);
      let idx = 1;
      const lines = items.map(line => {
        const m = line.match(/^\[\*\](.*)$/);
        if (!m) return null;
        const content = m[1].trim();
        if (tag.toLowerCase() === 'ol') return `${idx++}. ${content}`;
        return `- ${content}`;
      }).filter(Boolean);
      return lines.join('\n');
    });
    // 清理残留的 [*]
    s = s.replace(/^\s*\[\*]\s*/gm, '- ');

    // 将单个换行符转换为 Markdown 硬换行（行尾两个空格）
    // 但要避免影响已经是双换行的情况
    s = s.replace(/([^\n])\n(?!\n)/g, '$1  \n');

    return s;
  }

  // ----------------------------
  // BBCode -> HTML（预览：修复原正则失效 + 更稳）
  // ----------------------------
  function bbcodeToHtml(bbcode) {
    const input = String(bbcode || '');
    if (!input.trim()) {
      return `<p style="text-align: center; color: #6c757d; padding: 40px 0;">暂无内容</p>`;
    }

    // 先转义，避免 XSS
    let html = escapeHtml(input);

    // 先处理 align，避免被内层标签破坏
    html = html.replace(/\[align=center]([\s\S]*?)\[\/align]/gi, '<div align="center">$1</div>');

    // 处理 font 标签
    html = html.replace(/\[font=([^\]]+)]([\s\S]*?)\[\/font]/gi, '<font face="$1">$2</font>');

    // 处理 table 标签
    html = html.replace(/\[table=(\d+)%]/gi, '<table cellspacing="0" class="t_table" style="width:$1%"><tbody>');
    html = html.replace(/\[table]/gi, '<table cellspacing="0" class="t_table"><tbody>');
    html = html.replace(/\[\/table]/gi, '</tbody></table>');

    // 处理 tr 标签（带背景色）
    html = html.replace(/\[tr=(#[A-Fa-f0-9]{6})]/gi, '<tr style="background-color:$1"><td>');
    html = html.replace(/\[tr]/gi, '<tr><td>');
    html = html.replace(/\[\/tr]/gi, '</td></tr>');

    // 处理 td 标签
    html = html.replace(/\[td]/gi, '<td>');
    html = html.replace(/\[\/td]/gi, '</td>');

    // 处理 float 标签
    html = html.replace(/\[float=left]/gi, '<span style="float:left;margin-right:5px">');
    html = html.replace(/\[float=right]/gi, '<span style="float:right;margin-left:5px">');
    html = html.replace(/\[\/float]/gi, '</span>');

    // 处理带尺寸的 img 标签
    html = html.replace(/\[img=(\d+),(\d+)]([\s\S]*?)\[\/img]/gi, '<img width="$1" height="$2" src="$3" alt="" style="max-width:100%" />');

    // 处理 size 标签 - 使用循环处理嵌套，从内到外
    let maxSizeIterations = 10;
    while ((html.includes('[size=') || html.includes('[size]')) && maxSizeIterations-- > 0) {
      // 先处理 size + b（带像素单位）- 匹配不包含[size的内容
      html = html.replace(/\[size=(\d+)px]\s*\[b]((?:(?!\[size)[\s\S])*?)\[\/b]\s*\[\/size]/gi, (_, s, t) => {
        const text = t.trim();
        return `<font style="font-size:${s}px"><strong>${text}</strong></font>`;
      });

      // 处理 size + b（不带像素单位）
      html = html.replace(/\[size=([\d.]+)]\s*\[b]((?:(?!\[size)[\s\S])*?)\[\/b]\s*\[\/size]/gi, (_, s, t) => {
        const n = parseFloat(s);
        const text = t.trim();
        if (n >= 7) return `<h1>${text}</h1>`;
        if (n === 6) return `<h2>${text}</h2>`;
        if (n === 5) return `<h3>${text}</h3>`;
        if (n === 4) return `<strong style="font-size:1.2em">${text}</strong>`;
        return `<strong>${text}</strong>`;
      });

      // 单独的 size 标签（带像素单位）
      html = html.replace(/\[size=(\d+)px]((?:(?!\[size)[\s\S])*?)\[\/size]/gi, (_, s, t) => {
        const text = t.trim();
        return `<font style="font-size:${s}px">${text}</font>`;
      });

      // 单独的 size 标签（不带像素单位）
      html = html.replace(/\[size=([\d.]+)]((?:(?!\[size)[\s\S])*?)\[\/size]/gi, (_, s, t) => {
        const n = parseFloat(s);
        const text = t.trim();
        if (n >= 7) return `<span style="font-size:2em">${text}</span>`;
        if (n === 6) return `<span style="font-size:1.5em">${text}</span>`;
        if (n === 5) return `<span style="font-size:1.3em">${text}</span>`;
        if (n === 4) return `<span style="font-size:1.2em">${text}</span>`;
        if (n === 3) return `<span style="font-size:1em">${text}</span>`;
        if (n === 2) return `<span style="font-size:0.9em">${text}</span>`;
        return `<span style="font-size:0.8em">${text}</span>`;
      });
    }

    // b/i/u/s
    html = html.replace(/\[b]([\s\S]*?)\[\/b]/gi, '<strong>$1</strong>');
    html = html.replace(/\[i]([\s\S]*?)\[\/i]/gi, '<em>$1</em>');
    html = html.replace(/\[u]([\s\S]*?)\[\/u]/gi, '<u>$1</u>');
    html = html.replace(/\[s]([\s\S]*?)\[\/s]/gi, '<del>$1</del>');

    // color
    html = html.replace(/\[color=([^\]]+)]([\s\S]*?)\[\/color]/gi, '<span style="color:$1">$2</span>');

    // url/img
    html = html.replace(/\[url=([^\]]+)]([\s\S]*?)\[\/url]/gi, '<a href="$1" target="_blank" rel="noopener">$2</a>');
    html = html.replace(/\[img]([\s\S]*?)\[\/img]/gi, '<img src="$1" alt="" style="max-width:100%;border-radius:8px;" />');

    // quote/code/hr
    html = html.replace(/\[quote]([\s\S]*?)\[\/quote]/gi, '<blockquote>$1</blockquote>');
    html = html.replace(/\[code]([\s\S]*?)\[\/code]/gi, '<pre><code>$1</code></pre>');
    html = html.replace(/\[hr]/gi, '<hr />');

    // lists - 递归处理嵌套列表，从内到外
    // 循环处理直到所有 [list] 标签都被转换
    let maxIterations = 10; // 防止无限循环
    while ((html.includes('[list]') || html.includes('[list=1]')) && maxIterations-- > 0) {
      // 先处理有序列表
      html = html.replace(/\[list=1]([\s\S]*?)\[\/list]/gi, (match, inner) => {
        // 处理有序列表
        const items = inner.split(/\[\*\]/).map(x => x.trim()).filter(x => x.length > 0);
        const liItems = items.map(item => `<li>${item}</li>`).join('');
        return `<ol>${liItems}</ol>`;
      });
      // 再处理无序列表
      html = html.replace(/\[list]([\s\S]*?)\[\/list]/gi, (match, inner) => {
        // 处理无序列表
        const items = inner.split(/\[\*\]/).map(x => x.trim()).filter(x => x.length > 0);
        const liItems = items.map(item => `<li>${item}</li>`).join('');
        return `<ul>${liItems}</ul>`;
      });
    }

    // 清理残留的 [*] 标签（如果有的话）
    html = html.replace(/\[\*\]/g, '');

    // 换行：保留视觉效果（注意 code/pre 内也会有 <br>，但不影响预览）
    html = html.replace(/\r\n/g, '\n').replace(/\n/g, '<br>');

    // 清理表格相关标签之间的 <br>
    html = html.replace(/<tbody>(<br>)+/gi, '<tbody>');
    html = html.replace(/(<br>)+<\/tbody>/gi, '</tbody>');
    html = html.replace(/<\/tr>(<br>)+<tr/gi, '</tr><tr');
    html = html.replace(/<\/tr>(<br>)+<\/tbody>/gi, '</tr></tbody>');
    html = html.replace(/<table([^>]*)>(<br>)+/gi, '<table$1>');
    html = html.replace(/(<br>)+<\/table>/gi, '</table>');
    html = html.replace(/<tr([^>]*)>(<br>)*<td>/gi, '<tr$1><td>');
    html = html.replace(/<\/td>(<br>)*<\/tr>/gi, '</td></tr>');

    // 清理 div 和 font 标签之间的 <br>
    html = html.replace(/<\/div>(<br>)+<div/gi, '</div><div');
    html = html.replace(/<div([^>]*)>(<br>)+/gi, '<div$1>');
    html = html.replace(/<font([^>]*)>(<br>)+/gi, '<font$1>');
    html = html.replace(/(<br>)+<\/font>/gi, '</font>');

    // 简单清理：ul/ol 内只删除 li 标签之间的 <br>，保留 li 内部的 <br>
    html = html.replace(/<(ul|ol)>([\s\S]*?)<\/\1>/gi, (m, tag, inner) => {
      // 只删除 </li> 和 <li> 之间的 <br>，以及开头和结尾的 <br>
      const cleaned = inner
        .replace(/^(<br\s*\/?>)+/gi, '')  // 删除开头的 <br>
        .replace(/(<br\s*\/?>)+$/gi, '')  // 删除结尾的 <br>
        .replace(/(<\/li>)(<br\s*\/?>)+(<li>)/gi, '$1$3');  // 删除 li 之间的 <br>
      return `<${tag}>${cleaned}</${tag}>`;
    });

    // 清理空的 <li> 标签（只包含空白字符或 <br> 的 li）
    html = html.replace(/<li>(\s|<br\s*\/?>)*<\/li>/gi, '');

    // 清理标题标签后的 <br>（h1-h6）
    html = html.replace(/(<\/h[1-6]>)(<br\s*\/?>)+/gi, '$1');

    // 清理 table 和 div 前后的多余 <br> 和 <hr>
    // 清理 table 前面的所有 <br>
    html = html.replace(/(<br>)+<table/gi, '<table');

    // 清理 font 标签后面紧跟的多个 <br>（在table前）
    html = html.replace(/(<font[^>]*>)(<br>){2,}/gi, '$1');

    // 清理 div 标签后面紧跟的多个 <br>
    html = html.replace(/(<div[^>]*>)(<br>){2,}/gi, '$1');

    // 清理 table 后面的多余 <br>
    html = html.replace(/(<\/table>)(<br>){2,}/gi, '$1<br>');

    // 清理 div 后面的多余 <br>
    html = html.replace(/(<\/div>)(<br>){2,}/gi, '$1<br>');

    // 清理 hr 前后的多余 <br>，但保留各1个
    // 先清理多个 <br> 为 1个
    html = html.replace(/(<br>){2,}<hr/gi, '<br><hr');
    html = html.replace(/<hr\s*\/?>((<br>){2,})/gi, '<hr><br>');

    // 如果 hr 前后没有 <br>，添加一个
    html = html.replace(/([^>])<hr/gi, '$1<br><hr');
    html = html.replace(/<hr\s*\/?>((?!<br>)[^<])/gi, '<hr><br>$1');

    return html;
  }

  // ----------------------------
  // 工具函数
  // ----------------------------
  function formatDateTimeCN(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('zh-CN', { hour12: false });
  }

  /**
   * 规范化文本：统一换行符并去除首尾空白
   * @param {string} t - 输入文本
   * @returns {string} 规范化后的文本
   */
  function normalizeText(t) {
    return String(t || '').replace(/\r\n/g, '\n').trim();
  }

  /**
   * 规范化文本并保留行结构：统一换行符，去除首尾空白，但保留内部换行
   * @param {string} t - 输入文本
   * @returns {string} 规范化后的文本
   */
  function normalizeTextKeepLines(t) {
    return String(t || '').replace(/\r\n/g, '\n').trim();
  }

  /**
   * 移除所有换行符：将所有空白字符（包括换行）压缩为单个空格
   * @param {string} t - 输入文本
   * @returns {string} 单行文本
   */
  function stripNewlines(t) {
    return String(t || '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Markdown链接转BBCode链接
   * @param {string} text - 包含Markdown链接的文本
   * @returns {string} 转换后的BBCode格式文本
   */
  function mdLinksToBBCode(text) {
    return String(text || '').replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g, '[url=$2]$1[/url]');
  }

  /**
   * BBCode文本清理：移除空字符
   * @param {string} text - 输入文本
   * @returns {string} 清理后的文本
   */
  function escapeBB(text) {
    return String(text || '').replace(/\u0000/g, '');
  }

  /**
   * HTML转义：转义HTML特殊字符以防止XSS
   * @param {string} str - 输入字符串
   * @returns {string} 转义后的字符串
   */
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * HTML属性转义：转义HTML属性中的特殊字符
   * @param {string} str - 输入字符串
   * @returns {string} 转义后的字符串
   */
  function escapeAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function debounce(fn, wait) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function cssEscape(str) {
    // 简单兼容：用于 querySelector
    return String(str).replace(/([#.;,[\]:()/\\])/g, '\\$1');
  }

  function copyToClipboard(text, btn) {
    const value = String(text || '');
    if (!value.trim()) return updateStatus('提示：没有可复制的内容', true);

    const done = () => {
      if (!btn) return;
      btn.classList.add('copied');
      const old = btn.textContent;
      btn.textContent = '已复制';
      setTimeout(() => { btn.textContent = old; btn.classList.remove('copied'); }, 1200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(() => fallbackCopy(value, done));
    } else {
      fallbackCopy(value, done);
    }
  }

  function fallbackCopy(value, done) {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); }
    catch { updateStatus('复制失败：浏览器阻止了剪贴板访问', true); }
    document.body.removeChild(ta);
  }

  function updateStatus(message, isError = false) {
    statusText.textContent = message;
    statusText.style.color = isError ? '#e74c3c' : '#2ecc71';
    if (!isError) {
      setTimeout(() => {
        statusText.textContent = '就绪 - 等待新的文件上传或编辑';
        statusText.style.color = '#6c757d';
      }, 2200);
    }
  }
})();