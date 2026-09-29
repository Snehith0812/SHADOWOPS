import { ContactShadows, Float, OrbitControls, Sky, SoftShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  buildKnowledgeGraph,
  memoriesForEntity,
  nodeById,
  observedWorkflow,
  officialWorkflow,
  org3d,
  type EntityNode,
} from "@/lib/shadowops-3d";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type WorkflowViewMode = "official" | "observed" | "compare";

export interface SceneProps {
  selectedId: string | null;
  highlightId: string | null;
  workflowMode: WorkflowViewMode;
  view: "world" | "graph";
  paused: boolean;
  mode: "day" | "night";
  focusTarget: { id: string; nonce: number } | null;
  resetNonce: number;
  onSelect: (id: string | null) => void;
}

const KIND_COLOR: Record<string, string> = {
  episodic: "#6366F1",
  decision: "#5865F2",
  procedural: "#94A3B8",
  outcome: "#22C55E",
  incident: "#EF4444",
  workflow: "#22D3EE",
};

function buildingHeight(n: EntityNode) {
  return 3.2 + n.activity * 9;
}

/* ---------------- environment presets ---------------- */

const DAY = {
  sunPos: [60, 80, 40] as [number, number, number],
  sunIntensity: 2.2,
  ambient: 0.55,
  sky: { turbidity: 6, rayleigh: 1.2, inclination: 0.52, azimuth: 0.25 },
  grass: "#7FA07E",
  ground: "#9FB4A8",
  road: "#3A3F46",
  fillLight: 0.25,
};

const NIGHT = {
  sunPos: [-30, 10, -50] as [number, number, number],
  sunIntensity: 0.12,
  ambient: 0.14,
  sky: { turbidity: 0.6, rayleigh: 0.12, inclination: -0.08, azimuth: 0.25 },
  grass: "#0C110E",
  ground: "#0B0F16",
  road: "#14171C",
  fillLight: 0.9,
};

/* ---------------- label sprites (no DOM portals) ---------------- */

function makeLabelTexture(text: string, color: string, bg: string, border: string) {
  const canvas = document.createElement("canvas");
  const fontSize = 44;
  const padX = 26;
  const padY = 18;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  const textW = measure.measureText(text).width;
  canvas.width = Math.ceil(textW + padX * 2);
  canvas.height = fontSize + padY * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  const r = 16;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvas.width - r, 0);
  ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
  ctx.lineTo(canvas.width, canvas.height - r);
  ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
  ctx.lineTo(r, canvas.height);
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = border;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, padX, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { texture, aspect: canvas.width / canvas.height };
}

function LabelSprite({
  text,
  position,
  height = 0.95,
  color = "#C9D3E8",
  bg = "rgba(8,12,20,0.92)",
  border = "#26314A",
}: {
  text: string;
  position: [number, number, number];
  height?: number;
  color?: string;
  bg?: string;
  border?: string;
}) {
  const { texture, aspect } = useMemo(
    () => makeLabelTexture(text, color, bg, border),
    [text, color, bg, border],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={position} scale={[height * aspect, height, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

/* ---------------- sun rig ---------------- */

function Sun({ mode }: { mode: "day" | "night" }) {
  const p = mode === "day" ? DAY : NIGHT;
  return (
    <>
      <Sky
        distance={4500}
        sunPosition={p.sunPos}
        turbidity={p.sky.turbidity}
        rayleigh={p.sky.rayleigh}
        inclination={p.sky.inclination}
        azimuth={p.sky.azimuth}
      />
      <directionalLight
        castShadow
        position={p.sunPos}
        intensity={p.sunIntensity}
        color={mode === "day" ? "#FFF3E0" : "#8FA8D8"}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
      />
      <ambientLight intensity={p.ambient} />
      <hemisphereLight
        intensity={mode === "day" ? 0.45 : 0.12}
        color={mode === "day" ? "#CFE4FF" : "#1A2438"}
        groundColor={mode === "day" ? "#8FA98E" : "#0A0E14"}
      />
      <directionalLight position={[-40, 20, -30]} intensity={p.fillLight} color="#22D3EE" />
    </>
  );
}

/* ---------------- ground ---------------- */

function RealGround({ mode }: { mode: "day" | "night" }) {
  const p = mode === "day" ? DAY : NIGHT;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color={p.grass} roughness={1} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[92, 72]} />
        <meshStandardMaterial color={p.ground} roughness={0.95} metalness={0} />
      </mesh>
    </>
  );
}

/* ---------------- roads & props ---------------- */

function RoadNetwork({ mode }: { mode: "day" | "night" }) {
  const p = mode === "day" ? DAY : NIGHT;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[76, 56]} />
        <meshStandardMaterial color={p.road} roughness={0.9} metalness={0} />
      </mesh>
      {[-14, -7, 0, 7, 14].map((x) => (
        <mesh key={`h${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]}>
          <planeGeometry args={[0.35, 56]} />
          <meshStandardMaterial
            color="#E8ECF2"
            roughness={0.7}
            opacity={mode === "night" ? 0.35 : 0.85}
            transparent
          />
        </mesh>
      ))}
      {[-18, -12, -6, 0, 6, 12, 18].map((z) => (
        <mesh key={`v${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, z]}>
          <planeGeometry args={[76, 0.28]} />
          <meshStandardMaterial
            color="#E8ECF2"
            roughness={0.7}
            opacity={mode === "night" ? 0.3 : 0.8}
            transparent
          />
        </mesh>
      ))}
      {Array.from({ length: 26 }).map((_, i) => (
        <mesh key={`dh${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-36 + i * 2.8, 0.02, 0]}>
          <planeGeometry args={[1.4, 0.16]} />
          <meshStandardMaterial color="#F2C94C" roughness={0.6} />
        </mesh>
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={`dv${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -26 + i * 2.7]}>
          <planeGeometry args={[0.16, 1.3]} />
          <meshStandardMaterial color="#F2C94C" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ position, mode }: { position: [number, number, number]; mode: "day" | "night" }) {
  const dark = mode === "night";
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.4, 7]} />
        <meshStandardMaterial color={dark ? "#1A130C" : "#6B4F2E"} roughness={1} />
      </mesh>
      <mesh position={[0, 2.0, 0]} castShadow>
        <sphereGeometry args={[0.95, 12, 12]} />
        <meshStandardMaterial color={dark ? "#0E1A12" : "#4E7A4A"} roughness={1} flatShading />
      </mesh>
      <mesh position={[0.35, 1.55, 0.2]} castShadow>
        <sphereGeometry args={[0.6, 10, 10]} />
        <meshStandardMaterial color={dark ? "#122417" : "#5C8A55"} roughness={1} flatShading />
      </mesh>
      <mesh position={[-0.3, 1.5, -0.15]} castShadow>
        <sphereGeometry args={[0.5, 10, 10]} />
        <meshStandardMaterial color={dark ? "#0C1D13" : "#446E41"} roughness={1} flatShading />
      </mesh>
    </group>
  );
}

function StreetLamp({ position, mode }: { position: [number, number, number]; mode: "day" | "night" }) {
  const night = mode === "night";
  return (
    <group position={position}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 3.2, 8]} />
        <meshStandardMaterial color={night ? "#14161A" : "#3A3F46"} roughness={0.6} metalness={0.6} />
      </mesh>
      <mesh position={[0.55, 3.25, 0]} rotation={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.04, 0.05, 1.2, 8]} />
        <meshStandardMaterial color={night ? "#14161A" : "#3A3F46"} roughness={0.6} metalness={0.6} />
      </mesh>
      <mesh position={[1.05, 3.3, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color="#FFF7DE" emissive="#FFD9A0" emissiveIntensity={night ? 3 : 0.15} />
      </mesh>
      {night && <pointLight position={[1.05, 3.2, 0]} intensity={12} distance={11} color="#FFD9A0" />}
    </group>
  );
}

function Bench({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.1, 0.08, 0.4]} />
        <meshStandardMaterial color="#5C4630" roughness={1} />
      </mesh>
      <mesh position={[0, 0.6, -0.16]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.1, 0.35, 0.06]} />
        <meshStandardMaterial color="#5C4630" roughness={1} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.17, 0]}>
          <boxGeometry args={[0.08, 0.34, 0.36]} />
          <meshStandardMaterial color="#2C2A26" roughness={0.8} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function ParkedCar({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.7, 0.5, 3.6]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.65} />
      </mesh>
      <mesh position={[0, 0.85, -0.3]} castShadow>
        <boxGeometry args={[1.5, 0.42, 1.7]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.65} />
      </mesh>
      {[
        [-0.75, 1.1],
        [0.75, 1.1],
        [-0.75, -1.1],
        [0.75, -1.1],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.3, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 14]} />
          <meshStandardMaterial color="#101216" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- buildings ---------------- */

function OfficeBuilding({
  node,
  selected,
  onPath,
  mode,
  onSelect,
}: {
  node: EntityNode;
  selected: boolean;
  onPath: boolean;
  mode: "day" | "night";
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const h = buildingHeight(node);
  const isVendor = node.type === "vendor";
  const w = isVendor ? 3.6 : 5.2;
  const d = isVendor ? 3.6 : 5.2;
  const night = mode === "night";

  const litWindows = useMemo(() => {
    const set = new Set<string>();
    let seed = node.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + node.decisionCount;
    const cols = 6;
    const rows = Math.max(3, Math.floor(h / 1.15));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        seed = (seed * 9301 + 49297) % 233280;
        if (seed / 233280 < (night ? 0.55 : 0.18)) set.add(`${r}-${c}`);
      }
    }
    return { set, cols, rows };
  }, [node.id, node.decisionCount, h, night]);

  const accent = onPath ? "#22D3EE" : selected ? "#5865F2" : hovered ? "#5B6579" : "#2A3242";
  const glowColor = onPath ? "#22D3EE" : "#5865F2";

  return (
    <group position={node.position}>
      <mesh
        position={[0, h / 2, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={isVendor ? (night ? "#1C2230" : "#B8C2CC") : night ? "#20293A" : "#C9D2DC"}
          roughness={0.35}
          metalness={0.55}
          emissive={selected ? glowColor : "#000000"}
          emissiveIntensity={selected ? 0.12 : 0}
        />
      </mesh>

      <mesh position={[0, h / 2, d / 2 + 0.02]}>
        <planeGeometry args={[w * 0.86, h * 0.82]} />
        <meshStandardMaterial
          color={night ? "#0E1520" : "#9FB8D8"}
          roughness={0.08}
          metalness={0.9}
          emissive={night ? glowColor : "#000000"}
          emissiveIntensity={night ? (onPath ? 0.5 : 0.22) : 0}
          transparent
          opacity={0.92}
        />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side} position={[0, 0, side * (d / 2 + 0.03)]}>
          {Array.from({ length: litWindows.rows }).map((_, r) =>
            Array.from({ length: litWindows.cols }).map((_, c) =>
              litWindows.set.has(`${r}-${c}`) ? (
                <mesh
                  key={`${side}-${r}-${c}`}
                  position={[
                    -w / 2 + 0.55 + (c * (w - 1.1)) / (litWindows.cols - 1),
                    0.9 + r * ((h - 1.4) / Math.max(litWindows.rows - 1, 1)),
                    0,
                  ]}
                >
                  <planeGeometry args={[0.34, 0.5]} />
                  <meshStandardMaterial
                    color="#FFF4D6"
                    emissive="#FFDF9E"
                    emissiveIntensity={night ? 2.6 : 0.5}
                  />
                </mesh>
              ) : null,
            ),
          )}
        </group>
      ))}

      <mesh position={[0, h + 0.1, 0]} castShadow>
        <boxGeometry args={[w + 0.3, 0.2, d + 0.3]} />
        <meshStandardMaterial color={night ? "#171D28" : "#8B97A4"} roughness={0.8} />
      </mesh>
      <mesh position={[w / 4, h + 0.42, -d / 4]} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.9]} />
        <meshStandardMaterial color={night ? "#20262F" : "#A8B2BC"} roughness={0.7} metalness={0.3} />
      </mesh>

      <mesh position={[0, 0.5, d / 2 + 0.75]} castShadow>
        <boxGeometry args={[w * 0.55, 0.12, 1.5]} />
        <meshStandardMaterial color={night ? "#1A212E" : "#93A0AD"} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.08, d / 2 + 1.5]}>
        <boxGeometry args={[w * 0.4, 0.16, 0.9]} />
        <meshStandardMaterial color={night ? "#141821" : "#AEB8C2"} roughness={0.9} />
      </mesh>

      {onPath && (
        <mesh position={[0, h + 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.25, 0.045, 10, 48]} />
          <meshStandardMaterial
            color="#22D3EE"
            emissive="#22D3EE"
            emissiveIntensity={1.8}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      <LabelSprite
        text={node.name.toUpperCase()}
        position={[0, h + 2.2, 0]}
        height={1.05}
        color={onPath ? "#22D3EE" : selected ? "#8B93F8" : night ? "#7E88A0" : "#3A4656"}
        bg={night ? "rgba(6,10,16,0.9)" : "rgba(10,14,20,0.78)"}
        border={onPath ? "#22D3EE" : selected ? "#5865F2" : night ? "#26314A" : "#4A5568"}
      />
    </group>
  );
}

/* ---------------- memory orbs ---------------- */

function MemoryOrb({
  entityId,
  offsetIndex,
  paused,
  onSelect,
}: {
  entityId: string;
  offsetIndex: number;
  paused: boolean;
  onSelect: (memoryId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const node = nodeById(entityId);
  const list = memoriesForEntity(entityId);
  const m = list[offsetIndex % Math.max(list.length, 1)];
  if (!node || !m) return null;
  const color = KIND_COLOR[m.kind] ?? "#6366F1";

  const angle = (offsetIndex / Math.max(list.length, 4)) * Math.PI * 2;
  const r = node.type === "vendor" ? 3.4 : 4.6;
  const x = node.position[0] + Math.cos(angle) * r;
  const z = node.position[2] + Math.sin(angle) * r;
  const y = 2.2 + ((offsetIndex * 0.9) % 2.2);

  return (
    <Float speed={paused ? 0 : 1.3} floatIntensity={0.6} rotationIntensity={0.12}>
      <mesh
        position={[x, y, z]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(m.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[hovered ? 0.4 : 0.28, 18, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 2.4 : 1.3} />
      </mesh>
      {(hovered || offsetIndex === 0) && (
        <LabelSprite
          text={`${m.id} · ${m.kind.toUpperCase()}`}
          position={[x, y + 0.85, z]}
          height={0.55}
          color="#C9D3E8"
          border={color}
        />
      )}
    </Float>
  );
}

/* ---------------- workflow paths ---------------- */

function WorkflowPath({
  entityIds,
  color,
  opacity,
  dashed,
  paused,
  mode,
  label,
}: {
  entityIds: string[];
  color: string;
  opacity: number;
  dashed?: boolean;
  paused: boolean;
  mode: "day" | "night";
  label?: string;
}) {
  const particles = useRef<THREE.Group>(null);
  const curve = useMemo(() => {
    const pts = entityIds
      .map((id) => nodeById(id))
      .filter((n): n is EntityNode => Boolean(n))
      .map((n) => {
        const dirX = Math.sign(n.position[0]) || 1;
        const dirZ = Math.sign(n.position[2]) || 1;
        return new THREE.Vector3(n.position[0] - dirX * 2.6, 0.7, n.position[2] - dirZ * 2.6);
      });
    if (pts.length < 2) return null;
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4);
  }, [entityIds]);

  const tube = useMemo(
    () => (curve ? new THREE.TubeGeometry(curve, 90, dashed ? 0.06 : 0.13, 8, false) : null),
    [curve, dashed],
  );

  useFrame((state) => {
    if (paused || !particles.current || !curve) return;
    particles.current.children.forEach((child, i) => {
      const p = (state.clock.elapsedTime * (0.055 + i * 0.013) + i * 0.28) % 1;
      const pos = curve.getPointAt(p);
      if (pos) {
        child.position.copy(pos);
        child.position.y = 0.7 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.08;
      }
    });
  });

  if (!curve || !tube) return null;

  const mid = curve.getPointAt(0.5);

  return (
    <group>
      <mesh geometry={tube}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={mode === "night" ? 1.6 : 0.9}
          transparent
          opacity={opacity}
        />
      </mesh>
      {!dashed && (
        <group ref={particles}>
          {[0, 1, 2].map((i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshStandardMaterial color="#F5F8FF" emissive={color} emissiveIntensity={2.6} />
            </mesh>
          ))}
        </group>
      )}
      {label && (
        <LabelSprite
          text={label}
          position={[mid.x, mid.y + 1.4, mid.z]}
          height={0.8}
          color={color}
          border={color}
        />
      )}
    </group>
  );
}

/* ---------------- world scene ---------------- */

function WorldScene(props: SceneProps & { mode: "day" | "night" }) {
  const { selectedId, workflowMode, paused, onSelect, mode } = props;
  const depts = useMemo(() => org3d.nodes.filter((n) => n.type === "department"), []);
  const vendors = useMemo(() => org3d.nodes.filter((n) => n.type === "vendor"), []);
  const orbHosts = ["procurement", "security", "finance", "manager-lane", "it", "executive", "vendor-northwind"];

  const trees = useMemo<[number, number, number][]>(() => {
    const list: [number, number, number][] = [];
    let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) {
      const x = -46 + rnd() * 92;
      const z = -34 + rnd() * 68;
      const nearRoad = Math.abs(x) < 2.2 || Math.abs(z) < 2.2;
      const onPlot = Math.abs(x) < 30 && Math.abs(z) < 24;
      if (!nearRoad && !onPlot) list.push([x, 0, z]);
    }
    return list.slice(0, 18);
  }, []);

  const lamps = useMemo<[number, number, number][]>(
    () => [
      [-9, 0, 3.2], [9, 0, 3.2], [-9, 0, -3.2], [9, 0, -3.2],
      [-3.2, 0, -10], [3.2, 0, -10], [-3.2, 0, 10], [3.2, 0, 10],
      [-20, 0, 3.2], [20, 0, 3.2], [-20, 0, -3.2], [20, 0, -3.2],
      [-3.2, 0, -20], [3.2, 0, -20], [-3.2, 0, 20], [3.2, 0, 20],
    ],
    [],
  );

  return (
    <>
      <RealGround mode={mode} />
      <RoadNetwork mode={mode} />
      <ContactShadows
        position={[0, 0.015, 0]}
        scale={110}
        far={9}
        opacity={mode === "night" ? 0.5 : 0.42}
        blur={2.4}
        frames={paused ? 1 : Infinity}
      />

      {depts.map((n) => (
        <OfficeBuilding
          key={n.id}
          node={n}
          selected={selectedId === n.id}
          onPath={
            (workflowMode === "observed" || workflowMode === "compare") && observedWorkflow.steps.includes(n.id)
          }
          mode={mode}
          onSelect={onSelect}
        />
      ))}
      {vendors.map((n) => (
        <OfficeBuilding
          key={n.id}
          node={n}
          selected={selectedId === n.id}
          onPath={false}
          mode={mode}
          onSelect={onSelect}
        />
      ))}

      {orbHosts.flatMap((id) =>
        [0, 1, 2].map((k) => (
          <MemoryOrb key={`${id}-${k}`} entityId={id} offsetIndex={k} paused={paused} onSelect={onSelect} />
        )),
      )}

      {workflowMode !== "official" && (
        <WorkflowPath
          entityIds={observedWorkflow.steps}
          color="#22D3EE"
          opacity={0.85}
          paused={paused}
          mode={mode}
          label="OBSERVED · DERIVED FROM MEMORY"
        />
      )}
      {(workflowMode === "official" || workflowMode === "compare") && (
        <WorkflowPath
          entityIds={officialWorkflow.steps}
          color="#94A3B8"
          opacity={workflowMode === "compare" ? 0.5 : 0.8}
          dashed
          paused={paused}
          mode={mode}
          label={workflowMode === "compare" ? "OFFICIAL · DOCUMENTED" : undefined}
        />
      )}

      {trees.map((pos, i) => (
        <Tree key={i} position={pos} mode={mode} />
      ))}
      {lamps.map((pos, i) => (
        <StreetLamp key={i} position={pos} mode={mode} />
      ))}

      <Bench position={[4.8, 0, 6.4]} />
      <Bench position={[-4.8, 0, 6.4]} />
      <Bench position={[4.8, 0, -6.4]} />
      <Bench position={[-4.8, 0, -6.4]} />

      <ParkedCar position={[12.5, 0, 8.5]} color="#5B6B7E" />
      <ParkedCar position={[12.5, 0, 12.2]} color="#7E5B5B" />
      <ParkedCar position={[-12.5, 0, -8.5]} color="#4E5E52" />
      <ParkedCar position={[-12.5, 0, -12.2]} color="#5E584E" />
      <ParkedCar position={[8.5, 0, 18.5]} color="#51606E" />
      <ParkedCar position={[-8.5, 0, -18.5]} color="#6E5160" />
    </>
  );
}

/* ---------------- knowledge graph ---------------- */

function GraphScene({ selectedId, paused, onSelect }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const { nodes, edges } = useMemo(() => buildKnowledgeGraph(), []);

  const positions = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    const depts = nodes.filter((n) => n.type === "department");
    const vendors = nodes.filter((n) => n.type === "vendor");
    const mems = nodes.filter((n) => n.id.startsWith("mem-"));
    depts.forEach((n, i) => {
      const a = (i / depts.length) * Math.PI * 2;
      map.set(n.id, new THREE.Vector3(Math.cos(a) * 11, 0, Math.sin(a) * 11));
    });
    vendors.forEach((n, i) => {
      const a = (i / vendors.length) * Math.PI * 2 + 0.6;
      map.set(n.id, new THREE.Vector3(Math.cos(a) * 16.5, 0, Math.sin(a) * 16.5));
    });
    mems.forEach((n, i) => {
      const a = (i / mems.length) * Math.PI * 2;
      const r = 5.2 + ((i * 0.41) % 1) * 3.2;
      map.set(n.id, new THREE.Vector3(Math.cos(a) * r, 1.2 + ((i * 0.29) % 1) * 2.6, Math.sin(a) * r));
    });
    return map;
  }, [nodes]);

  const edgeGeom = useMemo(() => {
    const pts: number[] = [];
    for (const e of edges) {
      const a = positions.get(e.source);
      const b = positions.get(e.target);
      if (a && b) pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [edges, positions]);

  useFrame((_, delta) => {
    if (!paused && group.current) group.current.rotation.y += delta * 0.045;
  });

  return (
    <>
      <group ref={group}>
        <lineSegments geometry={edgeGeom}>
          <lineBasicMaterial color="#26314A" transparent opacity={0.5} />
        </lineSegments>
        {nodes.map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          const isDept = n.type === "department";
          const isVendor = n.type === "vendor";
          const color = isDept
            ? "#5865F2"
            : isVendor
              ? "#22D3EE"
              : n.type === "incident"
                ? "#EF4444"
                : n.type === "decision"
                  ? "#6366F1"
                  : n.type === "outcome"
                    ? "#22C55E"
                    : "#8A94A8";
          const size = isDept ? 0.7 : isVendor ? 0.55 : 0.15;
          const isSel = selectedId === (n.memoryId ?? n.id);
          return (
            <mesh
              key={n.id}
              position={p}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(n.memoryId ?? n.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <sphereGeometry args={[size, 14, 14]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSel ? 2.4 : 0.8} />
            </mesh>
          );
        })}
        {nodes
          .filter((n) => n.type === "department")
          .map((n, i) => {
            const p = positions.get(n.id);
            if (!p) return null;
            return (
              <LabelSprite
                key={`lbl-${n.id}`}
                text={n.label.toUpperCase()}
                position={[p.x, 1.5 + (i % 2) * 0.3, p.z]}
                height={0.7}
              />
            );
          })}
      </group>
      <ContactShadows position={[0, -0.02, 0]} scale={60} far={12} opacity={0.4} blur={2.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#0A0E16" roughness={1} />
      </mesh>
    </>
  );
}

/* ---------------- camera rig ---------------- */

function CameraRig({
  focusTarget,
  resetNonce,
}: {
  focusTarget: SceneProps["focusTarget"];
  resetNonce: number;
}) {
  const controls = useRef<any>(null);
  const { camera } = useThree();
  const desiredCam = useRef<THREE.Vector3 | null>(null);
  const desiredTarget = useRef<THREE.Vector3 | null>(null);

  useMemo(() => {
    if (!focusTarget) return;
    const n = nodeById(focusTarget.id);
    if (!n) return;
    const h = buildingHeight(n);
    desiredTarget.current = new THREE.Vector3(n.position[0], h * 0.45, n.position[2]);
    desiredCam.current = new THREE.Vector3(n.position[0] + 10, h + 6.5, n.position[2] + 12);
  }, [focusTarget]);

  useMemo(() => {
    if (resetNonce === 0) return;
    desiredTarget.current = new THREE.Vector3(0, 2, 0);
    desiredCam.current = new THREE.Vector3(26, 30, 38);
  }, [resetNonce]);

  useFrame(() => {
    const c = controls.current;
    if (!c) return;
    if (desiredCam.current && desiredTarget.current) {
      camera.position.lerp(desiredCam.current, 0.07);
      c.target.lerp(desiredTarget.current, 0.07);
      if (camera.position.distanceTo(desiredCam.current) < 0.1) {
        desiredCam.current = null;
        desiredTarget.current = null;
      }
      c.update();
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={7}
      maxDistance={110}
      maxPolarAngle={Math.PI / 2.04}
      target={[0, 2, 0]}
    />
  );
}

/* ---------------- exported canvas ---------------- */

export function OrgScene(props: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [26, 30, 38], fov: 42 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <SoftShadows size={26} samples={12} focus={0.7} />
      <Sun mode={props.mode} />
      {props.view === "world" ? <WorldScene {...props} mode={props.mode} /> : <GraphScene {...props} />}
      <CameraRig focusTarget={props.focusTarget} resetNonce={props.resetNonce} />
    </Canvas>
  );
}
