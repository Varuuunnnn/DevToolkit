import { createSignal, createEffect } from 'solid-js'
import * as pako from 'pako'

function GzipCompressor() {
  const [operation, setOperation] = createSignal('decompress')
  const [inputText, setInputText] = createSignal('')
  const [result, setResult] = createSignal('')
  const [error, setError] = createSignal('')
  const [isProcessing, setIsProcessing] = createSignal(false)
  const [inputCharCount, setInputCharCount] = createSignal(0)
  const [resultCharCount, setResultCharCount] = createSignal(0)

  // Auto-resize textarea and update character count
  createEffect(() => {
    setInputCharCount(inputText().length)
  })

  createEffect(() => {
    setResultCharCount(result().length)
  })

  const handleCompress = async () => {
    if (!inputText().trim()) {
      setError('Please enter some text to compress')
      return
    }

    setIsProcessing(true)
    setError('')
    setResult('')

    try {
      // Compress the text using pako
      const compressed = pako.gzip(inputText().trim())
      
      // Convert to base64 for display
      const base64 = btoa(String.fromCharCode(...compressed))
      setResult(base64)
    } catch (err) {
      setError(`Compression failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecompress = async () => {
    if (!inputText().trim()) {
      setError('Please enter some base64 encoded gzip data to decompress')
      return
    }

    setIsProcessing(true)
    setError('')
    setResult('')

    try {
      // Convert base64 to Uint8Array
      const binaryString = atob(inputText().trim())
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Decompress using pako
      const decompressed = pako.inflate(bytes, { to: 'string' })
      setResult(decompressed)
    } catch (err) {
      setError(`Decompression failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcess = () => {
    if (operation() === 'compress') {
      handleCompress()
    } else {
      handleDecompress()
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result())
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const clearAll = () => {
    setInputText('')
    setResult('')
    setError('')
  }

  const getCompressionRatio = () => {
    if (operation() === 'compress' && inputText() && result()) {
      const originalSize = new Blob([inputText()]).size
      const compressedSize = new Blob([atob(result())]).size
      const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
      return `${ratio}% reduction (${originalSize} → ${compressedSize} bytes)`
    }
    return null
  }

  const autoResize = (textarea) => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px'
  }

  return (
    <div class="card">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gzip Compressor/Decompressor</h2>
      
      {/* Operation Toggle */}
      <div class="form-group">
        <div class="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setOperation('compress')}
            class={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
              operation() === 'compress' 
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🗜️ Compress
          </button>
          <button
            onClick={() => setOperation('decompress')}
            class={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
              operation() === 'decompress' 
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📂 Decompress
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div class="form-group">
        <label class="form-label">
          {operation() === 'compress' ? '📝 Text to Compress' : '🔗 Base64 Encoded Gzip Data'}
        </label>
        <textarea
          ref={(el) => {
            if (el) {
              el.addEventListener('input', () => autoResize(el))
              autoResize(el)
            }
          }}
          value={inputText()}
          onInput={(e) => {
            setInputText(e.target.value)
            autoResize(e.target)
          }}
          placeholder={
            operation() === 'compress' 
              ? 'Enter your text here to compress...\n\nYou can paste large amounts of text, JSON data, or any content you want to compress.' 
              : 'Paste your base64 encoded gzip data here...\n\nExample: H4sIAAAAAAAAA...'
          }
          class="textarea-enhanced"
        />
        <div class="char-count">
          {inputCharCount().toLocaleString()} characters
        </div>
        <div class="form-description">
          {operation() === 'compress' 
            ? 'Enter any text content to compress it using gzip algorithm'
            : 'Paste base64-encoded gzip data to decompress it back to original text'
          }
        </div>
      </div>

      {/* Controls */}
      <div class="btn-group">
        <button
          onClick={handleProcess}
          disabled={isProcessing()}
          class="btn-primary"
        >
          {isProcessing() 
            ? (operation() === 'compress' ? '🔄 Compressing...' : '🔄 Decompressing...') 
            : (operation() === 'compress' ? '🗜️ Compress Text' : '📂 Decompress Data')
          }
        </button>
        <button onClick={clearAll} class="btn-secondary">
          🗑️ Clear All
        </button>
      </div>

      {/* Error Display */}
      {error() && (
        <div class="error-container">
          <p class="error-text">❌ {error()}</p>
        </div>
      )}

      {/* Compression Stats */}
      {operation() === 'compress' && getCompressionRatio() && (
        <div class="success-container">
          <p class="success-text">
            📊 Compression: {getCompressionRatio()}
          </p>
        </div>
      )}

      {/* Result Section */}
      {result() && (
        <div class="form-group">
          <div class="flex items-center justify-between mb-3">
            <label class="form-label mb-0">
              {operation() === 'compress' ? '📦 Compressed Data (Base64)' : '📄 Decompressed Content'}
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
            value={result()}
            readonly
            class="textarea-code bg-gray-50 dark:bg-gray-700"
          />
          <div class="char-count">
            {resultCharCount().toLocaleString()} characters
          </div>
          <div class="form-description">
            {operation() === 'compress' 
              ? 'Base64 encoded compressed data - copy this to share or store'
              : 'Original decompressed text content'
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default GzipCompressor