/* eslint-disable @typescript-eslint/no-explicit-any */
import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';

// --- 翻译助手（取不到就用回退文案）
const t = (key: string, fallback: string) => {
  const s = (app.translator.trans(key) as unknown) as string;
  return !s || s === key ? fallback : s;
};

// --- RTE 操作：空白段/缩进/BBCode 包裹
function insertBlankParagraph(editor: any) {
  editor.chain().focus().insertContent({ type: 'paragraph' }).insertContent('\u00A0').insertContent({ type: 'paragraph' }).run();
}

function insertIndent(editor: any) {
  try {
    const { state } = editor;
    const $from = state.selection.$from;
    const start = $from.start($from.depth);
    editor.chain().focus().setTextSelection({ from: start, to: start }).insertContent('\u3000\u3000').run();
  } catch {
    editor.chain().focus().insertContent('\u3000\u3000').run();
  }
}

function wrapWithTag(editor: any, tag: 'center' | 'right') {
  const open = `[${tag}]`;
  const close = `[/${tag}]`;
  const sel = editor.state.selection;

  if (!sel || sel.empty) {
    editor.chain().focus().insertContent(open + close).run();
    const posAfter = editor.state.selection.from;
    const inside = posAfter - close.length;
    editor.chain().setTextSelection({ from: inside, to: inside }).run();
    return;
  }

  const from = sel.from;
  const to = sel.to;
  const selectedText = editor.state.doc.textBetween(from, to, '\n');

  editor.chain().focus().deleteRange({ from, to }).insertContent(open + selectedText + close).run();
}

app.initializers.add('lady-byron/more-format', () => {
  // ❶ 运行时再“拿”别的扩展，确保已加载；并兼容不同导出形态
  let rich: any;
  try {
    // 需要在 webpack.config.js 里 useExtensions: ['askvortsov-rich-text']
    // 这样这里才有 @askvortsov-rich-text 可用
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    rich = require('@askvortsov-rich-text');
  } catch (e) {
    console.warn('[more-format] @askvortsov-rich-text not available', e);
    return; // 避免初始化失败
  }

  const RichTextEditor =
    rich?.components?.RichTextEditor ||
    rich?.RichTextEditor ||
    rich?.default?.components?.RichTextEditor ||
    rich?.default?.RichTextEditor;

  if (!RichTextEditor) {
    console.warn('[more-format] RichTextEditor export not found on @askvortsov-rich-text', rich);
    return; // 避免初始化失败
  }

  // ❷ 正式向 RTE 工具栏注入按钮
  extend(RichTextEditor.prototype as any, 'toolbarItems', function (items: any) {
    const editor = (this as any).editor || (this as any).attrs?.editor;
    if (!editor || !editor.chain) return;

    items.add(
      'lb-blank-paragraph',
      <Button
        className="Button Button--icon"
        icon="fas fa-paragraph"
        title={t('lady-byron-more-format.forum.blank_paragraph', '空白段落')}
        onclick={() => insertBlankParagraph(editor)}
      />,
      30
    );

    items.add(
      'lb-indent',
      <Button
        className="Button Button--icon"
        icon="fas fa-indent"
        title={t('lady-byron-more-format.forum.indent', '段首缩进')}
        onclick={() => insertIndent(editor)}
      />,
      29
    );

    items.add(
      'lb-center',
      <Button
        className="Button Button--icon"
        icon="fas fa-align-center"
        title={t('lady-byron-more-format.forum.center', '居中')}
        onclick={() => wrapWithTag(editor, 'center')}
      />,
      28
    );

    items.add(
      'lb-right',
      <Button
        className="Button Button--icon"
        icon="fas fa-align-right"
        title={t('lady-byron-more-format.forum.right', '右对齐')}
        onclick={() => wrapWithTag(editor, 'right')}
      />,
      27
    );
  });
});


