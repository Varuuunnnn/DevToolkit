import { createSignal } from 'solid-js'

function PasswordGenerator() {
  const [password, setPassword] = createSignal('')
  const [length, setLength] = createSignal(16)
  const [includeUppercase, setIncludeUppercase] = createSignal(true)
  const [includeLowercase, setIncludeLowercase] = createSignal(true)
  const [includeNumbers, setIncludeNumbers] = createSignal(true)
  const [includeSymbols, setIncludeSymbols] = createSignal(true)
  const [excludeSimilar, setExcludeSimilar] = createSignal(false)
  const [strength, setStrength] = createSignal('')

  const generatePassword = () => {
    let charset = ''
    
    if (includeUppercase()) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (includeLowercase()) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (includeNumbers()) charset += '0123456789'
    if (includeSymbols()) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    if (excludeSimilar()) {
      charset = charset.replace(/[il1Lo0O]/g, '')
    }
    
    if (!charset) {
      setPassword('Please select at least one character type')
      return
    }
    
    let result = ''
    for (let i = 0; i < length(); i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    setPassword(result)
    calculateStrength(result)
  }

  const calculateStrength = (pwd) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    
    if (score < 3) setStrength('Weak')
    else if (score < 5) setStrength('Medium')
    else setStrength('Strong')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password())
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Password Generator</h2>
      
      {/* Length Slider */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Length: {length()}
        </label>
        <input
          type="range"
          min="4"
          max="128"
          value={length()}
          onInput={(e) => setLength(parseInt(e.target.value))}
          class="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Options */}
      <div class="grid grid-cols-2 gap-3 mb-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            checked={includeUppercase()}
            onChange={(e) => setIncludeUppercase(e.target.checked)}
            class="mr-2"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Uppercase</span>
        </label>
        <label class="flex items-center">
          <input
            type="checkbox"
            checked={includeLowercase()}
            onChange={(e) => setIncludeLowercase(e.target.checked)}
            class="mr-2"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Lowercase</span>
        </label>
        <label class="flex items-center">
          <input
            type="checkbox"
            checked={includeNumbers()}
            onChange={(e) => setIncludeNumbers(e.target.checked)}
            class="mr-2"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Numbers</span>
        </label>
        <label class="flex items-center">
          <input
            type="checkbox"
            checked={includeSymbols()}
            onChange={(e) => setIncludeSymbols(e.target.checked)}
            class="mr-2"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Symbols</span>
        </label>
      </div>

      <label class="flex items-center mb-4">
        <input
          type="checkbox"
          checked={excludeSimilar()}
          onChange={(e) => setExcludeSimilar(e.target.checked)}
          class="mr-2"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">Exclude similar characters (i, l, 1, L, o, 0, O)</span>
      </label>

      <button onClick={generatePassword} class="btn-primary w-full mb-4">
        Generate Password
      </button>

      {password() && (
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Generated Password</span>
            <div class="flex items-center space-x-2">
              <span class={`text-xs px-2 py-1 rounded ${
                strength() === 'Strong' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                strength() === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}>
                {strength()}
              </span>
              <button onClick={copyToClipboard} class="btn-secondary text-xs">
                Copy
              </button>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 font-mono text-sm break-all text-gray-900 dark:text-gray-100">
            {password()}
          </div>
        </div>
      )}
    </div>
  )
}

export default PasswordGenerator