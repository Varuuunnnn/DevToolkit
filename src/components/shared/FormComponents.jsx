import { createSignal } from 'solid-js'

// Reusable Form Components
export const FormGroup = (props) => (
  <div class="form-group">
    {props.children}
  </div>
)

export const FormRow = (props) => (
  <div class="form-row">
    {props.children}
  </div>
)

export const FormCol = (props) => (
  <div class={`form-col ${props.class || ''}`}>
    {props.children}
  </div>
)

export const FormLabel = (props) => (
  <label class={`form-label ${props.class || ''}`}>
    {props.children}
  </label>
)

export const FormDescription = (props) => (
  <div class="form-description">
    {props.children}
  </div>
)

export const TextArea = (props) => {
  const autoResize = (textarea) => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, props.maxHeight || 400) + 'px'
  }

  return (
    <textarea
      ref={(el) => {
        if (el && props.autoResize) {
          el.addEventListener('input', () => autoResize(el))
          autoResize(el)
        }
      }}
      value={props.value || ''}
      onInput={(e) => {
        if (props.onInput) props.onInput(e)
        if (props.autoResize) autoResize(e.target)
      }}
      placeholder={props.placeholder}
      rows={props.rows || 4}
      class={`${props.enhanced ? 'textarea-enhanced' : 'textarea-field'} ${props.class || ''}`}
      readonly={props.readonly}
    />
  )
}

export const InputField = (props) => (
  <input
    type={props.type || 'text'}
    value={props.value || ''}
    onInput={props.onInput}
    placeholder={props.placeholder}
    class={`input-field ${props.class || ''}`}
    disabled={props.disabled}
  />
)

export const Button = (props) => (
  <button
    onClick={props.onClick}
    disabled={props.disabled}
    class={`${props.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} ${props.class || ''}`}
  >
    {props.children}
  </button>
)

export const ButtonGroup = (props) => (
  <div class="btn-group">
    {props.children}
  </div>
)

export const CharCount = (props) => (
  <div class="char-count">
    {props.count?.toLocaleString() || 0} characters
  </div>
)

export const ErrorContainer = (props) => (
  <div class="error-container">
    <p class="error-text">❌ {props.message}</p>
  </div>
)

export const SuccessContainer = (props) => (
  <div class="success-container">
    <p class="success-text">{props.message}</p>
  </div>
)

export const ResultContainer = (props) => (
  <div class={`result-container ${props.class || ''}`}>
    {props.children}
  </div>
)

export const CodeDisplay = (props) => (
  <pre class={`code-display ${props.class || ''}`}>
    {props.children}
  </pre>
)

export const CopyButton = (props) => {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(props.text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button onClick={copyToClipboard} class={`copy-btn ${props.class || ''}`}>
      📋 {props.label || 'Copy'}
    </button>
  )
}

export const SectionHeader = (props) => (
  <h3 class="section-header">
    {props.children}
  </h3>
)

export const Card = (props) => (
  <div class="card">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      {props.title}
    </h2>
    {props.children}
  </div>
)

export const StatusBadge = (props) => {
  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400'
    if (status >= 300 && status < 400) return 'text-yellow-600 dark:text-yellow-400'
    if (status >= 400 && status < 500) return 'text-red-600 dark:text-red-400'
    if (status >= 500) return 'text-purple-600 dark:text-purple-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <span class={`font-bold text-xl ${getStatusColor(props.status)}`}>
      {props.status} {props.statusText}
    </span>
  )
}

export const LoadingSpinner = () => (
  <div class="flex items-center justify-center p-4">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

export const EmptyState = (props) => (
  <div class="text-center py-8 text-gray-500 dark:text-gray-400">
    <p>{props.message || 'No data available'}</p>
  </div>
)

export const Toggle = (props) => (
  <div class="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
    {props.options.map((option) => (
      <button
        key={option.value}
        onClick={() => props.onChange(option.value)}
        class={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
          props.value === option.value
            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
)

export const Select = (props) => (
  <select
    value={props.value}
    onChange={props.onChange}
    class={`input-field ${props.class || ''}`}
    disabled={props.disabled}
  >
    {props.options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
)