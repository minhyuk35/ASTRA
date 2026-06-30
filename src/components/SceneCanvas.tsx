"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface StarLayerProps {
  count: number;
  spread: number;
  rotationSpeed: number;
  pointSize: number;
  opacity: number;
  mouseX: number;
  mouseY: number;
  parallaxStrength: number;
  reducedMotion: boolean;
}

function StarLayer({
  count,
  spread,
  rotationSpeed,
  pointSize,
  opacity,
  mouseX,
  mouseY,
  parallaxStrength,
  reducedMotion,
}: StarLayerProps) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = spread * (0.4 + Math.random() * 0.6);
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, spread]);

  useFrame((_, delta) => {
    if (reducedMotion || !ref.current) return;
    ref.current.rotation.y += rotationSpeed * delta;
    ref.current.rotation.x += rotationSpeed * 0.3 * delta;
    // Subtle mouse parallax
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      ref.current.rotation.y + mouseX * parallaxStrength * 0.0008,
      0.018
    );
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      ref.current.rotation.x + mouseY * parallaxStrength * 0.0005,
      0.018
    );
  });

  if (count === 0) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={pointSize}
        color="#cce8ff"
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        depthTest={false}   // stars are in a sphere — no depth needed
      />
    </points>
  );
}

function Scene({
  mouseX,
  mouseY,
  reducedMotion,
}: {
  mouseX: number;
  mouseY: number;
  reducedMotion: boolean;
}) {
  const { size } = useThree();
  const isMobile = size.width < 768;

  // Adaptive counts: reduce on mobile and for reduced-motion users
  const farCount  = reducedMotion ? 600 : isMobile ? 1800 : 3500;
  const nearCount = reducedMotion ? 0   : isMobile ? 200  : 600;

  return (
    <>
      {/* No lights — pointsMaterial doesn't respond to lighting */}
      <StarLayer
        count={farCount}
        spread={90}
        rotationSpeed={0.012}
        pointSize={0.07}
        opacity={0.65}
        mouseX={mouseX}
        mouseY={mouseY}
        parallaxStrength={0.4}
        reducedMotion={reducedMotion}
      />
      <StarLayer
        count={nearCount}
        spread={45}
        rotationSpeed={0.022}
        pointSize={0.11}
        opacity={0.45}
        mouseX={mouseX}
        mouseY={mouseY}
        parallaxStrength={0.9}
        reducedMotion={reducedMotion}
      />
    </>
  );
}

export default function SceneCanvas({
  mouseX = 0,
  mouseY = 0,
  reducedMotion = false,
}: {
  mouseX?: number;
  mouseY?: number;
  reducedMotion?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      gl={{
        antialias: !reducedMotion,
        alpha: false,
        powerPreference: reducedMotion ? "default" : "high-performance",
        stencil: false,
        depth: false,       // no depth buffer — pure particle scene
      }}
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}   // adaptive DPR: drops to 0.5× if FPS falls
      frameloop={reducedMotion ? "demand" : "always"}
      style={{ background: "#050508" }}
    >
      <Scene mouseX={mouseX} mouseY={mouseY} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
