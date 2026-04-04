<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    AmbientLight,
    BoxGeometry,
    BufferGeometry,
    CylinderGeometry,
    EdgesGeometry,
    Group,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshPhongMaterial,
    MeshPhysicalMaterial,
    PerspectiveCamera,
    PointLight,
    Raycaster,
    Scene,
    Vector2,
    WebGLRenderer,
  } from "three";
  import type { Material, Object3D } from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import type { BuildingRecord } from "$lib/types";
  import { buildApartmentId, getApartmentColor, getTotalFloors } from "$lib/utils";

  interface Props {
    building: BuildingRecord | null;
    selectedApartments: Set<string>;
    onApartmentClick: (sectionIndex: number, floorIndex: number, apartmentIndex: number) => void;
  }

  type ApartmentMeta = {
    sectionIndex: number;
    floorIndex: number;
    apartmentIndex: number;
  };

  const FLOOR_HEIGHT = 5;

  let { building, selectedApartments, onApartmentClick }: Props = $props();

  let container: HTMLDivElement | null = null;
  let scene: Scene | null = null;
  let camera: PerspectiveCamera | null = null;
  let renderer: WebGLRenderer | null = null;
  let controls: OrbitControls | null = null;
  let apartmentGroup: Group | null = null;
  const apartmentTargets = new Map<Object3D, ApartmentMeta>();
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  function disposeMaterial(material: Material | Material[]) {
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
      return;
    }

    material.dispose();
  }

  function clearGroup(group: Group) {
    while (group.children.length > 0) {
      const child = group.children.pop();
      if (!child) continue;

      group.remove(child);

      if (child instanceof Group) {
        clearGroup(child);
        continue;
      }

      if ("geometry" in child && child.geometry instanceof BufferGeometry) {
        child.geometry.dispose();
      }

      if ("material" in child && child.material) {
        disposeMaterial(child.material as Material | Material[]);
      }
    }
  }

  function rebuildBuilding(options: { resetCamera?: boolean } = {}) {
    if (!apartmentGroup) return;

    clearGroup(apartmentGroup);
    apartmentTargets.clear();

    if (!building) return;

    let globalFloorIndex = 0;

    for (const [sectionIndex, section] of building.sections.entries()) {
      const floorCount = section.endFloor - section.startFloor + 1;
      const apartments = section.apartments.slice(0, section.apartmentsCount);
      const segmentWidth = (2 * Math.PI) / apartments.length;
      const radialSegments =
        apartments.length >= 4 ? 1 : Math.max(1, Math.floor(60 / apartments.length));

      for (let floorIndex = 0; floorIndex < floorCount; floorIndex += 1) {
        const floorGroup = new Group();
        floorGroup.position.y = globalFloorIndex * FLOOR_HEIGHT;
        globalFloorIndex += 1;

        apartments.forEach((apartment, apartmentIndex) => {
          const apartmentId = buildApartmentId(sectionIndex, floorIndex, apartmentIndex);
          const color = getApartmentColor(apartment, selectedApartments, apartmentId);

          const geometry = new CylinderGeometry(
            5,
            5,
            FLOOR_HEIGHT,
            radialSegments,
            1,
            false,
            segmentWidth * apartmentIndex,
            segmentWidth,
          );
          const edges = new EdgesGeometry(geometry);

          const mesh = new Mesh(
            geometry,
            new MeshPhongMaterial({ color }),
          );
          mesh.position.set(0, FLOOR_HEIGHT / 2, 0);

          const outline = new LineSegments(
            edges,
            new LineBasicMaterial({ color: "#000000" }),
          );
          outline.position.set(0, FLOOR_HEIGHT / 2, 0);

          apartmentTargets.set(mesh, {
            sectionIndex,
            floorIndex,
            apartmentIndex,
          });

          floorGroup.add(mesh);
          floorGroup.add(outline);
        });

        apartmentGroup.add(floorGroup);
      }
    }

    if (options.resetCamera && camera && controls) {
      const totalFloors = getTotalFloors(building.sections);
      camera.position.set(-26, totalFloors * 6, totalFloors * 10);
      camera.lookAt(0, totalFloors * 2, 0);
      controls.target.set(0, 20, 0);
      controls.update();
    }
  }

  function handleResize() {
    if (!container || !camera || !renderer) return;

    const { clientWidth, clientHeight } = container;
    camera.aspect = clientWidth / Math.max(clientHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
  }

  function handlePointerDown(event: MouseEvent) {
    if (!container || !camera || !scene || !renderer) return;

    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(Array.from(apartmentTargets.keys()), false);
    const firstMatch = intersections[0]?.object;
    if (!firstMatch) return;

    const target = apartmentTargets.get(firstMatch);
    if (!target) return;

    onApartmentClick(target.sectionIndex, target.floorIndex, target.apartmentIndex);
  }

  onMount(() => {
    if (!container) return;

    scene = new Scene();

    camera = new PerspectiveCamera(50, 1, 0.1, 1000);
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor("#bfdbfe");
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enableDamping = true;

    scene.add(new AmbientLight("white", 3));

    const pointLight = new PointLight("white", 1);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    const base = new Mesh(
      new BoxGeometry(20, 1, 10),
      new MeshPhysicalMaterial({ color: "white" }),
    );
    base.position.set(0, -0.5, 0);
    scene.add(base);

    apartmentGroup = new Group();
    scene.add(apartmentGroup);

    handleResize();
    rebuildBuilding({ resetCamera: true });

    renderer.domElement.addEventListener("click", handlePointerDown);
    window.addEventListener("resize", handleResize);

    let frame = 0;
    const loop = () => {
      frame = window.requestAnimationFrame(loop);
      controls?.update();
      if (scene && camera && renderer) {
        renderer.render(scene, camera);
      }
    };

    loop();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      renderer?.domElement.removeEventListener("click", handlePointerDown);

      controls?.dispose();
      if (apartmentGroup) {
        clearGroup(apartmentGroup);
      }

      scene?.traverse((object) => {
        if ("geometry" in object && object.geometry instanceof BufferGeometry) {
          object.geometry.dispose();
        }

        if ("material" in object && object.material) {
          disposeMaterial(object.material as Material | Material[]);
        }
      });

      renderer?.dispose();
      renderer?.domElement.remove();
      apartmentTargets.clear();
    };
  });

  $effect(() => {
    building;
    untrack(() => rebuildBuilding({ resetCamera: true }));
  });

  $effect(() => {
    selectedApartments;
    rebuildBuilding();
  });
</script>

<div class="h-full w-full" bind:this={container}></div>
