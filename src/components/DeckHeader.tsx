interface DeckHeaderProps {
  warpEngaged: boolean
  onHome: () => void
}

export function DeckHeader({ warpEngaged, onHome }: DeckHeaderProps) {
  return (
    <header className="top-hud">
      <button type="button" className="brand-node" onClick={onHome} aria-label="返回 XPLANC 首页">
        <span className="node-core-dot" />
        <span className="brand-glitch" data-text="XPLANC">XPLANC</span>
        <span className="brand-suffix">// DECK</span>
      </button>

      <div
        id="live-status-pill"
        className={warpEngaged ? 'live-status-pill warp-engaged' : 'live-status-pill'}
        aria-live="polite"
      >
        <span className="status-beacon" />
        <span id="live-status-text">
          {warpEngaged ? 'WARP ENGAGED' : 'CRUISE STANDBY'}
        </span>
      </div>
    </header>
  )
}
