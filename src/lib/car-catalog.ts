export interface CarSource {
  url: string;
  label: string;
}

export interface CarSpec {
  id: "legend-911" | "street-buggy" | "neo-toy" | "midnight-hauler";
  name: string;
  subtitle: string;
  basePrice: number;
  accent: string;
  sources: CarSource[];
}

export const REQUIRED_PORSCHE_MODEL_URL =
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/porsche-911/model.gltf";

const CDN_TOYCAR_GLB =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@main/2.0/ToyCar/glTF-Binary/ToyCar.glb";
const CDN_BUGGY_GLB =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@main/2.0/Buggy/glTF-Binary/Buggy.glb";
const CDN_MILKTRUCK_GLB =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@main/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb";

export const CAR_CATALOG: CarSpec[] = [
  {
    id: "legend-911",
    name: "Legend 911",
    subtitle: "Hero Build / Primary Porsche",
    basePrice: 118_000,
    accent: "#00f0ff",
    sources: [
      { label: "Porsche Primary", url: REQUIRED_PORSCHE_MODEL_URL },
      {
        label: "911 Fallback: ToyCar GLB (CDN)",
        url: CDN_TOYCAR_GLB,
      },
      {
        label: "911 Fallback: Buggy GLB (CDN)",
        url: CDN_BUGGY_GLB,
      },
    ],
  },
  {
    id: "street-buggy",
    name: "Street Buggy",
    subtitle: "Wide Stance Drift Build",
    basePrice: 96_000,
    accent: "#ff2f8f",
    sources: [
      {
        label: "Buggy Main GLB (CDN)",
        url: CDN_BUGGY_GLB,
      },
      {
        label: "Buggy Fallback: ToyCar GLB (CDN)",
        url: CDN_TOYCAR_GLB,
      },
    ],
  },
  {
    id: "neo-toy",
    name: "Neo Toy Racer",
    subtitle: "Compact Tokyo Sprint Spec",
    basePrice: 88_500,
    accent: "#7d5cff",
    sources: [
      {
        label: "ToyCar Main GLB (CDN)",
        url: CDN_TOYCAR_GLB,
      },
      {
        label: "ToyCar Fallback: Buggy GLB (CDN)",
        url: CDN_BUGGY_GLB,
      },
    ],
  },
  {
    id: "midnight-hauler",
    name: "Midnight Hauler",
    subtitle: "Retro Cargo Street Rig",
    basePrice: 101_000,
    accent: "#a3ff12",
    sources: [
      {
        label: "MilkTruck Main GLB (CDN)",
        url: CDN_MILKTRUCK_GLB,
      },
      {
        label: "MilkTruck Fallback: ToyCar GLB (CDN)",
        url: CDN_TOYCAR_GLB,
      },
    ],
  },
];

export type CarId = CarSpec["id"];

const CAR_MAP = CAR_CATALOG.reduce<Record<CarId, CarSpec>>((acc, car) => {
  acc[car.id] = car;
  return acc;
}, {} as Record<CarId, CarSpec>);

export const getCarById = (id: CarId): CarSpec => CAR_MAP[id] ?? CAR_CATALOG[0];
