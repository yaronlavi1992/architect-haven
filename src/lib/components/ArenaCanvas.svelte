<script lang="ts">
  import { onMount } from "svelte";
  import {
    AmbientLight,
    BoxGeometry,
    BufferGeometry,
    Color,
    DirectionalLight,
    EdgesGeometry,
    GridHelper,
    Group,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshStandardMaterial,
    PerspectiveCamera,
    PlaneGeometry,
    Raycaster,
    Scene,
    SphereGeometry,
    Vector2,
    WebGLRenderer,
  } from "three";
  import type { Material, Object3D } from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import type { ArenaRecord, CellType, SimFrame } from "$lib/types";

  interface Props {
    arena: ArenaRecord;
    frame?: SimFrame | null;
    editable?: boolean;
    selectedAgentId?: string | null;
    onCellClick?: (x: number, z: number) => void;
    onAgentClick?: (id: string) => void;
  }

  let {
    arena,
    frame = null,
    editable = false,
    selectedAgentId = null,
    onCellClick = () => {},
    onAgentClick = () => {},
  }: Props = $props();

  let container: HTMLDivElement;
  let scene: Scene;
  let camera: PerspectiveCamera;
  let renderer: WebGLRenderer;
  let controls: OrbitControls;
  let content = new Group();
  const targets = new Map<Object3D, { x?: number; z?: number; agentId?: string }>();
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  const colors: Record<CellType, string> = {
    wall: "#334155",
    food: "#22c55e",
    hazard: "#ef4444",
    goal: "#f59e0b",
  };

  function disposeMaterial(material: Material | Material[]) {
    if (Array.isArray(material)) material.forEach((item) => item.dispose());
    else material.dispose();
  }

  function clearContent() {
    targets.clear();
    content.traverse((object) => {
      if ("geometry" in object && object.geometry instanceof BufferGeometry) object.geometry.dispose();
      if ("material" in object && object.material) disposeMaterial(object.material as Material | Material[]);
    });
    content.clear();
  }

  function rebuild() {
    if (!scene) return;
    clearContent();
    const offsetX = (arena.width - 1) / 2;
    const offsetZ = (arena.height - 1) / 2;
    const floorMaterial = new MeshStandardMaterial({ color: "#111827", roughness: 0.9 });

    for (let x = 0; x < arena.width; x += 1) {
      for (let z = 0; z < arena.height; z += 1) {
        const tile = new Mesh(new BoxGeometry(0.92, 0.12, 0.92), floorMaterial.clone());
        tile.position.set(x - offsetX, 0, z - offsetZ);
        targets.set(tile, { x, z });
        content.add(tile);
      }
    }

    for (const cell of arena.cells) {
      if (cell.type === "food" && frame && !frame.food.includes(`${cell.x}:${cell.z}`)) continue;
      const height = cell.type === "wall" ? 1.6 : cell.type === "hazard" ? 0.18 : 0.55;
      const geometry =
        cell.type === "food"
          ? new SphereGeometry(0.25, 20, 12)
          : new BoxGeometry(cell.type === "wall" ? 0.92 : 0.55, height, cell.type === "wall" ? 0.92 : 0.55);
      const block = new Mesh(
        geometry,
        new MeshStandardMaterial({
          color: colors[cell.type],
          emissive: new Color(colors[cell.type]),
          emissiveIntensity: cell.type === "wall" ? 0.05 : 0.35,
        }),
      );
      block.position.set(cell.x - offsetX, height / 2 + 0.1, cell.z - offsetZ);
      targets.set(block, { x: cell.x, z: cell.z });
      content.add(block);
    }

    const visibleAgents = frame?.agents ?? arena.agents.map((agent, index) => ({ ...agent, id: `${index}-${agent.name}`, alive: true }));
    for (const agent of visibleAgents) {
      if (!("alive" in agent) || !agent.alive) continue;
      const group = new Group();
      const body = new Mesh(
        new SphereGeometry(0.32, 24, 16),
        new MeshStandardMaterial({
          color: agent.color,
          emissive: new Color(agent.color),
          emissiveIntensity: selectedAgentId === agent.id ? 0.8 : 0.25,
        }),
      );
      body.position.y = 0.58;
      const ring = new LineSegments(
        new EdgesGeometry(new BoxGeometry(0.72, 0.08, 0.72)),
        new LineBasicMaterial({ color: selectedAgentId === agent.id ? "#ffffff" : agent.color }),
      );
      ring.position.y = 0.18;
      group.position.set(agent.x - offsetX, 0, agent.z - offsetZ);
      group.add(body, ring);
      targets.set(body, { agentId: agent.id });
      content.add(group);
    }
  }

  function resize() {
    if (!container || !camera || !renderer) return;
    camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function handleClick(event: MouseEvent) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const match = raycaster.intersectObjects([...targets.keys()], false)[0]?.object;
    const target = match ? targets.get(match) : null;
    if (target?.agentId) onAgentClick(target.agentId);
    else if (editable && target?.x != null && target.z != null) onCellClick(target.x, target.z);
  }

  onMount(() => {
    scene = new Scene();
    scene.background = new Color("#070b18");
    camera = new PerspectiveCamera(48, 1, 0.1, 500);
    camera.position.set(arena.width * 0.75, Math.max(arena.width, arena.height) * 0.95, arena.height * 0.85);
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    scene.add(new AmbientLight("#c4b5fd", 1.8));
    const light = new DirectionalLight("#ffffff", 2.2);
    light.position.set(8, 15, 10);
    scene.add(light);
    const grid = new GridHelper(Math.max(arena.width, arena.height) + 2, Math.max(arena.width, arena.height) + 2, "#7c3aed", "#1e293b");
    grid.position.y = -0.08;
    scene.add(grid);
    const underlay = new Mesh(new PlaneGeometry(100, 100), new MeshStandardMaterial({ color: "#070b18" }));
    underlay.rotation.x = -Math.PI / 2;
    underlay.position.y = -0.12;
    scene.add(underlay);
    scene.add(content);
    resize();
    rebuild();
    renderer.domElement.addEventListener("click", handleClick);
    window.addEventListener("resize", resize);
    let animation = 0;
    const loop = () => {
      animation = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("click", handleClick);
      clearContent();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  });

  $effect(() => {
    arena;
    frame;
    selectedAgentId;
    rebuild();
  });
</script>

<div class="h-full min-h-[360px] w-full" bind:this={container}></div>
