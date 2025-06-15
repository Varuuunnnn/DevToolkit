import { createSignal, createEffect } from 'solid-js'

// Custom hooks for common functionality
export const useCharacterCount = (initialValue = '') => {
  const [text, setText] = createSignal(initialValue)
  const [count, setCount] = createSignal(0)

  createEffect(() => {
    setCount(text().length)
  })

  return [text, setText, count]
}

export const useClipboard = () => {
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      return false
    }
  }

  return { copyToClipboard }
}

export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = createSignal(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setStoredValue = (newValue) => {
    setValue(newValue)
    try {
      localStorage.setItem(key, JSON.stringify(newValue))
    } catch (err) {
      console.error('Failed to save to localStorage:', err)
    }
  }

  return [value, setStoredValue]
}

export const useProcessing = () => {
  const [isProcessing, setIsProcessing] = createSignal(false)
  const [error, setError] = createSignal('')

  const withProcessing = async (asyncFn) => {
    setIsProcessing(true)
    setError('')
    try {
      const result = await asyncFn()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }

  return { isProcessing, error, setError, withProcessing }
}