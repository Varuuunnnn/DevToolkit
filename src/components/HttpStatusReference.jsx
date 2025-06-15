import { createSignal } from 'solid-js'

function HttpStatusReference() {
  const [searchTerm, setSearchTerm] = createSignal('')
  const [selectedCategory, setSelectedCategory] = createSignal('all')

  const statusCodes = [
    // 1xx Informational
    { code: 100, message: 'Continue', description: 'The server has received the request headers and the client should proceed to send the request body.', category: 'informational' },
    { code: 101, message: 'Switching Protocols', description: 'The requester has asked the server to switch protocols and the server has agreed to do so.', category: 'informational' },
    { code: 102, message: 'Processing', description: 'The server has received and is processing the request, but no response is available yet.', category: 'informational' },

    // 2xx Success
    { code: 200, message: 'OK', description: 'The request has succeeded. The meaning of the success depends on the HTTP method.', category: 'success' },
    { code: 201, message: 'Created', description: 'The request has been fulfilled and resulted in a new resource being created.', category: 'success' },
    { code: 202, message: 'Accepted', description: 'The request has been accepted for processing, but the processing has not been completed.', category: 'success' },
    { code: 204, message: 'No Content', description: 'The server successfully processed the request and is not returning any content.', category: 'success' },
    { code: 206, message: 'Partial Content', description: 'The server is delivering only part of the resource due to a range header sent by the client.', category: 'success' },

    // 3xx Redirection
    { code: 300, message: 'Multiple Choices', description: 'Indicates multiple options for the resource from which the client may choose.', category: 'redirection' },
    { code: 301, message: 'Moved Permanently', description: 'This and all future requests should be directed to the given URI.', category: 'redirection' },
    { code: 302, message: 'Found', description: 'Tells the client to look at another URL. 302 has been superseded by 303 and 307.', category: 'redirection' },
    { code: 304, message: 'Not Modified', description: 'Indicates that the resource has not been modified since the version specified by the request headers.', category: 'redirection' },
    { code: 307, message: 'Temporary Redirect', description: 'The request should be repeated with another URI; however, future requests should still use the original URI.', category: 'redirection' },
    { code: 308, message: 'Permanent Redirect', description: 'The request and all future requests should be repeated using another URI.', category: 'redirection' },

    // 4xx Client Error
    { code: 400, message: 'Bad Request', description: 'The server cannot or will not process the request due to an apparent client error.', category: 'client-error' },
    { code: 401, message: 'Unauthorized', description: 'Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet been provided.', category: 'client-error' },
    { code: 403, message: 'Forbidden', description: 'The request was valid, but the server is refusing action. The user might not have the necessary permissions.', category: 'client-error' },
    { code: 404, message: 'Not Found', description: 'The requested resource could not be found but may be available in the future.', category: 'client-error' },
    { code: 405, message: 'Method Not Allowed', description: 'A request method is not supported for the requested resource.', category: 'client-error' },
    { code: 409, message: 'Conflict', description: 'Indicates that the request could not be processed because of conflict in the request.', category: 'client-error' },
    { code: 410, message: 'Gone', description: 'Indicates that the resource requested is no longer available and will not be available again.', category: 'client-error' },
    { code: 422, message: 'Unprocessable Entity', description: 'The request was well-formed but was unable to be followed due to semantic errors.', category: 'client-error' },
    { code: 429, message: 'Too Many Requests', description: 'The user has sent too many requests in a given amount of time.', category: 'client-error' },

    // 5xx Server Error
    { code: 500, message: 'Internal Server Error', description: 'A generic error message, given when an unexpected condition was encountered.', category: 'server-error' },
    { code: 501, message: 'Not Implemented', description: 'The server either does not recognize the request method, or it lacks the ability to fulfill the request.', category: 'server-error' },
    { code: 502, message: 'Bad Gateway', description: 'The server was acting as a gateway or proxy and received an invalid response from the upstream server.', category: 'server-error' },
    { code: 503, message: 'Service Unavailable', description: 'The server is currently unavailable (because it is overloaded or down for maintenance).', category: 'server-error' },
    { code: 504, message: 'Gateway Timeout', description: 'The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.', category: 'server-error' },
  ]

  const categories = [
    { value: 'all', label: 'All Status Codes', color: 'gray' },
    { value: 'informational', label: '1xx Informational', color: 'blue' },
    { value: 'success', label: '2xx Success', color: 'green' },
    { value: 'redirection', label: '3xx Redirection', color: 'yellow' },
    { value: 'client-error', label: '4xx Client Error', color: 'red' },
    { value: 'server-error', label: '5xx Server Error', color: 'purple' },
  ]

  const filteredCodes = () => {
    return statusCodes.filter(status => {
      const matchesSearch = searchTerm() === '' || 
        status.code.toString().includes(searchTerm()) ||
        status.message.toLowerCase().includes(searchTerm().toLowerCase()) ||
        status.description.toLowerCase().includes(searchTerm().toLowerCase())
      
      const matchesCategory = selectedCategory() === 'all' || status.category === selectedCategory()
      
      return matchesSearch && matchesCategory
    })
  }

  const getCategoryColor = (category) => {
    const colors = {
      'informational': 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300',
      'success': 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300',
      'redirection': 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300',
      'client-error': 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300',
      'server-error': 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-300',
    }
    return colors[category] || 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200'
  }

  const copyStatusCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code.toString())
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">HTTP Status Codes</h2>
      
      {/* Search and Filter */}
      <div class="mb-4 space-y-3">
        <input
          type="text"
          value={searchTerm()}
          onInput={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by code, message, or description..."
          class="input-field"
        />
        
        <div class="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              class={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory() === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Codes List */}
      <div class="space-y-2 max-h-96 overflow-y-auto">
        {filteredCodes().map(status => (
          <div
            key={status.code}
            class={`border rounded-lg p-3 ${getCategoryColor(status.category)}`}
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-mono font-bold text-lg">{status.code}</span>
                  <span class="font-semibold">{status.message}</span>
                </div>
                <p class="text-sm opacity-90">{status.description}</p>
              </div>
              <button
                onClick={() => copyStatusCode(status.code)}
                class="ml-2 px-2 py-1 bg-white dark:bg-gray-800 bg-opacity-50 hover:bg-opacity-75 rounded text-xs transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCodes().length === 0 && (
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No status codes found matching your search.</p>
        </div>
      )}
    </div>
  )
}

export default HttpStatusReference