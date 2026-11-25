import { useImperativeHandle, useRef } from 'react'
import type { CSSProperties, MouseEvent, Ref } from 'react'
import { createPortalAnimation } from '../animation/portalVisuals'
import type { PortalAnimation } from '../animation/portalVisuals'
import type { Portal } from '../deck'
import { CopyButton } from './CopyButton'
import { PortalEmblem } from './PortalEmblem'

interface PortalCardProps {
  ref: Ref<PortalAnimation>
  id: string
  portal: Portal
  onHover: (id: string, hovered: boolean) => void
  onNotify: (message: string) => void
}

export function PortalCard({ ref, id, portal, onHover, onNotify }: PortalCardProps) {
  const card = useRef<HTMLAnchorElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useImperativeHandle(ref, () => createPortalAnimation(card.current!, canvas.current!, portal), [portal])

  function handleMove(event: MouseEvent<HTMLAnchorElement>) {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    element.style.setProperty('--mx', `${x}px`)
    element.style.setProperty('--my', `${y}px`)

    if (window.matchMedia('(pointer: coarse)').matches) return

    const cx = rect.width * 0.5
    const cy = rect.height * 0.5
    const rotX = ((y - cy) / cy) * -7.5
    const rotY = ((x - cx) / cx) * 7.5
    element.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-6px)`
  }

  function handleLeave(event: MouseEvent<HTMLAnchorElement>) {
    onHover(id, false)
    event.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)'
  }

  return (
    <a
      ref={card}
      id={`portal-${id}`}
      href={portal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="portal-card"
      style={{
        '--card-rgb': portal.rgb.join(', '),
        '--card-color-2': `rgb(${portal.rgb2.join(', ')})`,
      } as CSSProperties}
      data-portal={id}
      data-interactive
      onMouseEnter={() => onHover(id, true)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="portal-card-inner">
        <canvas ref={canvas} id={`mini-canvas-${id}`} className="card-bg-canvas" aria-hidden="true" />
        <div className="card-scrim" aria-hidden="true" />
        <div className="card-sheen" aria-hidden="true" />
        <div className="card-corners" aria-hidden="true" />

        <div className="card-content">
          <div className="card-top-row">
            <PortalEmblem iconUrl={portal.iconUrl} />
            <span className="card-tag-pill">
              <span className="card-tag-dot" />
              {portal.tag}
            </span>
          </div>

          <div className="card-identity">
            <h2 className="card-title">{portal.name}</h2>
            <p className="card-desc">{portal.description}</p>
          </div>

          <div className="card-bottom-group">
            <div className="url-terminal-bar">
              <div className="url-display">
                <span className="url-prefix-icon" aria-hidden="true">↗</span>
                <span className="url-full-text" title={portal.url}>{portal.url}</span>
              </div>
              <CopyButton url={portal.url} name={portal.name} onNotify={onNotify} />
            </div>

            <div className="card-launch-bar">
              <span className="launch-meta">{portal.sector}</span>
              <span className="launch-cta">WARP JUMP ↗</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}
