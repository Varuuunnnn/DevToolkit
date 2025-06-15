import { createSignal, createEffect, onCleanup } from 'solid-js'

function EventLoopVisualizer() {
  const [isRunning, setIsRunning] = createSignal(false)
  const [callStack, setCallStack] = createSignal([])
  const [callbackQueue, setCallbackQueue] = createSignal([])
  const [webApis, setWebApis] = createSignal([])
  const [currentLine, setCurrentLine] = createSignal(-1)
  const [speed, setSpeed] = createSignal(1000)
  const [code, setCode] = createSignal(`console.log('Start');

setTimeout(() => {
  console.log('Timeout 1');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise 1');
});

console.log('End');`)
  const [output, setOutput] = createSignal([])
  const [microtaskQueue, setMicrotaskQueue] = createSignal([])
  const [isEventLoopActive, setIsEventLoopActive] = createSignal(false)

  let executionTimer = null
  let stepIndex = 0

  const predefinedExamples = {
    basic: `console.log('Start');

setTimeout(() => {
  console.log('Timeout 1');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise 1');
});

console.log('End');`,

    complex: `console.log('1');

setTimeout(() => {
  console.log('2');
}, 0);

Promise.resolve().then(() => {
  console.log('3');
}).then(() => {
  console.log('4');
});

setTimeout(() => {
  console.log('5');
}, 0);

console.log('6');`,

    nested: `console.log('Start');

setTimeout(() => {
  console.log('Timeout 1');
  Promise.resolve().then(() => {
    console.log('Promise in Timeout');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('Promise 1');
  setTimeout(() => {
    console.log('Timeout in Promise');
  }, 0);
});

console.log('End');`,

    intervals: `console.log('Start');

let count = 0;
const interval = setInterval(() => {
  console.log('Interval: ' + count);
  count++;
  if (count >= 3) {
    clearInterval(interval);
  }
}, 100);

setTimeout(() => {
  console.log('Timeout');
}, 50);

console.log('End');`
  }

  const executionSteps = () => {
    const lines = code().split('\n').filter(line => line.trim())
    const steps = []
    
    // Simulate execution steps
    steps.push({
      type: 'sync',
      line: 0,
      action: 'push',
      stack: ['console.log("Start")'],
      output: 'Start'
    })
    
    steps.push({
      type: 'sync',
      line: 0,
      action: 'pop',
      stack: []
    })

    steps.push({
      type: 'async',
      line: 2,
      action: 'webapi',
      stack: ['setTimeout'],
      webapi: { type: 'setTimeout', callback: 'console.log("Timeout 1")', delay: 0 }
    })

    steps.push({
      type: 'sync',
      line: 2,
      action: 'pop',
      stack: []
    })

    steps.push({
      type: 'async',
      line: 6,
      action: 'microtask',
      stack: ['Promise.resolve().then'],
      microtask: 'console.log("Promise 1")'
    })

    steps.push({
      type: 'sync',
      line: 6,
      action: 'pop',
      stack: []
    })

    steps.push({
      type: 'sync',
      line: 9,
      action: 'push',
      stack: ['console.log("End")'],
      output: 'End'
    })

    steps.push({
      type: 'sync',
      line: 9,
      action: 'pop',
      stack: []
    })

    steps.push({
      type: 'eventloop',
      action: 'microtask_check',
      microtaskExecution: 'console.log("Promise 1")',
      output: 'Promise 1'
    })

    steps.push({
      type: 'eventloop',
      action: 'callback_check',
      callbackExecution: 'console.log("Timeout 1")',
      output: 'Timeout 1'
    })

    return steps
  }

  const executeStep = () => {
    const steps = executionSteps()
    if (stepIndex >= steps.length) {
      setIsRunning(false)
      return
    }

    const step = steps[stepIndex]
    setCurrentLine(step.line || -1)
    setIsEventLoopActive(step.type === 'eventloop')

    switch (step.action) {
      case 'push':
        setCallStack([...callStack(), ...step.stack])
        if (step.output) {
          setOutput([...output(), step.output])
        }
        break
      
      case 'pop':
        setCallStack(step.stack)
        break
      
      case 'webapi':
        setWebApis([...webApis(), step.webapi])
        setTimeout(() => {
          setWebApis(webApis().filter(api => api !== step.webapi))
          setCallbackQueue([...callbackQueue(), step.webapi.callback])
        }, step.webapi.delay + 500)
        break
      
      case 'microtask':
        setMicrotaskQueue([...microtaskQueue(), step.microtask])
        break
      
      case 'microtask_check':
        if (microtaskQueue().length > 0) {
          const task = microtaskQueue()[0]
          setMicrotaskQueue(microtaskQueue().slice(1))
          setCallStack([task])
          setTimeout(() => {
            setCallStack([])
            if (step.output) {
              setOutput([...output(), step.output])
            }
          }, 300)
        }
        break
      
      case 'callback_check':
        if (callbackQueue().length > 0) {
          const callback = callbackQueue()[0]
          setCallbackQueue(callbackQueue().slice(1))
          setCallStack([callback])
          setTimeout(() => {
            setCallStack([])
            if (step.output) {
              setOutput([...output(), step.output])
            }
          }, 300)
        }
        break
    }

    stepIndex++
  }

  const startExecution = () => {
    if (isRunning()) return
    
    reset()
    setIsRunning(true)
    stepIndex = 0
    
    executionTimer = setInterval(() => {
      executeStep()
    }, speed())
  }

  const stopExecution = () => {
    setIsRunning(false)
    if (executionTimer) {
      clearInterval(executionTimer)
      executionTimer = null
    }
  }

  const stepExecution = () => {
    if (isRunning()) return
    executeStep()
  }

  const reset = () => {
    stopExecution()
    setCallStack([])
    setCallbackQueue([])
    setWebApis([])
    setMicrotaskQueue([])
    setOutput([])
    setCurrentLine(-1)
    setIsEventLoopActive(false)
    stepIndex = 0
  }

  const loadExample = (exampleKey) => {
    reset()
    setCode(predefinedExamples[exampleKey])
  }

  onCleanup(() => {
    if (executionTimer) {
      clearInterval(executionTimer)
    }
  })

  const codeLines = () => code().split('\n')

  return (
    <div class="card">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">⚡ JavaScript Event Loop Visualizer</h2>
      
      {/* Controls */}
      <div class="form-group">
        <div class="flex flex-wrap gap-3 mb-4">
          <button
            onClick={startExecution}
            disabled={isRunning()}
            class="btn-primary"
          >
            {isRunning() ? '▶️ Running...' : '▶️ Start'}
          </button>
          <button onClick={stopExecution} class="btn-secondary">
            ⏸️ Stop
          </button>
          <button onClick={stepExecution} disabled={isRunning()} class="btn-secondary">
            ⏭️ Step
          </button>
          <button onClick={reset} class="btn-secondary">
            🔄 Reset
          </button>
        </div>

        {/* Speed Control */}
        <div class="flex items-center gap-3 mb-4">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Speed:</label>
          <input
            type="range"
            min="200"
            max="2000"
            step="200"
            value={speed()}
            onInput={(e) => setSpeed(parseInt(e.target.value))}
            class="flex-1 max-w-xs"
          />
          <span class="text-sm text-gray-600 dark:text-gray-400">{speed()}ms</span>
        </div>

        {/* Example Buttons */}
        <div class="flex flex-wrap gap-2">
          <button onClick={() => loadExample('basic')} class="btn-secondary text-xs">
            📝 Basic Example
          </button>
          <button onClick={() => loadExample('complex')} class="btn-secondary text-xs">
            🔧 Complex Example
          </button>
          <button onClick={() => loadExample('nested')} class="btn-secondary text-xs">
            🪆 Nested Example
          </button>
          <button onClick={() => loadExample('intervals')} class="btn-secondary text-xs">
            ⏰ Intervals Example
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div class="form-group">
        <label class="form-label">📝 JavaScript Code</label>
        <div class="relative">
          <textarea
            value={code()}
            onInput={(e) => setCode(e.target.value)}
            class="textarea-enhanced font-mono text-sm"
            rows="10"
            placeholder="Enter your JavaScript code here..."
          />
          {/* Line Highlight */}
          <div class="absolute top-0 left-0 pointer-events-none font-mono text-sm leading-relaxed p-4">
            {codeLines().map((line, index) => (
              <div
                key={index}
                class={`${
                  currentLine() === index
                    ? 'bg-yellow-200 dark:bg-yellow-800/50 rounded px-1'
                    : ''
                }`}
                style={{ height: '1.5rem' }}
              >
                {currentLine() === index ? '→' : ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div class="space-y-4">
          {/* Call Stack */}
          <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
              📚 Call Stack
              {callStack().length > 0 && (
                <span class="ml-2 text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">
                  {callStack().length}
                </span>
              )}
            </h3>
            <div class="space-y-2 min-h-[120px]">
              {callStack().length === 0 ? (
                <div class="text-blue-600 dark:text-blue-400 text-sm italic">Empty</div>
              ) : (
                callStack().slice().reverse().map((item, index) => (
                  <div
                    key={index}
                    class="bg-blue-100 dark:bg-blue-800 border border-blue-300 dark:border-blue-600 rounded p-2 font-mono text-sm animate-slideIn"
                  >
                    {item}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Web APIs */}
          <div class="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center">
              🌐 Web APIs
              {webApis().length > 0 && (
                <span class="ml-2 text-xs bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded">
                  {webApis().length}
                </span>
              )}
            </h3>
            <div class="space-y-2 min-h-[80px]">
              {webApis().length === 0 ? (
                <div class="text-purple-600 dark:text-purple-400 text-sm italic">No active APIs</div>
              ) : (
                webApis().map((api, index) => (
                  <div
                    key={index}
                    class="bg-purple-100 dark:bg-purple-800 border border-purple-300 dark:border-purple-600 rounded p-2 font-mono text-sm animate-pulse"
                  >
                    {api.type} ({api.delay}ms)
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div class="space-y-4">
          {/* Microtask Queue */}
          <div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center">
              ⚡ Microtask Queue (Promises)
              {microtaskQueue().length > 0 && (
                <span class="ml-2 text-xs bg-green-200 dark:bg-green-800 px-2 py-1 rounded">
                  {microtaskQueue().length}
                </span>
              )}
            </h3>
            <div class="space-y-2 min-h-[80px]">
              {microtaskQueue().length === 0 ? (
                <div class="text-green-600 dark:text-green-400 text-sm italic">Empty</div>
              ) : (
                microtaskQueue().map((task, index) => (
                  <div
                    key={index}
                    class="bg-green-100 dark:bg-green-800 border border-green-300 dark:border-green-600 rounded p-2 font-mono text-sm"
                  >
                    {task}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Callback Queue */}
          <div class="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-3 flex items-center">
              📋 Callback Queue (Macrotasks)
              {callbackQueue().length > 0 && (
                <span class="ml-2 text-xs bg-orange-200 dark:bg-orange-800 px-2 py-1 rounded">
                  {callbackQueue().length}
                </span>
              )}
            </h3>
            <div class="space-y-2 min-h-[80px]">
              {callbackQueue().length === 0 ? (
                <div class="text-orange-600 dark:text-orange-400 text-sm italic">Empty</div>
              ) : (
                callbackQueue().map((callback, index) => (
                  <div
                    key={index}
                    class="bg-orange-100 dark:bg-orange-800 border border-orange-300 dark:border-orange-600 rounded p-2 font-mono text-sm"
                  >
                    {callback}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Loop Indicator */}
      <div class={`mt-6 p-4 rounded-lg border-2 transition-all duration-300 ${
        isEventLoopActive()
          ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600'
          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
      }`}>
        <div class="flex items-center justify-center">
          <div class={`w-4 h-4 rounded-full mr-3 transition-all duration-300 ${
            isEventLoopActive()
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-gray-400'
          }`}></div>
          <span class={`font-semibold ${
            isEventLoopActive()
              ? 'text-yellow-800 dark:text-yellow-300'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            Event Loop {isEventLoopActive() ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Console Output */}
      <div class="form-group">
        <h3 class="section-header">📺 Console Output</h3>
        <div class="bg-black text-green-400 font-mono text-sm p-4 rounded-lg min-h-[120px] max-h-60 overflow-y-auto">
          {output().length === 0 ? (
            <div class="text-gray-500">Console output will appear here...</div>
          ) : (
            output().map((line, index) => (
              <div key={index} class="mb-1">
                <span class="text-gray-500">{'>'}</span> {line}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">📖 How it Works:</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div>• <strong>Call Stack:</strong> Synchronous code execution</div>
          <div>• <strong>Web APIs:</strong> Browser APIs (setTimeout, fetch, etc.)</div>
          <div>• <strong>Microtask Queue:</strong> Promises, queueMicrotask</div>
          <div>• <strong>Callback Queue:</strong> setTimeout, setInterval callbacks</div>
          <div class="md:col-span-2">• <strong>Event Loop:</strong> Moves tasks from queues to call stack when it's empty (microtasks have priority)</div>
        </div>
      </div>
    </div>
  )
}

export default EventLoopVisualizer