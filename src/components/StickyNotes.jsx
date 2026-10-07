import { createSignal, onMount, onCleanup, For, Show } from 'solid-js'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'devtoolkit-sticky-notes'
const ARCHIVE_DAYS = 5

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

function isOlderThanDays(iso, days) {
  const d = new Date(iso)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  cutoff.setHours(0, 0, 0, 0)
  return d < cutoff
}

function toDateString(iso) {
  return new Date(iso).toISOString().split('T')[0]
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

async function archiveNotesToDb(notes) {
  if (!notes || notes.length === 0) return
  try {
    const rows = notes.map((n) => ({
      content: n.content || '',
      title: n.title || '',
      x: Math.round(n.x || 30),
      y: Math.round(n.y || 30),
      color: n.color || 'yellow',
      created_at: n.created_at,
    }))
    const { error } = await supabase.from('sticky_notes').insert(rows)
    if (error) console.error('Failed to archive notes to DB:', error.message)
  } catch (e) {
    console.error('Failed to archive notes to DB:', e)
  }
}

async function fetchArchivedNotesByDate(dateStr) {
  try {
    const start = new Date(dateStr + 'T00:00:00')
    const end = new Date(dateStr + 'T23:59:59')
    const { data, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Failed to fetch archived notes:', error.message)
      return []
    }
    return (data || []).map((row) => ({
      id: row.id || genId(),
      content: row.content || '',
      title: row.title || '',
      x: row.x || 30,
      y: row.y || 30,
      color: row.color || 'yellow',
      created_at: row.created_at,
      archived: true,
    }))
  } catch (e) {
    console.error('Failed to fetch archived notes:', e)
    return []
  }
}

function seedTestData() {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const seeds = [
    { title: 'Today Note', content: 'This is a test note created today. It should appear on the board.', color: 'yellow', daysAgo: 0 },
    { title: 'Yesterday Note', content: 'Test note from yesterday — should still be active on the board.', color: 'pink', daysAgo: 1 },
    { title: 'Two Days Ago', content: 'Test note from two days ago — still within the 5-day window.', color: 'blue', daysAgo: 2 },
    { title: 'Three Days Ago', content: 'Test note from three days ago — still within the 5-day window.', color: 'green', daysAgo: 3 },
    { title: 'Four Days Ago', content: 'Test note from four days ago — last day before archiving kicks in.', color: 'orange', daysAgo: 4 },
  ]
  return seeds.map((s, i) => ({
    id: genId(),
    content: s.content,
    title: s.title,
    x: 30 + i * 30,
    y: 30 + i * 40,
    color: s.color,
    created_at: new Date(now - s.daysAgo * dayMs).toISOString(),
  }))
}

function StickyNotes() {
  const [notes, setNotes] = createSignal([])
  const [showClearConfirm, setShowClearConfirm] = createSignal(false)
  const [colorPickerFor, setColorPickerFor] = createSignal(null)
  const [editingTitleFor, setEditingTitleFor] = createSignal(null)
  const [showCalendar, setShowCalendar] = createSignal(false)
  const [calendarDate, setCalendarDate] = createSignal('')
  const [archivedNotes, setArchivedNotes] = createSignal([])
  const [showArchived, setShowArchived] = createSignal(false)
  const [loadingArchived, setLoadingArchived] = createSignal(false)
  const [archiveError, setArchiveError] = createSignal('')
  let titleInputs = {}
  let dragId = null
  let dragOffsetX = 0
  let dragOffsetY = 0
  let boardEl = null
  let saveTimer = null

  const debounceSave = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const current = notes()
      saveToStorage(current)
      const oldNotes = current.filter((n) => isOlderThanDays(n.created_at, ARCHIVE_DAYS))
      const freshNotes = current.filter((n) => !isOlderThanDays(n.created_at, ARCHIVE_DAYS))
      if (oldNotes.length > 0) {
        archiveNotesToDb(oldNotes).then(() => {
          saveToStorage(freshNotes)
          setNotes(freshNotes)
        })
      }
    }, 800)
  }

  onMount(() => {
    let loaded = loadFromStorage()
    if (loaded.length === 0) {
      loaded = seedTestData()
      saveToStorage(loaded)
    }
    const oldNotes = loaded.filter((n) => isOlderThanDays(n.created_at, ARCHIVE_DAYS))
    const freshNotes = loaded.filter((n) => !isOlderThanDays(n.created_at, ARCHIVE_DAYS))
    if (oldNotes.length > 0) {
      archiveNotesToDb(oldNotes).then(() => {
        saveToStorage(freshNotes)
        setNotes(freshNotes)
      })
    } else {
      setNotes(freshNotes)
    }
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
    if (editingTitleFor() === note.id) return
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

  const focusTitleInput = (id) => {
    setTimeout(() => {
      const el = titleInputs[id]
      if (el) {
        el.focus()
        el.select()
      }
    }, 0)
  }

  const getColor = (name) => COLORS.find((c) => c.name === name) || COLORS[0]

  const viewArchived = async () => {
    const dateStr = calendarDate()
    if (!dateStr) return
    setLoadingArchived(true)
    setArchiveError('')
    setShowArchived(true)
    const result = await fetchArchivedNotesByDate(dateStr)
    setArchivedNotes(result)
    setLoadingArchived(false)
    if (result.length === 0) {
      setArchiveError('No sticky notes found for that date.')
    }
  }

  const maxCalendarDate = () => {
    const d = new Date()
    d.setDate(d.getDate() - ARCHIVE_DAYS)
    return toDateString(d.toISOString())
  }

  const renderNote = (note, isArchived) => {
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
          opacity: isArchived ? '0.92' : '1',
        }}
        onMouseDown={(e) => !isArchived && onMouseDown(e, note)}
      >
        <div
          class="px-2 pt-1 pb-0"
          style={{ 'border-bottom': `1px solid ${c.border}` }}
        >
          <div class="flex items-center gap-1.5">
            <div class="relative shrink-0">
              <button
                onClick={(e) => {
                  if (isArchived) return
                  e.stopPropagation()
                  setColorPickerFor(colorPickerFor() === note.id ? null : note.id)
                }}
                class="w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
                style={{ 'background-color': c.border }}
                title="Change color"
                disabled={isArchived}
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
            {editingTitleFor() === note.id && !isArchived ? (
              <input
                ref={(el) => (titleInputs[note.id] = el)}
                type="text"
                value={note.title || ''}
                onInput={(e) => {
                  note.title = e.currentTarget.value
                  setNotes([...notes()])
                  debounceSave()
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
                  if (isArchived) return
                  e.stopPropagation()
                  setEditingTitleFor(note.id)
                  focusTitleInput(note.id)
                }}
                class="flex-1 min-w-0 text-xs font-semibold truncate"
                style={{ color: c.text, opacity: note.title ? 1 : 0.5, cursor: isArchived ? 'default' : 'text' }}
              >
                {note.title || 'Title...'}
              </div>
            )}
            <button
              onClick={(e) => {
                if (isArchived) return
                e.stopPropagation()
                deleteNote(note.id)
              }}
              class="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold shrink-0"
              title="Delete note"
              disabled={isArchived}
              style={{ opacity: isArchived ? '0.3' : '1' }}
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
            if (isArchived) return
            note.content = e.currentTarget.value
            setNotes([...notes()])
            debounceSave()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Write something..."
          class="w-full bg-transparent border-none outline-none resize-none p-3 text-sm leading-relaxed"
          style={{ color: c.text, 'min-height': '160px' }}
          disabled={isArchived}
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
            Drag notes anywhere on the board. Notes older than 5 days are archived automatically.
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

      <div class="mb-4 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowCalendar(!showCalendar())}
          class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          View Archived Notes
        </button>
        <Show when={showCalendar()}>
          <div class="flex items-center gap-2">
            <input
              type="date"
              max={maxCalendarDate()}
              value={calendarDate()}
              onInput={(e) => setCalendarDate(e.currentTarget.value)}
              class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={viewArchived}
              disabled={!calendarDate()}
              class="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Fetch
            </button>
          </div>
        </Show>
      </div>

      <Show when={showArchived}>
        <div class="mb-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-blue-900 dark:text-blue-200">
              Archived Notes {calendarDate() && `for ${new Date(calendarDate() + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
            </h3>
            <button
              onClick={() => {
                setShowArchived(false)
                setArchivedNotes([])
                setArchiveError('')
              }}
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium"
            >
              Close
            </button>
          </div>
          <Show when={loadingArchived()}>
            <p class="text-sm text-blue-700 dark:text-blue-300">Loading archived notes...</p>
          </Show>
          <Show when={!loadingArchived() && archiveError()}>
            <p class="text-sm text-gray-500 dark:text-gray-400">{archiveError()}</p>
          </Show>
          <Show when={!loadingArchived() && !archiveError() && archivedNotes().length > 0}>
            <div class="flex flex-wrap gap-3">
              <For each={archivedNotes()}>
                {(note) => {
                  const c = getColor(note.color)
                  return (
                    <div
                      class="rounded-lg shadow-md p-3 w-52"
                      style={{
                        'background-color': c.bg,
                        border: `2px solid ${c.border}`,
                      }}
                    >
                      <div class="text-xs font-semibold mb-1 truncate" style={{ color: c.text }}>
                        {note.title || 'Untitled'}
                      </div>
                      <div class="text-xs mb-2 truncate" style={{ color: c.text, opacity: 0.7 }}>
                        {formatDate(note.created_at)}
                      </div>
                      <p class="text-sm whitespace-pre-wrap break-words" style={{ color: c.text }}>
                        {note.content || '(empty)'}
                      </p>
                    </div>
                  )
                }}
              </For>
            </div>
          </Show>
        </div>
      </Show>

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
          {(note) => renderNote(note, false)}
        </For>
      </div>
    </div>
  )
}

export default StickyNotes
