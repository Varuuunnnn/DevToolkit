import { createSignal } from 'solid-js'

function CaseConverter() {
  const [input, setInput] = createSignal('')
  const [results, setResults] = createSignal({})

  const convertCases = () => {
    const text = input().trim()
    if (!text) {
      setResults({})
      return
    }

    const conversions = {
      camelCase: toCamelCase(text),
      PascalCase: toPascalCase(text),
      snake_case: toSnakeCase(text),
      'kebab-case': toKebabCase(text),
      'CONSTANT_CASE': toConstantCase(text),
      'Title Case': toTitleCase(text),
      'Sentence case': toSentenceCase(text),
      'lowercase': text.toLowerCase(),
      'UPPERCASE': text.toUpperCase(),
      'aLtErNaTiNg CaSe': toAlternatingCase(text),
      'iNvErSe CaSe': toInverseCase(text)
    }

    setResults(conversions)
  }

  const toCamelCase = (str) => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase()
      })
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
  }

  const toPascalCase = (str) => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
  }

  const toSnakeCase = (str) => {
    return str
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_')
  }

  const toKebabCase = (str) => {
    return str
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('-')
  }

  const toConstantCase = (str) => {
    return toSnakeCase(str).toUpperCase()
  }

  const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  }

  const toSentenceCase = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  const toAlternatingCase = (str) => {
    return str
      .split('')
      .map((char, index) => 
        index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
      )
      .join('')
  }

  const toInverseCase = (str) => {
    return str
      .split('')
      .map(char => 
        char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
      )
      .join('')
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const clearAll = () => {
    setInput('')
    setResults({})
  }

  return (
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Case Converter</h2>
      
      {/* Input */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Input Text
        </label>
        <textarea
          value={input()}
          onInput={(e) => {
            setInput(e.target.value)
            convertCases()
          }}
          placeholder="Enter text to convert..."
          rows="3"
          class="textarea-field"
        />
      </div>

      {/* Controls */}
      <div class="flex gap-2 mb-4">
        <button onClick={convertCases} class="btn-primary">
          Convert
        </button>
        <button onClick={clearAll} class="btn-secondary">
          Clear
        </button>
      </div>

      {/* Results */}
      {Object.keys(results()).length > 0 && (
        <div class="space-y-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Conversions</h3>
          {Object.entries(results()).map(([caseName, result]) => (
            <div key={caseName} class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{caseName}</span>
                <button 
                  onClick={() => copyToClipboard(result)}
                  class="btn-secondary text-xs"
                >
                  Copy
                </button>
              </div>
              <div class="font-mono text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600 break-all">
                {result}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CaseConverter