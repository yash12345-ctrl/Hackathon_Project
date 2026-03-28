import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Dashboard() {
  const [config, setConfig] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)

  // 1. Fetch available tiles and global metrics on load
  useEffect(() => {
    fetch('http://localhost:8000/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data)
        if (data.tiles && data.tiles.length > 0) {
          fetchPrediction(data.tiles[0])
        } else {
          setLoading(false)
        }
      })
      .catch(err => console.error("Error connecting to API:", err))
  }, [])

  // 2. Fetch specific tile data when slider changes
  const fetchPrediction = (tileId) => {
    if (!tileId) return;
    setLoading(true)
    fetch(`http://localhost:8000/api/predict/${tileId}`)
      .then(res => res.json())
      .then(data => {
        setPrediction(data)
        setLoading(false)
      })
  }

  const handleSliderChange = (e) => {
    const newIdx = parseInt(e.target.value)
    setCurrentIndex(newIdx)
    fetchPrediction(config.tiles[newIdx])
  }

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

    :root {
      --bg:        #F4F6FB;
      --surface:   #FFFFFF;
      --border:    #E8ECF4;
      --border2:   #D6DCE8;
      --ink:       #0F172A;
      --ink2:      #475569;
      --ink3:      #94A3B8;
      --blue:      #3B5BDB;
      --blue-lt:   #EEF2FF;
      --blue-mid:  #C5CFFE;
      --green:     #16A34A;
      --green-lt:  #DCFCE7;
      --red:       #DC2626;
      --red-lt:    #FEE2E2;
      --amber:     #D97706;
      --amber-lt:  #FEF3C7;
      --shadow-sm: 0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
      --shadow-md: 0 4px 16px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04);
      --shadow-lg: 0 12px 40px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.05);
    }

    /* ── RESET & WRAPPER ── */
    .dashboard-wrapper {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; height: 100vh; width: 100vw;
      background: var(--bg); color: var(--ink); overflow: hidden;
      font-family: 'Inter', sans-serif;
    }

    /* ─────────────────────────────────────────
       SIDEBAR
    ───────────────────────────────────────── */
    .sidebar {
      width: 268px; flex-shrink: 0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      box-shadow: var(--shadow-sm);
      z-index: 100; overflow-y: auto; overflow-x: hidden;
    }

    /* Brand */
    .brand-logo {
      padding: 1.25rem 1.25rem 1rem;
      display: flex; align-items: center; gap: 0.65rem;
      border-bottom: 1px solid var(--border);
    }
    .brand-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: var(--blue); display: flex; align-items: center;
      justify-content: center; color: #fff;
      font-family: 'JetBrains Mono', monospace; font-weight: 500;
      font-size: 0.78rem; letter-spacing: 0.04em; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(59,91,219,0.35);
    }
    .brand-text-wrap { display: flex; flex-direction: column; }
    .brand-name { font-size: 0.95rem; font-weight: 700; color: var(--ink); letter-spacing: 0.01em; line-height: 1.2; }
    .brand-tag  { font-size: 0.65rem; font-weight: 500; color: var(--blue); letter-spacing: 0.08em; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }

    /* Nav section label */
    .nav-section-label {
      padding: 1rem 1.25rem 0.35rem;
      font-size: 0.62rem; font-weight: 700; color: var(--ink3);
      text-transform: uppercase; letter-spacing: 0.1em;
      font-family: 'JetBrains Mono', monospace;
    }

    .nav-menu { padding: 0.5rem 0.75rem; display: flex; flex-direction: column; gap: 2px; }

    /* UPDATED: NAV ITEM ANIMATIONS */
    .nav-item {
      display: flex; align-items: center; gap: 0.7rem;
      padding: 0.65rem 0.75rem; border-radius: 10px;
      color: var(--ink2); text-decoration: none;
      font-size: 0.84rem; font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      z-index: 1;
    }

    /* Horizontal Slide on Hover */
    .nav-item:hover { 
      background: var(--blue-lt); 
      color: var(--blue);
      transform: translateX(6px);
    }

    /* Circle Pulse Effect */
    .nav-item::after {
      content: '';
      position: absolute;
      left: 20px; /* Positioned behind the icon */
      top: 50%;
      width: 35px;
      height: 35px;
      background: var(--blue-mid);
      border-radius: 50%;
      opacity: 0;
      transform: translate(-50%, -50%) scale(0);
      transition: all 0.4s ease;
      z-index: -1;
    }

    .nav-item:hover::after {
      opacity: 0.25;
      transform: translate(-50%, -50%) scale(1.8);
    }

    .nav-item.active {
      background: var(--blue-lt); color: var(--blue); font-weight: 600;
    }
    
    .nav-item.active::before {
      content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
      width: 3px; background: var(--blue); border-radius: 0 3px 3px 0;
      margin-left: -0.75rem;
    }

    .nav-icon { 
      width: 16px; height: 16px; flex-shrink: 0; opacity: 0.6; 
      transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .nav-item:hover .nav-icon { 
      opacity: 1; 
      transform: scale(1.2) rotate(-8deg); /* Bouncy tilt effect */
    }

    .nav-badge {
      margin-left: auto; background: var(--blue); color: #fff;
      font-size: 0.6rem; font-weight: 700; padding: 1px 6px;
      border-radius: 20px; font-family: 'JetBrains Mono', monospace;
      z-index: 2;
    }

    /* ── MATRIX PANEL ── */
    .matrix-panel {
      margin: 0.75rem; border-radius: 14px;
      background: var(--blue-lt); border: 1px solid var(--blue-mid);
      padding: 1rem 1.1rem; flex-shrink: 0;
    }
    .matrix-title {
      font-size: 0.65rem; font-weight: 700; color: var(--blue);
      text-transform: uppercase; letter-spacing: 0.1em;
      font-family: 'JetBrains Mono', monospace; margin-bottom: 0.75rem;
      display: flex; align-items: center; gap: 0.4rem;
    }
    .matrix-title::before {
      content: ''; display: inline-block; width: 6px; height: 6px;
      border-radius: 50%; background: var(--blue);
      animation: pulse-dot 2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.7); }
    }
    .matrix-grid { display: flex; flex-direction: column; gap: 8px; }
    .matrix-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 0; border-bottom: 1px solid var(--blue-mid);
    }
    .matrix-row:last-child { border-bottom: none; padding-bottom: 0; }
    .matrix-key { font-size: 0.72rem; color: var(--ink2); font-weight: 500; }
    .matrix-val {
      font-size: 0.8rem; font-weight: 700;
      font-family: 'JetBrains Mono', monospace; color: var(--blue);
    }
    .matrix-val.good  { color: var(--green); }
    .matrix-val.warn  { color: var(--amber); }
    .matrix-val.bad   { color: var(--red); }

    /* Mini bar */
    .mini-bar-track {
      width: 60px; height: 5px; background: var(--blue-mid);
      border-radius: 3px; overflow: hidden;
    }
    .mini-bar-fill {
      height: 100%; background: var(--blue); border-radius: 3px;
      transition: width 0.6s ease;
    }
    .mini-bar-fill.good { background: var(--green); }

    /* ── USER PROFILE ── */
    .user-profile {
      margin: auto 0 0; padding: 1rem; border-top: 1px solid var(--border);
      display: flex; align-items: center; gap: 0.75rem;
      background: var(--bg);
    }
    .avatar {
      width: 36px; height: 36px; background: var(--blue-lt); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; color: var(--blue);
      border: 2px solid var(--blue-mid); flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; min-width: 0; }
    .user-name { font-size: 0.82rem; font-weight: 700; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 0.65rem; color: var(--blue); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; font-family: 'JetBrains Mono', monospace; }

    /* ─────────────────────────────────────────
       TOP BAR
    ───────────────────────────────────────── */
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .topbar {
      background: var(--surface); border-bottom: 1px solid var(--border);
      padding: 0 2.5rem; height: 58px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: var(--shadow-sm);
    }
    .topbar-left { display: flex; flex-direction: column; justify-content: center; }
    .topbar-title { font-size: 1.05rem; font-weight: 700; color: var(--ink); line-height: 1.2; }
    .topbar-crumb {
      font-size: 0.68rem; color: var(--ink3); font-family: 'JetBrains Mono', monospace;
      display: flex; align-items: center; gap: 4px; margin-top: 1px;
    }
    .topbar-crumb span { color: var(--blue); }

    .topbar-right { display: flex; align-items: center; gap: 0.75rem; }

    .topbar-chip {
      display: flex; align-items: center; gap: 0.45rem;
      background: var(--bg); border: 1px solid var(--border2);
      border-radius: 20px; padding: 5px 12px;
      font-size: 0.75rem; font-weight: 600; color: var(--ink2);
    }
    .topbar-chip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .dot-green { background: var(--green); box-shadow: 0 0 0 2px var(--green-lt); animation: pulse-dot 2s infinite; }
    .dot-blue  { background: var(--blue);  box-shadow: 0 0 0 2px var(--blue-lt); }

    .topbar-icon-btn {
      width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border2);
      background: var(--surface); display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--ink2); transition: all 0.15s;
    }
    .topbar-icon-btn:hover { background: var(--bg); color: var(--ink); border-color: var(--blue-mid); }

    /* ─────────────────────────────────────────
       PAGE BODY
    ───────────────────────────────────────── */
    .page-body { flex: 1; overflow-y: auto; padding: 2rem 2.5rem; }

    .header-section {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 2rem; gap: 1.5rem; flex-wrap: wrap;
    }
    .page-title { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.25rem; color: var(--ink); letter-spacing: -0.02em; }
    .page-subtitle { color: var(--ink2); margin: 0; font-size: 0.88rem; font-weight: 400; }

    .metrics-container { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .metric-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
      padding: 1rem 1.25rem; min-width: 140px;
      box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
    }
    .metric-card::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0;
      height: 3px; border-radius: 0 0 14px 14px;
    }
    .metric-card.c-red::after   { background: var(--red); }
    .metric-card.c-blue::after  { background: var(--blue); }
    .metric-card.c-green::after { background: var(--green); }
    .metric-label { font-size: 0.67rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink3); margin-bottom: 0.35rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .metric-value { font-size: 1.65rem; font-weight: 800; letter-spacing: -0.02em; }

    /* ── VIEWER PANEL ── */
    .viewer-panel {
      background: var(--surface); border: 1px solid var(--border); border-radius: 20px;
      padding: 2rem; box-shadow: var(--shadow-md);
    }

    .slider-header { display: flex; justify-content: space-between; margin-bottom: 0.65rem; align-items: center; }
    .slider-title  { font-size: 0.88rem; font-weight: 700; color: var(--ink); }
    .slider-info   { font-size: 0.78rem; color: var(--ink2); background: var(--bg); padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 600; font-family: 'JetBrains Mono', monospace; border: 1px solid var(--border); }

    input[type="range"] {
      -webkit-appearance: none; width: 100%; height: 5px;
      background: var(--border); border-radius: 5px; outline: none; margin-bottom: 1.75rem;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none; width: 18px; height: 18px;
      border-radius: 50%; background: var(--blue); cursor: pointer;
      box-shadow: 0 0 0 3px rgba(59,91,219,0.2); transition: transform 0.15s;
    }
    input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.25); }

    /* ── AI PIPELINE ── */
    .ai-pipeline {
      display: flex; align-items: stretch; justify-content: space-between;
      gap: 1.5rem; position: relative; min-height: 480px; padding-top: 1rem;
    }
    .col-inputs { flex: 1.2; display: flex; flex-direction: column; justify-content: space-between; gap: 1.5rem; z-index: 2; }
    .col-outputs { flex: 1.5; display: flex; flex-direction: column; justify-content: center; gap: 1.5rem; z-index: 2; }
    .col-center { flex: 0.8; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; }

    .sensor-card {
      background: #111; border: 1px solid var(--border); border-radius: 16px;
      padding: 0.5rem; position: relative; overflow: hidden;
      box-shadow: var(--shadow-md); transition: all 0.3s ease;
    }
    .sensor-card img { width: 100%; height: auto; border-radius: 12px; display: block; opacity: 0.9; transition: opacity 0.3s; }
    .is-loading .sensor-card img { opacity: 0.3; }

    .sensor-label {
      position: absolute; top: 1rem; left: 1rem; background: rgba(0,0,0,0.7); color: #fff;
      padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.05em; text-transform: uppercase; backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.15); z-index: 20;
    }

    .scanner { position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: #3A5CE8; box-shadow: 0 0 15px 3px rgba(58,92,232,0.8); opacity: 0; z-index: 10; pointer-events: none; }
    .is-loading .scanner { opacity: 1; animation: scan-anim 1.5s ease-in-out infinite alternate; }
    @keyframes scan-anim { 0% { top: 0%; } 100% { top: calc(100% - 2px); } }

    .output-card { border-color: #DFE8FF; background: #fff; box-shadow: 0 15px 40px rgba(58,92,232,0.10); }
    .is-loading .output-card img { opacity: 0.5; filter: grayscale(50%); }
    .output-card .scanner { background: #3AAD6E; box-shadow: 0 0 20px 3px rgba(58,173,110,0.7); }
    .output-label { background: #fff; color: #1A1612; border-color: #E4DED6; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }

    .interactive-heatmap { transition: transform 0.2s, box-shadow 0.2s; display: block; }
    .interactive-heatmap:hover { transform: translateY(-4px); box-shadow: 0 15px 40px rgba(58,92,232,0.25); cursor: pointer; }
    .interactive-heatmap:hover img { filter: brightness(1.1); }

    .ai-core {
      position: relative; width: 80px; height: 80px; background: var(--surface);
      border: 2px solid var(--border2); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; color: var(--ink);
      font-weight: 800; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
      box-shadow: var(--shadow-md); transition: all 0.4s ease; z-index: 5;
    }
    .ai-ring   { position: absolute; inset: -15px; border: 2px dashed var(--border2); border-radius: 50%; animation: spin 15s linear infinite; opacity: 0.8; }
    .ai-ring-2 { position: absolute; inset: -35px; border: 1px solid var(--border); border-radius: 50%; animation: spin 20s linear infinite reverse; opacity: 0.4; }
    .is-loading .ai-core { background: var(--blue); color: #fff; border-color: var(--blue-mid); box-shadow: 0 0 40px rgba(59,91,219,0.5); transform: scale(1.1); }
    .is-loading .ai-ring { border-color: var(--blue); border-style: solid; border-top-color: transparent; border-bottom-color: transparent; animation-duration: 2s; opacity: 1; }
    .is-loading .ai-ring-2 { border-color: rgba(59,91,219,0.3); border-width: 2px; animation-duration: 4s; opacity: 1; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .conn-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .conn-path { fill: none; stroke: var(--border2); stroke-width: 2; }
    .conn-path-flow { fill: none; stroke: var(--blue); stroke-width: 4; stroke-dasharray: 15 20; stroke-dashoffset: 100; opacity: 0; transition: opacity 0.3s; }
    .is-loading .conn-path-flow { opacity: 1; animation: flow 0.6s linear infinite; }
    @keyframes flow { to { stroke-dashoffset: 0; } }

    .output-stats {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.85rem;
      background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem;
    }
    .stat-box { display: flex; flex-direction: column; gap: 0.25rem; }
    .stat-title { font-size: 0.67rem; color: var(--ink3); text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .stat-val { font-size: 1.5rem; font-weight: 800; color: var(--ink); letter-spacing: -0.02em; }
    .stat-val.primary { color: var(--blue); font-size: 1.9rem; }
    .stat-val.success { color: var(--green); }
    .stat-val.danger  { color: var(--red); }
  `

  // Live matrix values derived from prediction / config
  const mae  = config?.metrics?.mae  ?? null
  const rmse = config?.metrics?.rmse ?? null
  const acc  = config?.metrics?.acc_2m ?? null

  return (
    <div className="dashboard-wrapper">
      <style>{customStyles}</style>

      {/* ══════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════ */}
      <aside className="sidebar">

        {/* Brand */}
        <div className="brand-logo">
          <div className="brand-icon">AI</div>
          <div className="brand-text-wrap">
            <span className="brand-name">Geo Fusion AI</span>
            <span className="brand-tag">Live</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="nav-section-label">Navigation</div>
        <nav className="nav-menu">
          <Link to="/" className="nav-item">
            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Overview
          </Link>
          <Link to="/inference" className="nav-item active">
            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            AI Model
            <span className="nav-badge">LIVE</span>
          </Link>
          <Link to="/t_d" className="nav-item">
            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            3-D Modelling
          </Link>
          <Link to="/Advance" className="nav-item">
            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            GIS View
          </Link>
        </nav>

        {/* ── MATRIX PANEL ── */}
        <div className="nav-section-label">Model Matrix</div>
        <div className="matrix-panel">
          <div className="matrix-title">Live Metrics</div>
          <div className="matrix-grid">

            {/* MAE */}
            <div className="matrix-row">
              <span className="matrix-key">MAE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="mini-bar-track">
                  <div className="mini-bar-fill" style={{ width: mae !== null ? `${Math.min((mae / 5) * 100, 100)}%` : '0%', background: mae !== null && mae < 2 ? 'var(--green)' : 'var(--amber)' }} />
                </div>
                <span className={`matrix-val ${mae === null ? '' : mae < 2 ? 'good' : 'warn'}`}>
                  {mae !== null ? `${mae.toFixed(2)}m` : '—'}
                </span>
              </div>
            </div>

            {/* RMSE */}
            <div className="matrix-row">
              <span className="matrix-key">RMSE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="mini-bar-track">
                  <div className="mini-bar-fill" style={{ width: rmse !== null ? `${Math.min((rmse / 8) * 100, 100)}%` : '0%' }} />
                </div>
                <span className="matrix-val">{rmse !== null ? `${rmse.toFixed(2)}m` : '—'}</span>
              </div>
            </div>

            {/* Accuracy */}
            <div className="matrix-row">
              <span className="matrix-key">Acc &lt;2m</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="mini-bar-track">
                  <div className="mini-bar-fill good" style={{ width: acc !== null ? `${acc}%` : '0%' }} />
                </div>
                <span className={`matrix-val ${acc !== null && acc >= 80 ? 'good' : acc !== null && acc >= 60 ? 'warn' : 'bad'}`}>
                  {acc !== null ? `${acc.toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>

            {/* Current tile error */}
            <div className="matrix-row">
              <span className="matrix-key">Tile Error</span>
              <span className={`matrix-val ${prediction ? (prediction.error <= 2 ? 'good' : prediction.error <= 4 ? 'warn' : 'bad') : ''}`}>
                {prediction ? `${prediction.error.toFixed(2)}m` : '—'}
              </span>
            </div>

            {/* Tile predicted */}
            <div className="matrix-row">
              <span className="matrix-key">Predicted</span>
              <span className="matrix-val">{prediction ? `${prediction.predicted.toFixed(1)}m` : '—'}</span>
            </div>

            {/* Ground truth */}
            <div className="matrix-row">
              <span className="matrix-key">Ground Truth</span>
              <span className="matrix-val">{prediction ? `${prediction.actual.toFixed(1)}m` : '—'}</span>
            </div>

          </div>
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="avatar">YT</div>
          <div className="user-info">
            <span className="user-name">Yash Tomar</span>
            <span className="user-role">Student</span>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════
          MAIN CONTENT
      ══════════════════════════════ */}
      <main className="main-content">

        {/* ── TOP BAR ── */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Inference Dashboard</div>
            <div className="topbar-crumb">
              SpaceNet Core &rsaquo; AI Model &rsaquo; <span>Live Feed</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Pipeline status */}
            <div className="topbar-chip">
              <div className="topbar-chip-dot dot-green" />
              Pipeline Active
            </div>

            {/* Tile counter */}
            {config?.tiles && (
              <div className="topbar-chip">
                <div className="topbar-chip-dot dot-blue" />
                {config.tiles.length} Tiles Loaded
              </div>
            )}

            {/* Notification icon */}
            <button className="topbar-icon-btn">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Settings icon */}
            <button className="topbar-icon-btn">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── PAGE BODY ── */}
        <div className="page-body">

          {/* HEADER & METRICS */}
          <header className="header-section">
            <div>
              <h1 className="page-title">Inference Dashboard</h1>
              <p className="page-subtitle">Live AI evaluation pipeline for SpaceNet-6 datasets.</p>
            </div>

            {config?.tiles?.length > 0 && (
              <div className="metrics-container">
                {[
                  { label: 'Overall MAE',    val: `${config.metrics.mae.toFixed(2)}m`,    color: '#DC2626', cls: 'c-red'   },
                  { label: 'Overall RMSE',   val: `${config.metrics.rmse.toFixed(2)}m`,   color: '#3B5BDB', cls: 'c-blue'  },
                  { label: 'Accuracy (<2m)', val: `${config.metrics.acc_2m.toFixed(1)}%`, color: '#16A34A', cls: 'c-green' }
                ].map((m, i) => (
                  <div key={i} className={`metric-card ${m.cls}`}>
                    <div className="metric-label">{m.label}</div>
                    <div className="metric-value" style={{ color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>
            )}
          </header>

          {/* MAIN VIEWER PANEL */}
          <section className="viewer-panel">

            {config?.tiles?.length > 0 && (
              <div>
                <div className="slider-header">
                  <span className="slider-title">Data Feed Selection</span>
                  <span className="slider-info">
                    {config.tiles[currentIndex]} · {currentIndex + 1}/{config.tiles.length}
                  </span>
                </div>
                <input
                  type="range" min="0" max={config.tiles.length - 1}
                  value={currentIndex} onChange={handleSliderChange}
                />
              </div>
            )}

            {config && (!config.tiles || config.tiles.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: '#FFF4F0', borderRadius: '16px', border: '1px dashed #DC2626' }}>
                <h2 style={{ color: '#DC2626', marginBottom: '0.5rem' }}>⚠️ Dataset Not Found</h2>
                <p style={{ color: '#475569' }}>The API could not find data in the <strong>SpaceNet_20_Samples</strong> folder.</p>
              </div>
            ) : !prediction && loading ? (
              <div style={{ textAlign: 'center', padding: '6rem 0', color: '#475569', fontWeight: 600 }}>Initializing AI Pipeline…</div>
            ) : (
              <div className={`ai-pipeline ${loading ? 'is-loading' : ''}`}>

                {/* INPUTS */}
                <div className="col-inputs">
                  <div className="sensor-card">
                    <div className="sensor-label">Ch 1: SAR Radar</div>
                    <div className="scanner"></div>
                    <img src={prediction ? prediction.images.sar : ''} alt="SAR" />
                  </div>
                  <div className="sensor-card">
                    <div className="sensor-label">Ch 2: Optical RGB</div>
                    <div className="scanner"></div>
                    <img src={prediction ? prediction.images.rgb : ''} alt="RGB" />
                  </div>
                </div>

                {/* AI CORE */}
                <div className="col-center">
                  <svg className="conn-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path className="conn-path" d="M 0,25 C 25,25 25,50 50,50" vectorEffect="non-scaling-stroke" />
                    <path className="conn-path" d="M 0,75 C 25,75 25,50 50,50" vectorEffect="non-scaling-stroke" />
                    <path className="conn-path" d="M 50,50 C 75,50 75,50 100,50" vectorEffect="non-scaling-stroke" />
                    <path className="conn-path-flow" d="M 0,25 C 25,25 25,50 50,50" vectorEffect="non-scaling-stroke" />
                    <path className="conn-path-flow" d="M 0,75 C 25,75 25,50 50,50" vectorEffect="non-scaling-stroke" />
                    <path className="conn-path-flow" d="M 50,50 C 75,50 75,50 100,50" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div className="ai-core">
                    <div className="ai-ring"></div>
                    <div className="ai-ring-2"></div>
                    CORE
                  </div>
                </div>

                {/* OUTPUTS */}
                <div className="col-outputs">
                  <Link to="/t_d" state={{ heatmapUrl: prediction ? prediction.images.heatmap : null }} style={{ textDecoration: 'none' }}>
                    <div className="sensor-card output-card interactive-heatmap">
                      <div className="sensor-label output-label">Target: Prediction Heatmap</div>
                      <div className="scanner"></div>
                      <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#3B5BDB', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, zIndex: 30 }}>
                        CLICK TO 3D VIEW ✨
                      </div>
                      <img src={prediction ? prediction.images.heatmap : ''} alt="Heatmap" />
                    </div>
                  </Link>

                  {prediction && (
                    <div className="output-stats">
                      <div className="stat-box">
                        <span className="stat-title">Predicted Height</span>
                        <span className="stat-val primary">{prediction.predicted.toFixed(2)}m</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-title">Ground Truth</span>
                        <span className="stat-val">{prediction.actual.toFixed(2)}m</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-title">Absolute Error</span>
                        <span className={`stat-val ${prediction.error <= 2.0 ? 'success' : 'danger'}`}>
                          {prediction.error.toFixed(2)}m
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}