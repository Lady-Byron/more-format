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

function wrapWithTagRT(tag: 'center' | 'right') {
  const open = `[${tag}]`;
  const close = `[/${tag}]`;

  const ed = getRteEditable();
  if (ed) {
    ed.focus();
    const sel = window.getSelection();
    const selected = sel && sel.rangeCount > 0 ? sel.toString() : '';
    if (selected) {
      document.execCommand('insertText', false, open + selected + close);
    } else {
      document.execCommand('insertText', false, open + close);
      // 无选区时：把光标移到 open/close 中间
      //（RTE 下无法可靠设置选区，交给用户直接输入）
    }
    return true;
  }

  const ta = getTextarea();
  if (ta) {
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    const selected = ta.value.slice(start, end);
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    ta.value = before + open + selected + close + after;

    if (selected) {
      const pos = (before + open + selected + close).length;
      ta.selectionStart = ta.selectionEnd = pos;
    } else {
      const pos = (before + open).length;
      ta.selectionStart = ta.selectionEnd = pos;
    }

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

