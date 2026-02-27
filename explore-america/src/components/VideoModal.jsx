import React, { useEffect } from 'react'

export default function VideoModal({ region, onClose }) {
  const open = !!region

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const video = region.video || { type: 'youtube', src: '' }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalBackdrop" onClick={onClose} />
      <div className="modal">
        <div className="modalHeader">
          <div>
            <div className="modalTitle">{region.name}</div>
            <div className="modalSubtitle">{region.tagline}</div>
          </div>
          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="videoWrap">
          {video.type === 'youtube' ? (
            <iframe
              className="video"
              src={video.src}
              title={`${region.name} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video className="video" src={video.src} controls autoPlay />
          )}
        </div>

        <div className="modalBody">
          <p className="modalDesc">{region.description}</p>
          <div className="modalActions">
            <a
              className="btn primary"
              href={video.type === 'youtube' ? video.src : region.video?.src}
              target="_blank"
              rel="noreferrer"
            >
              Watch full story
            </a>
            <button className="btn" onClick={onClose}>Back to globe</button>
          </div>
        </div>
      </div>
    </div>
  )
}
