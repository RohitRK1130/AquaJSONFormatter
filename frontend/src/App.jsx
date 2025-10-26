import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from './components/Logo'

export default function App() {
  const [raw, setRaw] = useState('')
  const [indent, setIndent] = useState(2) // 0 => minify
  const [autoFix, setAutoFix] = useState(true)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // NEW UI states
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wrapOutput, setWrapOutput] = useState(true) // true => wrap (pre-wrap); false => nowrap (pre + scroll)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  // close fullscreen on Escape
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
  }, [isFullscreen])

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  async function handleFormat(e) {
    e?.preventDefault()
    setError('')
    setResult('')
    setLoading(true)
    try {
      const res = await fetch('/api/format/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw, indent, auto_fix: autoFix })
      })
      const data = await res.json()
      if (res.ok) setResult(data.formatted)
      else setError(data.error || data.details || JSON.stringify(data))
    } catch (err) {
      // fallback: client-side formatting with conservative auto-fix
      try {
        const fixed = autoFix ? autoFixHeuristic(raw) : raw
        const parsed = JSON.parse(fixed)
        setResult(indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent))
      } catch (parseErr) {
        setError(parseErr.message || String(parseErr) || 'Invalid JSON')
      }
    } finally {
      setLoading(false)
    }
  }

  function autoFixHeuristic(text) {
    let s = text.replace(/`/g, '"')
    s = s.replace(/'([^']*)'/g, function(m, g1) {
      return '"' + g1.replace(/"/g, '\\"') + '"'
    })
    s = s.replace(/,\s*(\}|])/g, '$1')
    s = s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
    return s
  }

  async function copyToClipboard() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
    } catch (e) {
      console.warn('Copy failed', e)
    }
  }

  function replaceInput() {
    if (result) setRaw(result)
  }

  function clearAll() {
    setRaw('')
    setResult('')
    setError('')
  }

  function loadSample() {
    setRaw("{ name: 'Rohit', age: 30, trailing: [1,2,], }")
  }

  const indentOptions = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '4', value: 4 },
    { label: 'Minify', value: 0 },
  ]

  return (
    <div className="page">
      <div className="ocean-bg" aria-hidden="true">
        <div className="wave wave1" />
        <div className="wave wave2" />
      </div>

      <header className="topbar">
        <div className="brand">
          <Logo size={44} />
          <div className="brand-text">
            <div className="title">AquaJSON</div>
            <div className="subtitle">Formatter & Validator</div>
          </div>
        </div>

        {/* <nav className="nav-actions">
          <button className="ghost" onClick={() => alert('Docs coming soon')}>Docs</button>
          <button className="ghost" onClick={() => alert('About coming soon')}>About</button>
          <button className="btn small" onClick={() => alert('Pro feature coming soon')}>Upgrade</button>
        </nav> */}
      </header>

      <main className="container">
        <motion.div
          className="card"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45 }}
        >
          <form className="controls" onSubmit={handleFormat}>
            <div className="left">
              <div className="segmented" role="tablist" aria-label="Indent options">
                {indentOptions.map(opt => (
                  <motion.button
                    key={opt.label}
                    type="button"
                    className={`seg-btn ${indent === opt.value ? 'active' : ''}`}
                    onClick={() => setIndent(opt.value)}
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ y: -2 }}
                    aria-pressed={indent === opt.value}
                  >
                    {opt.label}
                    {indent === opt.value && (
                      <motion.span
                        layoutId="segIndicator"
                        className="seg-indicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.18 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="toggle-row">
                <div className="toggle-label">Auto-fix</div>
                <div className="toggle-switch" role="switch" aria-checked={!!autoFix} onClick={() => setAutoFix(v => !v)}>
                  <motion.div
                    className="toggle-track"
                    animate={{ background: autoFix ? 'linear-gradient(90deg,#06b6d4,#0ea5a4)' : 'rgba(255,255,255,0.06)' }}
                    transition={{ duration: 0.25 }}
                  />
                  <motion.div
                    className="toggle-thumb"
                    layout
                    initial={false}
                    animate={{ x: autoFix ? 22 : 0 }}
                    transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                    whileTap={{ scale: 0.95 }}
                  />
                </div>
              </div>
            </div>

            <div className="actions">
              <motion.button
                className="btn primary"
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -2 }}
              >
                {loading ? 'Formatting...' : 'Format'}
              </motion.button>

              <motion.button className="btn" type="button" onClick={loadSample} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                Sample
              </motion.button>

              <motion.button className="btn ghost" type="button" onClick={clearAll} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                Clear
              </motion.button>
            </div>
          </form>

          <div className="editor-row">
            <div className="pane input-pane">
              <div className="pane-header">
                <strong>Raw input</strong>
                <span className="muted">Paste your data here</span>
              </div>
              <textarea
                className="editor"
                value={raw}
                onChange={e => setRaw(e.target.value)}
                placeholder='e.g. { "name": "alice", "age": 30 }'
                aria-label="Raw JSON input"
              />
            </div>

            <div className="pane output-pane">
              <div className="pane-header">
                <strong>Output</strong>
                <div className="toolbar">
                  <motion.button
                    onClick={copyToClipboard}
                    disabled={!result}
                    className="copy-btn"
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ y: -2 }}
                  >
                    Copy
                  </motion.button>

                  <motion.button
                    onClick={replaceInput}
                    disabled={!result}
                    className="replace-btn"
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ y: -2 }}
                  >
                    Replace
                  </motion.button>

                  {/* NEW: Wrap toggle */}
                  <motion.button
                    onClick={() => setWrapOutput(w => !w)}
                    className={`wrap-toggle ${wrapOutput ? 'on' : 'off'}`}
                    whileTap={{ scale: 0.96 }}
                    aria-pressed={wrapOutput}
                    title={wrapOutput ? 'Wrap enabled' : 'Wrap disabled'}
                  >
                    {wrapOutput ? 'Wrap: ON' : 'Wrap: OFF'}
                  </motion.button>

                  {/* NEW: Fullscreen button */}
                  <motion.button
                    onClick={() => setIsFullscreen(true)}
                    className="copy-btn"
                    whileTap={{ scale: 0.96 }}
                    title="Open fullscreen"
                    aria-label="Open output in fullscreen"
                  >
                    Fullscreen
                  </motion.button>
                </div>
              </div>

              {/* output content */}
              {error ? (
                <pre className={`error ${wrapOutput ? 'wrap' : 'nowrap'}`}>{error}</pre>
              ) : result ? (
                <pre className={`result ${wrapOutput ? 'wrap' : 'nowrap'}`}>{result}</pre>
              ) : (
                <div className="empty">No output yet — click <strong>Format</strong>.</div>
              )}
            </div>
          </div>

          <div className="footnote muted">
            Auto-fix uses heuristics. For production prefer a tolerant parser/server.
          </div>
        </motion.div>
      </main>

      {/* small toast for copy feedback */}
      <AnimatePresence>
        {copied && (
          <motion.div
            className="toast"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            Copied!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className="fullscreen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsFullscreen(false)}
          >
            <motion.div
              className="fullscreen-card"
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="fs-header">
                <div className="fs-title">Output — Fullscreen</div>
                <div className="fs-actions">
                  <button className="btn ghost" onClick={() => setIsFullscreen(false)}>Close</button>
                  <button className="btn primary" onClick={() => { copyToClipboard(); setIsFullscreen(false); }}>Copy & Close</button>
                </div>
              </div>

              <div className="fs-body">
                {error ? (
                  <pre className={`error ${wrapOutput ? 'wrap' : 'nowrap'}`}>{error}</pre>
                ) : result ? (
                  <pre className={`result ${wrapOutput ? 'wrap' : 'nowrap'}`}>{result}</pre>
                ) : (
                  <div className="empty">No output yet — click <strong>Format</strong>.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
