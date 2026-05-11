import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const getGearParticle = (i, count, time, target, color) => {
  const size = 58;
  const teeth = 24;
  const width = 42;
  const helix = 3.5;
  const spin = 0.75;
  const toothDepth = 13;
  const pi2 = Math.PI * 2;
  const n = count > 1 ? i / (count - 1) : 0;
  const layer = Math.floor(n * 260);
  const local = n * 260 - layer;

  const side = local < 0.5 ? -1 : 1;
  const z = side * width * 0.5 + Math.sin(n * pi2 * 17 + time) * 0.8;
  const k = layer / 260;
  const baseA = k * pi2 * teeth;
  const twist = z * 0.038 * helix;
  const a = baseA + twist + time * spin;

  const wave = Math.cos(baseA);
  const toothShape = Math.pow(Math.abs(wave), 0.32);
  const ridge = 0.5 + 0.5 * toothShape;
  const root = size * 0.58;
  const tip = root + toothDepth * ridge;
  const flank = Math.sin(baseA * 2 + z * 0.08 * helix);
  const bore = 1 - 0.16 * Math.abs(Math.sin(n * pi2 * 11 + time * spin));
  const r = (tip + flank * 1.7) * bore;

  target.set(Math.cos(a) * r, Math.sin(a) * r, z);

  const hue = (0.36 + 0.12 * Math.sin(a * 0.45 + z * 0.04) + time * 0.015) % 1;
  const light = 0.36 + 0.14 * ridge + 0.04 * Math.sin(z * 0.2 + a);
  color.setHSL(hue < 0 ? hue + 1 : hue, 0.9, Math.min(0.58, light));
};

const createParticleTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const ParticleSwarm = () => {
  const pointsRef = useRef(null);
  const count = 14000;
  const target = useMemo(() => new THREE.Vector3(), []);
  const particleColor = useMemo(() => new THREE.Color(), []);
  const particleTexture = useMemo(() => createParticleTexture(), []);

  const { geometry, positions, colors } = useMemo(() => {
    const initialPositions = new Float32Array(count * 3);
    const initialColors = new Float32Array(count * 3);
    const initialTarget = new THREE.Vector3();
    const initialColor = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      getGearParticle(i, count, 0, initialTarget, initialColor);
      const offset = i * 3;
      initialPositions[offset] = initialTarget.x;
      initialPositions[offset + 1] = initialTarget.y;
      initialPositions[offset + 2] = initialTarget.z;
      initialColors[offset] = initialColor.r;
      initialColors[offset + 1] = initialColor.g;
      initialColors[offset + 2] = initialColor.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(initialPositions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(initialColors, 3).setUsage(THREE.DynamicDrawUsage),
    );

    return {
      geometry: particleGeometry,
      positions: initialPositions,
      colors: initialColors,
    };
  }, [count]);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;
    const time = state.clock.getElapsedTime();
    const positionAttribute = points.geometry.getAttribute('position');
    const colorAttribute = points.geometry.getAttribute('color');

    for (let i = 0; i < count; i += 1) {
      getGearParticle(i, count, time, target, particleColor);
      const offset = i * 3;

      positions[offset] += (target.x - positions[offset]) * 0.18;
      positions[offset + 1] += (target.y - positions[offset + 1]) * 0.18;
      positions[offset + 2] += (target.z - positions[offset + 2]) * 0.18;

      colors[offset] += (particleColor.r - colors[offset]) * 0.12;
      colors[offset + 1] += (particleColor.g - colors[offset + 1]) * 0.12;
      colors[offset + 2] += (particleColor.b - colors[offset + 2]) * 0.12;
    }

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    points.rotation.z = Math.sin(time * 0.18) * 0.08;
    points.rotation.x = Math.sin(time * 0.12) * 0.12;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      frustumCulled={false}
    >
      <pointsMaterial
        attach="material"
        map={particleTexture}
        vertexColors
        size={0.82}
        sizeAttenuation
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
};

function HeroScene() {
  return (
    <>
      <color attach="background" args={['#030308']} />
      <ParticleSwarm />
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.35}
        enableZoom={false}
        enablePan={false}
        makeDefault
      />
    </>
  );
}

export default function HomeHeroCanvas() {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', display: 'block' }}
      camera={{ position: [0, 0, 100], fov: 60, near: 0.1, far: 500 }}
      gl={{
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      frameloop="always"
      onCreated={({ gl }) => {
        gl.setClearColor('#030308', 1);
        if ('outputColorSpace' in gl) {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      <HeroScene />
    </Canvas>
  );
}
