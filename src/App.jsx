import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { createGame } from './game/engine.js'
import { MUTE_KEY } from './game/config.js'

function readFlag(key) {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export default function App() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const mutedRef = useRef(readFlag(MUTE_KEY))

  const [phase, setPhase] = useState('ready')
  const [score, setScore] = useState(0)
  const [coinsRun, setCoinsRun] = useState(0)
  const [best, setBest] = useState(0)
  const [coinsTotal, setCoinsTotal] = useState(0)
  const [newBest, setNewBest] = useState(false)
  const [muted, setMuted] = useState(() => readFlag(MUTE_KEY))

  /* ─── actions (stable, safe to use in effect deps) ─── */
  const press = useCallback(() => gameRef.current?.press(), [])
  const togglePause = useCallback(() => gameRef.current?.togglePause(), [])

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    gameRef.current?.setMuted(next)
    try {
      localStorage.setItem(MUTE_KEY, next ? '1' : '0')
    } catch {
      /* storage unavailable — ignore */
    }
  }, [])

  /* ─── boot the engine once ─── */
  useEffect(() => {
    const game = createGame({
      canvas: canvasRef.current,
      onState: (s) => {
        setPhase(s.phase)
        setScore(s.score)
        setCoinsRun(s.coinsRun)
        setBest(s.best)
        setCoinsTotal(s.coinsTotal)
        setNewBest(s.newBest)
      },
    })
    gameRef.current = game
    game.setMuted(mutedRef.current)
    game.startLoop()

    // keep the canvas backing store in sync with its CSS size
    let ro = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => game.resize())
      ro.observe(canvasRef.current)
    }
    window.addEventListener('resize', game.resize)

    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', game.resize)
      game.destroy()
      gameRef.current = null
    }
  }, [])

  /* ─── auto-pause when the tab / window goes away ─── */
  useEffect(() => {
    const onHide = () => document.hidden && gameRef.current?.pause()
    const onBlur = () => gameRef.current?.pause()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  /* ─── keyboard ─── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.code) {
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
        case 'Enter':
          e.preventDefault()
          if (!e.repeat) press()
          break
        case 'KeyP':
        case 'Escape':
          e.preventDefault()
          if (!e.repeat) togglePause()
          break
        case 'KeyM':
          e.preventDefault()
          if (!e.repeat) toggleMute()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press, togglePause, toggleMute])

  /* ─── pointer / touch ─── */
  const onPointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return
      if (e.target.closest('button')) return
      e.preventDefault()
      press()
    },
    [press],
  )

  const over = phase === 'over'
  const paused = phase === 'paused'

  return (
    <div className="game-wrapper crt">
      <div className="stage" onPointerDown={onPointerDown}>
        <canvas ref={canvasRef} className="screen" width={480} height={700} />

        {/* ── HUD ── */}
        <div className={`hud ${phase === 'ready' ? 'hud-off' : ''}`}>
          <div className={`score ${score > 0 ? 'score-pop' : ''}`} key={score}>
            {score}
          </div>
          <div className="hud-row">
            <span className="hud-chip">BEST {best}</span>
            <span className="hud-chip">
              <i className="coin-dot" />
              {coinsRun}
            </span>
          </div>
        </div>

        <div className="top-right">
          <button
            type="button"
            className="icon-btn"
            onClick={togglePause}
            aria-label={paused ? 'Resume' : 'Pause'}
            title={paused ? 'Resume (P)' : 'Pause (P)'}
          >
            {paused ? '▶' : '❙❙'}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* ── READY ── */}
        {phase === 'ready' && (
          <div className="overlay">
            <h1 className="title">FLAPPY BAT</h1>
            <p className="subtitle">
              Press <strong>SPACE</strong> · <strong>↑</strong> · <strong>TAP</strong> to flap
            </p>
            <div className="stats">
              <div className="stat">
                <span className="stat-label">BEST</span>
                <span className="stat-value">{best}</span>
              </div>
              <div className="stat">
                <span className="stat-label">COINS</span>
                <span className="stat-value">{coinsTotal}</span>
              </div>
            </div>
            <button type="button" className="btn" onClick={press}>
              PLAY
            </button>
            <p className="hint">P pause · M mute</p>
          </div>
        )}

        {/* ── PAUSED ── */}
        {paused && (
          <div className="overlay">
            <h2 className="go-title pause-title">PAUSED</h2>
            <p className="final-score">SCORE {score}</p>
            <button type="button" className="btn" onClick={togglePause}>
              RESUME
            </button>
            <p className="hint">Press P or Esc</p>
          </div>
        )}

        {/* ── GAME OVER ── */}
        {over && (
          <div className="overlay">
            <h2 className="go-title">GAME OVER</h2>
            {newBest && <p className="new-best">NEW BEST!</p>}
            <p className="final-score">SCORE {score}</p>
            <p className="best-score">
              BEST {best} · {coinsRun} COINS
            </p>
            <button type="button" className="btn" onClick={press}>
              PLAY AGAIN
            </button>
            <p className="hint">Press SPACE or tap to restart</p>
          </div>
        )}
      </div>

      <p className="instructions">SPACE · ↑ · TAP to flap · P pause · M mute</p>
    </div>
  )
}
