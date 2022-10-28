import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  debugger
  const [count, setCount] = useState(0)
  const [count1, setCount1] = useState(1)
  const ref = useRef(null)
  useEffect(() => {
    console.log(count)
  }, [count])
  return (
    <div className="App">
      <p>
        Edit <code>src/App.js</code> and save to reload.
      </p>
      <a
        className="App-link"
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn React
      </a>
      <p>number:{count}</p>
      <p>number:{count1}</p>
      <button
        ref={(e) => {
          debugger
          ref.current = e
        }}
        onClick={() => {
          setCount((p) => {
            debugger
            return p + 1
          })
        }}
      >
        sssss
      </button>
      <button
        onClick={() => {
          setCount1((p) => {
            debugger
            return p + 2
          })
        }}
      >
        1111
      </button>
    </div>
  )
}

export default App
