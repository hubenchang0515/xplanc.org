import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DeckBackground } from './components/DeckBackground'
import { DeckHeader } from './components/DeckHeader'
import { PortalCard } from './components/PortalCard'
import { Reticle } from './components/Reticle'
import { Telemetry } from './components/Telemetry'
import { ToastStack } from './components/ToastStack'
import type { ToastMessage } from './components/ToastStack'
import { getPortal } from './deck'
import { useDeckAnimation } from './hooks/useDeckAnimation'
import { useDeckPages } from './hooks/useDeckPages'
import './App.css'

function App() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ToastMessage[]>([])
  const nextToastId = useRef(0)
  const portalScreen = useRef<HTMLElement>(null)

  const warpEngaged = Boolean(getPortal(hoveredId))
  const resetHover = useCallback(() => setHoveredId(null), [])
  const animation = useDeckAnimation(hoveredId, resetHover)
  const pages = useDeckPages(animation.portals.length)
  const isHome = pages.page === 0
  const canGoDown = pages.page < pages.lastPage
  const portalGroups = Array.from({ length: pages.lastPage }, (_, index) =>
    animation.portals.slice(index * pages.pageSize, (index + 1) * pages.pageSize),
  )

  useEffect(() => {
    resetHover()
  }, [pages.page, pages.columns, resetHover])

  useLayoutEffect(() => {
    animation.portals.forEach(({ ref }) => ref.current?.resize())
  }, [animation.portals, pages.columns])

  const showToast = useCallback((text: string) => {
    const message = { id: nextToastId.current++, text }
    setMessages((current) => [...current, message])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id))
  }, [])

  function handleHover(id: string, hovered: boolean) {
    setHoveredId((current) => {
      if (hovered) return id
      return current === id ? null : current
    })
  }

  function openPortals() {
    pages.setPage(1)
    requestAnimationFrame(() => portalScreen.current?.focus({ preventScroll: true }))
  }

  return (
    <>
      <DeckBackground canvasRef={animation.background} />
      <Reticle ref={animation.reticle} />

      <div className="deck-shell">
        <DeckHeader warpEngaged={warpEngaged} onHome={() => pages.setPage(0)} />

        <main ref={animation.viewport} className="command-main">
          <div className="deck-track" data-view={isHome ? 'home' : 'portals'}>
            <section className="hero-block" inert={!isHome}>
              <div className="hero-title-wrap">
                <h1 className="hero-title">XPLANC</h1>
              </div>
              <div className="hero-scanline" aria-hidden="true" />
              <p className="hero-tagline">DIGITAL COMMAND DECK · 探索 · 记录 · 创造</p>
              {isHome && canGoDown && (
                <button
                  type="button"
                  className="chevron-button scroll-hint"
                  aria-label="向下滚动查看入口"
                  onClick={openPortals}
                />
              )}
            </section>

            <section
              ref={portalScreen}
              id="portal-entries"
              className="portal-screen"
              aria-label="XPLANC Portal Entries"
              inert={isHome}
              tabIndex={-1}
            >
              <div className="portal-area">
                <button
                  type="button"
                  className="chevron-button chevron-button-up"
                  aria-label="上一屏"
                  onClick={() => pages.turnPage(-1)}
                />
                <div className="portal-viewport">
                  <div
                    className="portal-page-track"
                    style={{ transform: `translateY(-${Math.max(0, pages.page - 1) * 100}%)` }}
                  >
                    {portalGroups.map((group, index) => (
                      <div className="portal-page" key={group[0].id} inert={pages.page !== index + 1}>
                        <div
                          className="portals-grid"
                          data-columns={pages.columns}
                          style={{ gridTemplateColumns: `repeat(${pages.columns}, minmax(0, 1fr))` }}
                        >
                          {group.map(({ id, portal, ref }) => (
                            <PortalCard
                              key={id}
                              id={id}
                              ref={ref}
                              portal={portal}
                              onHover={handleHover}
                              onNotify={showToast}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="chevron-button"
                  aria-label="下一屏"
                  aria-hidden={!canGoDown || undefined}
                  onClick={() => pages.turnPage(1)}
                  disabled={!canGoDown}
                />
              </div>
              <Telemetry ref={animation.telemetry} warpEngaged={warpEngaged} />
            </section>
          </div>
        </main>
      </div>

      <ToastStack messages={messages} onDismiss={dismissToast} />
    </>
  )
}

export default App
