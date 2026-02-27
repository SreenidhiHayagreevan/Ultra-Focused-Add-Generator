import React, { useMemo, useState } from 'react'
import GlobeScene from './components/GlobeScene.jsx'
import VideoModal from './components/VideoModal.jsx'
import regions from './data/regions.js'

export default function App() {
  const [activeRegionId, setActiveRegionId] = useState(null)
  const [hoverRegionId, setHoverRegionId] = useState(null)

  const activeRegion = useMemo(
    () => regions.find(r => r.id === activeRegionId) || null,
    [activeRegionId]
  )
  const hoverRegion = useMemo(
    () => regions.find(r => r.id === hoverRegionId) || null,
    [hoverRegionId]
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-title">Explore America</div>
          <div className="brand-subtitle">
            Hover a region to see its name • Click to watch its story
          </div>
        </div>
        <div className="hint">
          <span className="pill">3D Globe</span>
          <span className="pill">Regions</span>
          <span className="pill">Video</span>
        </div>
      </header>

      <main className="stage">
        <GlobeScene
          regions={regions}
          activeRegionId={activeRegionId}
          hoverRegionId={hoverRegionId}
          onHoverRegion={setHoverRegionId}
          onSelectRegion={setActiveRegionId}
        />

        {/* Tooltip */}
        <div className={`tooltip ${hoverRegion ? 'show' : ''}`}>
          <div className="tooltip-title">{hoverRegion?.name || ''}</div>
          <div className="tooltip-subtitle">{hoverRegion?.tagline || ''}</div>
        </div>

        {/* Bottom panel */}
        <div className="bottom">
          <div className="bottom-card">
            <div className="bottom-title">
              {activeRegion ? activeRegion.name : 'Click a region'}
            </div>
            <div className="bottom-text">
              {activeRegion
                ? activeRegion.description
                : 'The globe will fly to the USA on load. Then you can explore regions.'}
            </div>
            <div className="bottom-actions">
              <button
                className="btn"
                onClick={() => setActiveRegionId(null)}
                disabled={!activeRegion}
                aria-disabled={!activeRegion}
              >
                Reset
              </button>
              <button
                className="btn primary"
                onClick={() => activeRegion && setActiveRegionId(activeRegion.id)}
                disabled={!activeRegion}
                aria-disabled={!activeRegion}
                title={activeRegion ? 'Open video' : 'Select a region first'}
              >
                Play video
              </button>
            </div>
          </div>
        </div>

        <VideoModal region={activeRegion} onClose={() => setActiveRegionId(null)} />
      </main>

      <footer className="footer">
        <span className="muted">Tip:</span> Replace placeholder videos inside <code>src/data/regions.js</code>
      </footer>
    </div>
  )
}
