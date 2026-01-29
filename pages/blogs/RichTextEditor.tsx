
import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Underline } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync state to editor only if content is different (to avoid cursor jumps)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string) => {
    document.execCommand(command, false, '');
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${isFocused ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
      {/* Toolbar */}
      <div className="flex items-center space-x-1 p-2 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
          title="Underline"
        >
          <Underline size={18} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('insertOrderedList'); }}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="prose-editor min-h-[300px] p-4 bg-white text-gray-900 outline-none overflow-y-auto leading-relaxed"
        data-placeholder={placeholder}
      />
    </div>
  );
};
