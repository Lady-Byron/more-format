import app from 'flarum/forum/app';

const MARK_ATTR = 'data-lb-moreformat-mounted';

// —— 统一找“当前可编辑区”：优先富文本(.ProseMirror)，其次旧文本框 ——
function getRteEditable(): HTMLElement | null {
  // RTE 的真实编辑区
  const pm = document.querySelector('.ProseMirror[contenteditable="true"]') as HTMLElement | null;
  if (pm) return pm;

  // 某些主题旧类名（备援）
  const r1 = document.querySelector('.RichText-editor[contenteditable="true"]') as HTMLElement | null;
  if (r1) return r1;

  return null;
}
function getTextarea(): HTMLTextAreaElement | null {
  return document.querySelector('.TextEditor textarea') as HTMLTextAreaElement | null;
}

// —— 基础操作：插入文字、起新段（同时兼容 RTE / 旧编辑器） ——
function insertTextRT(text: string) {
  const ed = getRteEditable();
  if (ed) {
    ed.focus();
    document.execCommand('insertText', false, text); // 由 ProseMirror 接管
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
    document.execCommand('insertParagraph');        // 触发 RTE 的起段逻辑
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

// —— 现有两个功能 ——
function runIndent() { insertTextRT('\u3000\u3000'); }

function runBlank(n = 1) {
  for (let i = 0; i < n; i++) {
    insertParagraphRT();                 // 开新段
    insertTextRT('\u00A0');              // 放入真实 NBSP（不是字面“&nbsp;”）
    insertParagraphRT();                 // 再开下一段
  }
}

// —— 工具栏挂载（保持不变） ——
type Tool = { key: string; title: string; icon: string; run: () => void; };
const tools: Tool[] = [
  { key: 'blank-1', title: app.translator.trans('lady-byron-more-format.forum.blank_paragraph') as any, icon: 'fas fa-paragraph', run: () => runBlank(1) },
  { key: 'indent',  title: app.translator.trans('lady-byron-more-format.forum.indent') as any,         icon: 'fas fa-indent',    run: runIndent },
];

function findToolbars(): Element[] {
  // 兼容富文本和原生工具栏
  return Array.from(document.querySelectorAll('.RichTextEditor-toolbar, .TextEditor-controls'));
}

function mountButtons(toolbar: Element) {
  const root = toolbar as HTMLElement;
  if (root.getAttribute(MARK_ATTR)) return;
  root.setAttribute(MARK_ATTR, '1');

  const group = root.querySelector('.ButtonGroup') ?? root;

  for (const t of tools) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'Button Button--icon';
    btn.title = t.title;
    btn.innerHTML = `<i class="${t.icon}"></i>`;
    btn.addEventListener('click', (e) => { e.preventDefault(); t.run(); });
    group.appendChild(btn);
  }
}

app.initializers.add('lady-byron/more-format', () => {
  const tick = () => findToolbars().forEach(mountButtons);
  tick();
  new MutationObserver(tick).observe(document.body, { childList: true, subtree: true });
  (app.history as any)?.on?.('push', tick);
  (app.history as any)?.on?.('pop', tick);
});
