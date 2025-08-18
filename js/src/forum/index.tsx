import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';

// ✅ Rich Text 编辑器组件（不同版本路径一致性很好；若编译报错，再换为
// 'askvortsov/flarum-rich-text/forum/components/RichTextEditor'）
import RichTextEditor from 'askvortsov/flarum-rich-text/forum/components/RichTextEditor';

app.initializers.add('lady-byron/more-format', () => {
  extend(RichTextEditor.prototype as any, 'toolbarItems', function (items: any) {
    const editor = (this as any).editor || (this as any).attrs?.editor;
    if (!editor || !editor.chain) return;

    // 空白段落：插入只含 NBSP 的 <p>，避免被折叠
    items.add(
      'lb-blank-paragraph',
      <Button
        className="Button Button--icon"
        icon="fas fa-paragraph"
        title={app.translator.trans('lady-byron-more-format.forum.blank_paragraph')}
        onclick={() => {
          editor
            .chain()
            .focus()
            .insertContent({ type: 'paragraph', content: [{ type: 'text', text: '\u00A0' }] })
            .run();
        }}
      />,
      30
    );

    // 段首缩进：将光标移到当前段开头并插入两个全角空格（U+3000）
    items.add(
      'lb-indent',
      <Button
        className="Button Button--icon"
        icon="fas fa-indent"
        title={app.translator.trans('lady-byron-more-format.forum.indent')}
        onclick={() => {
          try {
            const { state } = editor;
            const $from = state.selection.$from;
            const start = $from.start($from.depth);
            editor
              .chain()
              .focus()
              .setTextSelection({ from: start, to: start })
              .insertContent('\u3000\u3000') // 如偏好 NBSP，可换成 '\u00A0\u00A0'
              .run();
          } catch {
            editor.chain().focus().insertContent('\u3000\u3000').run();
          }
        }}
      />,
      29
    );
  });
});
