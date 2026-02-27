/**
 * Regions are defined as *approximate* lat/lon rectangles over the USA.
 * This keeps the demo lightweight and dependency-free.
 *
 * You can refine shapes later (GeoJSON -> triangulation) for true state borders.
 */

const regions = [
  {
    id: 'west',
    name: 'West',
    tagline: 'Mountains, deserts, coastlines',
    description: 'Explore iconic landscapes, tech hubs, and the Pacific coastline.',
    // rough box: CA/OR/WA/NV/AZ/UT/ID/MT/WY/CO/NM (approx)
    bounds: { latMin: 31, latMax: 49, lonMin: -125, lonMax: -104 },
    video: { type: 'youtube', src: 'https://www.youtube.com/embed/ysz5S6PUM-U' },
  },
  {
    id: 'southwest',
    name: 'Southwest',
    tagline: 'Canyons, culture, big sky',
    description: 'A region of dramatic geology, vibrant heritage, and wide open spaces.',
    bounds: { latMin: 28, latMax: 37, lonMin: -114, lonMax: -100 },
    video: { type: 'youtube', src: 'https://www.youtube.com/embed/jNQXAC9IVRw' },
  },
  {
    id: 'midwest',
    name: 'Midwest',
    tagline: 'Lakes, plains, and industry',
    description: 'From Great Lakes to farmlands—stories of innovation, grit, and community.',
    bounds: { latMin: 36, latMax: 49, lonMin: -104, lonMax: -82 },
    video: { type: 'youtube', src: 'https://www.youtube.com/embed/oUFJJNQGwhk' },
  },
  {
    id: 'southeast',
    name: 'Southeast',
    tagline: 'Music, beaches, and history',
    description: 'Coastal energy and deep cultural roots across the American South.',
    bounds: { latMin: 24, latMax: 37, lonMin: -92, lonMax: -75 },
    video: { type: 'youtube', src: 'https://www.youtube.com/embed/aqz-KE-bpKQ' },
  },
  {
    id: 'northeast',
    name: 'Northeast',
    tagline: 'Cities, universities, and heritage',
    description: 'Historic towns and dense metros—ideas and culture across generations.',
    bounds: { latMin: 38, latMax: 47, lonMin: -82, lonMax: -66 },
    video: { type: 'youtube', src: 'https://www.youtube.com/embed/tgbNymZ7vqY' },
  },
]

export default regions
