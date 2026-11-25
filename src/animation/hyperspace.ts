import { getPortal } from '../deck'
import type { AmbientPalette } from './ambientPalette'

export interface FlightState {
  hoveredPortal: string | null
  warpFactor: number
  mouseNormX: number
  mouseNormY: number
  smoothMouseX: number
  smoothMouseY: number
  curRgb: number[]
  curRgb2: number[]
}

interface Shockwave {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  rgb: number[]
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  rgb: number[]
}

interface SpeedLine {
  angle: number
  dist: number
  speed: number
  length: number
  width: number
  alt: boolean
}

export function createHyperspaceRenderer(canvas: HTMLCanvasElement, state: FlightState) {
  const context = canvas.getContext('2d')
  if (!context) return null
  const ctx = context

  let width = 0;
  let height = 0;
  let centerY = 0;

  const STAR_COUNT = 960;
  const MAX_DEPTH = 2100;
  const stars: ReturnType<typeof makeStar>[] = [];
  const speedLines: SpeedLine[] = [];
  const shockwaves: Shockwave[] = [];
  const sparks: Spark[] = [];

  function makeStar(randomZ: boolean) {
    const spread = 1650;
    return {
      x: (Math.random() - 0.5) * spread * 2,
      y: (Math.random() - 0.5) * spread * 2,
      z: randomZ ? Math.random() * MAX_DEPTH + 20 : MAX_DEPTH,
      size: Math.random() * 1.6 + 0.5,
      tint: Math.random(),
    };
  }
  for (let i = 0; i < STAR_COUNT; i++) stars.push(makeStar(true));

  for (let i = 0; i < 64; i++) {
    speedLines.push({
      angle: (i / 64) * Math.PI * 2 + (Math.random() - 0.5) * 0.08,
      dist: 0.28 + Math.random() * 0.72,
      speed: 1.15 + Math.random() * 1.4,
      length: 0.14 + Math.random() * 0.24,
      width: 0.8 + Math.random() * 1.5,
      alt: i % 3 === 0,
    });
  }

  // 先生成正二十面体顶点，再严格基于欧氏距离为有效索引生成边
  const PHI = (1 + Math.sqrt(5)) / 2;
  const icoVerts = [
    [-1,  PHI, 0], [ 1,  PHI, 0], [-1, -PHI, 0], [ 1, -PHI, 0],
    [ 0, -1,  PHI], [ 0,  1,  PHI], [ 0, -1, -PHI], [ 0,  1, -PHI],
    [ PHI, 0, -1], [ PHI, 0,  1], [-PHI, 0, -1], [-PHI, 0,  1],
  ].map(([x, y, z]) => {
    const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  });

  const icoEdges: [number, number][] = [];
  for (let i = 0; i < icoVerts.length; i++) {
    for (let j = i + 1; j < icoVerts.length; j++) {
      const d = Math.hypot(
        icoVerts[i][0] - icoVerts[j][0],
        icoVerts[i][1] - icoVerts[j][1],
        icoVerts[i][2] - icoVerts[j][2]
      );
      if (d < 1.15) icoEdges.push([i, j]);
    }
  }

  // 内部反旋八面体顶点与基于有效索引验证的边
  const octVerts = [
    [1, 0, 0], [-1, 0, 0],
    [0, 1, 0], [0, -1, 0],
    [0, 0, 1], [0, 0, -1],
  ];
  const octEdges: [number, number][] = [];
  for (let i = 0; i < octVerts.length; i++) {
    for (let j = i + 1; j < octVerts.length; j++) {
      const d = Math.hypot(
        octVerts[i][0] - octVerts[j][0],
        octVerts[i][1] - octVerts[j][1],
        octVerts[i][2] - octVerts[j][2]
      );
      if (d > 1.3 && d < 1.5) octEdges.push([i, j]);
    }
  }

  let rotX = 0.24;
  let rotY = 0;
  let rotZ = 0;
  let ringAngle = 0;
  let gridOffset = 0;

  function resize(focusY: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, window.innerWidth || 1);
    height = Math.max(1, window.innerHeight || 1);
    centerY = Math.min(focusY, height * 0.5);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function emitShockwave(px: number, py: number) {
    if (width <= 0 || height <= 0) return;
    shockwaves.push({
      x: px,
      y: py,
      radius: 6,
      maxRadius: Math.min(width, height) * 0.44 + 130,
      alpha: 0.95,
      rgb: [...state.curRgb],
    });
    for (let i = 0; i < 18; i++) {
      const ang = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.25;
      const spd = 2.4 + Math.random() * 4.4;
      sparks.push({
        x: px,
        y: py,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        rgb: i % 2 === 0 ? [...state.curRgb] : [255, 255, 255],
      });
    }
  }

  function rotate3D(x: number, y: number, z: number, rx: number, ry: number, rz: number) {
    const y1 = y * Math.cos(rx) - z * Math.sin(rx);
    const z1 = y * Math.sin(rx) + z * Math.cos(rx);
    const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
    const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
    const x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
    const y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);
    return [x3, y3, z2];
  }

  function drawRing(cx: number, cy: number, radius: number, tiltX: number, tiltY: number, spin: number, r: number, g: number, b: number, alpha: number, segs = 72) {
    const fov = 720;
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2 + spin;
      const [rx, ry, rz] = rotate3D(Math.cos(a) * radius, Math.sin(a) * radius, 0, tiltX, tiltY, 0);
      const denom = Math.max(60, fov + rz + 460);
      const scale = fov / denom;
      const sx = cx + rx * scale;
      const sy = cy + ry * scale;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.lineWidth = 1.25 + state.warpFactor * 0.6;
    ctx.stroke();

    for (let s = 0; s < 3; s++) {
      const sa = spin * 1.45 + (s * Math.PI * 2) / 3;
      const [rx, ry, rz] = rotate3D(Math.cos(sa) * radius, Math.sin(sa) * radius, 0, tiltX, tiltY, 0);
      const denom = Math.max(60, fov + rz + 460);
      const scale = fov / denom;
      ctx.beginPath();
      ctx.arc(cx + rx * scale, cy + ry * scale, (2.6 + state.warpFactor * 1.2) * scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 2.3)})`;
      ctx.fill();
    }
  }

  function drawPerspectiveGrid(cx: number, horizonY: number, r: number, g: number, b: number, dt: number) {
    gridOffset = (gridOffset + dt * (0.45 + state.warpFactor * 4.5)) % 1;
    const gridBottom = height + 20;
    const spanY = Math.max(80, gridBottom - horizonY);
    const alphaBase = 0.075 + state.warpFactor * 0.085;

    const cols = 14;
    for (let i = -cols; i <= cols; i++) {
      const topX = cx + i * (width * 0.045);
      const botX = cx + i * (width * 0.24);
      ctx.beginPath();
      ctx.moveTo(topX, horizonY);
      ctx.lineTo(botX, gridBottom);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alphaBase * 0.65})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const rows = 9;
    for (let j = 0; j < rows; j++) {
      const t = (j + gridOffset) / rows;
      const y = horizonY + Math.pow(t, 2.35) * spanY;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alphaBase * t})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function render(dt: number, now: number, ambient: AmbientPalette) {
    if (width <= 0 || height <= 0) return;

    // 1. 悬停任意门户卡片即平滑加速至 8.50x
    const hoveredPortal = getPortal(state.hoveredPortal);
    const targetWarp = hoveredPortal ? 1 : 0;
    const lerpRate = targetWarp > state.warpFactor ? 5.2 : 3.4;
    state.warpFactor += (targetWarp - state.warpFactor) * (1 - Math.exp(-lerpRate * dt));
    if (state.warpFactor < 0.001 && targetWarp === 0) state.warpFactor = 0;

    // 2. 颜色在当前环境配色和悬停卡片配色之间平滑过渡。
    const { rgb: targetRgb, rgb2: targetRgb2 } = hoveredPortal ?? ambient;
    const colorLerp = 1 - Math.exp(-6.5 * dt);
    for (let c = 0; c < 3; c++) {
      state.curRgb[c] += (targetRgb[c] - state.curRgb[c]) * colorLerp;
      state.curRgb2[c] += (targetRgb2[c] - state.curRgb2[c]) * colorLerp;
    }
    const r1 = Math.round(state.curRgb[0]);
    const g1 = Math.round(state.curRgb[1]);
    const b1 = Math.round(state.curRgb[2]);
    const r2 = Math.round(state.curRgb2[0]);
    const g2 = Math.round(state.curRgb2[1]);
    const b2 = Math.round(state.curRgb2[2]);

    // 3. 曲速残影清屏
    if (state.warpFactor > 0.06) {
      ctx.fillStyle = `rgba(${ambient.background.join(', ')}, ${0.46 - state.warpFactor * 0.22})`;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    const mouseLerp = 1 - Math.exp(-5.0 * dt);
    state.smoothMouseX += (state.mouseNormX - state.smoothMouseX) * mouseLerp;
    state.smoothMouseY += (state.mouseNormY - state.smoothMouseY) * mouseLerp;

    const cx = width * 0.5 - state.smoothMouseX * (width * 0.075);
    const cy = centerY - state.smoothMouseY * (height * 0.045);
    const fov = Math.max(120, Math.min(width, height) * 0.66);

    // 4. 透视网格
    drawPerspectiveGrid(cx, height * 0.66 - state.smoothMouseY * 18, r1, g1, b1, dt);

    // 5. 960 颗 3D 星尘与光速星轨
    const velocityMult = 1 + state.warpFactor * 7.5; // 1.00x -> 8.50x
    const starSpeed = 155 * velocityMult * dt;
    const streakStretch = 1 + state.warpFactor * 7.2;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      if (!s) continue;
      s.z -= starSpeed;
      if (s.z <= 14) {
        const ns = makeStar(false);
        s.x = ns.x;
        s.y = ns.y;
        s.z = MAX_DEPTH;
        continue;
      }

      const sx = cx + (s.x / s.z) * fov;
      const sy = cy + (s.y / s.z) * fov;
      if (sx < -80 || sx > width + 80 || sy < -80 || sy > height + 80) continue;

      const depthRatio = 1 - s.z / MAX_DEPTH;
      const alpha = Math.min(1, depthRatio * depthRatio * (1.28 + state.warpFactor * 0.55));

      if (state.warpFactor < 0.04) {
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.7, s.size * depthRatio * 1.35), 0, Math.PI * 2);
        ctx.fillStyle =
          s.tint > 0.66
            ? `rgba(${r1}, ${g1}, ${b1}, ${alpha})`
            : s.tint > 0.42
            ? `rgba(${r2}, ${g2}, ${b2}, ${alpha * 0.88})`
            : `rgba(238, 248, 255, ${alpha})`;
        ctx.fill();
      } else {
        const tailZ = Math.min(MAX_DEPTH, s.z + starSpeed * streakStretch + 55 * state.warpFactor);
        const px = cx + (s.x / tailZ) * fov;
        const py = cy + (s.y / tailZ) * fov;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle =
          s.tint > 0.46
            ? `rgba(${r1}, ${g1}, ${b1}, ${alpha})`
            : s.tint > 0.24
            ? `rgba(${r2}, ${g2}, ${b2}, ${alpha * 0.94})`
            : `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = Math.max(0.75, s.size * depthRatio * (1.1 + state.warpFactor * 1.55));
        ctx.stroke();
      }
    }

    // 6. 视口边缘径向超光速能量隧道流线
    if (state.warpFactor > 0.05) {
      const maxR = Math.hypot(width, height) * 0.65;
      for (let i = 0; i < speedLines.length; i++) {
        const sl = speedLines[i];
        if (!sl) continue;
        sl.dist += sl.speed * (0.4 + state.warpFactor * 2.8) * dt;
        if (sl.dist > 1.25) {
          sl.dist = 0.24 + Math.random() * 0.22;
        }
        const rStart = Math.max(0.24, sl.dist - sl.length * (0.5 + state.warpFactor)) * maxR;
        const rEnd = sl.dist * maxR;
        const cosA = Math.cos(sl.angle);
        const sinA = Math.sin(sl.angle);
        const lineAlpha = state.warpFactor * Math.min(0.65, (sl.dist - 0.22) * 0.95);

        if (lineAlpha > 0.02) {
          ctx.beginPath();
          ctx.moveTo(cx + cosA * rStart, cy + sinA * rStart);
          ctx.lineTo(cx + cosA * rEnd, cy + sinA * rEnd);
          ctx.strokeStyle = sl.alt
            ? `rgba(255, 255, 255, ${lineAlpha * 0.7})`
            : `rgba(${r1}, ${g1}, ${b1}, ${lineAlpha})`;
          ctx.lineWidth = sl.width * (0.7 + state.warpFactor * 0.7);
          ctx.stroke();
        }
      }
    }

    // 7. 中央多层 3D 线框多面体能量核心（悬停时旋转加速 ~7x）
    const coreSpinBoost = 1 + state.warpFactor * 6.2;
    rotY += 0.34 * coreSpinBoost * dt;
    rotX += 0.19 * coreSpinBoost * dt;
    rotZ += 0.09 * coreSpinBoost * dt;
    ringAngle += 0.54 * coreSpinBoost * dt;

    const baseRadius = Math.min(width, height) * (width < 640 ? 0.50 : 0.48);
    const expand = 1 + state.warpFactor * 0.14;
    const pulse = 1 + Math.sin(now * 0.0034) * 0.028 + state.warpFactor * Math.sin(now * 0.026) * 0.055;
    const coreR = Math.max(20, baseRadius * expand * pulse);

    const glowR = coreR * (1.52 + state.warpFactor * 0.55);
    const glow = ctx.createRadialGradient(cx, cy, coreR * 0.05, cx, cy, glowR);
    glow.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${0.18 + state.warpFactor * 0.28})`);
    glow.addColorStop(0.48, `rgba(${r2}, ${g2}, ${b2}, ${0.07 + state.warpFactor * 0.14})`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();

    const tiltX = state.smoothMouseY * 0.44;
    const tiltY = state.smoothMouseX * 0.44;
    drawRing(cx, cy, coreR * 1.32, 1.15 + tiltX, 0.35 + tiltY, ringAngle, r1, g1, b1, 0.26 + state.warpFactor * 0.32);
    drawRing(cx, cy, coreR * 1.54, -0.92 + tiltX, -0.58 + tiltY, -ringAngle * 0.8, r2, g2, b2, 0.2 + state.warpFactor * 0.28);
    drawRing(cx, cy, coreR * 1.12, 0.48 + tiltX, 1.25 + tiltY, ringAngle * 1.28, r1, g1, b1, 0.17 + state.warpFactor * 0.24, 52);

    // 外层正二十面体投影与严格边界校验绘制
    const coreFov = 720;
    const projIco = icoVerts.map(([vx, vy, vz]) => {
      const [rx, ry, rz] = rotate3D(vx * coreR, vy * coreR, vz * coreR, rotX + tiltX, rotY + tiltY, rotZ);
      const denom = Math.max(60, coreFov + rz + 460);
      const scale = coreFov / denom;
      return { x: cx + rx * scale, y: cy + ry * scale, z: rz, scale };
    });

    for (let i = 0; i < icoEdges.length; i++) {
      const edge = icoEdges[i];
      if (!edge) continue;
      const iA = edge[0];
      const iB = edge[1];
      if (iA < 0 || iA >= projIco.length || iB < 0 || iB >= projIco.length) continue;
      const a = projIco[iA];
      const b = projIco[iB];
      if (!a || !b) continue;

      const dNorm = Math.max(0.16, Math.min(1, 0.58 - ((a.z + b.z) * 0.5) / (coreR * 2.2)));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(${r1}, ${g1}, ${b1}, ${dNorm * (0.44 + state.warpFactor * 0.42)})`;
      ctx.lineWidth = (0.75 + dNorm * 1.1) * (1 + state.warpFactor * 0.42);
      ctx.stroke();
    }

    for (let i = 0; i < projIco.length; i++) {
      const p = projIco[i];
      if (!p) continue;
      const dNorm = Math.max(0.2, Math.min(1, 0.62 - p.z / (coreR * 2.2)));
      ctx.beginPath();
      ctx.arc(p.x, p.y, (2.2 + dNorm * 2.4 + state.warpFactor * 1.1) * p.scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, dNorm * (0.9 + state.warpFactor * 0.2))})`;
      ctx.fill();
    }

    // 内层反旋八面体投影与严格边界校验绘制
    const innerR = coreR * 0.46;
    const projOct = octVerts.map(([vx, vy, vz]) => {
      const [rx, ry, rz] = rotate3D(vx * innerR, vy * innerR, vz * innerR, -rotX * 1.5, -rotY * 1.8, rotZ * 1.25);
      const denom = Math.max(60, coreFov + rz + 460);
      const scale = coreFov / denom;
      return { x: cx + rx * scale, y: cy + ry * scale };
    });

    for (let i = 0; i < octEdges.length; i++) {
      const edge = octEdges[i];
      if (!edge) continue;
      const iA = edge[0];
      const iB = edge[1];
      if (iA < 0 || iA >= projOct.length || iB < 0 || iB >= projOct.length) continue;
      const a = projOct[iA];
      const b = projOct[iB];
      if (!a || !b) continue;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(${r2}, ${g2}, ${b2}, ${0.52 + state.warpFactor * 0.42})`;
      ctx.lineWidth = 1.2 + state.warpFactor * 0.5;
      ctx.stroke();
    }

    // 8. 声纳冲击波与粒子火花
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const w = shockwaves[i];
      w.radius += (480 + w.radius * 1.15) * dt;
      w.alpha -= 1.22 * dt;
      if (w.alpha <= 0 || w.radius > w.maxRadius) {
        shockwaves.splice(i, 1);
        continue;
      }
      const [wr, wg, wb] = w.rgb.map(Math.round);
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${wr}, ${wg}, ${wb}, ${w.alpha})`;
      ctx.lineWidth = 2.2 * w.alpha;
      ctx.stroke();

      if (w.radius > 20) {
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${w.alpha * 0.45})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vx *= 0.94;
      sp.vy *= 0.94;
      sp.life -= 1.8 * dt;
      if (sp.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      const [sr, sg, sb] = sp.rgb.map(Math.round);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(0.2, 2 * sp.life), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${sp.life})`;
      ctx.fill();
    }
  }

  return { resize, render, emitShockwave };
}
