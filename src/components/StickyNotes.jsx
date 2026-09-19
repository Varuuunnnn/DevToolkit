import { createSignal, onMount, onCleanup } from 'solid-js'

const STORAGE_KEY = 'devtoolkit-sticky-notes'

const COLORS = [
  { name: 'yellow', bg: '#fef9c3', border: '#fde047', text: '#713f12' },
  { name: 'pink', bg: '#fce7f3', border: '#f9a8d4', text: '#831843' },
  { name: 'blue', bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
  { name: 'green', bg: '#dcfce7', border: '#86efac', text: '#14532d' },
  { name: 'orange', bg: '#ffedd5', border: '#fdba74', text: '#7c2d12' },
  { name: 'purple', bg: '#f3e8ff', border: '#c4b5fd', text: '#581c87' },
]

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load sticky notes:', e)
  }
  return []
}

function saveToStorage(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch (e) {
    console.error('Failed to save sticky notes:', e)
  }
}

function StickyNotes() {
  const [notes, setNotes] = createSignal([])
  const [dragId, setDragId] = createSignal(null)
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 })
  const [editingId, setEditingId] = createSignal(null)
  const [showColorPicker, setShowColorPicker] = createSignal(null)
  let boardEl = null

  const persist = (next) => {
    setNotes(next)
    saveToStorage(next)
  }

  onMount(() => {
    const loaded = loadFromStorage()
    setNotes(loaded)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    onCleanup(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    })
  })

  const addNote = () => {
    const newNote = {
      id: genId(),
      content: '',
      x: 40 + (notes().length % 6) * 30,
      y: 40 + (notes().length % 6) * 30,
      color: 'yellow',
      created_at: new Date().toISOString(),
    }
    persist([...notes(), newNote])
    setEditingId(newNote.id)
  }

  const deleteNote = (id) => {
    persist(notes().filter((n) => n.id !== id))
  }

  const updateContent = (id, content) => {
    persist(notes().map((n) => (n.id === id ? { ...n, content } : n)))
  }

  const updateColor = (id, color) => {
    persist(notes().map((n) => (n.id === id ? { ...n, color } : n)))
    setShowColorPicker(null)
  }

  const updatePosition = (id, x, y) => {
    persist(notes().map((n) => (n.id === id ? { ...n, x, y } : n)))
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
            Drag notes anywhere on the board. Click to write, click the color dot to change color.
          </p>
        </div>
        <button onClick={addNote} class="btn-primary text-sm whitespace-nowrap">
          + Add Note
        </button>
      </div>

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
                  updateContent(note.id, val)
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
    </div>
  )
}

export default StickyNotes
