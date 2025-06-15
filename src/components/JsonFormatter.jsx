import { createSignal, createEffect } from 'solid-js'

function JsonFormatter() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal('')
  const [indentSize, setIndentSize] = createSignal(2)
  const [inputCharCount, setInputCharCount] = createSignal(0)
  const [outputCharCount, setOutputCharCount] = createSignal(0)

  createEffect(() => {
    setInputCharCount(input().length)
  })

  createEffect(() => {
    setOutputCharCount(output().length)
  })

  const formatJson = () => {
    if (!input().trim()) {
      setError('Please enter some JSON to format')
      return
    }

    try {
      const parsed = JSON.parse(input())
      const formatted = JSON.stringify(parsed, null, indentSize())
      setOutput(formatted)
      setError('')
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`)
      setOutput('')
    }
  }

  const minifyJson = () => {
    if (!input().trim()) {
      setError('Please enter some JSON to minify')
      return
    }

    try {
      const parsed = JSON.parse(input())
      const minified = JSON.stringify(parsed)
      setOutput(minified)
      setError('')
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`)
      setOutput('')
    }
  }

  const validateJson = () => {
    if (!input().trim()) {
      setError('Please enter some JSON to validate')
      return
    }

    try {
      JSON.parse(input())
      setError('')
      setOutput('✅ Valid JSON - No syntax errors found!')
    } catch (err) {
      setError(`❌ Invalid JSON: ${err.message}`)
      setOutput('')
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output())
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const clearAll = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  const autoResize = (textarea) => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px'
  }

  const getSizeReduction = () => {
    if (input() && output() && output() !== '✅ Valid JSON - No syntax errors found!') {
      const inputSize = new Blob([input()]).size
      const outputSize = new Blob([output()]).size
      const reduction = inputSize - outputSize
      const percentage = ((reduction / inputSize) * 100).toFixed(1)
      
      if (reduction > 0) {
        return `📉 ${percentage}% smaller (${inputSize} → ${outputSize} bytes)`
      } else if (reduction < 0) {
        return `📈 ${Math.abs(percentage)}% larger (${inputSize} → ${outputSize} bytes)`
      }
      return `📊 Same size (${inputSize} bytes)`
    }
    return null
  }

  return (
    <div class="card">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">📝 JSON Formatter & Validator</h2>
      
      {/* Input */}
      <div class="form-group">
        <label class="form-label">
          📄 JSON Input
        </label>
        <textarea
          ref={(el) => {
            if (el) {
              el.addEventListener('input', () => autoResize(el))
              autoResize(el)
            }
          }}
          value={input()}
          onInput={(e) => {
            setInput(e.target.value)
            autoResize(e.target)
          }}
          placeholder='Paste your JSON here...

Example:
{
  "name": "John Doe",
  "age": 30,
  "city": "New York",
  "hobbies": ["reading", "coding", "traveling"]
}'
          class="textarea-enhanced font-mono"
        />
        <div class="char-count">
          {inputCharCount().toLocaleString()} characters
        </div>
        <div class="form-description">
          Paste any JSON data to format, minify, or validate it
        </div>
      </div>

      {/* Controls */}
      <div class="form-row">
        <div class="btn-group">
          <button onClick={formatJson} class="btn-primary">
            ✨ Format & Beautify
          </button>
          <button onClick={minifyJson} class="btn-secondary">
            🗜️ Minify
          </button>
          <button onClick={validateJson} class="btn-secondary">
            ✅ Validate Only
          </button>
          <button onClick={clearAll} class="btn-secondary">
            🗑️ Clear All
          </button>
        </div>
        
        <div class="form-col max-w-xs">
          <label class="form-label mb-1">🔧 Indent Size</label>
          <select
            value={indentSize()}
            onChange={(e) => setIndentSize(parseInt(e.target.value))}
            class="input-field"
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="8">8 spaces</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error() && (
        <div class="error-container">
          <p class="error-text">{error()}</p>
        </div>
      )}

      {/* Size comparison */}
      {getSizeReduction() && (
        <div class="success-container">
          <p class="success-text">{getSizeReduction()}</p>
        </div>
      )}

      {/* Output */}
      {output() && (
        <div class="form-group">
          <div class="flex items-center justify-between mb-3">
            <label class="form-label mb-0">
              📋 Formatted Output
            </label>
            <button onClick={copyToClipboard} class="copy-btn">
              📋 Copy Result
            </button>
          </div>
          <textarea
            ref={(el) => {
              if (el) {
                autoResize(el)
              }
            }}
            value={output()}
            readonly
            class="textarea-code bg-gray-50 dark:bg-gray-700"
          />
          <div class="char-count">
            {outputCharCount().toLocaleString()} characters
          </div>
          <div class="form-description">
            {output() === '✅ Valid JSON - No syntax errors found!' 
              ? 'JSON validation result'
              : 'Formatted JSON output - ready to copy and use'
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default JsonFormatter