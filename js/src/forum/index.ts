import app from 'flarum/forum/app';

const MARK_ATTR = 'data-lb-moreformat-mounted';

/** —— 获取当前编辑区域 —— */
function getRteEditable(): HTMLElement | null {
  const pm = document.querySelector('.ProseMirror[contenteditable="true"]') as HTMLElement | null;
  if (pm) return pm;
  const r1 = document.querySelector('.RichText-editor[contenteditable="true"]') as HTMLElement | null;
  if (r1) return r1;
  return null;
}
function getTextarea(): HTMLTextAreaElement | null {
  return document.querySelector('.TextEditor textarea') as HTMLTextAreaElement | null;
}

/** —— 兼容 RTE / 旧文本框 的插入 —— */
function insertTextRT(text: string) {
  const ed = getRteEditable();
  if (ed) {
    ed.focus();
    document.execCommand('insertText', false, text);
    return true;
  }
  const ta = getTextarea();
  if (ta) {
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = start + text.length;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    return true;
  }
  return false;
}

function insertParagraphRT() {
  const ed = getRteEditable();
  if (ed) {
    ed.focus();
    document.execCommand('insertParagraph');
    return true;
  }
  const ta = getTextarea();
  if (ta) {
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    ta.value = ta.value.slice(0, start) + '\n' + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = start + 1;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    return true;
  }
  return false;
}

/** —— 功能实现 —— */
function runIndent() {
  insertTextRT('\u3000\u3000'); // 两个全角空格
}

function runBlank(n = 1) {
  for (let i = 0; i < n; i++) {
    insertParagraphRT();
    insertTextRT('\u00A0');     // 实体 NBSP
    insertParagraphRT();
  }
}

/**
 * 包裹为 BBCode（[center]/[right]），并且：
 * - RTE：把标签插到“当前块（h1–h5/p/li/blockquote/div）”的外侧，各自独占一行
 * - 旧文本框：包住“当前整行/多行”，并让 open/close 各自独立成行
 */
function wrapWithTagRT(tag: 'center' | 'right') {
  const open = `[${tag}]`;
  const close = `[/${tag}]`;

  // —— RTE（ProseMirror）分支 —— //
  const ed = getRteEditable();
  if (ed) {
    ed.focus();

    const sel = window.getSelection();
    const rng = sel && sel.rangeCount ? sel.getRangeAt(0) : null;

    // 找到当前（或光标处）块级元素
    let anchor: Node | null = rng ? rng.startContainer : ed;
    if (anchor.nodeType === Node.TEXT_NODE) anchor = anchor.parentNode;
    let block = (anchor as Element | null)?.closest('h1,h2,h3,h4,h5,p,li,blockquote,div') as HTMLElement | null;
    if (!block) block = ed;

    // 若选区跨越多个块，退回到“包选中文本”的最小策略
    if (rng && sel) {
      const startBlock = (rng.startContainer.nodeType === 3 ? rng.startContainer.parentNode : (rng.startContainer as Element))
        ?.closest('h1,h2,h3,h4,h5,p,li,blockquote,div');
      const endBlock = (rng.endContainer.nodeType === 3 ? rng.endContainer.parentNode : (rng.endContainer as Element))
        ?.closest('h1,h2,h3,h4,h5,p,li,blockquote,div');
      if (startBlock && endBlock && startBlock !== endBlock) {
        document.execCommand('insertText', false, open + sel.toString() + close);
        return true;
      }
    }

    // 在块的前后插入文本节点，确保 open/close 独占一行
    const parent = block.parentNode;
    if (parent) {
      // 前面：如果前一个兄弟不是以换行结尾，手动补一个换行
      const needsLeadingNewline =
        block.previousSibling &&
        block.previousSibling.nodeType === Node.TEXT_NODE &&
        (block.previousSibling as Text).data.endsWith('\n')
          ? ''
          : '\n';

      const beforeNode = document.createTextNode((block === ed ? '' : needsLeadingNewline) + open + '\n');
      parent.insertBefore(beforeNode, block);

      // 后面：同理，保证换行 + close
      const needsTrailingNewline =
        block.nextSibling &&
        block.nextSibling.nodeType === Node.TEXT_NODE &&
        (block.nextSibling as Text).data.startsWith('\n')
          ? ''
          : '\n';

      const afterNode = document.createTextNode(needsTrailingNewline + close);
      if (block.nextSibling) parent.insertBefore(afterNode, block.nextSibling);
      else parent.appendChild(afterNode);
    }
    return true;
  }

  // —— 旧文本框分支：包住“当前整行/多行”，open/close 各占一行 —— //
  const ta = getTextarea();
  if (ta) {
    const value = ta.value;
    const start = ta.selectionStart ?? 0;
    const end   = ta.selectionEnd   ?? start;

    // 当前选择覆盖的“首行开头”和“末行末尾”
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd   = (value.indexOf('\n', end) === -1) ? value.length : value.indexOf('\n', end);

    const before = value.slice(0, lineStart);
    const middle = value.slice(lineStart, lineEnd);
    const after  = value.slice(lineEnd);

    // 保证 open/close 独立成行
    const prefixNL = (before.endsWith('\n') || before.length === 0) ? '' : '\n';
    const suffixNL = (after.startsWith('\n') || after.length === 0) ? '' : '\n';

    ta.value = before + open + '\n' + middle + '\n' + close + (after.startsWith('\n') ? after : '\n' + after);

    // 光标放到 close 之后
    const pos = (before + open + '\n' + middle + '\n' + close + '\n').length;
    ta.selectionStart = ta.selectionEnd = pos;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    return true;
  }

  return false;
}

/** —— 翻译兜底 —— */
function tt(key: string, fallback: string) {
  try {
    const s = (app.translator.trans(key) as unknown) as string;
    return !s || s === key ? fallback : s;
  } catch {
    return fallback;
  }
}
function setBtnTitle(btn: HTMLElement, key: string, fallback: string) {
  const text = tt(key, fallback);
  btn.setAttribute('title', text);
  btn.setAttribute('aria-label', text);
  requestAnimationFrame(() => {
    const t2 = tt(key, fallback);
    btn.setAttribute('title', t2);
    btn.setAttribute('aria-label', t2);
  });
  setTimeout(() => {
    const t3 = tt(key, fallback);
    btn.setAttribute('title', t3);
    btn.setAttribute('aria-label', t3);
  }, 300);
}

/** —— 工具栏挂载 —— */
type Tool = { key: string; i18nKey: string; fallback: string; icon: string; run: () => void };
const tools: Tool[] = [
  { key: 'blank-1', i18nKey: 'lady-byron-more-format.forum.blank_paragraph', fallback: '空白段落', icon: 'fas fa-paragraph',   run: () => runBlank(1) },
  { key: 'indent',  i18nKey: 'lady-byron-more-format.forum.indent',          fallback: '段首缩进', icon: 'fas fa-indent',      run: runIndent },
  { key: 'center',  i18nKey: 'lady-byron-more-format.forum.center',          fallback: '居中',     icon: 'fas fa-align-center', run: () => wrapWithTagRT('center') },
  { key: 'right',   i18nKey: 'lady-byron-more-format.forum.right',           fallback: '右对齐',   icon: 'fas fa-align-right',  run: () => wrapWithTagRT('right') },
];

function findToolbars(): HTMLElement[] {
  // 覆盖 RTE 与纯文本编辑器两种工具栏
  return Array.from(document.querySelectorAll<HTMLElement>('.RichTextEditor-toolbar, .TextEditor-controls'));
}

function pickButtonGroup(root: HTMLElement): HTMLElement {
  // 优先把按钮插到“最后一个” ButtonGroup，避免被别的扩展插在前面导致不可见
  const groups = root.querySelectorAll<HTMLElement>('.ButtonGroup');
  if (groups.length) return groups[groups.length - 1];
  return root;
}

function mountButtons(toolbar: HTMLElement) {
  if (toolbar.getAttribute(MARK_ATTR)) return;
  toolbar.setAttribute(MARK_ATTR, '1');

  const group = pickButtonGroup(toolbar);

  for (const t of tools) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'Button Button--icon';
    btn.innerHTML = `<i class="${t.icon}"></i>`;
    setBtnTitle(btn, t.i18nKey, t.fallback);
    btn.addEventListener('click', (e) => { e.preventDefault(); t.run(); });
    group.appendChild(btn);
  }
}

app.initializers.add('lady-byron/more-format', () => {
  const tick = () => findToolbars().forEach(mountButtons);
  tick();
  new MutationObserver(tick).observe(document.body, { childList: true, subtree: true });
  (app.history as any)?.on?.('push', tick);
  (app.history as any)?.on?.('pop',  tick);
});
