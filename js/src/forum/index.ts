import app from 'flarum/forum/app';

function injectButtons(toolbar: Element) {
  const mark = 'lb-morefmt-mounted';
  if ((toolbar as HTMLElement).dataset[mark]) return;
  (toolbar as HTMLElement).dataset[mark] = '1';

  const mk = (title: string, icon: string, onClick: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'Button Button--icon';
    b.title = title;
    b.innerHTML = `<i class="${icon}"></i>`;
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const editor = document.querySelector('.RichText-editor[contenteditable="true"]') as HTMLElement | null;
      if (!editor) return;
      editor.focus();
      onClick();
    });
    return b;
  };

  const btnBlank = mk(app.translator.trans('lady-byron-more-format.forum.blank_paragraph') as unknown as string, 'fas fa-paragraph', () => {
    document.execCommand('insertHTML', false, '<p>&nbsp;</p>');
  });

  const btnIndent = mk(app.translator.trans('lady-byron-more-format.forum.indent') as unknown as string, 'fas fa-indent', () => {
    document.execCommand('insertText', false, '\u3000\u3000');
  });

  const group = toolbar.querySelector('.ButtonGroup') ?? toolbar;
  group.appendChild(btnBlank);
  group.appendChild(btnIndent);
}

app.initializers.add('lady-byron/more-format', () => {
  const mount = () => document.querySelectorAll('.RichTextEditor-toolbar').forEach(injectButtons);
  mount();
  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
});
