import { createSignal, createEffect } from 'solid-js'
import {
  Card, FormGroup, FormLabel, FormDescription, ButtonGroup, Button,
  InputField, CopyButton, SectionHeader, ResultContainer
} from './shared/FormComponents'

function hexToRgb(hex) {
  const cleaned = hex.replace('#', '').trim()
  if (cleaned.length === 3) {
    const expanded = cleaned.split('').map(c => c + c).join('')
    const r = parseInt(expanded.substring(0, 2), 16)
    const g = parseInt(expanded.substring(2, 4), 16)
    const b = parseInt(expanded.substring(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null
    return { r, g, b }
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16)
    const g = parseInt(cleaned.substring(2, 4), 16)
    const b = parseInt(cleaned.substring(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null
    return { r, g, b }
  }
  return null
}

function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  const toHex = (v) => clamp(v).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

function hslToRgb(h, s, l) {
  h = (h % 360) / 360
  s = s / 100
  l = l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

function getContrastColor(r, g, b) {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

function ColorPicker() {
  const [color, setColor] = createSignal('#3b82f6')
  const [hexInput, setHexInput] = createSignal('#3b82f6')
  const [r, setR] = createSignal(59)
  const [g, setG] = createSignal(130)
  const [b, setB] = createSignal(246)
  const [h, setH] = createSignal(217)
  const [s, setS] = createSignal(91)
  const [l, setL] = createSignal(60)
  const [error, setError] = createSignal('')

  const updateFromHex = (hex) => {
    const rgb = hexToRgb(hex)
    if (!rgb) {
      setError('Invalid hex color')
      return
    }
    setError('')
    setHexInput(hex)
    setColor(rgbToHex(rgb.r, rgb.g, rgb.b))
    setR(rgb.r)
    setG(rgb.g)
    setB(rgb.b)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    setH(hsl.h)
    setS(hsl.s)
    setL(hsl.l)
  }

  const updateFromRgb = (newR, newG, newB) => {
    setError('')
    const hex = rgbToHex(newR, newG, newB)
    setColor(hex)
    setHexInput(hex)
    setR(newR)
    setG(newG)
    setB(newB)
    const hsl = rgbToHsl(newR, newG, newB)
    setH(hsl.h)
    setS(hsl.s)
    setL(hsl.l)
  }

  const updateFromHsl = (newH, newS, newL) => {
    setError('')
    const rgb = hslToRgb(newH, newS, newL)
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    setColor(hex)
    setHexInput(hex)
    setR(rgb.r)
    setG(rgb.g)
    setB(rgb.b)
    setH(newH)
    setS(newS)
    setL(newL)
  }

  const handleHexInput = (e) => {
    const val = e.target.value
    setHexInput(val)
    if (val.trim().startsWith('#') || val.trim().length >= 6) {
      updateFromHex(val)
    }
  }

  const handleRgbInput = (channel, e) => {
    const val = parseInt(e.target.value)
    if (isNaN(val)) return
    const clamped = Math.max(0, Math.min(255, val))
    if (channel === 'r') updateFromRgb(clamped, g(), b())
    if (channel === 'g') updateFromRgb(r(), clamped, b())
    if (channel === 'b') updateFromRgb(r(), g(), clamped)
  }

  const handleHslInput = (channel, e) => {
    const val = parseInt(e.target.value)
    if (isNaN(val)) return
    if (channel === 'h') updateFromHsl(Math.max(0, Math.min(360, val)), s(), l())
    if (channel === 's') updateFromHsl(h(), Math.max(0, Math.min(100, val)), l())
    if (channel === 'l') updateFromHsl(h(), s(), Math.max(0, Math.min(100, val)))
  }

  const handleColorPicker = (e) => {
    updateFromHex(e.target.value)
  }

  const copyValue = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const rgbString = () => `rgb(${r()}, ${g()}, ${b()})`
  const rgbaString = () => `rgba(${r()}, ${g()}, ${b()}, 1)`
  const hslString = () => `hsl(${h()}, ${s()}%, ${l()}%)`
  const hexUpper = () => hexInput().toUpperCase()

  const contrastColor = () => getContrastColor(r(), g(), b())

  const formatRow = (label, value) => (
    <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
      <div class="flex items-center space-x-3">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 w-16">{label}</span>
        <span class="font-mono text-sm text-gray-900 dark:text-gray-100">{value}</span>
      </div>
      <button
        onClick={() => copyValue(value)}
        class="copy-btn text-xs"
      >
        Copy
      </button>
    </div>
  )

  return (
    <Card title="🎨 Color Picker & Converter">
      {/* Color Preview + Picker */}
      <FormGroup>
        <FormLabel>🎨 Pick a Color</FormLabel>
        <div class="flex items-center gap-4">
          <input
            type="color"
            value={color()}
            onInput={handleColorPicker}
            class="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-600"
          />
          <div
            class="flex-1 rounded-lg p-4 flex items-center justify-center transition-colors duration-200"
            style={{ 'background-color': color(), color: contrastColor() }}
          >
            <span class="font-mono text-sm font-medium">{hexUpper()}</span>
          </div>
        </div>
        <FormDescription>
          Use the color picker or type a value in any format below — all fields update in real time.
        </FormDescription>
      </FormGroup>

      {/* HEX Input */}
      <FormGroup>
        <FormLabel>#️⃣ HEX</FormLabel>
        <InputField
          value={hexInput()}
          onInput={handleHexInput}
          placeholder="#3b82f6"
        />
        {error() && (
          <div class="text-red-600 dark:text-red-400 text-xs mt-1">{error()}</div>
        )}
      </FormGroup>

      {/* RGB Inputs */}
      <FormGroup>
        <FormLabel>🔴 RGB</FormLabel>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Red</label>
            <InputField
              type="number"
              value={r()}
              onInput={(e) => handleRgbInput('r', e)}
              placeholder="0-255"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Green</label>
            <InputField
              type="number"
              value={g()}
              onInput={(e) => handleRgbInput('g', e)}
              placeholder="0-255"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Blue</label>
            <InputField
              type="number"
              value={b()}
              onInput={(e) => handleRgbInput('b', e)}
              placeholder="0-255"
            />
          </div>
        </div>
      </FormGroup>

      {/* HSL Inputs */}
      <FormGroup>
        <FormLabel>🌈 HSL</FormLabel>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Hue</label>
            <InputField
              type="number"
              value={h()}
              onInput={(e) => handleHslInput('h', e)}
              placeholder="0-360"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Saturation</label>
            <InputField
              type="number"
              value={s()}
              onInput={(e) => handleHslInput('s', e)}
              placeholder="0-100"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Lightness</label>
            <InputField
              type="number"
              value={l()}
              onInput={(e) => handleHslInput('l', e)}
              placeholder="0-100"
            />
          </div>
        </div>
      </FormGroup>

      {/* All Format Outputs */}
      <FormGroup>
        <SectionHeader>📋 All Formats</SectionHeader>
        <div class="space-y-2">
          {formatRow('HEX', hexUpper())}
          {formatRow('HEX (lower)', color())}
          {formatRow('RGB', rgbString())}
          {formatRow('RGBA', rgbaString())}
          {formatRow('HSL', hslString())}
        </div>
      </FormGroup>
    </Card>
  )
}

export default ColorPicker
