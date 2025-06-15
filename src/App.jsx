import { createSignal, onMount } from 'solid-js'
import GzipCompressor from './components/GzipDecompressor'
import JwtDecryptor from './components/JwtDecryptor'
import PasswordGenerator from './components/PasswordGenerator'
import JsonFormatter from './components/JsonFormatter'
import DiffChecker from './components/DiffChecker'
import CaseConverter from './components/CaseConverter'
import TimestampConverter from './components/TimestampConverter'
import EpochConverter from './components/EpochConverter'
import HttpStatusReference from './components/HttpStatusReference'
import ApiTester from './components/ApiTester'
import EventLoopVisualizer from './components/EventLoopVisualizer'

function App() {
  const [activeTab, setActiveTab] = createSignal('gzip')
  const [isDarkMode, setIsDarkMode] = createSignal(false)
  const [isTransitioning, setIsTransitioning] = createSignal(false)

  const tools = [
    { id: 'gzip', name: 'Gzip Compress', icon: '🗜️', component: GzipCompressor },
    { id: 'jwt', name: 'JWT Decoder', icon: '🔐', component: JwtDecryptor },
    { id: 'password', name: 'Password Gen', icon: '🔑', component: PasswordGenerator },
    { id: 'json', name: 'JSON Format', icon: '📝', component: JsonFormatter },
    { id: 'diff', name: 'Text Diff', icon: '🔍', component: DiffChecker },
    { id: 'case', name: 'Case Convert', icon: '🔤', component: CaseConverter },
    { id: 'timestamp', name: 'Timestamp', icon: '⏰', component: TimestampConverter },
    { id: 'epoch', name: 'Epoch Time', icon: '🕐', component: EpochConverter },
    { id: 'http', name: 'HTTP Status', icon: '📡', component: HttpStatusReference },
    { id: 'api', name: 'API Tester', icon: '🚀', component: ApiTester },
    { id: 'eventloop', name: 'Event Loop', icon: '⚡', component: EventLoopVisualizer }
  ]

  // Split tools into two rows (6 tools in first row, 5 in second)
  const firstRowTools = () => tools.slice(0, 6)
  const secondRowTools = () => tools.slice(6, 11)

  // Initialize dark mode from localStorage or system preference
  onMount(() => {
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
    setIsDarkMode(shouldBeDark)
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode()
    setIsDarkMode(newDarkMode)
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Handle tab change with animation
  const handleTabChange = (tabId) => {
    if (tabId === activeTab()) return
    
    setIsTransitioning(true)
    
    // Small delay to allow fade out animation
    setTimeout(() => {
      setActiveTab(tabId)
      setIsTransitioning(false)
    }, 150)
  }

  // Get the active component
  const getActiveComponent = () => {
    const tool = tools.find(t => t.id === activeTab())
    return tool ? tool.component : GzipCompressor
  }

  const renderTabButton = (tool) => (
    <button
      key={tool.id}
      onClick={() => handleTabChange(tool.id)}
      class={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 flex-1 min-w-0 ${
        activeTab() === tool.id
          ? isDarkMode()
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
          : isDarkMode()
            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span class="text-base flex-shrink-0">{tool.icon}</span>
      <span class="truncate">{tool.name}</span>
    </button>
  )

  return (
    <div class={`min-h-screen transition-colors duration-300 ${
      isDarkMode() 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      {/* Header */}
      <header class={`sticky top-0 z-50 backdrop-blur-lg border-b transition-all duration-300 ${
        isDarkMode() 
          ? 'bg-gray-900/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            {/* Logo */}
            <div class="flex items-center space-x-3">
              <div class={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-colors duration-300 ${
                isDarkMode() 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}>
                ⚡
              </div>
              <div>
                <h1 class={`text-xl font-bold transition-colors duration-300 ${
                  isDarkMode() ? 'text-white' : 'text-gray-900'
                }`}>
                  DevToolkit
                </h1>
                <p class={`text-xs transition-colors duration-300 ${
                  isDarkMode() ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Professional Developer Utilities
                </p>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              class={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                isDarkMode() 
                  ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isDarkMode() ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Two Rows */}
      <nav class={`sticky top-16 z-40 backdrop-blur-lg border-b transition-all duration-300 ${
        isDarkMode() 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-3 space-y-2">
            {/* First Row */}
            <div class="flex space-x-2">
              {firstRowTools().map(renderTabButton)}
            </div>
            
            {/* Second Row */}
            <div class="flex space-x-2">
              {secondRowTools().map(renderTabButton)}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class={`transition-all duration-300 ease-in-out transform ${
          isTransitioning() 
            ? 'opacity-0 translate-y-4 scale-95' 
            : 'opacity-100 translate-y-0 scale-100'
        }`}>
          {(() => {
            const ActiveComponent = getActiveComponent()
            return <ActiveComponent />
          })()}
        </div>
      </main>

      {/* Footer */}
      <footer class={`mt-16 border-t transition-colors duration-300 ${
        isDarkMode() 
          ? 'bg-gray-900/50 border-gray-700' 
          : 'bg-white/50 border-gray-200'
      }`}>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex flex-col items-center justify-center space-y-4">
            {/* Features */}
            <div class="flex items-center justify-center space-x-8 text-sm">
              <span class={`flex items-center space-x-2 transition-colors duration-300 ${
                isDarkMode() ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
                <span>Client-side processing</span>
              </span>
              <span class={`flex items-center space-x-2 transition-colors duration-300 ${
                isDarkMode() ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                </svg>
                <span>Lightning fast</span>
              </span>
              <span class={`flex items-center space-x-2 transition-colors duration-300 ${
                isDarkMode() ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                <span>No data uploaded</span>
              </span>
            </div>
            
            {/* Custom Attribution */}
            <div class={`flex items-center space-x-2 text-sm transition-colors duration-300 ${
              isDarkMode() ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span>Made with</span>
              <span class="text-red-500 animate-pulse">❤️</span>
              <span>by</span>
              <span class={`font-semibold transition-colors duration-300 ${
                isDarkMode() ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Varun
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App