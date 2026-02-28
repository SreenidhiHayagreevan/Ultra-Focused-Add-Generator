# Explore America (3D Globe + Regions + Video)

A lightweight, downloadable demo of the “Explore America” concept:
- 3D globe in space
- Cinematic fly-to-USA camera move on load
- Hover highlights + tooltip for USA regions (approximate lat/lon patches)
- Click region to open a video modal (YouTube placeholders)

## Run locally

```bash
npm install
npm run dev
```

## Customize

- Replace region bounds and videos in `src/data/regions.js`
- For true state borders: use GeoJSON + triangulation (advanced)

## Notes

This project intentionally avoids external assets (textures) so it runs offline once dependencies are installed.
