"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { getCarById, type CarId } from "@/lib/car-catalog";
import { useConfiguratorStore } from "@/store/configurator-store";

interface WheelEntry {
  mesh: THREE.Mesh;
  initialRotationZ: number;
  side: number;
}

const MATERIAL_EXCLUDE_PATTERN = /(glass|window|tire|tyre|chrome|light|emissive|interior)/i;
const MATERIAL_BODY_PATTERN =
  /(body|paint|carpaint|chassis|door|hood|bonnet|fender|panel|bumper|material_)/i;
const WHEEL_PATTERN = /(wheel|rim|tire|tyre|brake|disc)/i;
const HOOD_PATTERN = /(hood|bonnet)/i;

const MODEL_TRANSFORMS: Record<
  CarId,
  {
    y: number;
    scale: number;
    rotationY: number;
  }
> = {
  "legend-911": { y: 0, scale: 1, rotationY: Math.PI },
  "street-buggy": { y: 0, scale: 1, rotationY: Math.PI },
  "neo-toy": { y: 0, scale: 1, rotationY: Math.PI },
  "midnight-hauler": { y: 0, scale: 1, rotationY: Math.PI },
};

const LOADER_CACHE = new Map<string, Promise<GLTF>>();

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  return await new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Timeout loading ${label}`));
    }, ms);

    promise
      .then((result) => {
        window.clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
};

const loadGLTF = (url: string): Promise<GLTF> => {
  const cached = LOADER_CACHE.get(url);
  if (cached) {
    return cached;
  }

  const loader = new GLTFLoader();
  loader.setCrossOrigin("anonymous");

  const task = loader.loadAsync(url).catch((error) => {
    LOADER_CACHE.delete(url);
    throw error;
  });

  LOADER_CACHE.set(url, task);
  return task;
};

const toMaterialArray = (
  material: THREE.Material | THREE.Material[] | undefined,
): THREE.Material[] => {
  if (!material) {
    return [];
  }

  return Array.isArray(material) ? material : [material];
};

const cloneMeshMaterials = (scene: THREE.Group) => {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return;
    }

    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => material.clone());
    } else if (object.material) {
      object.material = object.material.clone();
    }
  });
};

const normalizeScene = (scene: THREE.Group) => {
  const bounds = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bounds.getSize(size);
  bounds.getCenter(center);

  if (!Number.isFinite(size.x + size.y + size.z) || size.lengthSq() === 0) {
    return;
  }

  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.position.y -= bounds.min.y;

  const maxDim = Math.max(size.x, size.y, size.z);
  const targetDim = 3.1;
  const scaleFactor = targetDim / maxDim;
  scene.scale.multiplyScalar(scaleFactor);
};

const releaseScene = (scene: THREE.Group | null) => {
  if (!scene) {
    return;
  }

  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return;
    }

    if (object.geometry) {
      object.geometry.dispose();
    }

    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose());
    } else if (object.material) {
      object.material.dispose();
    }
  });
};

export function CarModel() {
  const carId = useConfiguratorStore((state) => state.carId);
  const paintColor = useConfiguratorStore((state) => state.paintColor);
  const finishType = useConfiguratorStore((state) => state.finishType);
  const rideHeight = useConfiguratorStore((state) => state.rideHeight);
  const camber = useConfiguratorStore((state) => state.camber);
  const carbonHood = useConfiguratorStore((state) => state.carbonHood);
  const wheelStyle = useConfiguratorStore((state) => state.wheelStyle);
  const modelRetryToken = useConfiguratorStore((state) => state.modelRetryToken);
  const setModelRuntime = useConfiguratorStore((state) => state.setModelRuntime);

  const [scene, setScene] = useState<THREE.Group | null>(null);

  const bodyOffsetRef = useRef<THREE.Group>(null);
  const wheelMeshesRef = useRef<WheelEntry[]>([]);
  const paintMaterialsRef = useRef<Set<THREE.MeshStandardMaterial>>(new Set());
  const hoodMaterialsRef = useRef<Set<THREE.MeshStandardMaterial>>(new Set());
  const wheelMaterialsRef = useRef<Set<THREE.MeshStandardMaterial>>(new Set());
  const paintColorRef = useRef(new THREE.Color(paintColor));
  const hoodCarbonColorRef = useRef(new THREE.Color("#101216"));

  const transform = useMemo(() => MODEL_TRANSFORMS[carId], [carId]);

  useEffect(() => {
    let cancelled = false;

    const car = getCarById(carId);

    const collectBindings = (loadedScene: THREE.Group) => {
      const wheelEntries: WheelEntry[] = [];
      const paintMaterials = new Set<THREE.MeshStandardMaterial>();
      const hoodMaterials = new Set<THREE.MeshStandardMaterial>();
      const wheelMaterials = new Set<THREE.MeshStandardMaterial>();

      loadedScene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
          return;
        }

        object.castShadow = true;
        object.receiveShadow = true;

        const nodeLabel = object.name.toLowerCase();
        if (WHEEL_PATTERN.test(nodeLabel)) {
          wheelEntries.push({
            mesh: object,
            initialRotationZ: object.rotation.z,
            side: object.position.x >= 0 ? -1 : 1,
          });
        }

        const materials = toMaterialArray(object.material);

        materials.forEach((material) => {
          if (!(material instanceof THREE.MeshStandardMaterial)) {
            return;
          }

          const materialLabel = `${material.name} ${nodeLabel}`.toLowerCase();

          if (WHEEL_PATTERN.test(materialLabel)) {
            wheelMaterials.add(material);
          }

          if (!MATERIAL_EXCLUDE_PATTERN.test(materialLabel)) {
            if (MATERIAL_BODY_PATTERN.test(materialLabel)) {
              paintMaterials.add(material);
            }

            if (HOOD_PATTERN.test(materialLabel)) {
              hoodMaterials.add(material);
            }
          }
        });
      });

      if (paintMaterials.size === 0) {
        loadedScene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) {
            return;
          }

          toMaterialArray(object.material).forEach((material) => {
            if (
              material instanceof THREE.MeshStandardMaterial &&
              !MATERIAL_EXCLUDE_PATTERN.test(`${material.name} ${object.name}`)
            ) {
              paintMaterials.add(material);
            }
          });
        });
      }

      wheelMeshesRef.current = wheelEntries;
      paintMaterialsRef.current = paintMaterials;
      hoodMaterialsRef.current = hoodMaterials;
      wheelMaterialsRef.current = wheelMaterials;
    };

    const load = async () => {
      setModelRuntime({
        status: "loading",
        sourceLabel: `${car.name} // Initializing stream`,
        errorMessage: null,
      });

      let lastError: unknown = null;

      for (const source of car.sources) {
        if (cancelled) {
          return;
        }

        setModelRuntime({
          status: "loading",
          sourceLabel: `${car.name} // ${source.label}`,
          errorMessage: null,
        });

        try {
          const gltf = await withTimeout(loadGLTF(source.url), 14_000, source.label);
          if (cancelled) {
            return;
          }

          const clonedScene = gltf.scene.clone(true);
          cloneMeshMaterials(clonedScene);
          normalizeScene(clonedScene);
          collectBindings(clonedScene);

          setScene(clonedScene);
          setModelRuntime({
            status: "ready",
            sourceLabel: `${car.name} // ${source.label}`,
            errorMessage: null,
          });
          return;
        } catch (error) {
          lastError = error;

          if (error instanceof Error) {
            setModelRuntime({
              status: "loading",
              sourceLabel: `${car.name} // ${source.label} failed, trying next source`,
              errorMessage: error.message,
            });
          }
        }
      }

      if (cancelled) {
        return;
      }

      const message = lastError instanceof Error ? lastError.message : "Unknown model load failure";
      setScene(null);
      setModelRuntime({
        status: "error",
        sourceLabel: `${car.name} // All sources unreachable`,
        errorMessage: message,
      });
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [carId, modelRetryToken, setModelRuntime]);

  useEffect(() => {
    return () => {
      releaseScene(scene);
    };
  }, [scene]);

  useEffect(() => {
    paintColorRef.current.set(paintColor);

    const isGloss = finishType === "gloss";
    const roughness = isGloss ? 0.12 : 0.72;
    const metalness = isGloss ? 0.78 : 0.26;

    paintMaterialsRef.current.forEach((material) => {
      material.color.copy(paintColorRef.current);
      material.roughness = roughness;
      material.metalness = metalness;
      material.envMapIntensity = isGloss ? 1.35 : 0.82;
      material.needsUpdate = true;
    });

    hoodMaterialsRef.current.forEach((material) => {
      if (carbonHood) {
        material.color.copy(hoodCarbonColorRef.current);
        material.roughness = 0.56;
        material.metalness = 0.58;
        material.envMapIntensity = 1.05;
      } else {
        material.color.copy(paintColorRef.current);
        material.roughness = roughness;
        material.metalness = metalness;
        material.envMapIntensity = isGloss ? 1.35 : 0.82;
      }

      material.needsUpdate = true;
    });

    const wheelPreset =
      wheelStyle === "mesh"
        ? { color: "#d9dde4", roughness: 0.26, metalness: 0.94 }
        : wheelStyle === "forged"
          ? { color: "#7d5cff", roughness: 0.18, metalness: 0.98 }
          : { color: "#b1b5bf", roughness: 0.36, metalness: 0.86 };

    wheelMaterialsRef.current.forEach((material) => {
      material.color.set(wheelPreset.color);
      material.roughness = wheelPreset.roughness;
      material.metalness = wheelPreset.metalness;
      material.envMapIntensity = 1.2;
      material.needsUpdate = true;
    });
  }, [paintColor, finishType, carbonHood, wheelStyle]);

  useFrame((_, delta) => {
    if (bodyOffsetRef.current) {
      bodyOffsetRef.current.position.y = THREE.MathUtils.damp(
        bodyOffsetRef.current.position.y,
        rideHeight,
        8,
        delta,
      );
    }

    for (const wheel of wheelMeshesRef.current) {
      const targetCamber = wheel.initialRotationZ + camber * wheel.side;
      wheel.mesh.rotation.z = THREE.MathUtils.damp(
        wheel.mesh.rotation.z,
        targetCamber,
        9,
        delta,
      );
    }
  });

  if (!scene) {
    return null;
  }

  return (
    <group
      position={[0, transform.y, 0]}
      rotation={[0, transform.rotationY, 0]}
      scale={transform.scale}
    >
      <group ref={bodyOffsetRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
