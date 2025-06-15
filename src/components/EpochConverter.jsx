import { createSignal, onMount } from 'solid-js'

function EpochConverter() {
  const [epochInput, setEpochInput] = createSignal('')
  const [dateInput, setDateInput] = createSignal('')
  const [currentEpoch, setCurrentEpoch] = createSignal('')
  const [convertedDate, setConvertedDate] = createSignal('')
  const [convertedEpoch, setConvertedEpoch] = createSignal('')
  const [error, setError] = createSignal('')

  onMount(() => {
    updateCurrentEpoch()
    const interval = setInterval(updateCurrentEpoch, 1000)
    return () => clearInterval(interval)
  })

  const updateCurrentEpoch = () => {
    const now = Math.floor(Date.now() / 1000)
    setCurrentEpoch(now.toString())
  }

  const convertEpochToDate = () => {
    if (!epochInput().trim()) {
      setError('Please enter an epoch timestamp')
      return
    }

    try {
      let epoch = parseInt(epochInput().trim())
      
      // Auto-detect if it's milliseconds (13 digits) or seconds (10 digits)
      if (epoch.toString().length === 13) {
        epoch = Math.floor(epoch / 1000)
      }
      
      const date = new Date(epoch * 1000)
      
      if (isNaN(date.getTime())) {
        setError('Invalid epoch timestamp')
        return
      }

      const result = {
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        localDate: date.toLocaleDateString(),
        localTime: date.toLocaleTimeString(),
        relative: getRelativeTime(date)
      }

      setConvertedDate(result)
      setError('')
    } catch (err) {
      setError('Error converting epoch timestamp')
    }
  }

  const convertDateToEpoch = () => {
    if (!dateInput().trim()) {
      setError('Please enter a date')
      return
    }

    try {
      const date = new Date(dateInput().trim())
      
      if (isNaN(date.getTime())) {
        setError('Invalid date format')
        return
      }

      const result = {
        seconds: Math.floor(date.getTime() / 1000),
        milliseconds: date.getTime(),
        iso: date.toISOString()
      }

      setConvertedEpoch(result)
      setError('')
    } catch (err) {
      setError('Error converting date')
    }
  }

  const getRelativeTime = (date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (Math.abs(diffSecs) < 60) return `${Math.abs(diffSecs)} seconds ${diffSecs < 0 ? 'from now' : 'ago'}`
    if (Math.abs(diffMins) < 60) return `${Math.abs(diffMins)} minutes ${diffMins < 0 ? 'from now' : 'ago'}`
    if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)} hours ${diffHours < 0 ? 'from now' : 'ago'}`
    if (Math.abs(diffDays) < 30) return `${Math.abs(diffDays)} days ${diffDays < 0 ? 'from now' : 'ago'}`
    
    return date.toLocaleDateString()
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text.toString())
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const useCurrentEpoch = () => {
    setEpochInput(currentEpoch())
  }

  const clearAll = () => {
    setEpochInput('')
    setDateInput('')
    setConvertedDate('')
    setConvertedEpoch('')
    setError('')
  }

  return (
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Epoch Time Converter</h2>
      
      {/* Current Epoch Display */}
      <div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Current Epoch Time</h3>
            <div class="font-mono text-lg text-green-900 dark:text-green-200">{currentEpoch()}</div>
            <div class="text-xs text-green-600 dark:text-green-400 mt-1">
              {new Date().toLocaleString()}
            </div>
          </div>
          <button 
            onClick={useCurrentEpoch}
            class="btn-secondary text-xs"
          >
            Use Current
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error() && (
        <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
          <p class="text-red-800 dark:text-red-300 text-sm">{error()}</p>
        </div>
      )}

      {/* Epoch to Date */}
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Epoch Timestamp (seconds or milliseconds)
        </label>
        <div class="flex gap-2 mb-3">
          <input
            type="text"
            value={epochInput()}
            onInput={(e) => setEpochInput(e.target.value)}
            placeholder="1640995200"
            class="input-field flex-1"
          />
          <button onClick={convertEpochToDate} class="btn-primary">
            Convert to Date
          </button>
        </div>

        {convertedDate() && (
          <div class="space-y-2">
            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">ISO 8601</span>
                <button onClick={() => copyToClipboard(convertedDate().iso)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{convertedDate().iso}</div>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Local Time</span>
                <button onClick={() => copyToClipboard(convertedDate().local)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{convertedDate().local}</div>
            </div>

            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">UTC</span>
                <button onClick={() => copyToClipboard(convertedDate().utc)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{convertedDate().utc}</div>
            </div>

            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Relative</span>
                <button onClick={() => copyToClipboard(convertedDate().relative)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{convertedDate().relative}</div>
            </div>
          </div>
        )}
      </div>

      {/* Date to Epoch */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date/Time Input
        </label>
        <div class="flex gap-2 mb-3">
          <input
            type="text"
            value={dateInput()}
            onInput={(e) => setDateInput(e.target.value)}
            placeholder="2022-01-01 12:00:00 or January 1, 2022"
            class="input-field flex-1"
          />
          <button onClick={convertDateToEpoch} class="btn-primary">
            Convert to Epoch
          </button>
        </div>

        {convertedEpoch() && (
          <div class="space-y-2">
            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Epoch Seconds</span>
                <button onClick={() => copyToClipboard(convertedEpoch().seconds)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{convertedEpoch().seconds}</div>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Epoch Milliseconds</span>
                <button onClick={() => copyToClipboard(convertedEpoch().milliseconds)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{convertedEpoch().milliseconds}</div>
            </div>

            <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">ISO Format</span>
                <button onClick={() => copyToClipboard(convertedEpoch().iso)} class="btn-secondary text-xs">Copy</button>
              </div>
              <div class="font-mono text-sm text-gray-900 dark:text-gray-100">{convertedEpoch().iso}</div>
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

export default EpochConverter