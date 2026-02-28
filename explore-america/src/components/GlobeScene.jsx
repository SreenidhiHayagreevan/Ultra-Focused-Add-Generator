import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import RegionPatch from './RegionPatch.jsx'

function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 2]} intensity={1.0} />
      <pointLight position={[-6, -3, -4]} intensity={0.6} />
    </>
  )
}

function Earth({ onReady }) {
  const ref = useRef()
  useEffect(() => {
    if (onReady) onReady(ref)
  }, [onReady])

  // A simple, premium-ish material without textures (keeps this downloadable/offline).
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2a6cff'),
      roughness: 0.75,
      metalness: 0.05,
      emissive: new THREE.Color('#0b1b3a'),
      emissiveIntensity: 0.35,
    })
    return m
  }, [])

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <sphereGeometry args={[1.2, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function Atmosphere() {
  // subtle glow shell
  return (
    <mesh>
      <sphereGeometry args={[1.23, 64, 64]} />
      <meshBasicMaterial color={'#5aa9ff'} transparent opacity={0.08} />
    </mesh>
  )
}

function CameraDirector({ targetUSA = true, controlsRef }) {
  // Handles intro: rotate globe -> fly camera to USA -> stop.
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!targetUSA || done) return
    if (!controlsRef.current) return

    const controls = controlsRef.current
    // Starting pose
    controls.object.position.set(0, 0.4, 4.2)
    controls.target.set(0, 0, 0)
    controls.update()

    // USA-ish camera target: slightly left on globe, north hemisphere.
    // We'll rotate camera around so the Americas are front-facing.
    const tl = gsap.timeline({
      onComplete: () => setDone(true),
    })

    tl.to(controls.object.position, {
      duration: 2.2,
      x: 1.55,
      y: 0.55,
      z: 2.65,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    }, 0)

    tl.to(controls.target, {
      duration: 2.2,
      x: 0.15,
      y: 0.10,
      z: 0,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    }, 0)

    return () => tl.kill()
  }, [targetUSA, done, controlsRef])

  return null
}

function AutoRotate({ enabled = true }) {
  const group = useRef()
  useFrame((_, delta) => {
    if (!enabled || !group.current) return
    group.current.rotation.y += delta * 0.12
  })
  return <group ref={group} />
}

function SceneContent({
  regions,
  activeRegionId,
  hoverRegionId,
  onHoverRegion,
  onSelectRegion,
}) {
  const controlsRef = useRef()

  // We keep auto-rotation for the first ~3 seconds then stop (cinematic intro)
  const [autoRotate, setAutoRotate] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setAutoRotate(false), 3200)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Stars radius={60} depth={50} count={2500} factor={4} fade speed={1} />
      <fog attach="fog" args={['#050812', 7, 13]} />
      <Lights />

      <group rotation={[0, 0.35, 0]}>
        <group rotation={[0, Math.PI * 0.2, 0]}>
          <Earth />
          <Atmosphere />

          {regions.map((r) => (
            <RegionPatch
              key={r.id}
              region={r}
              isActive={r.id === activeRegionId}
              isHover={r.id === hoverRegionId}
              onHover={(on) => onHoverRegion(on ? r.id : null)}
              onSelect={() => onSelectRegion(r.id)}
            />
          ))}
        </group>
      </group>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={2.1}
        maxDistance={6.5}
        rotateSpeed={0.35}
        zoomSpeed={0.7}
      />
      <CameraDirector controlsRef={controlsRef} />
      {/* Soft auto-rotation after intro stop is handled by orbit controls user interaction */}
      {/* We simulate initial motion by rotating the whole scene via group in RegionPatch + director */}
      {autoRotate ? <SlowSpin /> : null}
    </>
  )
}

function SlowSpin() {
  const ref = useRef()
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.22
  })
  return <group ref={ref} />
}

export default function GlobeScene(props) {
  return (
    <div className="canvasWrap">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 4.2], fov: 48, near: 0.1, far: 200 }}
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  )
}
