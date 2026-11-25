import { useImperativeHandle, useRef } from 'react'
import type { ReactNode, Ref } from 'react'
import type { FlightState } from '../animation/hyperspace'

export interface TelemetryAnimation {
  render: (now: number, state: FlightState) => void
}

interface TelemetryProps {
  ref: Ref<TelemetryAnimation>
  warpEngaged: boolean
}

function TelemetryItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="telemetry-item">
      <span className="lbl">{label}</span>
      {children}
    </span>
  )
}

function formatAngle(angle: number) {
  const degrees = angle.toFixed(1)
  return `${Number(degrees) >= 0 ? '+' : ''}${degrees}°`
}

export function Telemetry({ ref, warpEngaged }: TelemetryProps) {
  const clockHms = useRef<HTMLSpanElement>(null)
  const clockMs = useRef<HTMLSpanElement>(null)
  const azimuth = useRef<HTMLSpanElement>(null)
  const elevation = useRef<HTMLSpanElement>(null)
  const warp = useRef<HTMLSpanElement>(null)
  const gaugeFill = useRef<HTMLDivElement>(null)
  const fps = useRef<HTMLSpanElement>(null)

  // 每帧更新遥测文本，不让整页随帧重新渲染。
  useImperativeHandle(ref, () => {
    const hmsElement = clockHms.current!
    const msElement = clockMs.current!
    const azimuthElement = azimuth.current!
    const elevationElement = elevation.current!
    const warpElement = warp.current!
    const gaugeElement = gaugeFill.current!
    const fpsElement = fps.current!
    let frames = 0
    let fpsTick: number | undefined

    return {
      render(now, state) {
        const date = new Date()
        hmsElement.textContent = [date.getHours(), date.getMinutes(), date.getSeconds()]
          .map((part) => String(part).padStart(2, '0')).join(':')
        msElement.textContent = String(date.getMilliseconds()).padStart(3, '0')
        azimuthElement.textContent = formatAngle(state.smoothMouseX * 45)
        elevationElement.textContent = formatAngle(-state.smoothMouseY * 30)
        warpElement.textContent = `${(1 + state.warpFactor * 7.5).toFixed(2)}x`
        gaugeElement.style.width = `${(12 + state.warpFactor * 88).toFixed(1)}%`

        fpsTick ??= now
        frames++
        const elapsed = now - fpsTick
        if (elapsed >= 450) {
          fpsElement.textContent = String(Math.min(144, Math.round((frames * 1000) / elapsed)))
          frames = 0
          fpsTick = now
        }
      },
    }
  }, [])

  return (
    <footer className="bottom-hud">
      <div className="telemetry-left">
        <TelemetryItem label="LOCAL">
          <span className="val">
            <span ref={clockHms} id="clock-hms">00:00:00</span>.<span ref={clockMs} id="clock-ms" className="clock-ms">000</span>
          </span>
        </TelemetryItem>
        <TelemetryItem label="AZ">
          <span ref={azimuth} id="tel-az" className="val">+00.0°</span>
        </TelemetryItem>
        <TelemetryItem label="EL">
          <span ref={elevation} id="tel-el" className="val">+00.0°</span>
        </TelemetryItem>
      </div>

      <div className="telemetry-right">
        <div id="velocity-gauge" className={warpEngaged ? 'velocity-gauge warp-engaged' : 'velocity-gauge'}>
          <span className="lbl">WARP VELOCITY</span>
          <div className="gauge-track" aria-hidden="true">
            <div ref={gaugeFill} id="gauge-fill" className="gauge-fill" />
          </div>
          <span ref={warp} id="tel-warp" className="val">1.00x</span>
        </div>

        <TelemetryItem label="FPS">
          <span ref={fps} id="tel-fps" className="val">60</span>
        </TelemetryItem>
      </div>
    </footer>
  )
}
