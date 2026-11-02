import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Cookies from "js-cookie";

// Region keys must match BodyProgressService.classifyRegion on the backend,
// so a muscle group's trend lands on the matching part of the 3D model.
export type Region = "shoulder" | "chest" | "arm" | "leg" | "back" | "core" | "other";

// Mirrors BodyProgressService.classifyRegion on the backend - same loose
// keyword match, kept in sync by hand since the muscle_group column is
// free text on both sides.
export function classifyMuscleGroupRegion(muscleGroup: string): Region {
  const g = muscleGroup.toLowerCase();
  if (g.includes("shoulder") || g.includes("delt")) return "shoulder";
  if (g.includes("chest") || g.includes("pec")) return "chest";
  if (g.includes("back") || g.includes("lat") || g.includes("trap")) return "back";
  if (g.includes("leg") || g.includes("quad") || g.includes("hamstring") || g.includes("calf") || g.includes("glute")) return "leg";
  if (g.includes("arm") || g.includes("bicep") || g.includes("tricep") || g.includes("forearm")) return "arm";
  if (g.includes("core") || g.includes("ab")) return "core";
  return "other";
}

interface MuscleGroupProgress {
  muscleGroup: string;
  region: Region;
  thisWeekCount: number;
  lastWeekCount: number;
  percentChange: number | null;
  trend: "up" | "down" | "flat" | "new";
}

interface BodyProgressResponse {
  muscleGroups: MuscleGroupProgress[];
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bmiStatus: string | null;
}

interface RegionTrend {
  trend: "up" | "down" | "flat" | "new";
  intensity: number; // 0..1, how strongly to tint the region
  percentChange: number | null;
  thisWeekCount: number;
  planPlanned?: number | null;
}

const NEUTRAL_COLOR = new THREE.Color(0xffffff);
const UP_COLOR = new THREE.Color(0x22c55e);
const DOWN_COLOR = new THREE.Color(0x2563eb);
const ACTIVE_COLOR = new THREE.Color(0xef4444);

const MODEL_URL = "/models/body-athletic.glb";

function classifyVertex(x: number, y: number, z: number, bbox: THREE.Box3): Region {
  const ny = (y - bbox.min.y) / (bbox.max.y - bbox.min.y);
  const centerX = (bbox.max.x + bbox.min.x) / 2;
  const centerZ = (bbox.max.z + bbox.min.z) / 2;
  const absX = Math.abs(x - centerX);
  const front = z > centerZ;

  if (ny < 0.47) return "leg";
  if (ny >= 0.78 && ny < 0.87 && absX > 0.1 && absX < 0.3) return "shoulder";
  if (ny >= 0.47 && ny < 0.78 && absX >= 0.17) return "arm";
  if (ny >= 0.47 && ny < 0.65 && absX < 0.17) return "core";
  if (ny >= 0.65 && ny < 0.78 && absX < 0.17) return front ? "chest" : "back";
  if (ny >= 0.47 && ny < 0.87 && absX < 0.17 && !front) return "back";
  return "other";
}

function buildRegionTrends(
  muscleGroups: MuscleGroupProgress[],
  planCompletionByRegion?: Partial<Record<Region, { completed: number; planned: number }>>
): Record<Region, RegionTrend> {
  const totals: Record<string, { thisWeek: number; lastWeek: number }> = {};
  for (const mg of muscleGroups) {
    if (!totals[mg.region]) totals[mg.region] = { thisWeek: 0, lastWeek: 0 };
    totals[mg.region].thisWeek += mg.thisWeekCount;
    totals[mg.region].lastWeek += mg.lastWeekCount;
  }

  const result = {} as Record<Region, RegionTrend>;
  (["shoulder", "chest", "arm", "leg", "back", "core", "other"] as Region[]).forEach((region) => {
    const t = totals[region];
    if (!t || (t.thisWeek === 0 && t.lastWeek === 0)) {
      result[region] = { trend: "flat", intensity: 0, percentChange: null, thisWeekCount: 0 };
      return;
    }
    if (t.lastWeek === 0) {
      // No prior week to compare against - a real percent CHANGE is still
      // undefined here (division by zero). Instead, when this week's plan
      // is known, show the real percent of this region's planned
      // exercises that are actually done - a genuine number, not the old
      // hardcoded "+100%". Falls back to the raw count if the plan isn't
      // available (e.g. on a page with no weekly-plan context).
      const plan = planCompletionByRegion?.[region];
      const percent = plan && plan.planned > 0 ? Math.round((plan.completed / plan.planned) * 100) : null;
      const intensity =
        percent != null ? Math.min(1, 0.3 + (percent / 100) * 0.7) : Math.min(1, 0.35 + t.thisWeek / 8);
      result[region] = {
        trend: "new",
        intensity,
        percentChange: percent,
        thisWeekCount: t.thisWeek,
        planPlanned: plan?.planned ?? null,
      };
      return;
    }
    const percentChange = ((t.thisWeek - t.lastWeek) * 100) / t.lastWeek;
    const trend = percentChange > 2 ? "up" : percentChange < -2 ? "down" : "flat";
    // Scale 0-60% change to 0.3-1.0 intensity so even a modest change is visible.
    const intensity = trend === "flat" ? 0 : Math.min(1, 0.3 + Math.abs(percentChange) / 60);
    result[region] = { trend, intensity, percentChange, thisWeekCount: t.thisWeek };
  });
  return result;
}

export default function BodyProgressViewer({
  refreshKey,
  highlightActive = true,
  activeRegion = null,
  planCompletionByRegion,
  pulseSignal = null,
}: {
  refreshKey?: number | string;
  highlightActive?: boolean;
  activeRegion?: Region | null;
  planCompletionByRegion?: Partial<Record<Region, { completed: number; planned: number }>>;
  pulseSignal?: { region: Region; nonce: number } | null;
} = {}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  // Which pulse nonce has already been played, so re-rendering for an
  // unrelated reason (e.g. a weekly-trend refetch) while pulseSignal is
  // still the same object never replays an already-finished pulse.
  const lastPulseNonceRef = useRef<number | null>(null);
  const [progress, setProgress] = useState<BodyProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  // Fetch the real weekly comparison + BMI once on mount.
  useEffect(() => {
    const token = Cookies.get("token");
    const userId = Cookies.get("userId");
    if (!token || !userId) {
      setError("You must be logged in to see your body progress.");
      setLoading(false);
      return;
    }

    fetch(`https://fitness-backend-15563671567.europe-west8.run.app/api/body-progress/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load body progress");
        return res.json();
      })
      .then((data: BodyProgressResponse) => setProgress(data))
      .catch(() => setError("Could not load your body progress. Please try again."))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Three.js scene: set up once, re-color whenever `progress` changes.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 360;
    const height = 420;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.01, 100);
    camera.position.set(0, 0.1, 2.6);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.3);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 4, 3);
    scene.add(key);
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    fillLight.position.set(-3, 1, -2);
    scene.add(fillLight);
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.6;
    controls.maxDistance = 4;
    controls.target.set(0, 0, 0);

    let mesh: THREE.Mesh | null = null;
    let disposed = false;
    let blinkOn = true;

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      MODEL_URL,
      (gltf: { scene: THREE.Group }) => {
        if (disposed) return;
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(1.6 / maxDim);

        model.traverse((obj: THREE.Object3D) => {
          if ((obj as THREE.Mesh).isMesh) {
            mesh = obj as THREE.Mesh;
            const sourceMaterial = mesh.material as THREE.MeshStandardMaterial;
            const skinMap = Array.isArray(sourceMaterial) ? undefined : sourceMaterial.map;
            const geom = mesh.geometry;
            geom.computeVertexNormals();
            geom.computeBoundingBox();
            const bbox = geom.boundingBox!;
            const posAttr = geom.attributes.position;
            const count = posAttr.count;
            const basePositions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const regionIndex = new Uint8Array(count); // store region per vertex to recolor cheaply later
            const regionNames: Region[] = ["shoulder", "chest", "arm", "leg", "back", "core", "other"];

            for (let i = 0; i < count; i++) {
              // Read through getX/Y/Z, not the raw .array - this attribute is
              // quantized (normalized Int16), so .array holds raw integers,
              // not real coordinates.
              const x = posAttr.getX(i);
              const y = posAttr.getY(i);
              const z = posAttr.getZ(i);
              basePositions[i * 3] = x;
              basePositions[i * 3 + 1] = y;
              basePositions[i * 3 + 2] = z;
              const region = classifyVertex(x, y, z, bbox);
              const idx = regionNames.indexOf(region);
              regionIndex[i] = idx;
              NEUTRAL_COLOR.toArray(colors, i * 3);
            }

            geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
            (geom as any).__regionIndex = regionIndex;
            (geom as any).__regionNames = regionNames;
            (geom as any).__basePositions = basePositions;

            mesh.material = new THREE.MeshStandardMaterial({
              map: skinMap,
              color: 0xffffff,
              vertexColors: true,
              roughness: 0.55,
              metalness: 0.05,
            });
          }
        });

        scene.add(model);
        applyColors();
        if (pulseSignal && lastPulseNonceRef.current !== pulseSignal.nonce) {
          lastPulseNonceRef.current = pulseSignal.nonce;
          pulseStartTime = performance.now();
        }
      },
      undefined,
      () => setError((prev) => prev || "Could not load the 3D model.")
    );

    function applyColors() {
      if (!mesh) return;
      const geom = mesh.geometry;
      const colorAttr = geom.attributes.color as THREE.BufferAttribute;
      const regionIndex: Uint8Array = (geom as any).__regionIndex;
      const regionNames: Region[] = (geom as any).__regionNames;
      if (!colorAttr || !regionIndex) return;

      const trends =
        !activeRegion && highlightActive && progress
          ? buildRegionTrends(progress.muscleGroups, planCompletionByRegion)
          : null;
      const tmp = new THREE.Color();

      for (let i = 0; i < regionIndex.length; i++) {
        const region = regionNames[regionIndex[i]];
        if (activeRegion) {
          tmp.copy(region === activeRegion && blinkOn ? ACTIVE_COLOR : NEUTRAL_COLOR);
        } else if (!trends) {
          tmp.copy(NEUTRAL_COLOR);
        } else {
          const t = trends[region];
          if (!t || t.intensity === 0) {
            tmp.copy(NEUTRAL_COLOR);
          } else if (t.trend === "down") {
            tmp.copy(NEUTRAL_COLOR).lerp(DOWN_COLOR, t.intensity);
          } else {
            tmp.copy(NEUTRAL_COLOR).lerp(UP_COLOR, t.intensity);
          }
        }
        colorAttr.setXYZ(i, tmp.r, tmp.g, tmp.b);
      }
      colorAttr.needsUpdate = true;
    }

    let pulseStartTime: number | null = null;
    const PULSE_DURATION_MS = 900;
    const PULSE_MAX_OFFSET = 0.025;
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const easeInCubic = (x: number) => x * x * x;

    function applyPulse(elapsedMs: number) {
      if (!mesh || !pulseSignal) return;
      const geom = mesh.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      const normalAttr = geom.attributes.normal as THREE.BufferAttribute | undefined;
      const basePositions: Float32Array | undefined = (geom as any).__basePositions;
      const regionIndex: Uint8Array | undefined = (geom as any).__regionIndex;
      const regionNames: Region[] | undefined = (geom as any).__regionNames;
      if (!normalAttr || !basePositions || !regionIndex || !regionNames) return;

      const t = Math.min(1, elapsedMs / PULSE_DURATION_MS);
      let factor: number;
      if (t < 0.35) factor = easeOutCubic(t / 0.35);
      else if (t < 0.65) factor = 1;
      else factor = 1 - easeInCubic((t - 0.65) / 0.35);

      for (let i = 0; i < regionIndex.length; i++) {
        if (regionNames[regionIndex[i]] !== pulseSignal.region) continue;
        const bi = i * 3;
        posAttr.setXYZ(
          i,
          basePositions[bi] + normalAttr.getX(i) * PULSE_MAX_OFFSET * factor,
          basePositions[bi + 1] + normalAttr.getY(i) * PULSE_MAX_OFFSET * factor,
          basePositions[bi + 2] + normalAttr.getZ(i) * PULSE_MAX_OFFSET * factor
        );
      }
      posAttr.needsUpdate = true;
    }

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      if (activeRegion) {
        const blinkNow = Math.floor(performance.now() / 1000) % 2 === 0;
        if (blinkNow !== blinkOn) {
          blinkOn = blinkNow;
          applyColors();
        }
      }
      if (pulseStartTime !== null) {
        const elapsed = performance.now() - pulseStartTime;
        applyPulse(elapsed);
        if (elapsed >= PULSE_DURATION_MS) {
          pulseStartTime = null;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth || 360;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", handleResize);

    // Re-apply colors once data has already arrived before the model finished loading.
    applyColors();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, highlightActive, activeRegion, planCompletionByRegion, pulseSignal]);

  const regionTrends = progress ? buildRegionTrends(progress.muscleGroups, planCompletionByRegion) : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Body Progress
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          This week vs last week, by muscle group
        </p>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="flex flex-col lg:flex-row gap-5">
        <div
          ref={mountRef}
          className="w-full lg:w-auto rounded-xl bg-neutral-800"
          style={{ minHeight: 420 }}
        />

        <div className="flex-1 flex flex-col gap-2.5">
          {loading && (
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading your progress…</p>
          )}

          {!loading && progress && progress.bmiStatus && (
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.04] px-4 py-3 mb-1">
              <p className="text-xs uppercase tracking-wide text-gray-400">Current status</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {progress.bmiStatus}
                {progress.bmi != null && (
                  <span className="text-gray-400 font-normal"> · BMI {progress.bmi}</span>
                )}
              </p>
            </div>
          )}

          {!loading && regionTrends &&
            (Object.keys(regionTrends) as Region[])
              .filter((r) => r !== "other")
              .map((region) => {
                const t = regionTrends[region];
                const arrow = t.trend === "up" || t.trend === "new" ? "▲" : t.trend === "down" ? "▼" : "—";
                const color =
                  t.trend === "up" || t.trend === "new"
                    ? "text-green-500"
                    : t.trend === "down"
                    ? "text-blue-500"
                    : "text-gray-400";
                return (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                      selectedRegion === region
                        ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10"
                        : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">
                      {region}
                    </span>
                    <span className={`text-xs font-semibold ${color}`}>
                      {arrow}{" "}
                      {t.trend === "new"
                        ? t.planPlanned != null
                          ? `${t.thisWeekCount}/${t.planPlanned}`
                          : `new · ${t.thisWeekCount}× this week`
                        : t.percentChange != null
                        ? `${t.percentChange > 0 ? "+" : ""}${Math.round(t.percentChange)}%`
                        : "no data"}
                    </span>
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}
