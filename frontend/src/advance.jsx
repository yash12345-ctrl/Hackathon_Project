import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/* ─── OSM Overpass Fetching ─────────────────────────────── */
const OVERPASS_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

const ROTTERDAM_BBOX = [51.892, 4.467, 51.924, 4.500];

async function fetchOSMBuildings(bbox) {
  const [south, west, north, east] = bbox;
  const query = `
    [out:json][timeout:25][maxsize:16000000];
    (
      way["building"](${south},${west},${north},${east});
    );
    out body 800;
    >;
    out skel qt;
  `;
  const body = `data=${encodeURIComponent(query)}`;

  let lastErr;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 28000); 
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.elements?.length === 0) throw new Error('Empty response');
      return parseOSMData(data);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`All Overpass endpoints failed: ${lastErr?.message}`);
}

function parseOSMData(data) {
  const nodes = {};
  data.elements.forEach(el => {
    if (el.type === 'node') nodes[el.id] = [el.lat, el.lon];
  });

  const buildings = [];
  data.elements.forEach(el => {
    if (el.type !== 'way' || !el.tags?.building) return;
    const coords = el.nodes.map(nid => nodes[nid]).filter(Boolean);
    if (coords.length < 3) return;

    const tags = el.tags;
    const heightTagged = parseFloat(tags['building:height'] || tags['height']);
    const levels = parseInt(tags['building:levels']);

    const TYPE_LEVELS = {
      house: 2, residential: 3, apartments: 5, detached: 2, terrace: 2,
      semidetached_house: 2, bungalow: 1, cabin: 1, farm: 1,
      commercial: 3, retail: 2, supermarket: 1, kiosk: 1,
      office: 6, hotel: 8, hospital: 4, school: 3, university: 4,
      church: 4, cathedral: 6, chapel: 2, temple: 2, mosque: 3,
      industrial: 2, warehouse: 2, factory: 3, hangar: 1, garage: 1,
      shed: 1, greenhouse: 1, roof: 1, carport: 1,
      civic: 4, public: 3, government: 4, stadium: 4,
      train_station: 3, transportation: 2,
      tower: 12, skyscraper: 30,
      yes: 3, generic: 3,
    };

    let height, heightSource, estimatedLevels;
    if (!isNaN(heightTagged)) {
      height = Math.round(heightTagged * 10) / 10;
      heightSource = 'Tagged';
      estimatedLevels = Math.round(heightTagged / 3.0);
    } else if (!isNaN(levels)) {
      height = Math.round(levels * 3.0 * 10) / 10;
      heightSource = 'Estimated (floors)';
      estimatedLevels = levels;
    } else {
      const typeKey = (tags.building === 'yes'
        ? (tags.amenity || tags.shop || tags.office || tags.tourism || 'yes')
        : tags.building || 'yes'
      ).toLowerCase().replace(/ /g, '_');
      const defaultLevels = TYPE_LEVELS[typeKey] ?? TYPE_LEVELS['yes'];
      height = Math.round(defaultLevels * 3.0 * 10) / 10;
      estimatedLevels = defaultLevels;
      heightSource = 'Estimated (type)';
    }

    const rawDate = tags['start_date'] || tags['year_of_construction'] || tags['construction_date'];
    const year = rawDate ? parseInt(rawDate.substring(0, 4)) : null;
    const area = calcPolygonArea(coords);
    const typeRaw = tags.building === 'yes' ? (tags.amenity || tags.shop || tags.office || 'generic') : tags.building;
    const typeLabel = capitalize(typeRaw.replace(/_/g, ' '));

    buildings.push({
      id: el.id,
      coords,
      height,
      heightSource,
      levels: estimatedLevels,
      type: typeLabel,
      name: tags.name || null,
      area: Math.round(area),
      year,
      material: tags['building:material'] || null,
      postcode: tags['addr:postcode'] || null,
      street: tags['addr:street'] || null,
      housenumber: tags['addr:housenumber'] || null,
    });
  });

  return buildings;
}

function calcPolygonArea(coords) {
  const R = 6378137; 
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = coords[i][1] * (Math.PI / 180) * R * Math.cos(coords[i][0] * Math.PI / 180);
    const yi = coords[i][0] * (Math.PI / 180) * R;
    const xj = coords[j][1] * (Math.PI / 180) * R * Math.cos(coords[j][0] * Math.PI / 180);
    const yj = coords[j][0] * (Math.PI / 180) * R;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area / 2);
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ─── Stats Calculator ───────────────────────────────────── */
function calcStats(buildings) {
  const withHeight = buildings.filter(b => b.height !== null);
  const withYear = buildings.filter(b => b.year !== null);
  const tagged = buildings.filter(b => b.heightSource === 'Tagged');
  const estimated = buildings.filter(b => b.heightSource === 'Estimated');

  const avgHeight = withHeight.length
    ? withHeight.reduce((s, b) => s + b.height, 0) / withHeight.length
    : 0;
  const maxHeight = withHeight.length
    ? Math.max(...withHeight.map(b => b.height))
    : 0;
  const tallest = withHeight.find(b => b.height === maxHeight);
  const totalArea = buildings.reduce((s, b) => s + b.area, 0);

  const yearBuckets = {};
  withYear.forEach(b => {
    const decade = Math.floor(b.year / 10) * 10;
    yearBuckets[decade] = (yearBuckets[decade] || 0) + 1;
  });

  return {
    total: buildings.length,
    withHeight: withHeight.length,
    avgHeight: Math.round(avgHeight * 10) / 10,
    maxHeight: Math.round(maxHeight * 10) / 10,
    tallest,
    totalArea,
    taggedCount: tagged.length,
    estimatedCount: estimated.length,
    yearBuckets,
  };
}

/* ─── Color Scale ─────────────────────────────────────────── */
function getHeightColor(height, useHeatmap) {
  if (!useHeatmap || height === null) return { stroke: '#3A5CE8', fill: '#3A5CE8' };
  if (height > 40) return { stroke: '#E8633A', fill: '#E8633A' };
  if (height > 20) return { stroke: '#C9A84C', fill: '#C9A84C' };
  if (height > 10) return { stroke: '#56B0A0', fill: '#56B0A0' };
  return { stroke: '#3AAD6E', fill: '#3AAD6E' };
}

/* ─── Legend Pill ─────────────────────────────────────────── */
const legendItems = [
  { label: '> 40m', color: '#E8633A' },
  { label: '20–40m', color: '#C9A84C' },
  { label: '10–20m', color: '#56B0A0' },
  { label: '< 10m', color: '#3AAD6E' },
  { label: 'Unknown', color: '#3A5CE8' },
];

/* ─── Global Styles ─────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .gis-root {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    display: flex; height: 100vh; width: 100vw;
    background: #0D0F14; color: #E2E8F0; overflow: hidden;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 240px; flex-shrink: 0;
    background: #FFFFFF; border-right: 1px solid #E2E8F0;
    display: flex; flex-direction: column; z-index: 1000;
  }
  .brand {
    padding: 1.5rem 1.25rem; display: flex; align-items: center; gap: 0.75rem;
    border-bottom: 1px solid #E2E8F0;
  }
  .brand-icon {
    width: 34px; height: 34px; background: #3A5CE8; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.05em;
    font-family: 'DM Mono', monospace;
  }
  .brand-name { font-size: 0.9rem; font-weight: 700; color: #1A202C; letter-spacing: 0.04em; }
  .brand-sub { font-size: 0.65rem; color: #718096; font-family: 'DM Mono', monospace; margin-top: 1px; }

  .nav { flex: 1; padding: 1.5rem 0.75rem; display: flex; flex-direction: column; gap: 2px; }
  .nav-item {
    display: flex; align-items: center; gap: 0.65rem; padding: 0.7rem 0.75rem;
    border-radius: 8px; color: #4A5568; text-decoration: none;
    font-size: 0.82rem; font-weight: 600; transition: all 0.15s;
  }
  .nav-item:hover { background: #EDF2F7; color: #2D3748; }
  .nav-item.active { background: rgba(58, 92, 232, 0.15); color: #3A5CE8; }
  .nav-icon { width: 16px; height: 16px; flex-shrink: 0; }

  /* Stats sidebar footer */
  .sidebar-stats {
    padding: 1rem; border-top: 1px solid #E2E8F0; display: flex; flex-direction: column; gap: 8px;
  }
  .stat-chip {
    background: #EDF2F7; border-radius: 8px; padding: 8px 10px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .stat-chip-label { font-size: 0.68rem; color: #718096; font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.06em; }
  .stat-chip-value { font-size: 0.95rem; font-weight: 700; color: #3A5CE8; font-family: 'DM Mono', monospace; }

  /* ── MAP AREA ── */
  .map-area { flex: 1; position: relative; }
  .leaflet-container { width: 100%; height: 100%; background: #0D0F14; }

  /* ── FLOATING PANELS ── */
  .panel {
    position: absolute; background: rgba(17, 19, 24, 0.92);
    backdrop-filter: blur(12px); border: 1px solid #1E2130;
    border-radius: 14px; z-index: 400;
  }

  /* Layer Controls */
  .panel-layers { top: 16px; right: 16px; width: 260px; padding: 16px; }
  .panel-title {
    font-size: 0.65rem; font-weight: 700; color: #4A5568;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;
    font-family: 'DM Mono', monospace;
  }
  .toggle-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .toggle-label { font-size: 0.82rem; font-weight: 600; color: #A0AEC0; display: flex; align-items: center; gap: 6px; }
  .switch { position: relative; display: inline-block; width: 40px; height: 22px; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider-track {
    position: absolute; cursor: pointer; inset: 0;
    background: #1E2130; transition: .25s; border-radius: 22px;
  }
  .slider-track:before {
    position: absolute; content: ""; height: 16px; width: 16px;
    left: 3px; bottom: 3px; background: #4A5568;
    transition: .25s; border-radius: 50%;
  }
  input:checked + .slider-track { background: #3A5CE8; }
  input:checked + .slider-track:before { background: #fff; transform: translateX(18px); }

  /* Legend */
  .panel-legend { bottom: 16px; right: 16px; padding: 14px 16px; }
  .legend-items { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
  .legend-row { display: flex; align-items: center; gap: 8px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
  .legend-text { font-size: 0.72rem; color: #A0AEC0; font-family: 'DM Mono', monospace; }

  /* Loading Overlay */
  .loading-overlay {
    position: absolute; inset: 0; background: rgba(13, 15, 20, 0.85);
    backdrop-filter: blur(6px); z-index: 999;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  }
  .spinner {
    width: 44px; height: 44px; border: 3px solid #1E2130;
    border-top-color: #3A5CE8; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-title { font-size: 0.9rem; font-weight: 700; color: #7C9EFF; }
  .loading-sub { font-size: 0.72rem; color: #4A5568; font-family: 'DM Mono', monospace; }

  /* Error Banner */
  .error-banner {
    position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
    background: rgba(45,17,17,0.95); border: 1px solid #6B2020; border-radius: 10px;
    padding: 10px 18px; z-index: 500; font-size: 0.82rem; color: #FC8181;
    display: flex; gap: 10px; align-items: center; max-width: 520px;
    backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  .error-dismiss { background: none; border: none; color: #718096; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0 2px; }
  .error-dismiss:hover { color: #FC8181; }

  /* Refresh Button */
  .btn-refresh {
    position: absolute; top: 16px; left: 16px;
    background: rgba(17, 19, 24, 0.92); backdrop-filter: blur(12px);
    border: 1px solid #1E2130; border-radius: 10px; padding: 9px 14px;
    font-size: 0.78rem; font-weight: 600; color: #7C9EFF; cursor: pointer;
    z-index: 400; display: flex; align-items: center; gap: 6px; transition: border-color 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-refresh:hover { border-color: #3A5CE8; }

  /* ── POPUP ── */
  .leaflet-popup-content-wrapper {
    background: #111318 !important; border: 1px solid #1E2130 !important;
    border-radius: 12px !important; box-shadow: 0 12px 40px rgba(0,0,0,0.5) !important;
    padding: 0 !important; overflow: hidden;
  }
  .leaflet-popup-tip-container { display: none; }
  .leaflet-popup-content { margin: 0 !important; width: 230px !important; }
  .popup-header {
    background: #1A1F2E; padding: 10px 14px; border-bottom: 1px solid #1E2130;
  }
  .popup-name { font-size: 0.88rem; font-weight: 700; color: #E2E8F0; }
  .popup-type { font-size: 0.68rem; color: #4A5568; font-family: 'DM Mono', monospace; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
  .popup-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
  .popup-row { display: flex; justify-content: space-between; align-items: center; }
  .popup-label { font-size: 0.72rem; color: #4A5568; font-family: 'DM Mono', monospace; }
  .popup-value { font-size: 0.82rem; font-weight: 700; color: #E2E8F0; }
  .popup-value.accent { color: #7C9EFF; font-family: 'DM Mono', monospace; }
  .popup-value.green { color: #48BB78; }
  .popup-value.yellow { color: #ECC94B; }
  .popup-value.red { color: #FC8181; }
  .popup-divider { border: none; border-top: 1px solid #1E2130; }
  .source-badge {
    display: inline-block; padding: 2px 6px; border-radius: 4px;
    font-size: 0.65rem; font-family: 'DM Mono', monospace; font-weight: 600;
  }
  .source-tagged { background: rgba(72,187,120,0.15); color: #48BB78; }
  .source-estimated\ \(floors\) { background: rgba(236,201,75,0.15); color: #ECC94B; }
  .source-estimated\ \(type\) { background: rgba(160,118,220,0.15); color: #B794F4; }
  .source-unknown { background: rgba(74,85,104,0.2); color: #718096; }
  .badge-tagged { background: rgba(72,187,120,0.15); color: #48BB78; }
  .badge-floors { background: rgba(236,201,75,0.15); color: #ECC94B; }
  .badge-type { background: rgba(160,118,220,0.15); color: #B794F4; }

  .leaflet-popup-close-button { color: #4A5568 !important; top: 8px !important; right: 10px !important; }
`;

/* ─── Main Component ─────────────────────────────────────── */
export default function AdvanceGIS() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Connecting to Overpass API…');
  const [error, setError] = useState(null);
  const [layers, setLayers] = useState({ optical: true, sar: false, footprints: true, heatmap: true });

  const rotterdamCenter = [51.908, 4.483];

  const loadBuildings = useCallback(async (keepExisting = false) => {
    setLoading(true);
    if (!keepExisting) setError(null);
    setLoadingMsg('Connecting to Overpass API…');
    const msgs = [
      'Trying overpass.private.coffee…',
      'Trying overpass-api.de…',
      'Trying kumi.systems…',
      'Trying maps.mail.ru…',
      'Trying openstreetmap.ru…',
    ];
    let msgIdx = 0;
    const msgTimer = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, msgs.length - 1);
      setLoadingMsg(msgs[msgIdx]);
    }, 8000);
    try {
      const data = await fetchOSMBuildings(ROTTERDAM_BBOX);
      setBuildings(data);
      setError(null); 
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(msgTimer);
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBuildings(); }, [loadBuildings]);

  const stats = useMemo(() => calcStats(buildings), [buildings]);

  const toggleLayer = (key) => setLayers(p => ({ ...p, [key]: !p[key] }));

  const heightLabel = (b) => {
    if (b.height !== null) return `${b.height.toFixed(1)} m`;
    return '—';
  };

  const heightClass = (b) => {
    if (b.heightSource === 'Tagged') return 'green';
    if (b.heightSource === 'Estimated (floors)') return 'yellow';
    if (b.heightSource === 'Estimated (type)') return 'purple'; 
    return '';
  };

  return (
    <div className="gis-root">
      <style>{CSS}</style>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">AI</div>
          <div>
            <div className="brand-name">Geo Fusion AI</div>
            <div className="brand-sub">OSM · Rotterdam</div>
          </div>
        </div>

        <nav className="nav">
          <Link to="/advance" className="nav-item active">
            <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            GIS Explorer
          </Link>
        </nav>

        {/* Live Stats */}
        <div className="sidebar-stats">
          <div className="stat-chip">
            <span className="stat-chip-label">Buildings</span>
            <span className="stat-chip-value">{loading ? '…' : stats.total.toLocaleString()}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-label">Avg Height</span>
            <span className="stat-chip-value">{loading ? '…' : `${stats.avgHeight}m`}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-label">Max Height</span>
            <span className="stat-chip-value">{loading ? '…' : `${stats.maxHeight}m`}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-label">OSM Tagged</span>
            <span className="stat-chip-value">
              {loading ? '…' : stats.taggedCount}
            </span>
          </div>
        </div>
      </aside>

      {/* ── MAP AREA ── */}
      <div className="map-area">

        {/* Refresh Button */}
        <button className="btn-refresh" onClick={() => loadBuildings(true)} disabled={loading}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh OSM
        </button>

        {/* Layer Panel */}
        <div className="panel panel-layers">
          <div className="panel-title">Base Layers</div>
          <div className="toggle-row">
            <span className="toggle-label">📸 Optical (OSM)</span>
            <label className="switch">
              <input type="checkbox" checked={layers.optical} onChange={() => toggleLayer('optical')} />
              <span className="slider-track"></span>
            </label>
          </div>
          <div className="toggle-row">
            <span className="toggle-label">🌑 Dark (CARTO)</span>
            <label className="switch">
              <input type="checkbox" checked={layers.sar} onChange={() => toggleLayer('sar')} />
              <span className="slider-track"></span>
            </label>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #1E2130', margin: '12px 0' }} />
          <div className="panel-title">OSM Data Layers</div>
          <div className="toggle-row">
            <span className="toggle-label">🏢 Building Footprints</span>
            <label className="switch">
              <input type="checkbox" checked={layers.footprints} onChange={() => toggleLayer('footprints')} />
              <span className="slider-track"></span>
            </label>
          </div>
          <div className="toggle-row">
            <span className="toggle-label">🔥 Height Heatmap</span>
            <label className="switch">
              <input type="checkbox" checked={layers.heatmap} onChange={() => toggleLayer('heatmap')} disabled={!layers.footprints} />
              <span className="slider-track"></span>
            </label>
          </div>
        </div>

        {/* Legend */}
        {layers.heatmap && layers.footprints && (
          <div className="panel panel-legend">
            <div className="panel-title">Height Scale</div>
            <div className="legend-items">
              {legendItems.map(item => (
                <div className="legend-row" key={item.label}>
                  <div className="legend-dot" style={{ background: item.color }} />
                  <span className="legend-text">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <span>⚠</span>
            <span style={{ flex: 1 }}>{error}</span>
            <button style={{ background: 'none', border: '1px solid #6B2020', borderRadius: 6, color: '#FC8181', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', padding: '3px 10px' }}
              onClick={() => loadBuildings(true)}>Retry</button>
            <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <div className="loading-title">Fetching OSM Data</div>
            <div className="loading-sub">{loadingMsg}</div>
          </div>
        )}

        {/* LEAFLET MAP */}
        <MapContainer center={rotterdamCenter} zoom={15} zoomControl={true} style={{ height: '100%', width: '100%' }}>

          {layers.optical && !layers.sar && (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
          )}
          {layers.sar && (
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="© CARTO"
            />
          )}
          {!layers.sar && !layers.optical && (
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
              attribution="© CARTO"
            />
          )}

          {/* Real OSM Building Polygons */}
          {layers.footprints && buildings.map(building => {
            const { stroke, fill } = getHeightColor(building.height, layers.heatmap);
            return (
              <Polygon
                key={building.id}
                positions={building.coords}
                pathOptions={{
                  color: stroke,
                  fillColor: fill,
                  fillOpacity: layers.heatmap ? 0.55 : 0.2,
                  weight: 1.5,
                }}
              >
                <Popup closeButton={true} maxWidth={250}>
                  <div>
                    <div className="popup-header">
                      <div className="popup-name">{building.name || `OSM #${building.id}`}</div>
                      <div className="popup-type">{building.type}</div>
                    </div>
                    <div className="popup-body">
                      {/* Height */}
                      <div className="popup-row">
                        <span className="popup-label">height</span>
                        <span className={`popup-value accent ${heightClass(building)}`}>
                          {heightLabel(building)}
                        </span>
                      </div>
                      {/* Height source */}
                      <div className="popup-row">
                        <span className="popup-label">source</span>
                        <span className={`source-badge ${
                          building.heightSource === 'Tagged' ? 'badge-tagged' :
                          building.heightSource === 'Estimated (floors)' ? 'badge-floors' :
                          'badge-type'
                        }`}>
                          {building.heightSource}
                        </span>
                      </div>
                      <hr className="popup-divider" />
                      {/* Area */}
                      <div className="popup-row">
                        <span className="popup-label">footprint area</span>
                        <span className="popup-value">{building.area.toLocaleString()} m²</span>
                      </div>
                      {/* Year */}
                      {building.year && (
                        <div className="popup-row">
                          <span className="popup-label">year built</span>
                          <span className="popup-value">{building.year}</span>
                        </div>
                      )}
                      {/* Material */}
                      {building.material && (
                        <div className="popup-row">
                          <span className="popup-label">material</span>
                          <span className="popup-value">{building.material}</span>
                        </div>
                      )}
                      {/* Address */}
                      {building.street && (
                        <div className="popup-row">
                          <span className="popup-label">address</span>
                          <span className="popup-value" style={{ fontSize: '0.75rem', textAlign: 'right' }}>
                            {[building.street, building.housenumber].filter(Boolean).join(' ')}
                            {building.postcode ? `, ${building.postcode}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
                <Tooltip sticky direction="top" offset={[0, -5]}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem' }}>
                    {building.name || building.type} · {heightLabel(building)}
                  </span>
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}