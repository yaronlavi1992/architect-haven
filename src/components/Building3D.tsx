import { useRef, useMemo, useEffect, useCallback } from "react";
import * as THREE from "three";

interface Building3DProps {
  building: any;
  onApartmentClick: (sectionIndex: number, floorIndex: number, apartmentIndex: number) => void;
  selectedApartments: Set<string>;
}

const FLOOR_HEIGHT = 5;

function ApartmentSlice({
  apartmentIndex,
  segmentWidth,
  radialSegments,
  color,
  onClick,
}: {
  apartmentIndex: number;
  segmentWidth: number;
  radialSegments: number;
  color: string;
  onClick: () => void;
}) {
  const { geometry, edges } = useMemo(() => {
    const args = [
      5, 5, FLOOR_HEIGHT, radialSegments, 1, false,
      segmentWidth * apartmentIndex, segmentWidth,
    ] as const;
    const geom = new THREE.CylinderGeometry(...args);
    return { geometry: geom, edges: new THREE.EdgesGeometry(geom) };
  }, [apartmentIndex, segmentWidth, radialSegments]);

  useEffect(() => () => {
    geometry.dispose();
    edges.dispose();
  }, [geometry, edges]);

  return (
    <group>
      <mesh position={[0, FLOOR_HEIGHT / 2, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <primitive object={geometry} attach="geometry" />
        <meshPhongMaterial color={color} />
      </mesh>
      <lineSegments position={[0, FLOOR_HEIGHT / 2, 0]}>
        <primitive object={edges} attach="geometry" />
        <lineBasicMaterial color="#000" />
      </lineSegments>
    </group>
  );
}

export default function Building3D({ building, onApartmentClick, selectedApartments }: Building3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const getApartmentColor = useCallback(
    (apartment: any, sectionIndex: number, floorIndex: number, apartmentIndex: number) => {
      const apartmentId = `${sectionIndex}-${floorIndex}-${apartmentIndex}`;
      if (selectedApartments.has(apartmentId)) return "#FFEA00";
      if (apartment.documents?.length > 0) return apartment.documents[0].color || "#fff";
      return "#fff";
    },
    [selectedApartments]
  );

  const baseGeometry = useMemo(() => new THREE.BoxGeometry(20, 1, 10), []);
  const baseMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "white" }), []);

  useEffect(() => () => {
    baseGeometry.dispose();
    baseMaterial.dispose();
  }, [baseGeometry, baseMaterial]);

  let globalFloorIndex = 0;

  return (
    <>
      <mesh position={[0, -0.5, 0]} geometry={baseGeometry} material={baseMaterial} />

      <group ref={groupRef}>
        {building.sections.map((section: any, sectionIndex: number) => {
          const floorCount = section.endFloor - section.startFloor + 1;
          const apartments = section.apartments.slice(0, section.apartmentsCount);
          const segmentWidth = (2 * Math.PI) / apartments.length;
          const radialSegments =
            apartments.length >= 4 ? 1 : Math.max(1, Math.floor(60 / apartments.length));

          return (
            <group key={sectionIndex}>
              {Array.from({ length: floorCount }, (_, floorIndex) => {
                const yPos = globalFloorIndex * FLOOR_HEIGHT;
                globalFloorIndex += 1;

                return (
                  <group key={floorIndex} position={[0, yPos, 0]}>
                    {apartments.map((apartment: any, apartmentIndex: number) => (
                      <ApartmentSlice
                        key={apartmentIndex}
                        apartmentIndex={apartmentIndex}
                        segmentWidth={segmentWidth}
                        radialSegments={radialSegments}
                        color={getApartmentColor(apartment, sectionIndex, floorIndex, apartmentIndex)}
                        onClick={() => onApartmentClick(sectionIndex, floorIndex, apartmentIndex)}
                      />
                    ))}
                  </group>
                );
              })}
            </group>
          );
        })}
      </group>
    </>
  );
}
