import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo } from 'react';
import { proseToHtml } from '../../lib/prose';

interface SceneProseViewProps {
  content: string;
  readOnly?: boolean;
}

export function SceneProseView({ content, readOnly = true }: SceneProseViewProps) {
  const html = useMemo(() => proseToHtml(content), [content]);
  const editor = useEditor({
    extensions: [StarterKit],
    content: html,
    editable: !readOnly,
  });

  useEffect(() => {
    if (editor && html !== editor.getHTML()) {
      editor.commands.setContent(html);
    }
  }, [html, editor]);

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', background: '#fafafa' }}>
      <EditorContent
        editor={editor}
        className="max-w-[68ch] text-[1.0625rem] leading-[1.75] text-stone-800 [&_p]:mb-4"
        style={{ fontFamily: 'var(--font-display)' }}
      />
    </div>
  );
}
