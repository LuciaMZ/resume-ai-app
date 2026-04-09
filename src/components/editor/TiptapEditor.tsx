'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';
import { EditorToolbar } from './EditorToolbar';

interface TiptapEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
  onFocus?: () => void;
}

export function TiptapEditor({
  content,
  onUpdate,
  placeholder,
  onFocus,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      UnderlineExt,
      LinkExt.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-primary-600 underline cursor-pointer',
        },
      }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onUpdate(e.getHTML());
    },
    onFocus: () => {
      onFocus?.();
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none px-3 py-2.5 min-h-[120px] focus:outline-none text-surface-900',
      },
    },
    immediatelyRender: false,
  });

  return (
    <div className="overflow-hidden rounded-lg border border-surface-200 bg-white transition-all duration-150 hover:border-surface-300 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:shadow-sm">
      <EditorToolbar editor={editor} />
      <div className="relative">
        {editor && editor.isEmpty && placeholder && (
          <div className="pointer-events-none absolute left-3 top-2.5 text-sm text-surface-400 select-none">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
