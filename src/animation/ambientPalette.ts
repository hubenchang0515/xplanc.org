import { AMBIENT_PALETTES } from '../deck'
import type { Rgb } from '../deck'

const palettes = Object.values(AMBIENT_PALETTES)
const holdSeconds = 2
const fadeSeconds = 8
const secondsPerPalette = holdSeconds + fadeSeconds
export type AmbientPalette = typeof AMBIENT_PALETTES.cyber

function blendRgb(start: Rgb, end: Rgb, amount: number): Rgb {
  return [
    start[0] + (end[0] - start[0]) * amount,
    start[1] + (end[1] - start[1]) * amount,
    start[2] + (end[2] - start[2]) * amount,
  ]
}

export function sampleAmbientPalette(elapsed: number): AmbientPalette {
  const slot = elapsed / secondsPerPalette
  const index = Math.floor(slot) % palettes.length
  const current = palettes[index]
  const timeInSlot = elapsed % secondsPerPalette
  if (timeInSlot <= holdSeconds) return current

  const next = palettes[(index + 1) % palettes.length]
  const progress = (timeInSlot - holdSeconds) / fadeSeconds
  const amount = progress * progress * (3 - 2 * progress)

  return {
    rgb: blendRgb(current.rgb, next.rgb, amount),
    rgb2: blendRgb(current.rgb2, next.rgb2, amount),
    background: blendRgb(current.background, next.background, amount),
    text: blendRgb(current.text, next.text, amount),
    dimText: blendRgb(current.dimText, next.dimText, amount),
  }
}

function rgbChannels(rgb: readonly number[]) {
  return rgb.map(Math.round).join(', ')
}

export function paletteCssVariables(ambient: AmbientPalette, live: readonly number[]) {
  return {
    '--accent-rgb': rgbChannels(ambient.rgb),
    '--accent-2-rgb': rgbChannels(ambient.rgb2),
    '--bg-void': `rgb(${rgbChannels(ambient.background)})`,
    '--text-main': `rgb(${rgbChannels(ambient.text)})`,
    '--text-dim': `rgb(${rgbChannels(ambient.dimText)})`,
    '--live-rgb': rgbChannels(live),
  }
}
