
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  List, ListOrdered, Quote, 
  Heading1, Heading2, Heading3, 
  Undo, Redo, Link as LinkIcon,
  Eraser
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter the URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const btnClass = (active: boolean) => 
    `p-2 rounded-lg transition-all ${active ? 'bg-orange-100 text-[#d84602]' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'}`;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
      <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold">
          <Bold size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic">
          <Italic size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline">
          <UnderlineIcon size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-slate-200">
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1">
          <Heading1 size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2">
          <Heading2 size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Heading 3">
          <Heading3 size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-slate-200">
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List">
          <List size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Numbered List">
          <ListOrdered size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Blockquote">
          <Quote size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-slate-200">
        <button type="button" onClick={addLink} className={btnClass(editor.isActive('link'))} title="Add Link">
          <LinkIcon size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().run()} className={btnClass(false)} title="Clear Formatting">
          <Eraser size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 pl-2 ml-auto">
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 disabled:opacity-30 text-slate-500 hover:text-slate-900 transition-colors" title="Undo">
          <Undo size={18} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 disabled:opacity-30 text-slate-500 hover:text-slate-900 transition-colors" title="Redo">
          <Redo size={18} />
        </button>
      </div>
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#d84602] underline font-bold cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start typing or paste from Word...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none',
      },
    },
  });

  // Keep editor content in sync with external value changes (like when loading data)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-orange-50 focus-within:border-[#d84602] transition-all shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="bg-white text-slate-800" />
    </div>
  );
};
