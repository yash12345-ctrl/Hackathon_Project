import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useLocation } from 'react-router-dom'; // NEW IMPORT

/* ─── Global Styles (Updated to Light Theme) ────────────────── */
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body, html, #root { width: 100%; height: 100%; background: #F5F6F8; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  
  .pill-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 99px; outline: none; background: #E4DED6; }
  .pill-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #3A5CE8; cursor: pointer; border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.2s; }
  .pill-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
  
  .upload-zone { border: 1.5px dashed #3A5CE8; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; background: #EEF2FF; color: #3A5CE8; position: relative; font-weight: 600; transition: all 0.2s ease; }
  .upload-zone:hover { background: #DFE8FF; }
  .upload-zone input[type=file] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  
  .glass-panel { background: #ffffff; border: 1px solid #E4DED6; border-radius: 16px; color: #1A1612; height: 100%; overflow-y: auto; box-shadow: 2px 0 20px rgba(0,0,0,0.02); }
  
  /* UPDATED: Changed background to #000 for the 3D viewport */
  .viewport-wrap { flex: 1; position: relative; border-radius: 24px; overflow: hidden; margin: 10px; background: #000; border: 1px solid #E4DED6; box-shadow: 0 8px 30px rgba(26,22,18,0.03); }
`;
document.head.append(globalStyle);

/* ─── UI Components ──────────────────────────────────────────── */
function Control({ label, value, min, max, step = 1, onChange, unit = "" }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px', color: '#6B655E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>{label}</span>
        <span style={{ color: '#1A1612' }}>{value}{unit}</span>
      </div>
      <input type="range" className="pill-slider" min={min} max={max} step={step} value={value} onChange={onChange} />
    </div>
  );
}

/* ─── Upgraded Detection Script ─────────────────────────────── */
const CityMap = ({ rawImageData, resolution, sensitivity, maxHeight, maxBlockSize, colorTolerance, heightTolerance }) => {
  const meshRef = useRef();

  const { blocks, colorArray } = useMemo(() => {
    if (!rawImageData) return { blocks: [], colorArray: new Float32Array(0) };
    
    const { data, width, height } = rawImageData;
    const step = Math.max(1, Math.floor(100 / resolution));
    const gridW = Math.ceil(width / step);
    const gridH = Math.ceil(height / step);
    const grid = new Array(gridH).fill(0).map(() => new Array(gridW).fill(null));

    // 1. Precise Sampling with Saturation
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const r = data[i]/255, g = data[i+1]/255, b = data[i+2]/255;
        const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b);
        
        if (brightness > (1 - sensitivity)) {
          const gx = Math.floor(x / step);
          const gy = Math.floor(y / step);
          if (gx < gridW && gy < gridH) {
            grid[gy][gx] = { r, g, b, h: brightness * maxHeight };
          }
        }
      }
    }

    // 2. Multi-Factor Grouping (Color + Height + Size)
    const visited = new Set();
    const regions = [];

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        if (grid[y][x] && !visited.has(`${x},${y}`)) {
          const queue = [[x, y]];
          visited.add(`${x},${y}`);
          const seed = grid[y][x];
          
          let minX = x, maxX = x, minY = y, maxY = y;
          let sumR = 0, sumG = 0, sumB = 0, sumH = 0, count = 0;

          while (queue.length > 0) {
            const [cx, cy] = queue.shift();
            const cell = grid[cy][cx];
            sumR += cell.r; sumG += cell.g; sumB += cell.b; sumH += cell.h; count++;

            [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]].forEach(([nx, ny]) => {
              if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH && grid[ny][nx] && !visited.has(`${nx},${ny}`)) {
                const neighbor = grid[ny][nx];
                
                // Color Diff
                const cDist = Math.sqrt(Math.pow(seed.r-neighbor.r,2)+Math.pow(seed.g-neighbor.g,2)+Math.pow(seed.b-neighbor.b,2));
                
                // Height Diff (Check if neighbor is "slightly taller/shorter")
                const hDist = Math.abs(seed.h - neighbor.h);

                const pMinX = Math.min(minX, nx), pMaxX = Math.max(maxX, nx), pMinY = Math.min(minY, ny), pMaxY = Math.max(maxY, ny);

                // Grouping Logic
                if (cDist < colorTolerance && hDist < heightTolerance && 
                    (pMaxX - pMinX) < maxBlockSize && (pMaxY - pMinY) < maxBlockSize) {
                  minX = pMinX; maxX = pMaxX; minY = pMinY; maxY = pMaxY;
                  visited.add(`${nx},${ny}`);
                  queue.push([nx, ny]);
                }
              }
            });
          }
          regions.push({ minX, maxX, minY, maxY, r: sumR/count, g: sumG/count, b: sumB/count, h: sumH/count });
        }
      }
    }

    // 3. Render Prep
    const tempBlocks = regions.map(r => ({
      x: ((r.minX + r.maxX) / 2) * step - width / 2,
      z: ((r.minY + r.maxY) / 2) * step - height / 2,
      w: (r.maxX - r.minX + 1) * step * 0.94,
      d: (r.maxY - r.minY + 1) * step * 0.94,
      h: Math.max(0.5, r.h), r: r.r, g: r.g, b: r.b
    }));

    const colors = new Float32Array(tempBlocks.length * 3);
    tempBlocks.forEach((b, i) => { 
      const c = new THREE.Color(b.r, b.g, b.b);
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      c.setHSL(hsl.h, Math.min(1, hsl.s * 1.6), hsl.l * 1.1); // High Saturation + Contrast
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b; 
    });
    
    return { blocks: tempBlocks, colorArray: colors };
  }, [rawImageData, resolution, sensitivity, maxHeight, maxBlockSize, colorTolerance, heightTolerance]);

  useEffect(() => {
    if (!blocks.length || !meshRef.current) return;
    const dummy = new THREE.Object3D();
    blocks.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [blocks]);

  return blocks.length ? (
    <instancedMesh ref={meshRef} args={[null, null, blocks.length]}>
      <boxGeometry args={[1, 1, 1]}><instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} /></boxGeometry>
      <meshStandardMaterial vertexColors roughness={0.2} metalness={0.3} emissive="#ffffff" emissiveIntensity={0.05} />
    </instancedMesh>
  ) : null;
};

/* ─── Main App ──────────────────────────────────────────────── */
export default function App() {
  const location = useLocation(); // Hook to access state passed from Dashboard
  
  const [rawImageData, setRawImageData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [res, setRes] = useState(70);
  const [sens, setSens] = useState(0.8);
  const [maxH, setMaxH] = useState(45);
  const [maxB, setMaxB] = useState(6);
  const [cTol, setCTol] = useState(0.12);
  const [hTol, setHTol] = useState(8); 

  // NEW: Process an image URL (either from file upload or passed via state)
  const processImageSource = (src) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Crucial if images are hosted on a different port/domain
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scale = Math.min(1, 320 / Math.max(img.width, img.height));
      canvas.width = img.width * scale; 
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setRawImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      setPreviewUrl(canvas.toDataURL());
    };
    img.src = src;
  };

  // NEW: Check for passed heatmap URL on initial mount
  useEffect(() => {
    if (location.state && location.state.heatmapUrl) {
      processImageSource(location.state.heatmapUrl);
    }
  }, [location.state]);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processImageSource(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', padding: '15px', gap: '15px' }}>
      <div className="glass-panel" style={{ width: '360px', padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '5px', letterSpacing: '-0.02em', fontWeight: 800 }}>3-D Modelling <span style={{color: '#3A5CE8'}}>ULTRA</span></h2>
        <p style={{ fontSize: '10px', color: '#6B655E', fontWeight: 600, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Building Gradient Engine</p>
        
        <div className="upload-zone" style={{ marginBottom: '24px' }}>
          <input type="file" accept="image/*" onChange={onFileChange} />
          {previewUrl ? <img src={previewUrl} style={{ width: '100%', borderRadius: '8px' }} /> : "Upload Satellite Image"}
        </div>

        <Control label="Detail" value={res} unit="%" min={10} max={100} onChange={e => setRes(parseInt(e.target.value))} />
        <Control label="Sensitivity" value={Math.round(sens*100)} unit="%" min={0} max={100} onChange={e => setSens(parseInt(e.target.value)/100)} />
        <Control label="Skyline Height" value={maxH} unit="m" min={5} max={200} onChange={e => setMaxH(parseInt(e.target.value))} />
        <Control label="Max Building Size" value={maxB} min={1} max={25} onChange={e => setMaxB(parseInt(e.target.value))} />
        <Control label="Color Tolerance" value={cTol} step={0.01} min={0.01} max={0.4} onChange={e => setCTol(parseFloat(e.target.value))} />
        <Control label="Height Tolerance" value={hTol} min={1} max={50} onChange={e => setHTol(parseInt(e.target.value))} />

        <div style={{ marginTop: 'auto', background: '#EEF2FF', border: '1px solid #DFE8FF', padding: '12px', borderRadius: '12px', fontSize: '11px', color: '#3A5CE8', lineHeight: 1.5 }}>
          <b style={{ fontWeight: 800 }}>💡 PRO TIP:</b> Increase "Height Tolerance" if your houses are being split into too many small chunks.
        </div>
      </div>

      <div className="viewport-wrap">
        <Canvas>
          <PerspectiveCamera makeDefault position={[180, 180, 180]} />
          <ambientLight intensity={0.7} /> 
          <directionalLight position={[100, 250, 150]} intensity={1.8} />
          <pointLight position={[-100, 100, -100]} intensity={0.8} color="#3A5CE8" />
          <CityMap 
            rawImageData={rawImageData} 
            resolution={res} 
            sensitivity={sens} 
            maxHeight={maxH} 
            maxBlockSize={maxB} 
            colorTolerance={cTol}
            heightTolerance={hTol}
          />
          <OrbitControls makeDefault dampingFactor={0.1} />
        </Canvas>
      </div>
    </div>
  );
}