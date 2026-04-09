'use client';

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  label,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      className={`
        inline-flex h-8 w-8 items-center justify-center rounded-md text-sm
        transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
        ${
          isActive
            ? 'bg-primary-100 text-primary-700 shadow-sm'
            : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
        }
      `}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const setLink = useCallback(() => {
    if (!editor) return;

    // If link is already active, remove it
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const url = window.prompt('Enter URL:');
    if (!url) return;

    // Ensure URL has protocol
    const href = url.match(/^https?:\/\//) ? url : `https://${url}`;

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href })
      .run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className="flex items-center gap-0.5 border-b border-surface-200 bg-surface-50/50 px-2 py-1.5"
      role="toolbar"
      aria-label="Text formatting"
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        label="Bold"
      >
        <Bold className="h-4 w-4" strokeWidth={2.5} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        label="Underline"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>

      {/* Separator */}
      <div className="mx-1 h-5 w-px bg-surface-200" aria-hidden="true" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        label="Bullet list"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        label="Ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      {/* Separator */}
      <div className="mx-1 h-5 w-px bg-surface-200" aria-hidden="true" />

      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        disabled={false}
        label={editor.isActive('link') ? 'Remove link' : 'Add link'}
      >
        <Link className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
