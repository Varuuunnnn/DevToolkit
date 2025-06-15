import { createSignal, onMount } from 'solid-js'

function TimestampConverter() {
  const [timestamp, setTimestamp] = createSignal('')
  const [humanDate, setHumanDate] = createSignal('')
  const [currentTime, setCurrentTime] = createSignal('')
  const [timezone, setTimezone] = createSignal('UTC')
  const [format, setFormat] = createSignal('seconds')

  onMount(() => {
    updateCurrentTime()
    const interval = setInterval(updateCurrentTime, 1000)
    return () => clearInterval(interval)
  })

  const updateCurrentTime = () => {
    const now = new Date()
    const unixSeconds = Math.floor(now.getTime() / 1000)
    const unixMillis = now.getTime()
    
    setCurrentTime({
      seconds: unixSeconds,
      milliseconds: unixMillis,
      iso: now.toISOString(),
      local: now.toLocaleString()
    })
  }

  const convertToHuman = () => {
    if (!timestamp().trim()) return

    try {
      let ts = parseInt(timestamp())
      
      // Auto-detect format based on length
      if (ts.toString().length === 10) {
        // Seconds
        ts = ts * 1000
      } else if (ts.toString().length === 13) {
        // Milliseconds - use as is
      } else {
        setHumanDate('Invalid timestamp format')
        return
      }

      const date = new Date(ts)
      
      if (isNaN(date.getTime())) {
        setHumanDate('Invalid timestamp')
        return
      }

      const options = {
        timeZone: timezone() === 'UTC' ? 'UTC' : undefined,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      }

      const formatted = {
        iso: date.toISOString(),
        local: date.toLocaleString('en-US', options),
        utc: date.toUTCString(),
        relative: getRelativeTime(date)
      }

      setHumanDate(formatted)
    } catch (err) {
      setHumanDate('Error converting timestamp')
    }
  }

  const convertToTimestamp = () => {
    if (!humanDate().trim()) return

    try {
      const date = new Date(humanDate())
      
      if (isNaN(date.getTime())) {
        setTimestamp('Invalid date format')
        return
      }

      const result = {
        seconds: Math.floor(date.getTime() / 1000),
        milliseconds: date.getTime()
      }

      setTimestamp(result)
    } catch (err) {
      setTimestamp('Error converting date')
    }
  }

  const getRelativeTime = (date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return `${diffSecs} seconds ago`
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 30) return `${diffDays} days ago`
    
    return date.toLocaleDateString()
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text.toString())
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const useCurrentTime = (format) => {
    if (format === 'seconds') {
      setTimestamp(currentTime().seconds.toString())
    } else {
      setTimestamp(currentTime().milliseconds.toString())
    }
  }

  const clearAll = () => {
    setTimestamp('')
    setHumanDate('')
  }

  return (
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Timestamp Converter</h2>
      
      {/* Current Time Display */}
      <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
        <h3 class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Current Time</h3>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-blue-600 dark:text-blue-400">Unix (seconds):</span>
            <div class="font-mono text-blue-900 dark:text-blue-200">{currentTime().seconds}</div>
          </div>
          <div>
            <span class="text-blue-600 dark:text-blue-400">Unix (milliseconds):</span>
            <div class="font-mono text-blue-900 dark:text-blue-200">{currentTime().milliseconds}</div>
          </div>
        </div>
        <div class="mt-2 text-xs">
          <span class="text-blue-600 dark:text-blue-400">ISO:</span>
          <div class="font-mono text-blue-900 dark:text-blue-200">{currentTime().iso}</div>
        </div>
      </div>

      {/* Timestamp to Human */}
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Unix Timestamp
        </label>
        <div class="flex gap-2 mb-2">
          <input
            type="text"
            value={timestamp()}
            onInput={(e) => setTimestamp(e.target.value)}
            placeholder="1640995200"
            class="input-field flex-1"
          />
          <button 
            onClick={() => useCurrentTime('seconds')}
            class="btn-secondary text-xs"
          >
            Now (s)
          </button>
          <button 
            onClick={() => useCurrentTime('milliseconds')}
            class="btn-secondary text-xs"
          >
            Now (ms)
          </button>
        </div>
        <button onClick={convertToHuman} class="btn-primary">
          Convert to Human Date
        </button>

        {typeof humanDate() === 'object' && humanDate().iso && (
          <div class="mt-3 space-y-2">
            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">ISO 8601</span>
                <button onClick={() => copyToClipboard(humanDate().iso)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{humanDate().iso}</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Local Time</span>
                <button onClick={() => copyToClipboard(humanDate().local)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{humanDate().local}</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Relative</span>
                <button onClick={() => copyToClipboard(humanDate().relative)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{humanDate().relative}</div>
            </div>
          </div>
        )}
      </div>

      {/* Human to Timestamp */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Human Date
        </label>
        <input
          type="text"
          value={typeof humanDate() === 'string' ? humanDate() : ''}
          onInput={(e) => setHumanDate(e.target.value)}
          placeholder="2022-01-01 12:00:00 or January 1, 2022"
          class="input-field mb-2"
        />
        <button onClick={convertToTimestamp} class="btn-primary">
          Convert to Timestamp
        </button>

        {typeof timestamp() === 'object' && timestamp().seconds && (
          <div class="mt-3 space-y-2">
            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Unix Seconds</span>
                <button onClick={() => copyToClipboard(timestamp().seconds)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{timestamp().seconds}</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Unix Milliseconds</span>
                <button onClick={() => copyToClipboard(timestamp().milliseconds)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{timestamp().milliseconds}</div>
            </div>
          </div>
        )}
      </div>

      <button onClick={clearAll} class="btn-secondary w-full">
        Clear All
      </button>
    </div>
  )
}

export default TimestampConverter