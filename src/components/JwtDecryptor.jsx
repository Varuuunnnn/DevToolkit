import { createSignal, createEffect } from 'solid-js'

function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
  const binaryString = atob(padded)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

function JwtDecryptor() {
  const [jwtToken, setJwtToken] = createSignal('')
  const [decodedHeader, setDecodedHeader] = createSignal(null)
  const [decodedPayload, setDecodedPayload] = createSignal(null)
  const [error, setError] = createSignal('')
  const [isProcessing, setIsProcessing] = createSignal(false)
  const [tokenCharCount, setTokenCharCount] = createSignal(0)

  createEffect(() => {
    setTokenCharCount(jwtToken().length)
  })

  const handleDecode = async () => {
    if (!jwtToken().trim()) {
      setError('Please enter a JWT token')
      return
    }

    setIsProcessing(true)
    setError('')
    setDecodedHeader(null)
    setDecodedPayload(null)

    try {
      const token = jwtToken().trim()

      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format. JWT should have 3 parts separated by dots.')
      }

      const headerDecoded = JSON.parse(base64UrlDecode(parts[0]))
      setDecodedHeader(headerDecoded)

      const payloadDecoded = JSON.parse(base64UrlDecode(parts[1]))
      setDecodedPayload(payloadDecoded)

    } catch (err) {
      setError(`JWT decoding failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2))
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const clearAll = () => {
    setJwtToken('')
    setDecodedHeader(null)
    setDecodedPayload(null)
    setError('')
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      return new Date(timestamp * 1000).toLocaleString()
    } catch {
      return 'Invalid date'
    }
  }

  const autoResize = (textarea) => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px'
  }

  return (
    <div class="card">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">🔐 JWT Token Decoder</h2>
      
      {/* Input Section */}
      <div class="form-group">
        <label class="form-label">
          🎫 JWT Token
        </label>
        <textarea
          ref={(el) => {
            if (el) {
              el.addEventListener('input', () => autoResize(el))
              autoResize(el)
            }
          }}
          value={jwtToken()}
          onInput={(e) => {
            setJwtToken(e.target.value)
            autoResize(e.target)
          }}
          placeholder="Paste your JWT token here...

Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          class="textarea-enhanced font-mono"
        />
        <div class="char-count">
          {tokenCharCount().toLocaleString()} characters
        </div>
        <div class="form-description">
          Paste a complete JWT token to decode its header and payload sections. All decoding happens locally in your browser — your token never leaves your device.
        </div>
      </div>

      {/* Controls */}
      <div class="btn-group">
        <button
          onClick={handleDecode}
          disabled={isProcessing()}
          class="btn-primary"
        >
          {isProcessing() ? '🔄 Decoding...' : '🔓 Decode JWT'}
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

      {/* Results */}
      {(decodedHeader() || decodedPayload()) && (
        <div class="space-y-8">
          
          {/* Header Section */}
          {decodedHeader() && (
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="section-header mb-0">📋 Token Header</h3>
                <button 
                  onClick={() => copyToClipboard(decodedHeader())} 
                  class="copy-btn"
                >
                  📋 Copy Header
                </button>
              </div>
              <div class="result-container">
                <pre class="code-display text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(decodedHeader(), null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Payload Section */}
          {decodedPayload() && (
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="section-header mb-0">📦 Token Payload</h3>
                <button 
                  onClick={() => copyToClipboard(decodedPayload())} 
                  class="copy-btn"
                >
                  📋 Copy Payload
                </button>
              </div>
              
              {/* Key Claims Summary */}
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <p class="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">⏰ Issued At</p>
                  <p class="text-sm text-blue-900 dark:text-blue-300 font-mono">{formatTimestamp(decodedPayload().iat)}</p>
                </div>
                <div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <p class="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">⏳ Expires At</p>
                  <p class="text-sm text-green-900 dark:text-green-300 font-mono">{formatTimestamp(decodedPayload().exp)}</p>
                </div>
                <div class="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <p class="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">👤 Subject</p>
                  <p class="text-sm text-purple-900 dark:text-purple-300 font-mono">{decodedPayload().sub || 'N/A'}</p>
                </div>
              </div>

              <div class="result-container">
                <pre class="code-display text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(decodedPayload(), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default JwtDecryptor
