import dailyIcon from './assets/portals/daily.svg'
import ideaIcon from './assets/portals/idea.svg'
import moeToolsIcon from './assets/portals/moe-tools.svg'
import primersIcon from './assets/portals/primers.svg'
import qtThemeIcon from './assets/portals/qt-theme.svg'
import shiftIcon from './assets/portals/shift.svg'

export type PortalVisual = 'lattice' | 'waveform' | 'orbit'
export type Rgb = readonly [number, number, number]

function hexToRgb(hex: string): Rgb {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]
}

function createPalette(hex: string, secondaryHex: string) {
  return { hex, rgb: hexToRgb(hex), rgb2: hexToRgb(secondaryHex) }
}

function createAmbientPalette(accent: string, secondary: string, background: string, text: string, dimText: string) {
  return {
    rgb: hexToRgb(accent),
    rgb2: hexToRgb(secondary),
    background: hexToRgb(background),
    text: hexToRgb(text),
    dimText: hexToRgb(dimText),
  }
}

export const AMBIENT_PALETTES = {
  cyber: createAmbientPalette('#00f0ff', '#38bdf8', '#03060f', '#f4f9ff', '#94aac8'),
  void: createAmbientPalette('#c850ff', '#ff2a85', '#070312', '#faf5ff', '#b49bc9'),
  solar: createAmbientPalette('#ffaa00', '#ff3b30', '#0d0502', '#fff9f0', '#c7a98b'),
  matrix: createAmbientPalette('#00ff9d', '#00d68f', '#020c08', '#ecfdf5', '#85bca6'),
}

export const DEFAULT_PALETTE = AMBIENT_PALETTES.cyber

export interface Portal {
  name: string
  tag: string
  description: string
  url: string
  iconUrl: string
  animation: PortalVisual
  sector: string
  borderAngle: number
  hex: string
  rgb: Rgb
  rgb2: Rgb
}

export const PORTALS: Record<string, Portal> = {
  primers: {
    name: 'PRIMERS',
    tag: 'KNOWLEDGE ARCHITECTURE',
    description: '深度入门指南、知识架构与结构化技术图谱',
    url: 'https://primers.xplanc.org/',
    iconUrl: primersIcon,
    animation: 'lattice',
    sector: 'SECTOR 01 · DEEP DIVES',
    borderAngle: 0,
    ...createPalette('#66CCFF', '#39c5bb'),
  },
  daily: {
    name: 'DAILY',
    tag: 'DAILY LOGS & RADAR',
    description: '每日技术日志、前沿雷达与思考成长轨迹',
    url: 'https://daily.xplanc.org/',
    iconUrl: dailyIcon,
    animation: 'waveform',
    sector: 'SECTOR 02 · TECH RADAR',
    borderAngle: 120,
    // 图标的红色稍作提亮，保证深色背景上的小字号可读。
    ...createPalette('#f14f4b', '#fbd000'),
  },
  idea: {
    name: 'IDEA',
    tag: 'SPARKS & PROTOTYPES',
    description: '灵感星云、实验原型与创意孵化实验室',
    url: 'https://idea.xplanc.org/',
    iconUrl: ideaIcon,
    animation: 'orbit',
    sector: 'SECTOR 03 · INCUBATOR',
    borderAngle: 240,
    ...createPalette('#56f0c2', '#94fdff'),
  },
  'moe-tools': {
    name: 'MOE TOOLS',
    tag: 'ONLINE TOOLKIT',
    description: '萌萌工具箱，集成多种在线实用工具',
    url: 'https://hubenchang0515.github.io/moe-tools/',
    iconUrl: moeToolsIcon,
    animation: 'orbit',
    sector: 'SECTOR 04 · TOOLKIT',
    borderAngle: 60,
    ...createPalette('#ec7bb0', '#b198b6'),
  },
  'qt-theme': {
    name: 'QtTheme',
    tag: 'QT STYLESHEETS',
    description: '在线预览 Qt 样式，并导出纯 QSS 主题资源包',
    url: 'https://hubenchang0515.github.io/QtTheme/',
    iconUrl: qtThemeIcon,
    animation: 'lattice',
    sector: 'SECTOR 05 · QT THEMES',
    borderAngle: 180,
    ...createPalette('#41cd52', '#c9ffd1'),
  },
  shift: {
    name: 'SHIFT',
    tag: 'WEBASSEMBLY RUNTIME',
    description: '在浏览器中编写并运行 Python、Lua、Ruby 等语言',
    url: 'https://shift.js.org/',
    iconUrl: shiftIcon,
    animation: 'waveform',
    sector: 'SECTOR 06 · CODE RUNNER',
    borderAngle: 300,
    ...createPalette('#0ba4e0', '#d6d6d6'),
  },
}

export function getPortal(id: string | null): Portal | null {
  return id !== null && Object.prototype.hasOwnProperty.call(PORTALS, id) ? PORTALS[id] : null
}
