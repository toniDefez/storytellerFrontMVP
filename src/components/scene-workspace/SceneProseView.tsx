import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface SceneProseViewProps {
  content: string;
  readOnly?: boolean;
}

export function SceneProseView({ content, readOnly = true }: SceneProseViewProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: !readOnly,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', background: '#fafafa' }}>
      <EditorContent editor={editor} />
    </div>
  );
}
