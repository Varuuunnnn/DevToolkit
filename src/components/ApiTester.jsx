import { createSignal } from 'solid-js'
import { 
  Card, FormGroup, FormLabel, FormDescription, TextArea, ButtonGroup, Button, 
  InputField, ErrorContainer, StatusBadge, SectionHeader, ResultContainer, CodeDisplay, CopyButton
} from './shared/FormComponents'
import { useProcessing } from './shared/hooks'

function ApiTester() {
  const [url, setUrl] = createSignal('')
  const [method, setMethod] = createSignal('GET')
  const [headers, setHeaders] = createSignal('')
  const [body, setBody] = createSignal('')
  const [response, setResponse] = createSignal(null)
  const [curlInput, setCurlInput] = createSignal('')
  const { isProcessing, error, setError, withProcessing } = useProcessing()

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

  const parseCurl = (curlCommand) => {
    try {
      let curl = curlCommand.trim().replace(/^curl\s+/i, '')
      
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
        } else if (arg === '-H' || arg === '--header') {
          if (i + 1 < args.length) {
            const header = args[i + 1].replace(/^["']|["']$/g, '')
            const [key, ...valueParts] = header.split(':')
            if (key && valueParts.length > 0) {
              parsedHeaders[key.trim()] = valueParts.join(':').trim()
            }
            i++
          }
        } else if (arg === '-d' || arg === '--data' || arg === '--data-raw') {
          if (i + 1 < args.length) {
            parsedBody = args[i + 1].replace(/^["']|["']$/g, '')
            if (parsedMethod === 'GET') {
              parsedMethod = 'POST'
            }
            i++
          }
        } else if (!arg.startsWith('-') && !parsedUrl) {
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

  const sendRequest = async () => {
    if (!url().trim()) {
      setError('Please enter a URL or paste a cURL command')
      return
    }

    await withProcessing(async () => {
      const startTime = Date.now()
      
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

      const options = {
        method: method(),
        headers: parsedHeaders,
      }

      if (['POST', 'PUT', 'PATCH'].includes(method()) && body().trim()) {
        options.body = body()
        
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
      
      const responseHeaders = {}
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

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
    })
  }

  const copyAsCurl = async () => {
    let curl = `curl -X ${method()} "${url()}"`
    
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

  return (
    <Card title="🚀 API Tester">
      {/* cURL Input Section */}
      <FormGroup>
        <div class="flex items-center justify-between mb-3">
          <FormLabel>📋 Paste cURL Command or URL</FormLabel>
          <Button variant="secondary" onClick={loadExample} class="text-xs">
            📝 Load Example
          </Button>
        </div>
        <TextArea
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
          enhanced
        />
        <FormDescription>
          🎯 Supports cURL commands with -X, -H, -d flags. Auto-detects and fills URL, method, headers, and body.
        </FormDescription>
      </FormGroup>

      {/* URL and Method */}
      <FormGroup>
        <FormLabel>🌐 Request Details</FormLabel>
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
          <InputField
            type="url"
            value={url()}
            onInput={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            class="flex-1"
          />
        </div>
      </FormGroup>

      {/* Headers */}
      <FormGroup>
        <FormLabel>📋 Headers (JSON format)</FormLabel>
        <TextArea
          value={headers()}
          onInput={(e) => setHeaders(e.target.value)}
          placeholder={`{
  "Content-Type": "application/json",
  "Authorization": "Bearer your-token-here",
  "X-API-Key": "your-api-key"
}`}
          rows="4"
          enhanced
        />
        <FormDescription>
          💡 Headers will be auto-filled when you paste a cURL command above
        </FormDescription>
      </FormGroup>

      {/* Body */}
      {['POST', 'PUT', 'PATCH'].includes(method()) && (
        <FormGroup>
          <FormLabel>📦 Request Body</FormLabel>
          <TextArea
            value={body()}
            onInput={(e) => setBody(e.target.value)}
            placeholder={`{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}`}
            rows="6"
            enhanced
          />
          <FormDescription>
            🔧 Request body will be auto-filled from cURL -d flag
          </FormDescription>
        </FormGroup>
      )}

      {/* Controls */}
      <ButtonGroup>
        <Button onClick={sendRequest} disabled={isProcessing()}>
          {isProcessing() ? '⏳ Sending...' : '🚀 Send Request'}
        </Button>
        <Button variant="secondary" onClick={copyAsCurl}>
          📋 Copy as cURL
        </Button>
        <Button variant="secondary" onClick={clearAll}>
          🗑️ Clear All
        </Button>
      </ButtonGroup>

      {/* Error */}
      {error() && <ErrorContainer message={error()} />}

      {/* Response */}
      {response() && (
        <div class="space-y-6">
          {/* Status and Timing */}
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div class="flex items-center space-x-6">
              <StatusBadge status={response().status} statusText={response().statusText} />
              <span class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                ⏱️ {response().time}ms
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                📊 {response().size} bytes
              </span>
            </div>
            <CopyButton text={response().body} label="Copy Response" />
          </div>

          {/* Response Headers */}
          <div>
            <SectionHeader>📋 Response Headers</SectionHeader>
            <ResultContainer class="max-h-40 overflow-y-auto">
              <CodeDisplay>
                {Object.entries(response().headers).map(([key, value]) => 
                  `${key}: ${value}`
                ).join('\n')}
              </CodeDisplay>
            </ResultContainer>
          </div>

          {/* Response Body */}
          <div>
            <SectionHeader>📄 Response Body</SectionHeader>
            <ResultContainer class="max-h-80 overflow-y-auto">
              <CodeDisplay class="whitespace-pre-wrap">
                {response().body}
              </CodeDisplay>
            </ResultContainer>
          </div>
        </div>
      )}
    </Card>
  )
}

export default ApiTester