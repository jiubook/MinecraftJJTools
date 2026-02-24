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
      content: '[size=2][b]【本文Ai翻译及Ai排版借助了： [url=https://jiubook.github.io/MinecraftJJTools/J2MM_JsonToMcbbsMarkdown.html]J2MM[/url]、[url=https://github.com/jiubook/MinecraftJJTools]JBAiGNN[/url]、[url=https://chatgpt.com/]ChatGPT[/url]等工具 】\n【本Ai工具以 [url=https://www.gnu.org/licenses/gpl-3.0.zh-cn.html]GPL-3.0[/url] 协议发布】\n【本Ai翻译作品以 [url=https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hans]CC BY-SA 4.0[/url] 协议发布】[/b][/size]',
      position: 'end',
      enabled: true
    },
    {
      id: 'module_links',
      title: '实用链接',
      content: '[size=2][b]实用链接[/b]\n  [url=https://www.minecraft.net/zh-hans/download/server]官方服务端 jar 下载地址[/url]\n  [url=https://www.minecraft.net/zh-hans/download]正版启动器下载地址[/url]\n  [url=https://bugs.mojang.com/projects/MC/summary]官方漏洞报告站点[/url]（仅限英文）\n  [url=https://feedback.minecraft.net/]官方反馈及建议网站[/url]（仅限英文）[/size]',
      position: 'end',
      enabled: true
    },
    {
      id: 'module_howto',
      title: '如何游玩',
      content: '[size=2][b]如何游玩正式版？[/b]\n  对于正版用户：请打开官方启动器，选择「最新版本」即可。\n  对于非正版用户：请于 [url=https://archives.mcbbs.co/read.php?tid=38297]推荐启动器列表[/url] 寻找合适的启动器。\n  目前绝大多数主流启动器都带有下载功能。\n  如仍有疑惑请到 [url=https://www.mcbbs.co/forum-59-1.html]原版问答[/url] 板块提问。[/size]',
      position: 'end',
      enabled: true
    },
    {
      id: 'module_more',
      title: '更多资讯',
      content: '[size=2][b]想了解更多资讯？[/b]\n  [url=https://archives.mcbbs.co/read.php?tid=874677]外部来源以及详细的更新条目追踪[/url]\n  [url=https://www.mcbbs.co/forum-news-1.html]我的世界中文论坛 - 幻翼块讯板块[/url][/size]',
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

  const defaultModulesContainer = $('defaultModulesContainer');
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

  // 实时预览：BBCode 输出框变更即刷新预览（修复“实时预览失效”）
  const updatePreviewDebounced = debounce(() => {
    previewArea.innerHTML = bbcodeToHtml(bbcodeOutput.value || '');
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
  function renderTranslationPanel() {
    translationPanel.innerHTML = '';
    if (!editedBlocks) return;

    editedBlocks.forEach((block, index) => {
      const div = document.createElement('div');
      div.className = 'block-item';
      div.dataset.blockId = block.id;

      const typeLabel = String(block.type || 'p');
      const previewText = (block.source_text ? String(block.source_text) :
                          (block.items ? (block.items.join(', ')) : '')).slice(0, 80);

      let editorHtml = '';
      if (typeLabel === 'ul' || typeLabel === 'ol') {
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
        <div class="block-content-preview">${escapeHtml(previewText || '')}</div>
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

  
  function normalizeLines(t) {
    return String(t || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);
  }

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

    // ul/ol 需要 items；从文本类型切过来时自动按行拆分
    if (nt === 'ul' || nt === 'ol') {
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

function updateBlockFromUI(blockId) {
    const block = editedBlocks.find(b => b.id === blockId);
    if (!block) return;

    const container = document.querySelector(`.block-item[data-block-id="${cssEscape(blockId)}"]`);
    if (!container) return;

    const type = String(block.type || 'p').toLowerCase();
    if (type === 'ul' || type === 'ol') {
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

  function removeBlock(blockId) {
    if (!confirm('确定要删除这个 block 吗？')) return;
    editedBlocks = editedBlocks.filter(b => b.id !== blockId);
    renderTranslationPanel();
    generateOutput();
  }

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
    defaultModulesContainer.innerHTML = '';
    defaultModulesConfig.forEach(m => {
      const div = document.createElement('div');
      div.className = 'module-item module-default';
      div.innerHTML = `
        <h4>${escapeHtml(m.title)}</h4>
        <div class="module-controls">
          <label><input type="checkbox" ${m.enabled ? 'checked' : ''} data-mid="${escapeAttr(m.id)}" data-field="enabled"> 启用</label>
          <label>位置：
            <select data-mid="${escapeAttr(m.id)}" data-field="position">
              <option value="start" ${m.position === 'start' ? 'selected' : ''}>开头</option>
              <option value="end" ${m.position === 'end' ? 'selected' : ''}>结尾</option>
            </select>
          </label>
        </div>
      `;
      defaultModulesContainer.appendChild(div);
    });

    defaultModulesContainer.addEventListener('change', (e) => {
      const el = e.target;
      const id = el.dataset.mid;
      const field = el.dataset.field;
      if (!id || !field) return;

      const mod = defaultModulesConfig.find(x => x.id === id);
      if (!mod) return;

      if (field === 'enabled') mod.enabled = !!el.checked;
      if (field === 'position') mod.position = String(el.value);

      generateOutput();
    }, { once: true }); // 只绑一次，避免重复绑定
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
  // 输出生成
  // ----------------------------
  function generateOutput() {
    if (!originalJson || !editedBlocks) return;

    const bbcode = convertJsonToBBCode(originalJson, editedBlocks);
    const markdown = convertJsonToMarkdown(originalJson, editedBlocks);

    bbcodeOutput.value = bbcode;
    markdownOutput.value = markdown;

    // 预览永远以 BBCode 输出为准（且实时监听 bbcodeOutput 输入）
    previewArea.innerHTML = bbcodeToHtml(bbcode);

    updateStatus('输出已更新', false);
  }

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

    out += `\n[hr]\n`;

    if (!blocks || !blocks.length) {
      out += `[i]（未找到 blocks 或 blocks 为空）[/i]`;
      return insertModulesBBCode(out.trim());
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const next = blocks[i + 1];
      out += renderBlockBBCode(block) + '\n';

      const nextType = next ? String(next.type || 'p').toLowerCase() : '';
      if (['h1','h2','h3','h4'].includes(nextType)) out += `\n[hr]\n`;
    }

    return insertModulesBBCode(out.trim());
  }

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

    out += `---\n\n`;

    if (!blocks || !blocks.length) return insertModulesMarkdown((out + `（未找到 blocks 或 blocks 为空）`).trim());

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const next = blocks[i + 1];
      out += renderBlockMarkdown(block) + '\n\n';

      const nextType = next ? String(next.type || 'p').toLowerCase() : '';
      if (['h1','h2','h3','h4'].includes(nextType)) out += `---\n\n`;
    }

    return insertModulesMarkdown(out.trim());
  }

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
  function renderBlockBBCode(block) {
    const type = String(block.type || 'p').toLowerCase();
    const src = normalizeText(block.source_text || '');
    const tr = normalizeText(block.translated_text || '');

    const srcBB = mdLinksToBBCode(src);
    const trBB  = mdLinksToBBCode(tr);

    const duo = (main, sub) => {
      if (main && sub) return `${main}\n[color=#bcbcbc]${sub}[/color]\n`;
      return main || sub || '';
    };

    if (type === 'ul' || type === 'ol') {
      const items = Array.isArray(block.items) ? block.items : [];
      const translatedItems = Array.isArray(block.translated_items) ? block.translated_items : [];
      const tag = type === 'ol' ? 'ol' : 'ul';
      const li = items.map((item, i) => {
        const itemSrc = mdLinksToBBCode(normalizeText(item));
        const itemTr = mdLinksToBBCode(normalizeText(translatedItems[i] || ''));
        if (itemTr) return `[*]${escapeBB(itemTr)}\n[color=#bcbcbc]${escapeBB(itemSrc)}[/color]`;
        return `[*]${escapeBB(itemSrc)}`;
      }).join('\n');
      return `[${tag}]\n${li}\n[/${tag}]`;
    }

    if (type === 'h1') return `[size=7][b]${duo(escapeBB(trBB), escapeBB(srcBB))}[/b][/size]`;
    if (type === 'h2') return `[size=6][b]${duo(escapeBB(trBB), escapeBB(srcBB))}[/b][/size]`;
    if (type === 'h3') return `[size=5][b]${duo(escapeBB(trBB), escapeBB(srcBB))}[/b][/size]`;
    if (type === 'h4') return `[size=4][b]${duo(escapeBB(trBB), escapeBB(srcBB))}[/b][/size]`;
    if (type === 'blockquote' || type === 'quote') return `[quote]${duo(escapeBB(trBB), escapeBB(srcBB))}[/quote]`;
    if (type === 'code' || type === 'pre') return `[code]${escapeBB(src || tr || '')}[/code]`;
    if (type === 'img' || type === 'image') {
      const u = String(block.url || block.src || '').trim();
      const alt = String(block.alt || block.imageAltText || '').trim();
      if (!u) return alt ? `[i]${escapeBB(alt)}[/i]` : '';
      return alt ? `[img]${escapeBB(u)}[/img]\n[i]${escapeBB(alt)}[/i]` : `[img]${escapeBB(u)}[/img]`;
    }
    if (type === 'li') return duo(escapeBB(trBB), escapeBB(srcBB));
    return duo(escapeBB(trBB), escapeBB(srcBB));
  }

  function renderBlockMarkdown(block) {
    const type = String(block.type || 'p').toLowerCase();
    const src = normalizeText(block.source_text || '');
    const tr = normalizeText(block.translated_text || '');

    const duo = (main, sub) => {
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
        if (itemTr) return ordered ? `${i+1}. ${itemTr}\n   > ${itemSrc}` : `- ${itemTr}\n  > ${itemSrc}`;
        return ordered ? `${i+1}. ${itemSrc}` : `- ${itemSrc}`;
      }).join('\n');
    }

    if (type === 'h1') return `# ${stripNewlines(tr || src)}${(src && tr) ? `\n\n> ${stripNewlines(src)}` : ''}`.trim();
    if (type === 'h2') return `## ${stripNewlines(tr || src)}${(src && tr) ? `\n\n> ${stripNewlines(src)}` : ''}`.trim();
    if (type === 'h3') return `### ${stripNewlines(tr || src)}${(src && tr) ? `\n\n> ${stripNewlines(src)}` : ''}`.trim();
    if (type === 'h4') return `#### ${stripNewlines(tr || src)}${(src && tr) ? `\n\n> ${stripNewlines(src)}` : ''}`.trim();

    if (type === 'blockquote' || type === 'quote') {
      const a = tr ? tr.replace(/\n/g, '\n> ') : '';
      const b = src ? src.replace(/\n/g, '\n> ') : '';
      if (a && b) return `> ${a}\n>\n> ${b}`.trim();
      return (a || b) ? `> ${(a || b)}`.trim() : '';
    }

    if (type === 'code' || type === 'pre') {
      const code = src || tr || '';
      return `\`\`\`\n${code}\n\`\`\``;
    }

    if (type === 'img' || type === 'image') {
      const u = String(block.url || block.src || '').trim();
      const alt = String(block.alt || block.imageAltText || '').trim() || 'image';
      return u ? `![${alt}](${u})` : (alt ? `*${alt}*` : '');
    }

    if (type === 'li') return duo(tr, src);
    return duo(tr, src);
  }

  // ----------------------------
  // 模块内容：自动识别 + 转换，避免混杂
  // ----------------------------
  function sanitizeForBBCode(text) {
    const t = normalizeTextKeepLines(text);
    if (!t) return '';
    // 若包含 Markdown 特征，先转 BBCode
    let out = looksLikeMarkdown(t) ? markdownToBBCode(t) : t;
    // 再做一次“兜底清理”：把残留 markdown 链接/图片/代码等转掉
    out = markdownToBBCode(out);
    return out.trim();
  }

  function sanitizeForMarkdown(text) {
    const t = normalizeTextKeepLines(text);
    if (!t) return '';
    // 若包含 BBCode 特征，先转 Markdown
    let out = looksLikeBBCode(t) ? bbcodeToMarkdown(t) : t;
    // 再做一次兜底：避免残留 BBCode
    out = bbcodeToMarkdown(out);
    return out.trim();
  }

  function looksLikeBBCode(t) {
    return /\[(\/?)(b|i|u|s|url|img|quote|code|size|color|align|hr|ul|ol|\*)/i.test(t);
  }

  function looksLikeMarkdown(t) {
    return /(^\s{0,3}#{1,6}\s+)|(\*\*[^*]+\*\*)|(^\s*>\s+)|(\[[^\]]+\]\([^)]+\))|(!\[[^\]]*\]\([^)]+\))|(^\s*```)|(^\s*[-*]\s+)/m.test(t);
  }

  // ----------------------------
  // Markdown -> BBCode（模块用：够用且安全）
  // ----------------------------
  function markdownToBBCode(md) {
    if (!md) return '';
    let s = String(md);

    // 代码块 ``` ```
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
    s = s.replace(/\*\*([\s\S]+?)\*\*/g, '[b]$1[/b]');
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
      return items ? `[ul]\n${items}\n[/ul]` : m;
    });

    // 有序列表：1. 2.
    s = s.replace(/(^\s*\d+\.\s+.+(?:\n\s*\d+\.\s+.+)*)/gm, (m) => {
      const items = m.split('\n')
        .map(line => line.replace(/^\s*\d+\.\s+/, '').trim())
        .filter(Boolean)
        .map(x => `[*]${x}`)
        .join('\n');
      return items ? `[ol]\n${items}\n[/ol]` : m;
    });

    return s;
  }

  // ----------------------------
  // BBCode -> Markdown（模块用：够用且安全）
  // ----------------------------
  function bbcodeToMarkdown(bb) {
    if (!bb) return '';
    let s = String(bb);

    // 先处理 code（避免内部再被替换）
    s = s.replace(/\[code]([\s\S]*?)\[\/code]/gi, (_, code) => `\`\`\`\n${code.trim()}\n\`\`\``);

    // 图片/链接
    s = s.replace(/\[img]([\s\S]*?)\[\/img]/gi, (_, url) => `![](${url.trim()})`);
    s = s.replace(/\[url=([^\]]+)]([\s\S]*?)\[\/url]/gi, (_, url, text) => `[${text.trim()}](${url.trim()})`);

    // 基础样式
    s = s.replace(/\[b]([\s\S]*?)\[\/b]/gi, '**$1**');
    s = s.replace(/\[i]([\s\S]*?)\[\/i]/gi, '*$1*');
    s = s.replace(/\[s]([\s\S]*?)\[\/s]/gi, '~~$1~~');
    s = s.replace(/\[u]([\s\S]*?)\[\/u]/gi, '<u>$1</u>');

    // 引用
    s = s.replace(/\[quote]([\s\S]*?)\[\/quote]/gi, (_, inner) => {
      const lines = String(inner).trim().split('\n').map(x => `> ${x}`).join('\n');
      return lines;
    });

    // hr
    s = s.replace(/\[hr]/gi, '---');

    // align/color（用 HTML 兜底）
    s = s.replace(/\[align=center]([\s\S]*?)\[\/align]/gi, '<div style="text-align:center">$1</div>');
    s = s.replace(/\[color=([^\]]+)]([\s\S]*?)\[\/color]/gi, '<span style="color:$1">$2</span>');

    // size -> 标题（简单映射）
    s = s.replace(/\[size=(\d+)]([\s\S]*?)\[\/size]/gi, (_, size, inner) => {
      const n = parseInt(size, 10);
      const t = stripNewlines(inner);
      if (n >= 7) return `# ${t}`;
      if (n === 6) return `## ${t}`;
      if (n === 5) return `### ${t}`;
      if (n === 4) return `#### ${t}`;
      return t;
    });

    // 列表
    s = s.replace(/\[(ul|ol)]([\s\S]*?)\[\/\1]/gi, (_, tag, inner) => {
      const raw = String(inner);
      const items = raw.split(/\n/).map(x => x.trim()).filter(Boolean);
      let idx = 1;
      const lines = items.map(line => {
        const m = line.match(/^\[\*](.*)$/);
        if (!m) return null;
        const content = m[1].trim();
        if (tag.toLowerCase() === 'ol') return `${idx++}. ${content}`;
        return `- ${content}`;
      }).filter(Boolean);
      return lines.join('\n');
    });

    // 清理残留的 [*]
    s = s.replace(/^\s*\[\*]\s*/gm, '- ');

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

    // 标题 size + b（先处理）
    html = html.replace(/\[size=(\d+)]\s*\[b]([\s\S]*?)\[\/b]\s*\[\/size]/gi, (_, s, t) => {
      const n = parseInt(s, 10);
      const text = t.trim();
      if (n >= 7) return `<h1>${text}</h1>`;
      if (n === 6) return `<h2>${text}</h2>`;
      if (n === 5) return `<h3>${text}</h3>`;
      if (n === 4) return `<strong>${text}</strong>`;
      return `<strong>${text}</strong>`;
    });

    // align
    html = html.replace(/\[align=center]([\s\S]*?)\[\/align]/gi, '<div style="text-align:center">$1</div>');

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

    // lists
    html = html.replace(/\[ul]([\s\S]*?)\[\/ul]/gi, '<ul>$1</ul>');
    html = html.replace(/\[ol]([\s\S]*?)\[\/ol]/gi, '<ol>$1</ol>');
    html = html.replace(/\[\*]/g, '<li>');

    // 关闭 li（把 <li>... 补上 </li>）
    html = html.replace(/<li>([\s\S]*?)(?=<li>|<\/ul>|<\/ol>|$)/g, '<li>$1</li>');

    // 换行：保留视觉效果（注意 code/pre 内也会有 <br>，但不影响预览）
    html = html.replace(/\r\n/g, '\n').replace(/\n/g, '<br>');

    // 简单清理：ul/ol 内不应出现 <br>（避免空行影响）
    html = html.replace(/<(ul|ol)>([\s\S]*?)<\/\1>/gi, (m, tag, inner) => {
      const cleaned = inner.replace(/<br\s*\/?>/gi, '');
      return `<${tag}>${cleaned}</${tag}>`;
    });

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

  function normalizeText(t) {
    return String(t || '').replace(/\r\n/g, '\n').trim();
  }

  function normalizeTextKeepLines(t) {
    // 保留行结构但去掉首尾空白
    const s = String(t || '').replace(/\r\n/g, '\n');
    return s.trim();
  }

  function stripNewlines(t) {
    return String(t || '').replace(/\s+/g, ' ').trim();
  }

  function mdLinksToBBCode(text) {
    // 仅处理 markdown 链接，避免正文中残留
    return String(text || '').replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g, '[url=$2]$1[/url]');
  }

  function escapeBB(text) {
    return String(text || '').replace(/\u0000/g, '');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

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