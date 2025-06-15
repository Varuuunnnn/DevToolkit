import { createSignal } from 'solid-js'
import * as pako from 'pako'
import { 
  Card, FormGroup, FormLabel, FormDescription, TextArea, ButtonGroup, Button, 
  CharCount, ErrorContainer, SuccessContainer, CopyButton 
} from './shared/FormComponents'
import { useCharacterCount, useProcessing } from './shared/hooks'

function GzipCompressor() {
  const [operation, setOperation] = createSignal('decompress')
  const [inputText, setInputText, inputCharCount] = useCharacterCount('')
  const [result, setResult] = createSignal('')
  const [resultCharCount, setResultCharCount] = createSignal(0)
  const { isProcessing, error, setError, withProcessing } = useProcessing()

  const handleCompress = async () => {
    if (!inputText().trim()) {
      setError('Please enter some text to compress')
      return
    }

    await withProcessing(async () => {
      const compressed = pako.gzip(inputText().trim())
      const base64 = btoa(String.fromCharCode(...compressed))
      setResult(base64)
      setResultCharCount(base64.length)
    })
  }

  const handleDecompress = async () => {
    if (!inputText().trim()) {
      setError('Please enter some base64 encoded gzip data to decompress')
      return
    }

    await withProcessing(async () => {
      const binaryString = atob(inputText().trim())
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const decompressed = pako.inflate(bytes, { to: 'string' })
      setResult(decompressed)
      setResultCharCount(decompressed.length)
    })
  }

  const handleProcess = () => {
    if (operation() === 'compress') {
      handleCompress()
    } else {
      handleDecompress()
    }
  }

  const clearAll = () => {
    setInputText('')
    setResult('')
    setResultCharCount(0)
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

  return (
    <Card title="🗜️ Gzip Compressor/Decompressor">
      {/* Operation Toggle */}
      <FormGroup>
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
      </FormGroup>

      {/* Input Section */}
      <FormGroup>
        <FormLabel>
          {operation() === 'compress' ? '📝 Text to Compress' : '🔗 Base64 Encoded Gzip Data'}
        </FormLabel>
        <TextArea
          value={inputText()}
          onInput={(e) => setInputText(e.target.value)}
          placeholder={
            operation() === 'compress' 
              ? 'Enter your text here to compress...\n\nYou can paste large amounts of text, JSON data, or any content you want to compress.' 
              : 'Paste your base64 encoded gzip data here...\n\nExample: H4sIAAAAAAAAA...'
          }
          enhanced
          autoResize
        />
        <CharCount count={inputCharCount()} />
        <FormDescription>
          {operation() === 'compress' 
            ? 'Enter any text content to compress it using gzip algorithm'
            : 'Paste base64-encoded gzip data to decompress it back to original text'
          }
        </FormDescription>
      </FormGroup>

      {/* Controls */}
      <ButtonGroup>
        <Button
          onClick={handleProcess}
          disabled={isProcessing()}
        >
          {isProcessing() 
            ? (operation() === 'compress' ? '🔄 Compressing...' : '🔄 Decompressing...') 
            : (operation() === 'compress' ? '🗜️ Compress Text' : '📂 Decompress Data')
          }
        </Button>
        <Button variant="secondary" onClick={clearAll}>
          🗑️ Clear All
        </Button>
      </ButtonGroup>

      {/* Error Display */}
      {error() && <ErrorContainer message={error()} />}

      {/* Compression Stats */}
      {operation() === 'compress' && getCompressionRatio() && (
        <SuccessContainer message={`📊 Compression: ${getCompressionRatio()}`} />
      )}

      {/* Result Section */}
      {result() && (
        <FormGroup>
          <div class="flex items-center justify-between mb-3">
            <FormLabel>
              {operation() === 'compress' ? '📦 Compressed Data (Base64)' : '📄 Decompressed Content'}
            </FormLabel>
            <CopyButton text={result()} label="Copy Result" />
          </div>
          <TextArea
            value={result()}
            readonly
            class="bg-gray-50 dark:bg-gray-700"
            autoResize
          />
          <CharCount count={resultCharCount()} />
          <FormDescription>
            {operation() === 'compress' 
              ? 'Base64 encoded compressed data - copy this to share or store'
              : 'Original decompressed text content'
            }
          </FormDescription>
        </FormGroup>
      )}
    </Card>
  )
}

export default GzipCompressor