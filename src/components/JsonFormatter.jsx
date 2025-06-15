import { createSignal } from 'solid-js'
import { 
  Card, FormGroup, FormLabel, FormDescription, TextArea, ButtonGroup, Button, 
  CharCount, ErrorContainer, SuccessContainer, CopyButton, FormRow, FormCol, InputField
} from './shared/FormComponents'
import { useCharacterCount, useProcessing } from './shared/hooks'

function JsonFormatter() {
  const [input, setInput, inputCharCount] = useCharacterCount('')
  const [output, setOutput, outputCharCount] = useCharacterCount('')
  const [indentSize, setIndentSize] = createSignal(2)
  const { error, setError } = useProcessing()

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

  const clearAll = () => {
    setInput('')
    setOutput('')
    setError('')
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
    <Card title="📝 JSON Formatter & Validator">
      {/* Input */}
      <FormGroup>
        <FormLabel>📄 JSON Input</FormLabel>
        <TextArea
          value={input()}
          onInput={(e) => setInput(e.target.value)}
          placeholder='Paste your JSON here...

Example:
{
  "name": "John Doe",
  "age": 30,
  "city": "New York",
  "hobbies": ["reading", "coding", "traveling"]
}'
          enhanced
          autoResize
        />
        <CharCount count={inputCharCount()} />
        <FormDescription>
          Paste any JSON data to format, minify, or validate it
        </FormDescription>
      </FormGroup>

      {/* Controls */}
      <FormRow>
        <ButtonGroup>
          <Button onClick={formatJson}>✨ Format & Beautify</Button>
          <Button variant="secondary" onClick={minifyJson}>🗜️ Minify</Button>
          <Button variant="secondary" onClick={validateJson}>✅ Validate Only</Button>
          <Button variant="secondary" onClick={clearAll}>🗑️ Clear All</Button>
        </ButtonGroup>
        
        <FormCol class="max-w-xs">
          <FormLabel>🔧 Indent Size</FormLabel>
          <select
            value={indentSize()}
            onChange={(e) => setIndentSize(parseInt(e.target.value))}
            class="input-field"
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="8">8 spaces</option>
          </select>
        </FormCol>
      </FormRow>

      {/* Error */}
      {error() && <ErrorContainer message={error()} />}

      {/* Size comparison */}
      {getSizeReduction() && <SuccessContainer message={getSizeReduction()} />}

      {/* Output */}
      {output() && (
        <FormGroup>
          <div class="flex items-center justify-between mb-3">
            <FormLabel>📋 Formatted Output</FormLabel>
            <CopyButton text={output()} label="Copy Result" />
          </div>
          <TextArea
            value={output()}
            readonly
            class="bg-gray-50 dark:bg-gray-700"
            autoResize
          />
          <CharCount count={outputCharCount()} />
          <FormDescription>
            {output() === '✅ Valid JSON - No syntax errors found!' 
              ? 'JSON validation result'
              : 'Formatted JSON output - ready to copy and use'
            }
          </FormDescription>
        </FormGroup>
      )}
    </Card>
  )
}

export default JsonFormatter