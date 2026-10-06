import { createSignal, onMount, onCleanup, For } from 'solid-js'

const STORAGE_KEY = 'devtoolkit-sticky-notes'

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Today, ${time}`
  if (isYesterday) return `Yesterday, ${time}`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + `, ${time}`
}

function formatFullDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
  const [showClearConfirm, setShowClearConfirm] = createSignal(false)
  const [colorPickerFor, setColorPickerFor] = createSignal(null)
  let dragId = null
  let dragOffsetX = 0
  let dragOffsetY = 0
  let boardEl = null
  let saveTimer = null

  const debounceSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveToStorage(notes()), 400)
  }

  onMount(() => {
    setNotes(loadFromStorage())
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    onCleanup(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    })
  })

  const addNote = () => {
    const offset = notes().length % 6
    const newNote = {
      id: genId(),
      content: '',
      title: '',
      x: 30 + offset * 30,
      y: 30 + offset * 30,
      color: 'yellow',
      created_at: new Date().toISOString(),
    }
    setNotes([...notes(), newNote])
    debounceSave()
  }

  const deleteNote = (id) => {
    setNotes(notes().filter((n) => n.id !== id))
    debounceSave()
  }

  const clearAll = () => {
    setNotes([])
    saveToStorage([])
    setShowClearConfirm(false)
  }

  const updateColor = (id, color) => {
    setNotes(notes().map((n) => (n.id === id ? { ...n, color } : n)))
    debounceSave()
    setColorPickerFor(null)
  }

  const onMouseDown = (e, note) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return
    e.preventDefault()
    dragId = note.id
    const rect = boardEl.getBoundingClientRect()
    dragOffsetX = e.clientX - rect.left - note.x + boardEl.scrollLeft
    dragOffsetY = e.clientY - rect.top - note.y + boardEl.scrollTop
  }

  const onMouseMove = (e) => {
    if (!dragId) return
    const rect = boardEl.getBoundingClientRect()
    const x = Math.max(0, e.clientX - rect.left - dragOffsetX + boardEl.scrollLeft)
    const y = Math.max(0, e.clientY - rect.top - dragOffsetY + boardEl.scrollTop)
    setNotes(notes().map((n) => (n.id === dragId ? { ...n, x, y } : n)))
  }

  const onMouseUp = () => {
    if (!dragId) return
    dragId = null
    debounceSave()
  }

  const getColor = (name) => COLORS.find((c) => c.name === name) || COLORS[0]

  return (
    <div class="w-full">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Sticky Notes
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Drag notes anywhere on the board. Click to write, click the color dot to change color.
          </p>
        </div>
        <div class="flex items-center gap-2">
          {notes().length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              class="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-medium py-3 px-5 rounded-lg transition-all duration-200 text-sm transform hover:scale-105 active:scale-95"
            >
              Clear All
            </button>
          )}
          <button onClick={addNote} class="btn-primary text-sm whitespace-nowrap">
            + Add Note
          </button>
        </div>
      </div>

      {showClearConfirm() && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Clear all sticky notes?</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will permanently delete all your sticky notes. This action cannot be undone.
            </p>
            <div class="flex gap-3 justify-end">
              <button onClick={() => setShowClearConfirm(false)} class="btn-secondary text-sm">
                Cancel
              </button>
              <button
                onClick={clearAll}
                class="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={(el) => (boardEl = el)}
        class="relative w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-auto"
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

        <For each={notes()}>
          {(note) => {
            const c = getColor(note.color)
            return (
              <div
                class="absolute select-none rounded-lg shadow-lg hover:shadow-xl"
                style={{
                  'background-color': c.bg,
                  border: `2px solid ${c.border}`,
                  left: `${note.x}px`,
                  top: `${note.y}px`,
                  width: '220px',
                  'min-height': '200px',
                }}
                onMouseDown={(e) => onMouseDown(e, note)}
              >
                <div
                  class="px-2 pt-1 pb-0"
                  style={{ 'border-bottom': `1px solid ${c.border}` }}
                >
                  <div class="flex items-center justify-between">
                    <div class="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setColorPickerFor(colorPickerFor() === note.id ? null : note.id)
                        }}
                        class="w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
                        style={{ 'background-color': c.border }}
                        title="Change color"
                      />
                      {colorPickerFor() === note.id && (
                        <div
                          class="absolute top-7 left-0 z-30 flex gap-1 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <For each={COLORS}>
                            {(col) => (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateColor(note.id, col.name)
                                }}
                                class="w-6 h-6 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-125"
                                style={{ 'background-color': col.border }}
                              />
                            )}
                          </For>
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
                  <input
                    type="text"
                    value={note.title || ''}
                    onInput={(e) => {
                      note.title = e.currentTarget.value
                      setNotes([...notes()])
                      debounceSave()
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Title..."
                    class="w-full bg-transparent border-none outline-none text-xs font-semibold pb-1 placeholder:opacity-50"
                    style={{ color: c.text }}
                  />
                  <div
                    class="text-xs font-medium pb-1 truncate"
                    style={{ color: c.text, opacity: 0.7 }}
                    title={`Created: ${formatFullDate(note.created_at)}`}
                  >
                    {formatDate(note.created_at)}
                  </div>
                </div>

                <textarea
                  value={note.content}
                  onInput={(e) => {
                    note.content = e.currentTarget.value
                    setNotes([...notes()])
                    debounceSave()
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Write something..."
                  class="w-full bg-transparent border-none outline-none resize-none p-3 text-sm leading-relaxed"
                  style={{ color: c.text, 'min-height': '160px' }}
                />
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

export default StickyNotes
