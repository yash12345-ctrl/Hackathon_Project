import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './Dashboard' 
import Td from './t_d' // <--- 1. IMPORT YOUR NEW PAGE HERE
import Advance from './advance'

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #FAF8F4;
    --ink: #1A1612;
    --ink-soft: #4A4540;
    --accent: #3A5CE8;
    --accent-light: #DFE8FF;
    --accent-pale: #F0F4FF;
    --gold: #C9A84C;
    --gold-light: #F5EDD6;
    --line: #E4DED6;
    --orange: #E8633A;
    --orange-light: #FFE8DF;
    --green: #3AAD6E;
    --green-light: #DFFAEA;
  }

  html, body, #root { 
    width: 100%;
    height: auto;
    min-height: 100vh;
    overflow-x: hidden;
    overflow-y: auto !important; 
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--ink);
  }

  /* ── NOISE OVERLAY ── */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1000;
    opacity: 0.4;
  }

  /* ── NAV ── */
  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 3rem;
    background: rgba(250,248,244,0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--line);
  }

  .nav-logo {
    font-family: 'Clash Display', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    letter-spacing: -0.02em;
  }

  .nav-logo-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    display: inline-block;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 2rem;
    list-style: none;
  }

  .nav-links a {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--ink-soft);
    text-decoration: none;
    transition: color 0.2s;
  }

  .nav-links a:hover { color: var(--ink); }

  .nav-cta {
    background: var(--ink) !important;
    color: var(--cream) !important;
    padding: 0.55rem 1.2rem;
    border-radius: 100px;
    font-size: 0.85rem !important;
    font-weight: 500 !important;
    transition: background 0.2s, transform 0.15s !important;
    text-decoration: none;
  }

  .nav-cta:hover {
    background: var(--accent) !important;
    color: var(--cream) !important;
    transform: translateY(-1px);
  }

  /* ── HERO ── */
  .hero {
    min-height: 100vh;
    height: auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 0;
    padding-top: 100px;
    padding-bottom: 4rem;
  }

  .hero-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2rem 4rem;
    border-right: 1px solid var(--line);
    position: relative;
    z-index: 2;
  }

  .hero-left::after {
    content: '';
    position: absolute;
    bottom: -100px; left: -80px;
    width: 350px; height: 350px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--accent-light) 0%, transparent 70%);
    pointer-events: none;
    z-index: -1;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--accent-pale);
    border: 1px solid var(--accent-light);
    color: var(--accent);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.4rem 0.9rem;
    border-radius: 100px;
    width: fit-content;
    margin-bottom: 1.5rem;
    animation: fadeSlideUp 0.6s ease both;
  }

  .badge-pulse {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 2s ease infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.4); opacity: 0.7; }
  }

  .hero-title {
    font-family: 'Clash Display', sans-serif;
    font-size: clamp(2.5rem, 4.5vw, 4.2rem);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.03em;
    color: var(--ink);
    margin-bottom: 1.25rem;
    animation: fadeSlideUp 0.7s 0.1s ease both;
  }

  .hero-title em {
    font-style: normal;
    color: var(--accent);
    position: relative;
  }

  .hero-title em::after {
    content: '';
    position: absolute;
    bottom: 4px; left: 0; right: 0;
    height: 3px;
    background: var(--accent);
    border-radius: 2px;
    transform: scaleX(0);
    transform-origin: left;
    animation: underline 0.5s 0.9s ease forwards;
  }

  @keyframes underline { to { transform: scaleX(1); } }

  .hero-sub {
    font-size: 1.05rem;
    line-height: 1.6;
    color: var(--ink-soft);
    max-width: 440px;
    margin-bottom: 2rem;
    font-weight: 300;
    animation: fadeSlideUp 0.7s 0.2s ease both;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    animation: fadeSlideUp 0.7s 0.3s ease both;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    background: var(--accent);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    padding: 0.85rem 1.6rem;
    border-radius: 100px;
    border: none;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(58, 92, 232, 0.35);
    text-decoration: none;
  }

  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
    border-radius: inherit;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(58, 92, 232, 0.45);
  }

  .btn-primary:active { transform: translateY(0); }

  .btn-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px; height: 20px;
    background: rgba(255,255,255,0.25);
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .btn-primary:hover .btn-arrow { transform: translateX(3px); }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--ink-soft);
    font-size: 0.9rem;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
    background: none;
    border: none;
    cursor: pointer;
  }

  .btn-secondary:hover { color: var(--ink); }

  .btn-secondary svg { transition: transform 0.2s; }
  .btn-secondary:hover svg { transform: translateX(3px); }

  .hero-stats {
    display: flex;
    gap: 2.5rem;
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--line);
    animation: fadeSlideUp 0.7s 0.4s ease both;
  }

  .stat-item { display: flex; flex-direction: column; gap: 0.2rem; }

  .stat-number {
    font-family: 'Clash Display', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.02em;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--ink-soft);
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* ── HERO RIGHT / VISUALIZATION ── */
  .hero-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2rem 3rem;
    position: relative;
    background: var(--cream);
  }

  .hero-right::before {
    content: '';
    position: absolute;
    top: 0; right: -50px;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--orange-light) 0%, transparent 70%);
    pointer-events: none;
  }

  .viz-card {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 20px;
    padding: 1.5rem;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 8px 40px rgba(26,22,18,0.06), 0 2px 8px rgba(26,22,18,0.04);
    animation: cardRise 0.9s 0.4s ease both;
    position: relative;
    z-index: 10;
  }

  @keyframes cardRise {
    from { transform: translateY(30px) scale(0.97); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }

  .viz-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .viz-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .viz-live {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--green);
    background: var(--green-light);
    padding: 0.25rem 0.6rem;
    border-radius: 100px;
  }

  .live-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--green);
    animation: pulse 1.5s ease infinite;
  }

  .human-figure-wrap {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 2rem;
    padding: 1rem 0;
  }

  /* Bar chart */
  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 65px;
    margin: 1rem 0;
    padding: 0 0.5rem;
  }

  .bar-item { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }

  .bar {
    width: 100%;
    border-radius: 4px 4px 0 0;
    animation: barGrow 1s ease both;
    transform-origin: bottom;
  }

  .bar-val {
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--ink-soft);
  }

  .bar-age { font-size: 0.58rem; color: var(--ink-soft); opacity: 0.6; }

  @keyframes barGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }

  .result-strip {
    background: var(--accent-pale);
    border: 1px solid var(--accent-light);
    border-radius: 12px;
    padding: 0.85rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 1rem;
  }

  .result-text { font-size: 0.75rem; color: var(--ink-soft); font-weight: 500; }

  .result-value {
    font-family: 'Clash Display', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: -0.02em;
  }

  .result-conf {
    font-size: 0.65rem;
    color: var(--green);
    font-weight: 700;
    background: #fff;
    border: 1px solid var(--green-light);
    padding: 0.2rem 0.5rem;
    border-radius: 100px;
  }

  .input-row {
    display: flex;
    gap: 8px;
    margin-top: 1rem;
  }

  .fake-input {
    flex: 1;
    background: var(--cream);
    border: 1px dashed var(--line);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    font-size: 0.72rem;
    color: var(--ink-soft);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: monospace;
  }

  .fake-input strong { color: var(--ink); font-weight: 600; font-family: 'DM Sans', sans-serif;}

  .fake-btn {
    background: var(--ink);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 0.85rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.2s;
  }
  .fake-btn:hover { background: var(--accent); }

  /* ── FEATURES ── */
  .features {
    padding: 6rem 4rem;
    border-top: 1px solid var(--line);
  }

  .features-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    margin-bottom: 3.5rem;
    align-items: end;
  }

  .section-label {
    font-family: 'Syne', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 1rem;
  }

  .section-title {
    font-family: 'Clash Display', sans-serif;
    font-size: clamp(2rem, 3.5vw, 2.8rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: var(--ink);
  }

  .section-desc {
    font-size: 1rem;
    color: var(--ink-soft);
    line-height: 1.7;
    font-weight: 300;
    max-width: 380px;
    align-self: end;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5px;
    border: 1.5px solid var(--line);
    border-radius: 20px;
    overflow: hidden;
  }

  .feature-cell {
    background: #fff;
    padding: 2.5rem;
    transition: background 0.25s;
    position: relative;
    overflow: hidden;
  }

  .feature-cell:hover { background: var(--accent-pale); }

  .feature-cell::after {
    content: '';
    position: absolute;
    bottom: 0; left: 2.5rem; right: 2.5rem;
    height: 2px;
    background: var(--accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  .feature-cell:hover::after { transform: scaleX(1); }

  .feature-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    font-size: 1.3rem;
  }

  .feature-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 0.6rem;
  }

  .feature-desc {
    font-size: 0.88rem;
    color: var(--ink-soft);
    line-height: 1.65;
    font-weight: 300;
  }

  /* ── CTA STRIP ── */
  .cta-strip {
    margin: 0 4rem 6rem;
    background: var(--ink);
    border-radius: 24px;
    padding: 4rem;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 3rem;
    overflow: hidden;
    position: relative;
  }

  .cta-strip::before {
    content: '';
    position: absolute;
    top: -80px; right: 200px;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(58, 92, 232, 0.25) 0%, transparent 70%);
    pointer-events: none;
  }

  .cta-title {
    font-family: 'Clash Display', sans-serif;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin-bottom: 0.75rem;
  }

  .cta-sub {
    color: rgba(255,255,255,0.55);
    font-size: 0.95rem;
    font-weight: 300;
    line-height: 1.6;
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    background: var(--accent);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    padding: 0.95rem 2rem;
    border-radius: 100px;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(58, 92, 232, 0.4);
    text-decoration: none;
  }

  .cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(58, 92, 232, 0.5);
  }

  /* ── HOW IT WORKS ── */
  .how {
    padding: 6rem 4rem;
    border-top: 1px solid var(--line);
    background: #fff;
  }

  .how-header { text-align: center; margin-bottom: 4rem; }

  .steps-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    position: relative;
  }

  .steps-row::before {
    content: '';
    position: absolute;
    top: 28px; left: 10%; right: 10%;
    height: 1px;
    background: var(--line);
    z-index: 0;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 1.5rem;
    position: relative;
    z-index: 1;
  }

  .step-num {
    width: 56px; height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Clash Display', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    border: 2px solid var(--line);
    background: #fff;
    transition: background 0.3s, border-color 0.3s, color 0.3s;
  }

  .step:hover .step-num {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .step-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 0.5rem;
  }

  .step-desc { font-size: 0.83rem; color: var(--ink-soft); line-height: 1.6; font-weight: 300; }

  /* ── FOOTER ── */
  footer {
    border-top: 1px solid var(--line);
    padding: 2rem 4rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-copy { font-size: 0.8rem; color: var(--ink-soft); }
  .footer-links { display: flex; gap: 1.5rem; }
  .footer-links a { font-size: 0.8rem; color: var(--ink-soft); text-decoration: none; }
  .footer-links a:hover { color: var(--ink); }

  @keyframes fadeSlideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* ── FLOATING TAGS - Adjusted for better fit ── */
  .float-tag {
    position: absolute;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 0.5rem 0.8rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--ink);
    box-shadow: 0 4px 16px rgba(26,22,18,0.08);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    animation: float 4s ease-in-out infinite;
    z-index: 15;
  }

  .float-tag-1 { top: 12%; right: 10%; animation-delay: 0s; }
  .float-tag-2 { bottom: 12%; left: 5%; animation-delay: 1.5s; }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  .tag-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
  }

  /* Responsive fixes */
  @media (max-width: 1024px) {
    .hero { grid-template-columns: 1fr; height: auto; padding-top: 120px; text-align: center; }
    .hero-left { border-right: none; padding: 2rem; align-items: center; }
    .hero-sub { margin-left: auto; margin-right: auto; }
    .hero-stats { justify-content: center; }
    .hero-right { padding: 3rem 2rem; }
    .features { padding: 4rem 2rem; }
    .features-header { grid-template-columns: 1fr; text-align: center; }
    .section-desc { align-self: center; margin: 0 auto; }
    .features-grid { grid-template-columns: 1fr; }
    .cta-strip { margin: 0 2rem 4rem; grid-template-columns: 1fr; padding: 3rem 2rem; text-align: center; }
    .steps-row { grid-template-columns: 1fr 1fr; gap: 2rem; }
    .steps-row::before { display: none; }
    nav { padding: 1rem 1.5rem; }
    .nav-links { gap: 1rem; display: none; }
    .how { padding: 4rem 2rem; }
    footer { flex-direction: column; gap: 1rem; text-align: center; }
  }
`

function Counter({ target, duration = 1800 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now) => {
        const pct = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - pct, 3)
        setVal(Math.round(ease * target))
        if (pct < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{val.toLocaleString()}</span>
}

function BuildingSVG({ height = 100, width = 40, color = '#3A5CE8', opacity = 1 }) {
  const scale = height / 120;
  return (
    <svg width={width} height={120} viewBox={`0 0 ${width} 120`} fill="none" xmlns="http://www.w3.org/2000/svg" className="svg-figure">
      <rect x="0" y={120 - height} width={width} height={height} rx="4" fill={color} opacity={opacity} />
      {height > 40 && (
        <>
          <rect x={width * 0.2} y={120 - height + 15} width={width * 0.2} height="12" rx="2" fill="#ffffff" opacity="0.3" />
          <rect x={width * 0.6} y={120 - height + 15} width={width * 0.2} height="12" rx="2" fill="#ffffff" opacity="0.3" />
          <rect x={width * 0.2} y={120 - height + 35} width={width * 0.2} height="12" rx="2" fill="#ffffff" opacity="0.3" />
          <rect x={width * 0.6} y={120 - height + 35} width={width * 0.2} height="12" rx="2" fill="#ffffff" opacity="0.3" />
        </>
      )}
    </svg>
  )
}

const features = [
  { icon: '🛰️', color: '#DFE8FF', label: 'Data Source', title: 'SpaceNet-6 Dataset', desc: 'Leveraging pre-aligned SAR and optical image chips to build a robust baseline for urban infrastructure analysis.' },
  { icon: '📡', color: '#FFE8DF', label: 'Sensor 1', title: 'SAR Distortions', desc: 'Utilizing Synthetic Aperture Radar geometric distortions (layover, shadow) to extract reliable height-related cues.' },
  { icon: '📸', color: '#DFFAEA', label: 'Sensor 2', title: 'Optical Spatial Context', desc: 'Fusing high-resolution optical imagery to provide clear spatial context and improve building footprint isolation.' },
  { icon: '⚙️', color: '#F5EDD6', label: 'MVP Goal', title: 'Coarse Estimation', desc: 'Successfully generating approximate height estimates and rankings for 5–10 buildings per scene.' },
  { icon: '📉', color: '#DFE8FF', label: 'Evaluation', title: 'MAE & RMSE Metrics', desc: 'Computing standard error metrics to validate predicted heights against the provided reference samples.' },
  { icon: '🔍', color: '#FFE8DF', label: 'Enhancement', title: 'Visual Comparisons', desc: 'Providing side-by-side visual validations of our model\'s predicted heights versus the ground truth data.' },
]

const steps = [
  { n: '01', title: 'Load Imagery', desc: 'Import pre-aligned SAR and optical image pairs from the SpaceNet-6 Kaggle dataset.' },
  { n: '02', title: 'Fuse Modalities', desc: 'Apply our custom fusion approach to combine radar geometry with optical spatial context.' },
  { n: '03', title: 'Infer Heights', desc: 'Run the image processing model to generate height estimates for 5-10 target buildings.' },
  { n: '04', title: 'Evaluate Errors', desc: 'Calculate MAE/RMSE and export final visualizations for the project summary.' },
]

const bars = [
  { h: 30, val: '12m', age: 'B1' },
  { h: 45, val: '24m', age: 'B2' },
  { h: 65, val: '38m', age: 'B3' },
  { h: 50, val: '28m', age: 'B4' },
  { h: 80, val: '45m', age: 'B5', accent: true },
]

function LandingPage() {
  return (
    <>
      <style>{style}</style>

      {/* NAV */}
      <nav>
        <div className="nav-logo">
          <span className="nav-logo-dot" />
          GeoFusion AI
        </div>
        <ul className="nav-links">
          <li><a href="#features"></a></li>
          <li><a href="#how">Workflow</a></li>
        </ul>
        <Link to="/dashboard" className="nav-cta">View Results →</Link>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="badge">
            <span className="badge-pulse" />
             Multi-Sensor Fusion
          </div>

          <h1 className="hero-title">
            Estimate building<br />
            <em>heights</em> with<br />
            sensor fusion
          </h1>

          <p className="hero-sub">
            Fusing Synthetic Aperture Radar (SAR) and optical imagery using the SpaceNet-6 dataset to infer urban infrastructure heights with minimal error.
          </p>

          <div className="hero-actions">
            <Link to="/dashboard" className="btn-primary">
              View MVP Results
              <span className="btn-arrow">
                <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
            <button className="btn-secondary">
              Read Methodology
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              
            </div>
            <div className="stat-item">
              
            </div>
            <div className="stat-item">
              
              
            </div>
          </div>
        </div>

        {/* Visualization Panel */}
        <div className="hero-right">
          <div className="float-tag float-tag-1">
            <span className="tag-dot" style={{background:'var(--green)'}} />
            MAE / RMSE Validated
          </div>
          <div className="float-tag float-tag-2">
            <span className="tag-dot" style={{background:'var(--orange)'}} />
            SAR + Optical
          </div>

          <div className="viz-card">
            <div className="viz-header">
              <span className="viz-title">Inference Output: Scene 42</span>
              <span className="viz-live"><span className="live-dot"/>Live Fusion</span>
            </div>

            {/* Figures */}
            <div className="human-figure-wrap">
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
                <BuildingSVG height={65} color="var(--line)" />
                <span style={{fontSize:'0.65rem',fontWeight:600,color:'var(--ink-soft)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Ground Truth</span>
                <span style={{fontFamily:'Clash Display,sans-serif',fontWeight:700,fontSize:'0.9rem',color:'var(--ink-soft)'}}>42.0 m</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
                <BuildingSVG height={72} color="var(--accent)" />
                <span style={{fontSize:'0.65rem',fontWeight:600,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Predicted</span>
                <span style={{fontFamily:'Clash Display,sans-serif',fontWeight:700,fontSize:'0.9rem',color:'var(--accent)'}}>45.3 m</span>
              </div>
            </div>

            {/* Bar chart representing MVP buildings */}
            <div className="bar-chart">
              {bars.map((b, i) => (
                <div className="bar-item" key={i}>
                  <div className="bar-val">{b.val}</div>
                  <div
                    className="bar"
                    style={{
                      height: b.h,
                      background: b.accent ? 'var(--accent)' : 'var(--line)',
                      animationDelay: `${i * 0.1 + 0.6}s`
                    }}
                  />
                  <div className="bar-age">{b.age}</div>
                </div>
              ))}
            </div>

            <div className="result-strip">
              <div>
                <div className="result-text">Target Building (B5)</div>
                <div className="result-value">45.3 m</div>
              </div>
              <span className="result-conf">RMSE: 3.3m</span>
            </div>

            <div className="input-row">
              <div className="fake-input">
                <span style={{color: 'var(--accent)'}}>{`{`}</span> SAR + Opt <span style={{color: 'var(--accent)'}}>{`}`}</span> → Fusion
              </div>
              <button className="fake-btn">Run Model</button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="features-header">
          <div>
            <p className="section-label">Track 3 Requirements</p>
            <h2 className="section-title">Fusing modalities for<br />accurate mapping</h2>
          </div>
          <p className="section-desc">
            To estimate heights in urban regions, we leverage the distinct advantages of both sensor types, meeting all MVP requirements for the hackathon.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-cell" key={i}>
              <div className="feature-icon" style={{background:f.color}}>{f.icon}</div>
              <div style={{fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--ink-soft)',marginBottom:'0.4rem'}}>{f.label}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-header">
          <p className="section-label">Suggested Workflow</p>
          <h2 className="section-title" style={{marginBottom:'0.5rem'}}>Our approach to height inference</h2>
          <p style={{color:'var(--ink-soft)',fontWeight:300,fontSize:'0.95rem'}}>From raw SpaceNet-6 datasets to visualized summary slides.</p>
        </div>

        <div className="steps-row">
          {steps.map((s, i) => (
            <div className="step" key={i}>
              <div className="step-num" style={{color:i===0?'var(--accent)':'var(--ink)'}}>{s.n}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="cta-strip" id="start">
        <div>
          <h2 className="cta-title">Check out our final<br/>prediction tables</h2>
          <p className="cta-sub">Review our MVP results, error metrics, and visual comparisons against the ground truth.</p>
        </div>
        <Link to="/dashboard" className="cta-btn">
          View Summary Slide
          <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      {/* FOOTER */}
      <footer>
        <span className="footer-copy">© 2026 GeoFusion AI ·</span>
        <div className="footer-links">
          <a href="#">Kaggle Dataset</a>
          <a href="#">Methodology</a>
          <a href="#">GitHub Repo</a>
        </div>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* 2. ADD YOUR NEW ROUTE DOWN HERE */}
        <Route path="/t_d" element={<Td />} /> 
        <Route path="/advance" element={<Advance/>}/>
      </Routes>
    </Router>
  )
}