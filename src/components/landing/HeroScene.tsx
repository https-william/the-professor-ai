"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text, MeshTransmissionMaterial, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";

/* ─── Floating Glass Letter ────────────────────────────────────────────────── */
function GlassLetter({
  char,
  position,
  rotation,
  speed = 1,
  strikethrough = true,
}: {
  char: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  speed?: number;
  strikethrough?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime * speed;
    groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.15;
    groupRef.current.rotation.y = Math.cos(t * 0.2) * 0.2;
    groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.1;
  });

  return (
    <Float
      speed={1.5 * speed}
      rotationIntensity={0.4}
      floatIntensity={0.8}
      floatingRange={[-0.3, 0.3]}
    >
      <group ref={groupRef} position={position} rotation={rotation || [0, 0, 0]}>
        {/* Letter */}
        <Text
          font="/fonts/Inter-Bold.woff"
          fontSize={1.8}
          fontWeight={800}
          anchorX="center"
          anchorY="middle"
        >
          <MeshTransmissionMaterial
            backside
            samples={3}
            thickness={0.4}
            chromaticAberration={0.15}
            anisotropy={0.3}
            distortion={0.2}
            distortionScale={0.4}
            temporalDistortion={0.1}
            ior={1.5}
            color="#F59E0B"
            roughness={0.1}
            transmission={0.95}
            opacity={0.7}
            transparent
          />
          {char}
        </Text>

        {/* Diagonal strikethrough line */}
        {strikethrough && (
          <mesh rotation={[0, 0, -0.6]} position={[0, 0, 0.1]}>
            <boxGeometry args={[2.8, 0.08, 0.05]} />
            <meshStandardMaterial
              color="#EF4444"
              emissive="#EF4444"
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>
        )}
      </group>
    </Float>
  );
}

/* ─── Floating Glass Orb ───────────────────────────────────────────────────── */
function GlassOrb({
  position,
  size = 0.4,
  color = "#F59E0B",
  speed = 1,
}: {
  position: [number, number, number];
  size?: number;
  color?: string;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * speed;
    meshRef.current.position.y = position[1] + Math.sin(t) * 0.3;
    meshRef.current.position.x = position[0] + Math.cos(t * 0.7) * 0.2;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      <MeshTransmissionMaterial
        backside
        samples={2}
        thickness={0.3}
        chromaticAberration={0.1}
        anisotropy={0.2}
        distortion={0.15}
        distortionScale={0.3}
        temporalDistortion={0.05}
        ior={1.4}
        color={color}
        roughness={0.05}
        transmission={0.97}
        opacity={0.5}
        transparent
      />
    </mesh>
  );
}

/* ─── Particle Field ───────────────────────────────────────────────────────── */
function ParticleField() {
  const count = 80;
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#F59E0B"
        size={0.03}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/* ─── Main Scene ───────────────────────────────────────────────────────────── */
function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#F59E0B" />
      <pointLight position={[-5, -3, 3]} intensity={0.8} color="#6366F1" />
      <pointLight position={[0, 3, -5]} intensity={0.5} color="#F59E0B" />
      <directionalLight position={[0, 5, 5]} intensity={0.4} color="#fff" />

      {/* Floating crossed-out ABC letters */}
      <GlassLetter char="A" position={[-3.5, 1.5, -2]} speed={0.7} />
      <GlassLetter char="B" position={[3.8, -0.5, -1.5]} speed={0.9} />
      <GlassLetter char="C" position={[-1.5, -2, -3]} speed={0.6} />

      {/* Glass orbs scattered around */}
      <GlassOrb position={[4, 2, -2]} size={0.35} color="#F59E0B" speed={0.8} />
      <GlassOrb position={[-4.5, -1, -1]} size={0.5} color="#6366F1" speed={0.6} />
      <GlassOrb position={[2, -2.5, -2.5]} size={0.25} color="#F59E0B" speed={1.1} />
      <GlassOrb position={[-2.5, 3, -3]} size={0.4} color="#6366F1" speed={0.7} />
      <GlassOrb position={[0, 1.5, -4]} size={0.3} color="#F59E0B" speed={0.9} />

      {/* Particle dust */}
      <ParticleField />
    </>
  );
}

/* ─── Exported Component ───────────────────────────────────────────────────── */
export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0" style={{ pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 1.2]}
        gl={{
          antialias: false, // Performance win: disabled antialias as we have high pixel density
          alpha: true,
          powerPreference: "high-performance",
          depth: false, // Performance win: we don't need depth testing for this specific overlay scene
        }}
        style={{ background: "transparent" }}
      >
        <PerformanceMonitor onDecline={() => console.log('Performance declined, scaling down...')} />
        <Scene />
      </Canvas>
    </div>
  );
}
