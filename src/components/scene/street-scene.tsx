"use client";

import {
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  PerspectiveCamera,
  Text,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, type MutableRefObject, useMemo, useRef } from "react";
import * as THREE from "three";
import { useConfiguratorStore } from "@/store/configurator-store";
import { cn } from "@/lib/cn";
import { CarModel } from "./car-model";

interface StreetSceneProps {
  className?: string;
  scrollProgressRef: MutableRefObject<number>;
  interactive: boolean;
}

const lerpSegment = (
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  progress: number,
  target: THREE.Vector3,
): THREE.Vector3 => {
  if (progress < 0.5) {
    target.lerpVectors(a, b, progress / 0.5);
  } else {
    target.lerpVectors(b, c, (progress - 0.5) / 0.5);
  }

  return target;
};

function CinematicCameraRig({
  scrollProgressRef,
  interactive,
}: {
  scrollProgressRef: MutableRefObject<number>;
  interactive: boolean;
}) {
  const { camera } = useThree();

  const start = useMemo(() => new THREE.Vector3(4.8, 1.6, 7.2), []);
  const mid = useMemo(() => new THREE.Vector3(1.1, 1.25, 2.95), []);
  const end = useMemo(() => new THREE.Vector3(-4.3, 1.4, 4.1), []);
  const lookAt = useMemo(() => new THREE.Vector3(0, 0.2, 0), []);
  const tempTarget = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (interactive) {
      return;
    }

    const progress = THREE.MathUtils.clamp(scrollProgressRef.current, 0, 1);
    lerpSegment(start, mid, end, progress, tempTarget.current);

    const smooth = 1 - Math.exp(-delta * 4.5);
    camera.position.lerp(tempTarget.current, smooth);
    camera.lookAt(lookAt);
  });

  return null;
}

function SceneDiagnostics() {
  const modelStatus = useConfiguratorStore((state) => state.modelStatus);
  const activeModelSourceLabel = useConfiguratorStore((state) => state.activeModelSourceLabel);
  const modelErrorMessage = useConfiguratorStore((state) => state.modelErrorMessage);
  const forceModelRetry = useConfiguratorStore((state) => state.forceModelRetry);

  const statusColor =
    modelStatus === "ready"
      ? "#a3ff12"
      : modelStatus === "loading"
        ? "#00f0ff"
        : "#ff2f8f";

  const statusLabel =
    modelStatus === "ready" ? "MODEL ONLINE" : modelStatus === "loading" ? "LOADING" : "MODEL FAIL";

  return (
    <Html position={[-2.7, 1.2, -1.5]} transform distanceFactor={6.5}>
      <div className="glass-panel pointer-events-auto w-[250px] rounded-xl p-3 text-white">
        <p className="telemetry-label text-[9px]" style={{ color: statusColor }}>
          {statusLabel}
        </p>
        <p className="mt-1 font-telemetry text-[10px] uppercase tracking-telemetry text-white/70">
          {activeModelSourceLabel}
        </p>
        {modelErrorMessage ? (
          <p className="mt-2 line-clamp-2 font-telemetry text-[9px] uppercase tracking-telemetry text-neon-pink/90">
            {modelErrorMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => forceModelRetry()}
          className="mt-3 rounded-md border border-neon-blue/60 bg-neon-blue/10 px-2 py-1 font-telemetry text-[10px] tracking-telemetry text-neon-blue"
        >
          RETRY STREAM
        </button>
      </div>
    </Html>
  );
}

function NeonTunnel({ interactive }: { interactive: boolean }) {
  const bars = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => ({
        z: -6 + index * 1.45,
        x: index % 2 === 0 ? 2.6 : -2.6,
      })),
    [],
  );

  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      interactive ? 0.22 : 0,
      3.2,
      delta,
    );
  });

  return (
    <group ref={groupRef}>
      {bars.map((bar, index) => (
        <group key={`${bar.z}-${index}`} position={[bar.x, 0.7, bar.z]}>
          <mesh>
            <boxGeometry args={[0.05, 1.8, 0.28]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? "#00f0ff" : "#ff2f8f"}
              emissive={index % 2 === 0 ? "#00f0ff" : "#ff2f8f"}
              emissiveIntensity={1.2}
              metalness={0.5}
              roughness={0.35}
            />
          </mesh>
        </group>
      ))}

      <Text
        position={[0, 1.65, -1.3]}
        fontSize={0.2}
        color="#7d5cff"
        anchorX="center"
        anchorY="middle"
      >
        PIT-LAB // LIVE
      </Text>
    </group>
  );
}

function SceneContent({
  scrollProgressRef,
  interactive,
}: {
  scrollProgressRef: MutableRefObject<number>;
  interactive: boolean;
}) {
  const underglowColor = useConfiguratorStore((state) => state.underglowColor);
  const lightingMode = useConfiguratorStore((state) => state.lightingMode);
  const modelStatus = useConfiguratorStore((state) => state.modelStatus);

  const floorMetalness = lightingMode === "track" ? 0.9 : lightingMode === "neon" ? 0.82 : 0.72;
  const floorRoughness = lightingMode === "track" ? 0.2 : lightingMode === "neon" ? 0.24 : 0.3;
  const underglowIntensity =
    lightingMode === "track" ? 34 : lightingMode === "neon" ? 28 : modelStatus === "ready" ? 22 : 16;

  return (
    <>
      <PerspectiveCamera makeDefault position={[4.8, 1.6, 7.2]} fov={32} />

      <Environment preset="night" />

      <ambientLight intensity={0.09} color="#1f2a40" />
      <directionalLight
        castShadow
        position={[5.4, 5.8, 3.6]}
        intensity={2.8}
        color="#a7b3ff"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-6, 3.5, -2]} intensity={1.4} color="#ff4fae" />
      <spotLight
        position={[0, 4.8, 4.2]}
        angle={0.42}
        penumbra={0.5}
        intensity={lightingMode === "track" ? 21 : 15}
        color="#66b2ff"
      />

      <rectAreaLight
        position={[0, -0.45, 0.2]}
        width={5.4}
        height={2.2}
        intensity={underglowIntensity}
        color={underglowColor}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      <group position={[0, -0.58, 0]}>
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[28, 28]} />
          <meshStandardMaterial
            color="#06070c"
            roughness={floorRoughness}
            metalness={floorMetalness}
            envMapIntensity={1.1}
          />
        </mesh>
      </group>

      <NeonTunnel interactive={interactive} />

      <Suspense fallback={null}>
        <CarModel />
      </Suspense>

      <ContactShadows
        opacity={0.62}
        blur={2.7}
        far={3.6}
        resolution={1024}
        color={underglowColor}
        scale={5.5}
        position={[0, -0.52, 0]}
      />

      <OrbitControls
        enabled={interactive}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={2.15}
        maxDistance={6.4}
        minPolarAngle={0.72}
        maxPolarAngle={1.68}
        target={[0, 0.2, 0]}
      />

      <SceneDiagnostics />

      <CinematicCameraRig scrollProgressRef={scrollProgressRef} interactive={interactive} />
    </>
  );
}

export function StreetScene({ className, scrollProgressRef, interactive }: StreetSceneProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-0 transition-[filter] duration-500",
        interactive && "pointer-events-auto",
        className,
      )}
    >
      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <SceneContent scrollProgressRef={scrollProgressRef} interactive={interactive} />
      </Canvas>
    </div>
  );
}
