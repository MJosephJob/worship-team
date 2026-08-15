import { useEffect, useRef } from 'react'
import { Bold, Italic, Underline, List } from 'lucide-react'

export default function RichTextEditor({ value, onChange, rows = 6, placeholder = '' }) {
  const editorRef = useRef(null)

  // Set initial content once
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function exec(command) {
    editorRef.current?.focus()
    document.execCommand(command, false, null)
    sync()
  }

  function sync() {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  const toolbarBtn = 'w-7 h-7 rounded flex items-center justify-center text-cream-muted hover:text-gold hover:bg-gold/10 transition-colors'

  return (
    <div className="worship-input p-0 overflow-hidden flex flex-col" style={{ minHeight: `${rows * 1.75}rem` }}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-surface flex-shrink-0">
        <button type="button" onClick={() => exec('bold')} className={toolbarBtn} data-tooltip="Bold"><Bold size={13} /></button>
        <button type="button" onClick={() => exec('italic')} className={toolbarBtn} data-tooltip="Italic"><Italic size={13} /></button>
        <button type="button" onClick={() => exec('underline')} className={toolbarBtn} data-tooltip="Underline"><Underline size={13} /></button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className={toolbarBtn} data-tooltip="Bullet list"><List size={13} /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        className="flex-1 px-3 py-2.5 font-body text-sm text-cream outline-none overflow-y-auto"
        style={{ minHeight: `${(rows - 1) * 1.75}rem` }}
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--color-cream-muted);
          pointer-events: none;
        }
        [contenteditable] ul { padding-left: 1.25rem; margin: 0.25rem 0; }
        [contenteditable] li { margin-bottom: 0.2rem; }
      `}</style>
    </div>
  )
}
