import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

const ParticleSwarm = () => {
  const meshRef = useRef(null);
  const count = 20000;
  const speedMult = 1;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  const color = pColor;

  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i += 1) {
      pos.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
        ),
      );
    }
    return pos;
  }, [count]);

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true }),
    [],
  );
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.25), []);

  const PARAMS = useMemo(
    () => ({
      gearSize: 70,
      gearTeeth: 24,
      gearWidth: 45,
      gearHelix: 3.2,
      gearSpin: 0.8,
      gearDepth: 10,
    }),
    [],
  );
  const addControl = (id, _l, _min, _max, val) =>
    PARAMS[id] !== undefined ? PARAMS[id] : val;
  const setInfo = () => {};
  const annotate = () => {};

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(count * 3),
        3,
      );
    }
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;

    if (material.uniforms && material.uniforms.uTime) {
      material.uniforms.uTime.value = time;
    }

    for (let i = 0; i < count; i += 1) {
      const size = addControl('gearSize', 'Tamaño', 20, 120, 70);
      const teeth = addControl('gearTeeth', 'Dientes', 8, 40, 24);
      const width = addControl('gearWidth', 'Ancho', 10, 100, 45);
      const helix = addControl('gearHelix', 'Ángulo helicoidal', 0, 8, 3.2);
      const spin = addControl('gearSpin', 'Rotación', 0, 3, 0.8);
      const toothDepth = addControl('gearDepth', 'Profundidad diente', 1, 25, 10);

      const pi2 = 6.28318530718;
      const n = count > 1 ? i / (count - 1) : 0;
      const layer = Math.floor(n * 220.0);
      const local = n * 220.0 - layer;

      const side = local < 0.5 ? -1.0 : 1.0;
      const z = side * width * 0.5 + Math.sin(n * pi2 * 17.0 + time) * 0.4;

      const k = layer / 220.0;
      const baseA = k * pi2 * teeth;
      const t = time * spin;
      const twist = z * 0.035 * helix;
      const a = baseA + twist + t;

      const wave = Math.cos(baseA);
      const toothShape = Math.pow(Math.abs(wave), 0.35);
      const ridge = 0.5 + 0.5 * toothShape;
      const root = size * 0.58;
      const tip = root + toothDepth * ridge;

      const flank = Math.sin(baseA * 2.0 + z * 0.08 * helix);
      const r = tip + flank * 1.4;

      const boreMix = Math.sin(n * pi2 * 11.0 + t);
      const bore = 1.0 - 0.18 * Math.abs(boreMix);
      const rr = r * bore;

      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;

      target.set(x, y, z);

      const h =
        (0.58 + 0.18 * Math.sin(a * 0.7 + z * 0.05) + time * 0.02) % 1.0;
      const l =
        0.38 + 0.22 * ridge + 0.08 * Math.sin(z * 0.2 + a);
      color.setHSL(h, 0.82, l);

      if (i === 0) {
        setInfo(
          'Engranaje Helicoidal',
          'Partículas formando dientes inclinados con torsión helicoidal animada.',
        );
        annotate('gearAxis', target, 'eje helicoidal');
      }

      positions[i].lerp(target, 0.1);
      dummy.position.copy(positions[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
};

function HeroScene() {
  const { size } = useThree();
  const bloomRes = useMemo(
    () => new THREE.Vector2(size.width, size.height),
    [size.width, size.height],
  );

  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 45, 220]} />
      <ParticleSwarm />
      <OrbitControls autoRotate autoRotateSpeed={0.35} enableZoom={false} />
      <Effects multisamping={0} disableGamma>
        <unrealBloomPass args={[bloomRes, 1.8, 0.4, 0]} />
      </Effects>
    </>
  );
}

export default function HomeHeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 100], fov: 60 }}
      gl={{ antialias: false, alpha: false }}
      dpr={[1, 2]}
    >
      <HeroScene />
    </Canvas>
  );
}
