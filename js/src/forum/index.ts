import app from 'flarum/forum/app';

const MARK_ATTR = 'data-lb-moreformat-mounted';

function findToolbars(): Element[] {
  // 同时适配富文本工具栏 & 传统编辑器工具栏
  return Array.from(
    document.querySelectorAll('.RichTextEditor-toolbar, .TextEditor-controls')
  );
}

function insertAtCursor(htmlOrText: string, isHTML = false) {
  // 优先富文本
  const rted = document.querySelector(
    '.RichText-editor[contenteditable="true"]'
  ) as HTMLElement | null;

  if (rted) {
    rted.focus();
    if (isHTML) document.execCommand('insertHTML', false, htmlOrText);
    else document.execCommand('insertText', false, htmlOrText);
    return;
  }
  // 兼容纯文本编辑器
  const ta = document.querySelector('.TextEditor textarea') as
    | HTMLTextAreaElement
    | null;
  if (ta) {
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    ta.value = ta.value.slice(0, start) + htmlOrText + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = start + htmlOrText.length;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
  }
}

function mountButtons(toolbar: Element) {
  const root = toolbar as HTMLElement;
  if (root.getAttribute(MARK_ATTR)) return; // 避免重复挂载
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

  // 空白段落：插入仅含 NBSP 的 <p>
  const btnBlank = mk(
    (app.translator.trans('lady-byron-more-format.forum.blank_paragraph') as unknown) as string,
    'fas fa-paragraph',
    () => insertAtCursor('<p>&nbsp;</p>', true)
  );

  // 段首缩进：两个全角空格（U+3000）
  const btnIndent = mk(
    (app.translator.trans('lady-byron-more-format.forum.indent') as unknown) as string,
    'fas fa-indent',
    () => insertAtCursor('\u3000\u3000', false)
  );

  group.appendChild(btnBlank);
  group.appendChild(btnIndent);
}

app.initializers.add('lady-byron/more-format', () => {
  const tick = () => findToolbars().forEach(mountButtons);

  tick();
  new MutationObserver(tick).observe(document.body, { childList: true, subtree: true });
  // 路由切换后也再试一次
  (app.history as any)?.on?.('push', tick);
  (app.history as any)?.on?.('pop', tick);
});
