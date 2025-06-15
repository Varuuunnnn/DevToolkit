import { createSignal } from 'solid-js'

function ApiTester() {
  const [url, setUrl] = createSignal('')
  const [method, setMethod] = createSignal('GET')
  const [headers, setHeaders] = createSignal('')
  const [body, setBody] = createSignal('')
  const [response, setResponse] = createSignal(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal('')
  const [curlInput, setCurlInput] = createSignal('')

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

  const parseCurl = (curlCommand) => {
    try {
      // Clean up the curl command
      let curl = curlCommand.trim()
      
      // Remove 'curl' from the beginning if present
      curl = curl.replace(/^curl\s+/i, '')
      
      // Initialize parsed data
      let parsedUrl = ''
      let parsedMethod = 'GET'
      let parsedHeaders = {}
      let parsedBody = ''
      
      // Split by spaces but preserve quoted strings
      const args = []
      let current = ''
      let inQuotes = false
      let quoteChar = ''
      
      for (let i = 0; i < curl.length; i++) {
        const char = curl[i]
        
        if ((char === '"' || char === "'") && !inQuotes) {
          inQuotes = true
          quoteChar = char
        } else if (char === quoteChar && inQuotes) {
          inQuotes = false
          quoteChar = ''
        } else if (char === ' ' && !inQuotes) {
          if (current.trim()) {
            args.push(current.trim())
            current = ''
          }
          continue
        }
        
        current += char
      }
      
      if (current.trim()) {
        args.push(current.trim())
      }
      
      // Parse arguments
      for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        
        // Method
        if (arg === '-X' || arg === '--request') {
          if (i + 1 < args.length) {
            parsedMethod = args[i + 1].toUpperCase()
            i++
          }
        }
        // Headers
        else if (arg === '-H' || arg === '--header') {
          if (i + 1 < args.length) {
            const header = args[i + 1].replace(/^["']|["']$/g, '')
            const [key, ...valueParts] = header.split(':')
            if (key && valueParts.length > 0) {
              parsedHeaders[key.trim()] = valueParts.join(':').trim()
            }
            i++
          }
        }
        // Data/Body
        else if (arg === '-d' || arg === '--data' || arg === '--data-raw') {
          if (i + 1 < args.length) {
            parsedBody = args[i + 1].replace(/^["']|["']$/g, '')
            if (parsedMethod === 'GET') {
              parsedMethod = 'POST'
            }
            i++
          }
        }
        // URL (usually the last argument or first argument without flags)
        else if (!arg.startsWith('-') && !parsedUrl) {
          parsedUrl = arg.replace(/^["']|["']$/g, '')
        }
      }
      
      // Apply parsed values
      if (parsedUrl) setUrl(parsedUrl)
      if (parsedMethod) setMethod(parsedMethod)
      if (Object.keys(parsedHeaders).length > 0) {
        setHeaders(JSON.stringify(parsedHeaders, null, 2))
      }
      if (parsedBody) setBody(parsedBody)
      
      setError('')
      return true
    } catch (err) {
      setError(`Failed to parse cURL: ${err.message}`)
      return false
    }
  }

  const handleCurlPaste = (e) => {
    const pastedText = e.target.value
    setCurlInput(pastedText)
    
    // Auto-detect if it's a cURL command
    if (pastedText.trim().toLowerCase().startsWith('curl ') || 
        pastedText.includes('-X ') || 
        pastedText.includes('--request') ||
        pastedText.includes('-H ') ||
        pastedText.includes('--header')) {
      parseCurl(pastedText)
    } else if (pastedText.trim().startsWith('http')) {
      // If it's just a URL, set it directly
      setUrl(pastedText.trim())
    }
  }

  const sendRequest = async () => {
    if (!url().trim()) {
      setError('Please enter a URL or paste a cURL command')
      return
    }

    setLoading(true)
    setError('')
    setResponse(null)

    try {
      const startTime = Date.now()
      
      // Parse headers
      let parsedHeaders = {}
      if (headers().trim()) {
        try {
          // Try to parse as JSON first
          parsedHeaders = JSON.parse(headers())
        } catch {
          // If not JSON, parse as key:value pairs
          headers().split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':')
            if (key && valueParts.length > 0) {
              parsedHeaders[key.trim()] = valueParts.join(':').trim()
            }
          })
        }
      }

      // Prepare request options
      const options = {
        method: method(),
        headers: parsedHeaders,
      }

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(method()) && body().trim()) {
        options.body = body()
        
        // Set content-type if not already set
        if (!parsedHeaders['Content-Type'] && !parsedHeaders['content-type']) {
          try {
            JSON.parse(body())
            options.headers['Content-Type'] = 'application/json'
          } catch {
            options.headers['Content-Type'] = 'text/plain'
          }
        }
      }

      const fetchResponse = await fetch(url(), options)
      const endTime = Date.now()
      
      // Get response headers
      const responseHeaders = {}
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      // Get response body
      let responseBody = ''
      const contentType = fetchResponse.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        try {
          const jsonData = await fetchResponse.json()
          responseBody = JSON.stringify(jsonData, null, 2)
        } catch {
          responseBody = await fetchResponse.text()
        }
      } else {
        responseBody = await fetchResponse.text()
      }

      setResponse({
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: endTime - startTime,
        size: new Blob([responseBody]).size
      })

    } catch (err) {
      setError(`Request failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyResponse = async () => {
    if (!response()) return
    
    try {
      await navigator.clipboard.writeText(response().body)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyAsCurl = async () => {
    let curl = `curl -X ${method()} "${url()}"`
    
    // Add headers
    if (headers().trim()) {
      try {
        const parsedHeaders = JSON.parse(headers())
        Object.entries(parsedHeaders).forEach(([key, value]) => {
          curl += ` \\\n  -H "${key}: ${value}"`
        })
      } catch {
        headers().split('\n').forEach(line => {
          const [key, ...valueParts] = line.split(':')
          if (key && valueParts.length > 0) {
            curl += ` \\\n  -H "${key.trim()}: ${valueParts.join(':').trim()}"`
          }
        })
      }
    }
    
    // Add body
    if (['POST', 'PUT', 'PATCH'].includes(method()) && body().trim()) {
      curl += ` \\\n  -d '${body().replace(/'/g, "\\'")}'`
    }
    
    try {
      await navigator.clipboard.writeText(curl)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const clearAll = () => {
    setUrl('')
    setHeaders('')
    setBody('')
    setResponse(null)
    setError('')
    setCurlInput('')
  }

  const loadExample = () => {
    const exampleCurl = `curl -X POST "https://jsonplaceholder.typicode.com/posts" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-token-here" \\
  -d '{
    "title": "foo",
    "body": "bar",
    "userId": 1
  }'`
    
    setCurlInput(exampleCurl)
    parseCurl(exampleCurl)
  }

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400'
    if (status >= 300 && status < 400) return 'text-yellow-600 dark:text-yellow-400'
    if (status >= 400 && status < 500) return 'text-red-600 dark:text-red-400'
    if (status >= 500) return 'text-purple-600 dark:text-purple-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <div class="card">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">🚀 API Tester</h2>
      
      {/* cURL Input Section */}
      <div class="form-group">
        <div class="flex items-center justify-between mb-3">
          <label class="form-label mb-0">
            📋 Paste cURL Command or URL
          </label>
          <button onClick={loadExample} class="btn-secondary text-xs">
            📝 Load Example
          </button>
        </div>
        <textarea
          value={curlInput()}
          onInput={handleCurlPaste}
          placeholder={`Paste your cURL command here and it will auto-fill all fields below:

curl -X POST "https://api.example.com/users" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token123" \\
  -d '{"name": "John", "email": "john@example.com"}'

Or just paste a URL:
https://api.example.com/users`}
          rows="4"
          class="textarea-enhanced font-mono"
        />
        <div class="form-description">
          🎯 Supports cURL commands with -X, -H, -d flags. Auto-detects and fills URL, method, headers, and body.
        </div>
      </div>

      {/* URL and Method */}
      <div class="form-group">
        <label class="form-label">🌐 Request Details</label>
        <div class="flex gap-3 mb-4">
          <select
            value={method()}
            onChange={(e) => setMethod(e.target.value)}
            class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-3 font-medium min-w-[100px]"
          >
            {methods.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="url"
            value={url()}
            onInput={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            class="input-field flex-1"
          />
        </div>
      </div>

      {/* Headers */}
      <div class="form-group">
        <label class="form-label">
          📋 Headers (JSON format)
        </label>
        <textarea
          value={headers()}
          onInput={(e) => setHeaders(e.target.value)}
          placeholder={`{
  "Content-Type": "application/json",
  "Authorization": "Bearer your-token-here",
  "X-API-Key": "your-api-key"
}`}
          rows="4"
          class="textarea-enhanced font-mono"
        />
        <div class="form-description">
          💡 Headers will be auto-filled when you paste a cURL command above
        </div>
      </div>

      {/* Body */}
      {['POST', 'PUT', 'PATCH'].includes(method()) && (
        <div class="form-group">
          <label class="form-label">
            📦 Request Body
          </label>
          <textarea
            value={body()}
            onInput={(e) => setBody(e.target.value)}
            placeholder={`{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}`}
            rows="6"
            class="textarea-enhanced font-mono"
          />
          <div class="form-description">
            🔧 Request body will be auto-filled from cURL -d flag
          </div>
        </div>
      )}

      {/* Controls */}
      <div class="btn-group">
        <button
          onClick={sendRequest}
          disabled={loading()}
          class="btn-primary"
        >
          {loading() ? '⏳ Sending...' : '🚀 Send Request'}
        </button>
        <button onClick={copyAsCurl} class="btn-secondary">
          📋 Copy as cURL
        </button>
        <button onClick={clearAll} class="btn-secondary">
          🗑️ Clear All
        </button>
      </div>

      {/* Error */}
      {error() && (
        <div class="error-container">
          <p class="error-text">❌ {error()}</p>
        </div>
      )}

      {/* Response */}
      {response() && (
        <div class="space-y-6">
          {/* Status and Timing */}
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div class="flex items-center space-x-6">
              <span class={`font-bold text-xl ${getStatusColor(response().status)}`}>
                {response().status} {response().statusText}
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                ⏱️ {response().time}ms
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                📊 {response().size} bytes
              </span>
            </div>
            <button onClick={copyResponse} class="copy-btn">
              📋 Copy Response
            </button>
          </div>

          {/* Response Headers */}
          <div>
            <h3 class="section-header">📋 Response Headers</h3>
            <div class="result-container max-h-40 overflow-y-auto">
              <pre class="code-display">
                {Object.entries(response().headers).map(([key, value]) => 
                  `${key}: ${value}`
                ).join('\n')}
              </pre>
            </div>
          </div>

          {/* Response Body */}
          <div>
            <h3 class="section-header">📄 Response Body</h3>
            <div class="result-container max-h-80 overflow-y-auto">
              <pre class="code-display whitespace-pre-wrap">
                {response().body}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiTester