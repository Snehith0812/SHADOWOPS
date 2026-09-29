import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { observedWorkflow } from "@/lib/shadowops-3d";

export type FocusMode = "idle" | "email" | "password" | "authenticating";

export interface HoverInfo {
  title: string;
  kind: string;
  lines: string[];
  x: number;
  y: number;
}

export interface LoginSceneProps {
  focus: FocusMode;
  authStage: number; // 0 idle, 1 core activates, 2 network converges, 3 fly-through
  onHover: (info: HoverInfo | null) => void;
  reducedMotion: boolean;
}

/* ---------------- label sprites ---------------- */

function makeLabelTexture(text: string, color: string, bg: string, border: string) {
  const canvas = document.createElement("canvas");
  const fontSize = 42;
  const padX = 24;
  const padY = 16;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  const w = measure.measureText(text).width;
  canvas.width = Math.ceil(w + padX * 2);
  canvas.height = fontSize + padY * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  const r = 14;
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
  height = 0.8,
  color = "#94A3B8",
  border = "#26314A",
}: {
  text: string;
  position: [number, number, number];
  height?: number;
  color?: string;
  border?: string;
}) {
  const { texture, aspect } = useMemo(() => makeLabelTexture(text, color, "rgba(6,10,16,0.85)", border), [text, color, border]);
  return (
    <sprite position={position} scale={[height * aspect, height, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

/* ---------------- data-driven structure ---------------- */

interface CoreNode {
  id: string;
  kind: "memory" | "event" | "decision" | "incident" | "outcome" | "workflow" | "person";
  label: string;
  color: string;
  orbit: number;
  angle: number;
  speed: number;
  height: number;
  info: { title: string; kind: string; lines: string[] };
}

const NODE_COLORS: Record<string, string> = {
  memory: "#6366F1",
  event: "#38BDF8",
  decision: "#5865F2",
  incident: "#EF4444",
  outcome: "#22C55E",
  workflow: "#22D3EE",
  person: "#A855F7",
};

const DEPTS = [
  { id: "security", label: "SECURITY", x: -7.5, z: -4, h: 3.4, events: 127, decisions: 18, workflows: 6 },
  { id: "finance", label: "FINANCE", x: 7.5, z: -4, h: 4.1, events: 214, decisions: 31, workflows: 5 },
  { id: "it", label: "IT", x: 0, z: 6, h: 3.8, events: 186, decisions: 22, workflows: 7 },
  { id: "procurement", label: "PROCUREMENT", x: -10.5, z: 5, h: 3.0, events: 158, decisions: 19, workflows: 4 },
  { id: "operations", label: "OPERATIONS", x: 10.5, z: 5, h: 2.7, events: 94, decisions: 11, workflows: 3 },
];

const DEPT_LINKS: [string, string][] = [
  ["security", "finance"],
  ["security", "it"],
  ["finance", "it"],
  ["procurement", "security"],
  ["finance", "operations"],
];

const CORE_NODES: CoreNode[] = [
  { id: "n-mem", kind: "memory", label: "MEMORY", color: NODE_COLORS.memory, orbit: 3.2, angle: 0.4, speed: 0.16, height: 0.5, info: { title: "MEMORY", kind: "Core", lines: ["Organizational memory index", "12,842 retained memories"] } },
  { id: "n-ev1", kind: "event", label: "EVENT", color: NODE_COLORS.event, orbit: 4.4, angle: 1.4, speed: 0.24, height: 0.32, info: { title: "Vendor security approval delayed", kind: "Event", lines: ["2026-08-17", "Outcome: Finance approval postponed"] } },
  { id: "n-de1", kind: "decision", label: "DECISION", color: NODE_COLORS.decision, orbit: 4.6, angle: 2.6, speed: 0.2, height: 0.34, info: { title: "Fast-track lane adopted", kind: "Decision", lines: ["2026-01-18", "31 cases closed 60% faster"] } },
  { id: "n-in1", kind: "incident", label: "INCIDENT", color: NODE_COLORS.incident, orbit: 5.0, angle: 4.1, speed: 0.14, height: 0.36, info: { title: "Vendor API outage (Sev-2)", kind: "Incident", lines: ["2026-02-03", "Resolved via failover runbook"] } },
  { id: "n-ou1", kind: "outcome", label: "OUTCOME", color: NODE_COLORS.outcome, orbit: 4.8, angle: 5.2, speed: 0.18, height: 0.3, info: { title: "Onboarding record — 11 days", kind: "Outcome", lines: ["2026-05-08", "42% faster than median"] } },
  { id: "n-wf1", kind: "workflow", label: "WORKFLOW", color: NODE_COLORS.workflow, orbit: 5.4, angle: 0.9, speed: 0.12, height: 0.3, info: { title: "Vendor Approval", kind: "Workflow", lines: ["37 occurrences", "Derived from memory"] } },
  { id: "n-pe1", kind: "person", label: "ANALYST", color: NODE_COLORS.person, orbit: 5.6, angle: 3.3, speed: 0.22, height: 0.26, info: { title: "Security Analyst", kind: "Person", lines: ["Reviewed 48 vendor cases", "Avg cycle 4.2 days"] } },
];

/* ---------------- memory core ---------------- */

function MemoryCore({ authStage, reducedMotion }: { authStage: number; reducedMotion: boolean }) {
  const core = useRef<THREE.Group>(null);
  const wire = useRef<THREE.Mesh>(null);
  const icos = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (core.current) {
      const target = authStage >= 2 ? 1.9 : authStage >= 1 ? 1.12 : 1;
      core.current.scale.lerp(new THREE.Vector3(target, target, target), 0.05);
      if (!reducedMotion) {
        core.current.rotation.y += delta * (authStage >= 2 ? 0.5 : 0.08);
        core.current.rotation.x = Math.sin(t * 0.3) * 0.08;
      }
    }
    if (wire.current && wire.current.material instanceof THREE.MeshStandardMaterial) {
      wire.current.material.emissiveIntensity = authStage >= 1 ? 1.8 : 0.85 + Math.sin(t * 1.4) * 0.25;
    }
    if (icos.current) {
      icos.current.rotation.y -= delta * 0.12;
      icos.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <group ref={core} position={[0, 1.2, -6]}>
      {/* inner glowing sphere */}
      <mesh ref={wire}>
        <icosahedronGeometry args={[1.15, 2]} />
        <meshStandardMaterial
          color="#5865F2"
          emissive="#6366F1"
          emissiveIntensity={0.85}
          roughness={0.25}
          metalness={0.6}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* outer wireframe shell */}
      <mesh ref={icos}>
        <icosahedronGeometry args={[1.75, 1]} />
        <meshBasicMaterial color="#22D3EE" wireframe transparent opacity={0.32} />
      </mesh>
      {/* halo rings */}
      {[2.35, 2.85].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2 + i * 0.5, 0, i * 0.7]}>
          <torusGeometry args={[r, 0.02, 8, 64]} />
          <meshBasicMaterial color={i === 0 ? "#5865F2" : "#22D3EE"} transparent opacity={0.35} />
        </mesh>
      ))}
      <pointLight intensity={26} distance={22} color="#6366F1" />
      <LabelSprite text="SHADOWOPS · MEMORY CORE" position={[0, -2.6, 0]} height={0.85} color="#8B93F8" border="#3B4160" />
    </group>
  );
}

/* ---------------- orbiting nodes ---------------- */

function OrbitNodes({
  authStage,
  onHover,
  reducedMotion,
}: {
  authStage: number;
  onHover: LoginSceneProps["onHover"];
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const hoveredIdx = useRef<number | null>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const converge = authStage >= 2;
    group.current?.children.forEach((child, i) => {
      const n = CORE_NODES[i];
      if (!n) return;
      const speed = reducedMotion ? 0 : n.speed * (converge ? 3.2 : 1);
      const angle = n.angle + t * speed;
      const orbit = converge ? n.orbit * 0.25 : n.orbit;
      const x = Math.cos(angle) * orbit;
      const z = -6 + Math.sin(angle) * orbit;
      const y = 1.2 + Math.sin(t * 0.8 + i) * 0.35 + n.height;
      child.position.set(x, y, z);
      child.scale.setScalar(hoveredIdx.current === i ? 1.45 : 1);
      const mesh = meshes.current[i];
      if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
        const base = hoveredIdx.current === i ? 2.4 : 0.75;
        mesh.material.emissiveIntensity = base + Math.sin(t * 2 + i) * 0.25;
      }
    });
  });

  return (
    <group ref={group}>
      {CORE_NODES.map((n, i) => (
        <mesh
          key={n.id}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            hoveredIdx.current = i;
            onHover({ ...n.info, x: e.clientX ?? 0, y: e.clientY ?? 0 });
          }}
          onPointerOut={() => {
            hoveredIdx.current = null;
            onHover(null);
          }}
        >
          {n.kind === "decision" ? (
            <boxGeometry args={[0.42, 0.56, 0.06]} />
          ) : n.kind === "incident" ? (
            <octahedronGeometry args={[0.32, 0]} />
          ) : (
            <sphereGeometry args={[n.height, 18, 18]} />
          )}
          <meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={0.75} roughness={0.3} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- department structures ---------------- */

function DeptStructures({ focus }: { focus: FocusMode }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current?.children.forEach((child, i) => {
      const d = DEPTS[i];
      if (!d) return;
      const highlight =
        (focus === "email" && ["procurement", "finance", "it"].includes(d.id)) ||
        (focus === "password" && d.id === "security");
      const mesh = child.children[0] as THREE.Mesh | undefined;
      if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
        const target = highlight ? 0.85 : 0.22;
        mesh.material.emissiveIntensity += (target - mesh.material.emissiveIntensity) * 0.08;
      }
      child.position.y = Math.sin(t * 0.5 + i * 1.3) * 0.22;
    });
  });

  return (
    <group ref={group}>
      {DEPTS.map((d) => (
        <group key={d.id} position={[d.x, 0, d.z]}>
          <mesh position={[0, d.h / 2, 0]}>
            <boxGeometry args={[2.3, d.h, 2.3]} />
            <meshStandardMaterial
              color="#111826"
              emissive={focus === "password" && d.id === "security" ? "#22D3EE" : "#5865F2"}
              emissiveIntensity={0.22}
              roughness={0.4}
              metalness={0.65}
              transparent
              opacity={0.92}
            />
          </mesh>
          <mesh position={[0, d.h + 0.02, 0]}>
            <boxGeometry args={[2.55, 0.05, 2.55]} />
            <meshBasicMaterial color="#22D3EE" transparent opacity={0.4} />
          </mesh>
          <LabelSprite
            text={d.label}
            position={[0, d.h + 1.0, 0]}
            height={0.62}
            color={focus === "password" && d.id === "security" ? "#22D3EE" : "#8B93F8"}
            border="#26314A"
          />
        </group>
      ))}
    </group>
  );
}

/* ---------------- dept connections ---------------- */

function DeptLinks() {
  const geoms = useMemo(() => {
    return DEPT_LINKS.map(([a, b]) => {
      const da = DEPTS.find((d) => d.id === a)!;
      const db = DEPTS.find((d) => d.id === b)!;
      const pts = [
        new THREE.Vector3(da.x, da.h * 0.7, da.z),
        new THREE.Vector3((da.x + db.x) / 2, Math.max(da.h, db.h) * 0.95 + 0.8, (da.z + db.z) / 2),
        new THREE.Vector3(db.x, db.h * 0.7, db.z),
      ];
      const curve = new THREE.QuadraticBezierCurve3(pts[0], pts[1], pts[2]);
      return new THREE.TubeGeometry(curve, 32, 0.022, 6, false);
    });
  }, []);
  return (
    <group>
      {geoms.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color="#3B4160" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- workflow particles ---------------- */

function WorkflowParticles({ authStage, reducedMotion }: { authStage: number; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const curve = useMemo(() => {
    const deps = ["procurement", "security", "finance", "it"];
    const pts = deps
      .map((id) => DEPTS.find((d) => d.id === id))
      .filter((d): d is (typeof DEPTS)[number] => Boolean(d))
      .map((d) => new THREE.Vector3(d.x, d.h * 0.8, d.z));
    if (pts.length < 2) return null;
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.3);
  }, []);

  useFrame((state) => {
    if (!group.current || !curve) return;
    const speed = reducedMotion ? 0 : authStage >= 2 ? 0.3 : 0.07;
    group.current.children.forEach((child, i) => {
      const p = (state.clock.elapsedTime * speed + i * 0.25) % 1;
      const pos = curve.getPointAt(p);
      if (pos) {
        child.position.copy(pos);
        child.position.y += 0.25;
      }
    });
  });

  if (!curve) return null;
  return (
    <group>
      <group ref={group}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.13, 10, 10]} />
            <meshBasicMaterial color="#22D3EE" transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------------- ambient dust ---------------- */

function AmbientDust({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geom = useMemo(() => {
    const N = 260;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 46;
      positions[i * 3 + 1] = Math.random() * 16 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 46;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame((state, delta) => {
    if (reducedMotion || !ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - delta * 0.12;
      if (y < -2) y = 14;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    ref.current.rotation.y = state.clock.elapsedTime * 0.008;
  });

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.055} color="#8B93F8" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ---------------- camera parallax + auth fly-through ---------------- */

function CameraDirector({ focus, authStage, reducedMotion }: { focus: FocusMode; authStage: number; reducedMotion: boolean }) {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const targetPos = useRef(new THREE.Vector3(0, 3.4, 15));
  const targetLook = useRef(new THREE.Vector3(0, 1.4, -6));

  useMemo(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (authStage >= 3) {
      targetPos.current.set(0, 1.6, -6);
      targetLook.current.set(0, 1.2, -6);
    } else if (authStage >= 2) {
      targetPos.current.set(0, 2.6, 9);
      targetLook.current.set(0, 1.4, -6);
    } else {
      targetPos.current.set(mouse.current.x * 0.9, 3.4 - mouse.current.y * 0.5, 15);
      targetLook.current.set(mouse.current.x * 0.6, 1.4 - mouse.current.y * 0.25, -6);
    }
    camera.position.lerp(targetPos.current, Math.min(1, delta * (authStage >= 2 ? 2.2 : 1.6)));
    camera.lookAt(targetLook.current);
  });

  return null;
}

/* ---------------- exported canvas ---------------- */

export function LoginScene({ focus, authStage, onHover, reducedMotion }: LoginSceneProps) {
  const dim = focus === "password" ? 0.55 : 1;
  return (
    <Canvas
      camera={{ position: [0, 3.4, 15], fov: 55 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={["#080B12", 16, 52]} />
      <color attach="background" args={["#080B12"]} />

      <ambientLight intensity={0.5 * dim} />
      <directionalLight position={[8, 14, 6]} intensity={0.7 * dim} color="#CFE4FF" />
      <directionalLight position={[-10, 6, -8]} intensity={0.35 * dim} color="#22D3EE" />

      <group>
        <MemoryCore authStage={authStage} reducedMotion={reducedMotion} />
        <OrbitNodes authStage={authStage} onHover={onHover} reducedMotion={reducedMotion} />
        <DeptStructures focus={focus} />
        <DeptLinks />
        <WorkflowParticles authStage={authStage} reducedMotion={reducedMotion} />
        <AmbientDust reducedMotion={reducedMotion} />
      </group>

      <CameraDirector focus={focus} authStage={authStage} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
