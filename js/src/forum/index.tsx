import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';

// ✅ 用 compat 前缀导入其他扩展的导出
import RichTextEditor from 'flarum/compat/askvortsov-rich-text/forum/components/RichTextEditor';

// 翻译助手（取不到就用回退文案）
const t = (key: string, fallback: string) => {
  const s = (app.translator.trans(key) as unknown) as string;
  return !s || s === key ? fallback : s;
};

// 插入“只含 NBSP 的段落”：新段 -> NBSP -> 新段（中间段就是空白段）
function insertBlankParagraph(editor: any) {
  editor
    .chain()
    .focus()
    .insertContent({ type: 'paragraph' })
    .insertContent('\u00A0')
    .insertContent({ type: 'paragraph' })
    .run();
}

// 段首缩进：两个全角空格 U+3000
function insertIndent(editor: any) {
  try {
    const { state } = editor;
    const $from = state.selection.$from;
    const start = $from.start($from.depth);
    editor
      .chain()
      .focus()
      .setTextSelection({ from: start, to: start })
      .insertContent('\u3000\u3000')
      .run();
  } catch {
    editor.chain().focus().insertContent('\u3000\u3000').run();
  }
}

// 用 BBCode 包裹选区；无选区则插入成对标签并把光标放到中间
function wrapWithTag(editor: any, tag: 'center' | 'right') {
  const open = `[${tag}]`;
  const close = `[/${tag}]`;
  const { state } = editor;
  const sel = state.selection;

  if (!sel || sel.empty) {
    editor.chain().focus().insertContent(open + close).run();
    const posAfter = editor.state.selection.from;
    const inside = posAfter - close.length;
    editor.chain().setTextSelection({ from: inside, to: inside }).run();
    return;
  }

  const from = sel.from;
  const to = sel.to;
  const selectedText = state.doc.textBetween(from, to, '\n');

  editor
    .chain()
    .focus()
    .deleteRange({ from, to })
    .insertContent(open + selectedText + close)
    .run();
}

app.initializers.add('lady-byron/more-format', () => {
  extend(RichTextEditor.prototype as any, 'toolbarItems', function (items: any) {
    const editor = (this as any).editor || (this as any).attrs?.editor;
    if (!editor || !editor.chain) return;

    // 空白段落
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

    // 段首缩进
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

    // 居中
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

    // 右对齐
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


