import app from 'flarum/forum/app';

const MARK_ATTR = 'data-lb-moreformat-mounted';

function findToolbars(): Element[] {
  return Array.from(
    document.querySelectorAll('.RichTextEditor-toolbar, .TextEditor-controls')
  );
}

function insertIndent() {
  // 段首缩进：两个全角空格（U+3000）
  const rted = document.querySelector('.RichText-editor[contenteditable="true"]') as HTMLElement | null;
  if (rted) {
    rted.focus();
    document.execCommand('insertText', false, '\u3000\u3000');
    return;
  }
  const ta = document.querySelector('.TextEditor textarea') as HTMLTextAreaElement | null;
  if (ta) {
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    const s = '\u3000\u3000';
    ta.value = ta.value.slice(0, start) + s + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = start + s.length;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
  }
}

function insertBlankParagraph() {
  // 空白段落：一整段只有 NBSP 的段落
  const rted = document.querySelector('.RichText-editor[contenteditable="true"]') as HTMLElement | null;
  if (rted) {
    rted.focus();
    // 新段 -> NBSP -> 再起新段，让 NBSP 段独立存在
    document.execCommand('insertParagraph');                   // 开一个新段
    document.execCommand('insertText', false, '\u00A0');       // 放入 NBSP 字符（不是 "&nbsp;"）
    document.execCommand('insertParagraph');                   // 再开下一段
    return;
  }
  // 纯文本编辑器回退：插入 \n NBSP \n
  const ta = document.querySelector('.TextEditor textarea') as HTMLTextAreaElement | null;
  if (ta) {
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    const s = '\n\u00A0\n';
    ta.value = ta.value.slice(0, start) + s + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = start + s.length;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
  }
}

function mountButtons(toolbar: Element) {
  const root = toolbar as HTMLElement;
  if (root.getAttribute(MARK_ATTR)) return;
  root.setAttribute(MARK_ATTR, '1');

  const group = root.querySelector('.ButtonGroup') ?? root;

  const mk = (title: string, icon: string, onClick: () => void) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'Button Button--icon';
    btn.title = title;
    btn.innerHTML = `<i class="${icon}"></i>`;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      onClick();
    });
    return btn;
  };

  const btnBlank = mk(
    (app.translator.trans('lady-byron-more-format.forum.blank_paragraph') as unknown) as string,
    'fas fa-paragraph',
    insertBlankParagraph
  );

  const btnIndent = mk(
    (app.translator.trans('lady-byron-more-format.forum.indent') as unknown) as string,
    'fas fa-indent',
    insertIndent
  );

  group.appendChild(btnBlank);
  group.appendChild(btnIndent);
}

app.initializers.add('lady-byron/more-format', () => {
  const tick = () => findToolbars().forEach(mountButtons);
  tick();
  new MutationObserver(tick).observe(document.body, { childList: true, subtree: true });
  (app.history as any)?.on?.('push', tick);
  (app.history as any)?.on?.('pop', tick);
});
