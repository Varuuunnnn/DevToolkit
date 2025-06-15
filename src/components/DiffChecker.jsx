import { createSignal, createEffect } from 'solid-js'

function DiffChecker() {
  const [text1, setText1] = createSignal('')
  const [text2, setText2] = createSignal('')
  const [diffResult, setDiffResult] = createSignal([])
  const [ignoreWhitespace, setIgnoreWhitespace] = createSignal(false)
  const [ignoreCase, setIgnoreCase] = createSignal(false)
  const [text1CharCount, setText1CharCount] = createSignal(0)
  const [text2CharCount, setText2CharCount] = createSignal(0)

  createEffect(() => {
    setText1CharCount(text1().length)
  })

  createEffect(() => {
    setText2CharCount(text2().length)
  })

  const computeDiff = () => {
    let content1 = text1()
    let content2 = text2()

    if (ignoreCase()) {
      content1 = content1.toLowerCase()
      content2 = content2.toLowerCase()
    }

    if (ignoreWhitespace()) {
      content1 = content1.replace(/\s+/g, ' ').trim()
      content2 = content2.replace(/\s+/g, ' ').trim()
    }

    const lines1 = content1.split('\n')
    const lines2 = content2.split('\n')

    const diff = []
    const maxLines = Math.max(lines1.length, lines2.length)

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || ''
      const line2 = lines2[i] || ''

      if (line1 === line2) {
        diff.push({ type: 'equal', line1, line2, lineNum: i + 1 })
      } else {
        if (line1 && !line2) {
          diff.push({ type: 'removed', line1, line2: '', lineNum: i + 1 })
        } else if (!line1 && line2) {
          diff.push({ type: 'added', line1: '', line2, lineNum: i + 1 })
        } else {
          diff.push({ type: 'modified', line1, line2, lineNum: i + 1 })
        }
      }
    }

    setDiffResult(diff)
  }

  const clearAll = () => {
    setText1('')
    setText2('')
    setDiffResult([])
  }

  const swapTexts = () => {
    const temp = text1()
    setText1(text2())
    setText2(temp)
  }

  const autoResize = (textarea) => {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px'
  }

  const getDiffStats = () => {
    if (diffResult().length === 0) return null
    
    const stats = diffResult().reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {})

    return stats
  }

  return (
    <div class="card">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">🔍 Text Difference Checker</h2>
      
      {/* Options */}
      <div class="form-group">
        <label class="form-label">⚙️ Comparison Options</label>
        <div class="flex gap-6">
          <label class="flex items-center">
            <input
              type="checkbox"
              checked={ignoreWhitespace()}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              class="mr-3 w-4 h-4"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Ignore whitespace differences</span>
          </label>
          <label class="flex items-center">
            <input
              type="checkbox"
              checked={ignoreCase()}
              onChange={(e) => setIgnoreCase(e.target.checked)}
              class="mr-3 w-4 h-4"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Ignore case differences</span>
          </label>
        </div>
      </div>

      {/* Input Areas */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="form-group">
          <label class="form-label">
            📄 Original Text
          </label>
          <textarea
            ref={(el) => {
              if (el) {
                el.addEventListener('input', () => autoResize(el))
                autoResize(el)
              }
            }}
            value={text1()}
            onInput={(e) => {
              setText1(e.target.value)
              autoResize(e.target)
            }}
            placeholder="Enter the original text here...

This will be compared against the modified text to show differences."
            class="textarea-enhanced"
          />
          <div class="char-count">
            {text1CharCount().toLocaleString()} characters
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">
            📝 Modified Text
          </label>
          <textarea
            ref={(el) => {
              if (el) {
                el.addEventListener('input', () => autoResize(el))
                autoResize(el)
              }
            }}
            value={text2()}
            onInput={(e) => {
              setText2(e.target.value)
              autoResize(e.target)
            }}
            placeholder="Enter the modified text here...

Changes will be highlighted when you run the comparison."
            class="textarea-enhanced"
          />
          <div class="char-count">
            {text2CharCount().toLocaleString()} characters
          </div>
        </div>
      </div>

      {/* Controls */}
      <div class="btn-group">
        <button onClick={computeDiff} class="btn-primary">
          🔍 Compare Texts
        </button>
        <button onClick={swapTexts} class="btn-secondary">
          🔄 Swap Texts
        </button>
        <button onClick={clearAll} class="btn-secondary">
          🗑️ Clear All
        </button>
      </div>

      {/* Diff Stats */}
      {getDiffStats() && (
        <div class="success-container">
          <div class="flex gap-4 text-sm">
            {getDiffStats().equal && (
              <span class="text-gray-600 dark:text-gray-400">
                ✅ {getDiffStats().equal} unchanged
              </span>
            )}
            {getDiffStats().added && (
              <span class="text-green-600 dark:text-green-400">
                ➕ {getDiffStats().added} added
              </span>
            )}
            {getDiffStats().removed && (
              <span class="text-red-600 dark:text-red-400">
                ➖ {getDiffStats().removed} removed
              </span>
            )}
            {getDiffStats().modified && (
              <span class="text-yellow-600 dark:text-yellow-400">
                🔄 {getDiffStats().modified} modified
              </span>
            )}
          </div>
        </div>
      )}

      {/* Diff Results */}
      {diffResult().length > 0 && (
        <div class="form-group">
          <h3 class="section-header">📊 Difference Analysis</h3>
          <div class="result-container max-h-96 overflow-y-auto">
            {diffResult().map((item, index) => (
              <div key={index} class={`flex text-sm font-mono mb-1 p-2 rounded ${
                item.type === 'equal' ? 'text-gray-600 dark:text-gray-400' :
                item.type === 'removed' ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                item.type === 'added' ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
              }`}>
                <span class="w-12 text-gray-400 dark:text-gray-500 text-right mr-4 flex-shrink-0">{item.lineNum}</span>
                <div class="flex-1 min-w-0">
                  {item.type === 'removed' && (
                    <div class="flex">
                      <span class="text-red-600 dark:text-red-400 mr-2 flex-shrink-0">−</span>
                      <span class="break-all">{item.line1}</span>
                    </div>
                  )}
                  {item.type === 'added' && (
                    <div class="flex">
                      <span class="text-green-600 dark:text-green-400 mr-2 flex-shrink-0">+</span>
                      <span class="break-all">{item.line2}</span>
                    </div>
                  )}
                  {item.type === 'modified' && (
                    <div>
                      <div class="flex mb-1">
                        <span class="text-red-600 dark:text-red-400 mr-2 flex-shrink-0">−</span>
                        <span class="break-all">{item.line1}</span>
                      </div>
                      <div class="flex">
                        <span class="text-green-600 dark:text-green-400 mr-2 flex-shrink-0">+</span>
                        <span class="break-all">{item.line2}</span>
                      </div>
                    </div>
                  )}
                  {item.type === 'equal' && (
                    <div class="flex">
                      <span class="mr-3 flex-shrink-0"> </span>
                      <span class="break-all">{item.line1}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DiffChecker