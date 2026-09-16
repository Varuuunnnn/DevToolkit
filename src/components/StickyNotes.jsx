import { createSignal, onMount, onCleanup } from 'solid-js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const COLORS = [
  { name: 'yellow', bg: '#fef9c3', border: '#fde047', text: '#713f12' },
  { name: 'pink', bg: '#fce7f3', border: '#f9a8d4', text: '#831843' },
  { name: 'blue', bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
  { name: 'green', bg: '#dcfce7', border: '#86efac', text: '#14532d' },
  { name: 'orange', bg: '#ffedd5', border: '#fdba74', text: '#7c2d12' },
  { name: 'purple', bg: '#f3e8ff', border: '#c4b5fd', text: '#581c87' },
]

function StickyNotes() {
  const [notes, setNotes] = createSignal([])
  const [loading, setLoading] = createSignal(true)
  const [dragId, setDragId] = createSignal(null)
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 })
  const [editingId, setEditingId] = createSignal(null)
  const [showColorPicker, setShowColorPicker] = createSignal(null)
  let boardEl = null

  onMount(async () => {
    await loadNotes()
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    onCleanup(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    })
  })

  const loadNotes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Failed to load notes:', error)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  const addNote = async () => {
    const { data, error } = await supabase
      .from('sticky_notes')
      .insert({ content: '', x: 40, y: 40, color: 'yellow' })
      .select()
    if (error) {
      console.error('Failed to add note:', error)
    } else if (data && data[0]) {
      setNotes([...notes(), data[0]])
      setEditingId(data[0].id)
    }
  }

  const deleteNote = async (id) => {
    const { error } = await supabase.from('sticky_notes').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete note:', error)
    } else {
      setNotes(notes().filter((n) => n.id !== id))
    }
  }

  const updateContent = async (id, content) => {
    const { error } = await supabase
      .from('sticky_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('Failed to update note:', error)
  }

  const updateColor = async (id, color) => {
    const { error } = await supabase
      .from('sticky_notes')
      .update({ color, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.error('Failed to update color:', error)
    } else {
      setNotes(notes().map((n) => (n.id === id ? { ...n, color } : n)))
    }
    setShowColorPicker(null)
  }

  const updatePosition = async (id, x, y) => {
    const { error } = await supabase
      .from('sticky_notes')
      .update({ x, y, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('Failed to update position:', error)
  }

  const onMouseDown = (e, note) => {
    if (editingId() === note.id) return
    e.preventDefault()
    setDragId(note.id)
    const rect = boardEl.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left - note.x,
      y: e.clientY - rect.top - note.y,
    })
  }

  const onMouseMove = (e) => {
    if (!dragId()) return
    const rect = boardEl.getBoundingClientRect()
    const x = Math.max(0, e.clientX - rect.left - dragOffset().x)
    const y = Math.max(0, e.clientY - rect.top - dragOffset().y)
    setNotes(notes().map((n) => (n.id === dragId() ? { ...n, x, y } : n)))
  }

  const onMouseUp = () => {
    if (!dragId()) return
    const note = notes().find((n) => n.id === dragId())
    if (note) updatePosition(note.id, note.x, note.y)
    setDragId(null)
  }

  const getColor = (name) => COLORS.find((c) => c.name === name) || COLORS[0]

  return (
    <div class="w-full">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Sticky Notes
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Drag notes anywhere on the board. Click to write, double-click color dot to change color.
          </p>
        </div>
        <button onClick={addNote} class="btn-primary text-sm whitespace-nowrap">
          + Add Note
        </button>
      </div>

      {loading() ? (
        <div class="text-center py-16 text-gray-500 dark:text-gray-400">
          Loading notes...
        </div>
      ) : (
        <div
          ref={(el) => (boardEl = el)}
          class="relative w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden"
          style={{ 'min-height': '600px' }}
        >
          {notes().length === 0 && (
            <div class="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <div class="text-center">
                <p class="text-5xl mb-3">📝</p>
                <p class="text-sm">No sticky notes yet. Click "Add Note" to get started!</p>
              </div>
            </div>
          )}

          {notes().map((note) => {
            const c = getColor(note.color)
            return (
              <div
                class="absolute select-none rounded-lg shadow-lg transition-shadow hover:shadow-xl"
                style={{
                  'background-color': c.bg,
                  border: `2px solid ${c.border}`,
                  left: `${note.x}px`,
                  top: `${note.y}px`,
                  width: '220px',
                  'min-height': '200px',
                  cursor: dragId() === note.id ? 'grabbing' : 'grab',
                }}
                onMouseDown={(e) => onMouseDown(e, note)}
              >
                {/* Note header */}
                <div
                  class="flex items-center justify-between px-2 py-1 cursor-move"
                  style={{ 'border-bottom': `1px solid ${c.border}` }}
                >
                  <div class="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowColorPicker(showColorPicker() === note.id ? null : note.id)
                      }}
                      class="w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
                      style={{ 'background-color': c.border }}
                      title="Change color"
                    />
                    {showColorPicker() === note.id && (
                      <div class="absolute top-7 left-0 z-20 flex gap-1 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600">
                        {COLORS.map((col) => (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateColor(note.id, col.name)
                            }}
                            class="w-6 h-6 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-125"
                            style={{ 'background-color': col.border }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNote(note.id)
                    }}
                    class="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold"
                    title="Delete note"
                  >
                    ✕
                  </button>
                </div>

                {/* Note content */}
                <textarea
                  value={note.content}
                  onFocus={() => setEditingId(note.id)}
                  onBlur={() => setEditingId(null)}
                  onInput={(e) => {
                    const val = e.target.value
                    setNotes(notes().map((n) => (n.id === note.id ? { ...n, content: val } : n)))
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Write something..."
                  class="w-full bg-transparent border-none outline-none resize-none p-3 text-sm leading-relaxed"
                  style={{ color: c.text, 'min-height': '160px' }}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StickyNotes
