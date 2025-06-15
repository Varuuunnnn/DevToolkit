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
  
  // Security bypass options
  const [bypassCors, setBypassCors] = createSignal(false)
  const [disableSslVerification, setDisableSslVerification] = createSignal(false)
  const [followRedirects, setFollowRedirects] = createSignal(true)
  const [timeout, setTimeout] = createSignal(30000)
  const [userAgent, setUserAgent] = createSignal('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
  const [proxyUrl, setProxyUrl] = createSignal('')
  
  // Authentication options
  const [authType, setAuthType] = createSignal('none')
  const [authUsername, setAuthUsername] = createSignal('')
  const [authPassword, setAuthPassword] = createSignal('')
  const [bearerToken, setBearerToken] = createSignal('')
  const [apiKey, setApiKey] = createSignal('')
  const [apiKeyHeader, setApiKeyHeader] = createSignal('X-API-Key')

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT']
  const authTypes = ['none', 'basic', 'bearer', 'api-key', 'digest', 'oauth1', 'oauth2']

  const commonUserAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    'PostmanRuntime/7.32.3',
    'curl/7.68.0',
    'Googlebot/2.1',
    'facebookexternalhit/1.1'
  ]

  const parseCurl = (curlCommand) => {
    try {
      let curl = curlCommand.trim()
      curl = curl.replace(/^curl\s+/i, '')
      
      let parsedUrl = ''
      let parsedMethod = 'GET'
      let parsedHeaders = {}
      let parsedBody = ''
      
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
      
      for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        
        if (arg === '-X' || arg === '--request') {
          if (i + 1 < args.length) {
            parsedMethod = args[i + 1].toUpperCase()
            i++
          }
        }
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
        else if (arg === '-d' || arg === '--data' || arg === '--data-raw') {
          if (i + 1 < args.length) {
            parsedBody = args[i + 1].replace(/^["']|["']$/g, '')
            if (parsedMethod === 'GET') {
              parsedMethod = 'POST'
            }
            i++
          }
        }
        else if (arg === '-k' || arg === '--insecure') {
          setDisableSslVerification(true)
        }
        else if (arg === '-L' || arg === '--location') {
          setFollowRedirects(true)
        }
        else if (arg === '-A' || arg === '--user-agent') {
          if (i + 1 < args.length) {
            setUserAgent(args[i + 1].replace(/^["']|["']$/g, ''))
            i++
          }
        }
        else if (!arg.startsWith('-') && !parsedUrl) {
          parsedUrl = arg.replace(/^["']|["']$/g, '')
        }
      }
      
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
    
    if (pastedText.trim().toLowerCase().startsWith('curl ') || 
        pastedText.includes('-X ') || 
        pastedText.includes('--request') ||
        pastedText.includes('-H ') ||
        pastedText.includes('--header')) {
      parseCurl(pastedText)
    } else if (pastedText.trim().startsWith('http')) {
      setUrl(pastedText.trim())
    }
  }

  const buildAuthHeaders = () => {
    const authHeaders = {}
    
    switch (authType()) {
      case 'basic':
        if (authUsername() && authPassword()) {
          const credentials = btoa(`${authUsername()}:${authPassword()}`)
          authHeaders['Authorization'] = `Basic ${credentials}`
        }
        break
      case 'bearer':
        if (bearerToken()) {
          authHeaders['Authorization'] = `Bearer ${bearerToken()}`
        }
        break
      case 'api-key':
        if (apiKey() && apiKeyHeader()) {
          authHeaders[apiKeyHeader()] = apiKey()
        }
        break
      case 'digest':
        // Digest auth would need server challenge, simplified here
        if (authUsername() && authPassword()) {
          authHeaders['Authorization'] = `Digest username="${authUsername()}", password="${authPassword()}"`
        }
        break
    }
    
    return authHeaders
  }

  const buildSecurityBypassHeaders = () => {
    const bypassHeaders = {}
    
    // Common security bypass headers
    if (bypassCors()) {
      bypassHeaders['Access-Control-Allow-Origin'] = '*'
      bypassHeaders['Access-Control-Allow-Methods'] = '*'
      bypassHeaders['Access-Control-Allow-Headers'] = '*'
      bypassHeaders['Access-Control-Allow-Credentials'] = 'true'
    }
    
    // User agent spoofing
    if (userAgent()) {
      bypassHeaders['User-Agent'] = userAgent()
    }
    
    // Common bypass headers
    bypassHeaders['X-Forwarded-For'] = '127.0.0.1'
    bypassHeaders['X-Real-IP'] = '127.0.0.1'
    bypassHeaders['X-Originating-IP'] = '127.0.0.1'
    bypassHeaders['X-Remote-IP'] = '127.0.0.1'
    bypassHeaders['X-Remote-Addr'] = '127.0.0.1'
    bypassHeaders['X-Forwarded-Host'] = 'localhost'
    bypassHeaders['X-Forwarded-Proto'] = 'https'
    
    // WAF bypass headers
    bypassHeaders['X-Bypass-WAF'] = 'true'
    bypassHeaders['X-Rewrite-URL'] = '/'
    bypassHeaders['X-Original-URL'] = '/'
    bypassHeaders['X-Override-URL'] = '/'
    
    return bypassHeaders
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
      
      // Parse user headers
      let parsedHeaders = {}
      if (headers().trim()) {
        try {
          parsedHeaders = JSON.parse(headers())
        } catch {
          headers().split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':')
            if (key && valueParts.length > 0) {
              parsedHeaders[key.trim()] = valueParts.join(':').trim()
            }
          })
        }
      }

      // Build final headers with auth and security bypass
      const authHeaders = buildAuthHeaders()
      const bypassHeaders = buildSecurityBypassHeaders()
      const finalHeaders = { ...bypassHeaders, ...authHeaders, ...parsedHeaders }

      // Prepare request options
      const options = {
        method: method(),
        headers: finalHeaders,
        mode: bypassCors() ? 'cors' : 'same-origin',
        credentials: 'include',
        redirect: followRedirects() ? 'follow' : 'manual',
      }

      // Add timeout using AbortController
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout())
      options.signal = controller.signal

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(method()) && body().trim()) {
        options.body = body()
        
        if (!finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
          try {
            JSON.parse(body())
            options.headers['Content-Type'] = 'application/json'
          } catch {
            options.headers['Content-Type'] = 'text/plain'
          }
        }
      }

      let fetchUrl = url()
      
      // Use proxy if specified
      if (proxyUrl()) {
        fetchUrl = `${proxyUrl()}/${encodeURIComponent(url())}`
      }

      const fetchResponse = await fetch(fetchUrl, options)
      clearTimeout(timeoutId)
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
        size: new Blob([responseBody]).size,
        redirected: fetchResponse.redirected,
        url: fetchResponse.url
      })

    } catch (err) {
      if (err.name === 'AbortError') {
        setError(`Request timed out after ${timeout()}ms`)
      } else {
        setError(`Request failed: ${err.message}`)
      }
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
    
    // Add security bypass flags
    if (disableSslVerification()) {
      curl += ' \\\n  --insecure'
    }
    
    if (followRedirects()) {
      curl += ' \\\n  --location'
    }
    
    if (userAgent()) {
      curl += ` \\\n  --user-agent "${userAgent()}"`
    }
    
    // Add headers
    const allHeaders = { ...buildSecurityBypassHeaders(), ...buildAuthHeaders() }
    
    if (headers().trim()) {
      try {
        const parsedHeaders = JSON.parse(headers())
        Object.assign(allHeaders, parsedHeaders)
      } catch {
        headers().split('\n').forEach(line => {
          const [key, ...valueParts] = line.split(':')
          if (key && valueParts.length > 0) {
            allHeaders[key.trim()] = valueParts.join(':').trim()
          }
        })
      }
    }
    
    Object.entries(allHeaders).forEach(([key, value]) => {
      curl += ` \\\n  -H "${key}: ${value}"`
    })
    
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
    setAuthUsername('')
    setAuthPassword('')
    setBearerToken('')
    setApiKey('')
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
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">🚀 Advanced API Tester</h2>
      
      {/* Security Bypass Options */}
      <div class="form-group">
        <label class="form-label">🛡️ Security Bypass Options</label>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <label class="flex items-center">
            <input
              type="checkbox"
              checked={bypassCors()}
              onChange={(e) => setBypassCors(e.target.checked)}
              class="mr-3 w-4 h-4"
            />
            <span class="text-sm text-red-800 dark:text-red-300">Bypass CORS</span>
          </label>
          <label class="flex items-center">
            <input
              type="checkbox"
              checked={disableSslVerification()}
              onChange={(e) => setDisableSslVerification(e.target.checked)}
              class="mr-3 w-4 h-4"
            />
            <span class="text-sm text-red-800 dark:text-red-300">Disable SSL Verification</span>
          </label>
          <label class="flex items-center">
            <input
              type="checkbox"
              checked={followRedirects()}
              onChange={(e) => setFollowRedirects(e.target.checked)}
              class="mr-3 w-4 h-4"
            />
            <span class="text-sm text-red-800 dark:text-red-300">Follow Redirects</span>
          </label>
        </div>
        <div class="form-description text-red-600 dark:text-red-400">
          ⚠️ These options bypass security measures. Use responsibly and only for authorized testing.
        </div>
      </div>

      {/* Authentication */}
      <div class="form-group">
        <label class="form-label">🔐 Authentication</label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Auth Type</label>
            <select
              value={authType()}
              onChange={(e) => setAuthType(e.target.value)}
              class="input-field"
            >
              {authTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          
          {authType() === 'basic' && (
            <>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={authUsername()}
                  onInput={(e) => setAuthUsername(e.target.value)}
                  placeholder="username"
                  class="input-field"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={authPassword()}
                  onInput={(e) => setAuthPassword(e.target.value)}
                  placeholder="password"
                  class="input-field"
                />
              </div>
            </>
          )}
          
          {authType() === 'bearer' && (
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bearer Token</label>
              <input
                type="text"
                value={bearerToken()}
                onInput={(e) => setBearerToken(e.target.value)}
                placeholder="your-bearer-token"
                class="input-field"
              />
            </div>
          )}
          
          {authType() === 'api-key' && (
            <>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Key Header</label>
                <input
                  type="text"
                  value={apiKeyHeader()}
                  onInput={(e) => setApiKeyHeader(e.target.value)}
                  placeholder="X-API-Key"
                  class="input-field"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Key</label>
                <input
                  type="text"
                  value={apiKey()}
                  onInput={(e) => setApiKey(e.target.value)}
                  placeholder="your-api-key"
                  class="input-field"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Advanced Options */}
      <div class="form-group">
        <label class="form-label">⚙️ Advanced Options</label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Agent</label>
            <select
              value={userAgent()}
              onChange={(e) => setUserAgent(e.target.value)}
              class="input-field"
            >
              {commonUserAgents.map(ua => (
                <option key={ua} value={ua}>{ua.substring(0, 50)}...</option>
              ))}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timeout (ms)</label>
            <input
              type="number"
              value={timeout()}
              onInput={(e) => setTimeout(parseInt(e.target.value))}
              placeholder="30000"
              class="input-field"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proxy URL (optional)</label>
            <input
              type="url"
              value={proxyUrl()}
              onInput={(e) => setProxyUrl(e.target.value)}
              placeholder="https://cors-anywhere.herokuapp.com"
              class="input-field"
            />
          </div>
        </div>
      </div>

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
  -d '{"name": "John", "email": "john@example.com"}' \\
  --insecure --location

Or just paste a URL:
https://api.example.com/users`}
          rows="4"
          class="textarea-enhanced font-mono"
        />
        <div class="form-description">
          🎯 Supports cURL commands with security flags (-k, -L, -A). Auto-detects and fills all options.
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
          📋 Custom Headers (JSON format)
        </label>
        <textarea
          value={headers()}
          onInput={(e) => setHeaders(e.target.value)}
          placeholder={`{
  "Content-Type": "application/json",
  "X-Custom-Header": "custom-value"
}`}
          rows="4"
          class="textarea-enhanced font-mono"
        />
        <div class="form-description">
          💡 Auth and security bypass headers will be automatically added
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
              {response().redirected && (
                <span class="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                  🔄 Redirected
                </span>
              )}
            </div>
            <button onClick={copyResponse} class="copy-btn">
              📋 Copy Response
            </button>
          </div>

          {/* Final URL if redirected */}
          {response().redirected && (
            <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <span class="text-sm font-medium text-blue-800 dark:text-blue-300">Final URL:</span>
              <div class="font-mono text-sm text-blue-900 dark:text-blue-200 mt-1">{response().url}</div>
            </div>
          )}

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