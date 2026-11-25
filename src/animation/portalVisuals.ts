import type { Portal, PortalVisual } from '../deck'

export interface PortalAnimation {
  resize: () => void
  render: (dt: number, hovered: boolean) => void
}

interface CanvasPalette {
  primary: string
  secondary: string
}

// 先生成 3D 晶格顶点，再根据顶点距离构建边。
const latticePts: [number, number, number][] = [];
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      if (Math.abs(x) + Math.abs(y) + Math.abs(z) >= 2) {
        latticePts.push([x, y, z]);
      }
    }
  }
}

const latticeEdges: [number, number][] = [];
for (let i = 0; i < latticePts.length; i++) {
  for (let j = i + 1; j < latticePts.length; j++) {
    const pA = latticePts[i];
    const pB = latticePts[j];
    if (!pA || !pB) continue;
    const d = Math.hypot(pA[0] - pB[0], pA[1] - pB[1], pA[2] - pB[2]);
    if (d > 0.1 && d <= 1.05) {
      latticeEdges.push([i, j]);
    }
  }
}

// 轨道等离子星簇
const orbitSparks = Array.from({ length: 34 }, (_, idx) => ({
  angle: (idx / 34) * Math.PI * 2,
  rx: 42 + (idx % 5) * 26,
  ry: 22 + (idx % 4) * 14,
  tilt: (idx % 6) * 0.52,
  speed: (0.62 + (idx % 7) * 0.2) * (idx % 2 === 0 ? 1 : -1),
  size: 1.5 + (idx % 3) * 0.85,
  useSecondary: idx % 2 === 0,
}));

function safeModIndex(n: number, len: number) {
  if (!Number.isFinite(n) || len <= 0) return 0;
  const m = Math.floor(n) % len;
  return m < 0 ? m + len : m;
}

function drawLattice(
  ctx: CanvasRenderingContext2D, w: number, h: number, time: number, speed: number,
  { primary, secondary }: CanvasPalette,
) {
  const ay = time * 0.55;
  const ax = time * 0.34;
  const cx = w * 0.7;
  const cy = h * 0.38;
  const scaleBase = Math.min(w, h) * 0.33;

  const proj = new Array<{ x: number; y: number; z: number; persp: number }>(latticePts.length);
  for (let i = 0; i < latticePts.length; i++) {
    const v = latticePts[i];
    if (!v) continue;
    const y1 = v[1] * Math.cos(ax) - v[2] * Math.sin(ax);
    const z1 = v[1] * Math.sin(ax) + v[2] * Math.cos(ax);
    const x2 = v[0] * Math.cos(ay) + z1 * Math.sin(ay);
    const z2 = -v[0] * Math.sin(ay) + z1 * Math.cos(ay);
    const persp = 4.2 / Math.max(0.5, 4.2 + z2);
    proj[i] = {
      x: cx + x2 * scaleBase * persp,
      y: cy + y1 * scaleBase * persp,
      z: z2,
      persp,
    };
  }

  // 1. 绘制 3D 神经晶格边（严格验证边对象、索引范围与投影点）
  for (let i = 0; i < latticeEdges.length; i++) {
    const edge = latticeEdges[i];
    if (!edge) continue;
    const iA = edge[0];
    const iB = edge[1];
    if (iA < 0 || iA >= proj.length || iB < 0 || iB >= proj.length) continue;
    const p1 = proj[iA];
    const p2 = proj[iB];
    if (!p1 || !p2) continue;

    const alpha = Math.max(0.16, 0.62 - (p1.z + p2.z) * 0.14);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = `rgba(${i % 3 === 0 ? secondary : primary}, ${alpha})`;
    ctx.lineWidth = 1.05 + (speed - 1) * 0.25;
    ctx.stroke();
  }

  // 2. 绘制沿晶格穿梭的高亮知识脉冲数据包（使用安全非负模运算 + 边界校验）
  const edgeCount = latticeEdges.length;
  if (edgeCount > 0) {
    for (let p = 0; p < 6; p++) {
      const idx = safeModIndex(time * 3.2 + p * 7, edgeCount);
      const edge = latticeEdges[idx];
      if (!edge) continue;
      const iA = edge[0];
      const iB = edge[1];
      if (iA < 0 || iA >= proj.length || iB < 0 || iB >= proj.length) continue;
      const p1 = proj[iA];
      const p2 = proj[iB];
      if (!p1 || !p2) continue;

      const rawFrac = (time * 2.2 + p * 0.19) % 1;
      const frac = rawFrac < 0 ? rawFrac + 1 : rawFrac;
      const px = p1.x + (p2.x - p1.x) * frac;
      const py = p1.y + (p2.y - p1.y) * frac;
      if (!Number.isFinite(px) || !Number.isFinite(py)) continue;

      ctx.beginPath();
      ctx.arc(px, py, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = `rgb(${primary})`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // 3. 绘制脉冲晶格顶点节点
  const nodePulse = 1 + Math.sin(time * 4.5) * 0.18;
  for (let i = 0; i < proj.length; i++) {
    const pt = proj[i];
    if (!pt) continue;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, Math.max(0.8, 2.3 * pt.persp * nodePulse), 0, Math.PI * 2);
    ctx.fillStyle = i % 4 === 0 ? 'rgba(255, 255, 255, 0.92)' : `rgba(${primary}, 0.9)`;
    ctx.fill();
  }
}

function drawWaveform(
  ctx: CanvasRenderingContext2D, w: number, h: number, time: number, speed: number,
  { primary, secondary }: CanvasPalette,
) {
  const midY = h * 0.42;

  // 第 1 层：遥测背景频谱柱
  const bars = 26;
  const bw = w / bars;
  for (let i = 0; i < bars; i++) {
    const amp = (Math.sin(i * 0.55 - time * 3.1) * 0.5 + 0.5) * 32 + 6;
    ctx.fillStyle = `rgba(${primary}, 0.14)`;
    ctx.fillRect(i * bw + 2, midY - amp * 0.5, Math.max(1, bw - 4), amp);
  }

  // 第 2 层：次级谐波曲线
  ctx.beginPath();
  for (let x = 0; x <= w; x += 4) {
    const nx = x / w;
    const y = midY + Math.sin(nx * 13 - time * 3.4) * 26 * Math.sin(nx * Math.PI);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = `rgba(${secondary}, 0.52)`;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 第 3 层：高亮脉冲主示波器
  ctx.beginPath();
  for (let x = 0; x <= w; x += 2) {
    const nx = x / w;
    const wave = Math.sin(nx * 16 - time * 4.4) * 14 + Math.sin(nx * 34 + time * 2.2) * 5;
    const phase = ((nx * 1.9 - time * 0.52) % 1 + 1) % 1;
    let spike = 0;
    if (phase > 0.42 && phase < 0.58) {
      const p = (phase - 0.5) / 0.06;
      spike = Math.exp(-p * p * 12) * -46 + Math.exp(-(p - 0.55) * (p - 0.55) * 26) * 24;
    }
    const y = midY + (wave + spike) * Math.sin(nx * Math.PI);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = `rgb(${primary})`;
  ctx.lineWidth = 2.1 + (speed - 1) * 0.3;
  ctx.shadowColor = `rgba(${primary}, 0.9)`;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawOrbit(
  ctx: CanvasRenderingContext2D, w: number, h: number, time: number, speed: number,
  { primary, secondary }: CanvasPalette,
) {
  const cx = w * 0.68;
  const cy = h * 0.38;

  // 等离子脉冲奇点核心
  const pulseR = 16 + Math.sin(time * 4.2) * 4;
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, pulseR * 3);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.32, `rgba(${secondary}, 0.68)`);
  grad.addColorStop(0.7, `rgba(${primary}, 0.25)`);
  grad.addColorStop(1, `rgba(${primary}, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseR * 3, 0, Math.PI * 2);
  ctx.fill();

  // 轨道星环
  for (let r = 0; r < 3; r++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(r * 0.95 + time * 0.28 * (r % 2 === 0 ? 1 : -1));
    ctx.beginPath();
    ctx.ellipse(0, 0, 46 + r * 24, 17 + r * 8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = r % 2 === 0
      ? `rgba(${primary}, ${0.34 - r * 0.05})`
      : `rgba(${secondary}, ${0.32 - r * 0.05})`;
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.restore();
  }

  // 计算所有星簇位置与拖尾起点
  const pts = [];
  for (let i = 0; i < orbitSparks.length; i++) {
    const sp = orbitSparks[i];
    if (!sp) continue;
    const a = sp.angle + time * sp.speed;
    const prevA = a - sp.speed * (0.12 + (speed - 1) * 0.08);
    const lx = Math.cos(a) * sp.rx;
    const ly = Math.sin(a) * sp.ry;
    const plx = Math.cos(prevA) * sp.rx;
    const ply = Math.sin(prevA) * sp.ry;
    const cosT = Math.cos(sp.tilt);
    const sinT = Math.sin(sp.tilt);
    pts.push({
      x: cx + lx * cosT - ly * sinT,
      y: cy + lx * sinT + ly * cosT,
      px: cx + plx * cosT - ply * sinT,
      py: cy + plx * sinT + ply * cosT,
      size: sp.size,
      useSecondary: sp.useSecondary,
    });
  }

  // 动态星座连线（严格校验顶点存在）
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    if (!p1) continue;
    for (let j = i + 1; j < pts.length; j++) {
      const p2 = pts[j];
      if (!p2) continue;
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (d < 46) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${primary}, ${(1 - d / 46) * 0.38})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }
    }
  }

  // 绘制能量拖尾与高光星点
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (!p) continue;
    const color = p.useSecondary ? secondary : primary;
    ctx.beginPath();
    ctx.moveTo(p.px, p.py);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = `rgba(${color}, 0.75)`;
    ctx.lineWidth = p.size * 0.95;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : `rgb(${color})`;
    ctx.fill();
  }
}

const drawVisual = {
  lattice: drawLattice,
  waveform: drawWaveform,
  orbit: drawOrbit,
} satisfies Record<PortalVisual, typeof drawLattice>

export function createPortalAnimation(
  card: HTMLAnchorElement,
  canvas: HTMLCanvasElement,
  portal: Portal,
): PortalAnimation {
  const ctx = canvas.getContext('2d')
  const draw = drawVisual[portal.animation]
  const palette = { primary: portal.rgb.join(', '), secondary: portal.rgb2.join(', ') }
  let width = 0
  let height = 0
  let phase = 0
  let speed = 1
  let borderAngle = portal.borderAngle

  return {
    resize() {
      if (!ctx || !canvas.parentElement) return
      const rect = canvas.parentElement.getBoundingClientRect()
      width = Math.floor(rect.width)
      height = Math.floor(rect.height)
      if (width <= 0 || height <= 0) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    },
    render(dt, hovered) {
      const targetSpeed = hovered ? 3 : 1
      speed += (targetSpeed - speed) * (1 - Math.exp(-6 * dt))
      phase += dt * speed

      const borderDegreesPerSecond = 58 * (hovered ? 3.5 : 1)
      borderAngle = (borderAngle + borderDegreesPerSecond * dt) % 360
      card.style.setProperty('--plasma-angle', `${borderAngle.toFixed(1)}deg`)

      if (!ctx || width <= 0 || height <= 0) return
      ctx.clearRect(0, 0, width, height)
      draw(ctx, width, height, phase, speed, palette)
    },
  }
}
