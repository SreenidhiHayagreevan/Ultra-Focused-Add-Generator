import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

// Convert lat/lon to a point on a sphere (radius r)
function latLonToVec3(latDeg, lonDeg, r) {
  const lat = THREE.MathUtils.degToRad(latDeg)
  const lon = THREE.MathUtils.degToRad(lonDeg)
  // y = sin(lat), xz around lon
  const x = r * Math.cos(lat) * Math.cos(lon)
  const y = r * Math.sin(lat)
  const z = r * Math.cos(lat) * Math.sin(lon)
  return new THREE.Vector3(x, y, z)
}

/**
 * Builds a simple "spherical rectangle" patch (two triangles) from lat/lon bounds.
 * This is approximate but looks great for a demo and is lightweight.
 */
function buildPatchGeometry(bounds, radius = 1.205) {
  const { latMin, latMax, lonMin, lonMax } = bounds

  const v1 = latLonToVec3(latMin, lonMin, radius)
  const v2 = latLonToVec3(latMax, lonMin, radius)
  const v3 = latLonToVec3(latMax, lonMax, radius)
  const v4 = latLonToVec3(latMin, lonMax, radius)

  const positions = new Float32Array([
    // tri 1: v1, v2, v3
    v1.x, v1.y, v1.z,
    v2.x, v2.y, v2.z,
    v3.x, v3.y, v3.z,
    // tri 2: v1, v3, v4
    v1.x, v1.y, v1.z,
    v3.x, v3.y, v3.z,
    v4.x, v4.y, v4.z,
  ])

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.computeVertexNormals()
  return geom
}

export default function RegionPatch({
  region,
  isActive,
  isHover,
  onHover,
  onSelect,
}) {
  const meshRef = useRef()

  const geometry = useMemo(() => buildPatchGeometry(region.bounds), [region.bounds])

  const baseColor = useMemo(() => new THREE.Color('#7cc3ff'), [])
  const hoverColor = useMemo(() => new THREE.Color('#b7f3ff'), [])
  const activeColor = useMemo(() => new THREE.Color('#ffffff'), [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material

    // animate opacity + emissive on hover/active
    const targetOpacity = isActive ? 0.38 : isHover ? 0.26 : 0.12
    mat.opacity += (targetOpacity - mat.opacity) * clamp(delta * 6, 0, 1)

    const targetIntensity = isActive ? 1.25 : isHover ? 0.85 : 0.35
    mat.emissiveIntensity += (targetIntensity - mat.emissiveIntensity) * clamp(delta * 6, 0, 1)

    // color lerp
    const targetColor = isActive ? activeColor : isHover ? hoverColor : baseColor
    mat.color.lerp(targetColor, clamp(delta * 6, 0, 1))
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover?.(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        onHover?.(false)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
    >
      <meshStandardMaterial
        transparent
        opacity={0.12}
        color={'#7cc3ff'}
        emissive={'#2a6cff'}
        emissiveIntensity={0.35}
        roughness={0.35}
        metalness={0.05}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
