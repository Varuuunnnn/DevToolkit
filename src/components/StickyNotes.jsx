import { createSignal, onMount, onCleanup, For, Show } from 'solid-js'
import { supabase } from '../lib/supabase'

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

function toDateString(iso) {
  return new Date(iso).toISOString().split('T')[0]
}

function todayDateString() {
  return new Date().toISOString().split('T')[0]
}

const COLORS = [
  { name: 'yellow', bg: '#fef9c3', border: '#fde047', text: '#713f12' },
  { name: 'pink', bg: '#fce7f3', border: '#f9a8d4', text: '#831843' },
  { name: 'blue', bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
  { name: 'green', bg: '#dcfce7', border: '#86efac', text: '#14532d' },
  { name: 'orange', bg: '#ffedd5', border: '#fdba74', text: '#7c2d12' },
  { name: 'purple', bg: '#f3e8ff', border: '#c4b5fd', text: '#581c87' },
]

function getColor(name) {
  return COLORS.find((c) => c.name === name) || COLORS[0]
}

async function fetchNotesByDate(dateStr) {
  const start = new Date(dateStr + 'T00:00:00')
  const end = new Date(dateStr + 'T23:59:59')
  const { data, error } = await supabase
    .from('sticky_notes')
    .select('*')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true })
  if (error) {
    console.error('Failed to fetch notes:', error.message)
    return []
  }
  return (data || []).map((row) => ({
    id: row.id,
    content: row.content || '',
    title: row.title || '',
    x: row.x || 30,
    y: row.y || 30,
    color: row.color || 'yellow',
    created_at: row.created_at,
  }))
}

async function insertNote(note) {
  const { data, error } = await supabase
    .from('sticky_notes')
    .insert({
      title: note.title || '',
      content: note.content || '',
      x: Math.round(note.x),
      y: Math.round(note.y),
      color: note.color || 'yellow',
    })
    .select()
    .single()
  if (error) {
    console.error('Failed to insert note:', error.message)
    return null
  }
  return data.id
}

async function updateNoteInDb(id, fields) {
  const { error } = await supabase
    .from('sticky_notes')
    .update(fields)
    .eq('id', id)
  if (error) console.error('Failed to update note:', error.message)
}

async function deleteNoteFromDb(id) {
  const { error } = await supabase
    .from('sticky_notes')
    .delete()
    .eq('id', id)
  if (error) console.error('Failed to delete note:', error.message)
}

async function deleteNotesByDate(dateStr) {
  const start = new Date(dateStr + 'T00:00:00')
  const end = new Date(dateStr + 'T23:59:59')
  const { error } = await supabase
    .from('sticky_notes')
    .delete()
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
  if (error) console.error('Failed to clear notes:', error.message)
}

function StickyNotes() {
  const [notes, setNotes] = createSignal([])
  const [showClearConfirm, setShowClearConfirm] = createSignal(false)
  const [colorPickerFor, setColorPickerFor] = createSignal(null)
  const [editingTitleFor, setEditingTitleFor] = createSignal(null)
  const [calendarDate, setCalendarDate] = createSignal(todayDateString())
  const [viewingDate, setViewingDate] = createSignal(todayDateString())
  const [loading, setLoading] = createSignal(false)
  const [fetchError, setFetchError] = createSignal('')
  let titleInputs = {}
  let dragId = null
  let dragOffsetX = 0
  let dragOffsetY = 0
  let boardEl = null
  let updateTimers = {}

  const loadNotes = async (dateStr) => {
    setLoading(true)
    setFetchError('')
    const result = await fetchNotesByDate(dateStr)
    setNotes(result)
    setLoading(false)
    if (result.length === 0) {
      setFetchError(`No sticky notes found for ${new Date(dateStr + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`)
    }
  }

  onMount(async () => {
    await loadNotes(todayDateString())
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    onCleanup(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    })
  })

  const isViewingToday = () => viewingDate() === todayDateString()

  const addNote = async () => {
    if (!isViewingToday()) return
    const offset = notes().length % 6
    const { data, error } = await supabase
      .from('sticky_notes')
      .insert({
        title: '',
        content: '',
        x: 30 + offset * 30,
        y: 30 + offset * 30,
        color: 'yellow',
      })
      .select()
      .single()
    if (error) {
      console.error('Failed to add note:', error.message)
      return
    }
    const newNote = {
      id: data.id,
      content: '',
      title: '',
      x: data.x,
      y: data.y,
      color: data.color,
      created_at: data.created_at,
    }
    setNotes([...notes(), newNote])
  }

  const deleteNote = (id) => {
    deleteNoteFromDb(id)
    setNotes(notes().filter((n) => n.id !== id))
  }

  const clearAll = async () => {
    await deleteNotesByDate(viewingDate())
    setNotes([])
    setShowClearConfirm(false)
  }

  const updateColor = (id, color) => {
    setNotes(notes().map((n) => (n.id === id ? { ...n, color } : n)))
    updateNoteInDb(id, { color })
    setColorPickerFor(null)
  }

  const debounceUpdate = (id, fields) => {
    if (updateTimers[id]) clearTimeout(updateTimers[id])
    updateTimers[id] = setTimeout(() => {
      updateNoteInDb(id, fields)
    }, 600)
  }

  const onMouseDown = (e, note) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return
    if (editingTitleFor() === note.id) return
    if (!isViewingToday()) return
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
    const note = notes().find((n) => n.id === dragId)
    if (note) updateNoteInDb(note.id, { x: Math.round(note.x), y: Math.round(note.y) })
    dragId = null
  }

  const focusTitleInput = (id) => {
    setTimeout(() => {
      const el = titleInputs[id]
      if (el) {
        el.focus()
        el.select()
      }
    }, 0)
  }

  const onFetchClick = async () => {
    const dateStr = calendarDate()
    if (!dateStr) return
    setViewingDate(dateStr)
    await loadNotes(dateStr)
  }

  const renderNote = (note) => {
    const c = getColor(note.color)
    const readOnly = !isViewingToday()
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
          opacity: readOnly ? '0.92' : '1',
        }}
        onMouseDown={(e) => !readOnly && onMouseDown(e, note)}
      >
        <div
          class="px-2 pt-1 pb-0"
          style={{ 'border-bottom': `1px solid ${c.border}` }}
        >
          <div class="flex items-center gap-1.5">
            <div class="relative shrink-0">
              <button
                onClick={(e) => {
                  if (readOnly) return
                  e.stopPropagation()
                  setColorPickerFor(colorPickerFor() === note.id ? null : note.id)
                }}
                class="w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
                style={{ 'background-color': c.border }}
                title="Change color"
                disabled={readOnly}
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
            {editingTitleFor() === note.id && !readOnly ? (
              <input
                ref={(el) => (titleInputs[note.id] = el)}
                type="text"
                value={note.title || ''}
                onInput={(e) => {
                  const val = e.currentTarget.value
                  setNotes(notes().map((n) => (n.id === note.id ? { ...n, title: val } : n)))
                  debounceUpdate(note.id, { title: val })
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={() => setEditingTitleFor(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingTitleFor(null)
                }}
                placeholder="Title..."
                class="flex-1 min-w-0 bg-transparent border-none outline-none text-xs font-semibold placeholder:opacity-50"
                style={{ color: c.text }}
              />
            ) : (
              <div
                onClick={(e) => {
                  if (readOnly) return
                  e.stopPropagation()
                  setEditingTitleFor(note.id)
                  focusTitleInput(note.id)
                }}
                class="flex-1 min-w-0 text-xs font-semibold truncate"
                style={{ color: c.text, opacity: note.title ? 1 : 0.5, cursor: readOnly ? 'default' : 'text' }}
              >
                {note.title || 'Title...'}
              </div>
            )}
            <button
              onClick={(e) => {
                if (readOnly) return
                e.stopPropagation()
                deleteNote(note.id)
              }}
              class="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold shrink-0"
              title="Delete note"
              disabled={readOnly}
              style={{ opacity: readOnly ? '0.3' : '1' }}
            >
              ✕
            </button>
          </div>
          <div
            class="text-xs font-medium pb-1 pt-0.5 truncate"
            style={{ color: c.text, opacity: 0.7 }}
            title={`Created: ${formatFullDate(note.created_at)}`}
          >
            {formatDate(note.created_at)}
          </div>
        </div>

        <textarea
          value={note.content}
          onInput={(e) => {
            if (readOnly) return
            const val = e.currentTarget.value
            setNotes(notes().map((n) => (n.id === note.id ? { ...n, content: val } : n)))
            debounceUpdate(note.id, { content: val })
          }}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Write something..."
          class="w-full bg-transparent border-none outline-none resize-none p-3 text-sm leading-relaxed"
          style={{ color: c.text, 'min-height': '160px' }}
          disabled={readOnly}
        />
      </div>
    )
  }

  return (
    <div class="w-full">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            Sticky Notes
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isViewingToday()
              ? 'Drag notes anywhere on the board. All notes are saved to the database.'
              : `Viewing notes from ${new Date(viewingDate() + 'T00:00:00').toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}. Read-only.`}
          </p>
        </div>
        <Show when={isViewingToday()}>
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
        </Show>
      </div>

      <div class="mb-4 flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={calendarDate()}
          onInput={(e) => setCalendarDate(e.currentTarget.value)}
          class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onFetchClick}
          disabled={!calendarDate()}
          class="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Fetch
        </button>
        <Show when={!isViewingToday()}>
          <button
            onClick={async () => {
              setCalendarDate(todayDateString())
              setViewingDate(todayDateString())
              await loadNotes(todayDateString())
            }}
            class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
          >
            Back to Today
          </button>
        </Show>
      </div>

      <Show when={loading}>
        <div class="flex items-center justify-center py-12">
          <p class="text-sm text-gray-500 dark:text-gray-400">Loading sticky notes...</p>
        </div>
      </Show>

      <Show when={!loading && fetchError() && notes().length === 0}>
        <div class="flex items-center justify-center py-12">
          <p class="text-sm text-gray-400 dark:text-gray-500">{fetchError()}</p>
        </div>
      </Show>

      {showClearConfirm() && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Clear all sticky notes for today?</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will permanently delete all sticky notes created today. This action cannot be undone.
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

      <Show when={!loading}>
        <div
          ref={(el) => (boardEl = el)}
          class="relative w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-auto"
          style={{ 'min-height': '600px' }}
        >
          {notes().length === 0 && !fetchError() && (
            <div class="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <div class="text-center">
                <p class="text-5xl mb-3">📝</p>
                <p class="text-sm">No sticky notes yet. Click "Add Note" to get started!</p>
              </div>
            </div>
          )}

          <For each={notes()}>
            {(note) => renderNote(note)}
          </For>
        </div>
      </Show>
    </div>
  )
}

export default StickyNotes
