import { Stars } from "@react-three/drei";

export function Scene() {
  return (
    <>
      <Stars
        radius={150}
        depth={190}
        count={14000}
        factor={12}
        saturation={0.65}
        fade
        speed={0.25}
      />
      <ambientLight intensity={0.45} color="#8a94c4" />
      <hemisphereLight args={["#c9a3ff", "#241433", 0.7]} />
      <directionalLight
        position={[25, 35, 15]}
        intensity={1.9}
        color="#f4f6ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.5}
        shadow-camera-far={140}
      />
      <directionalLight
        position={[-30, 18, -20]}
        intensity={0.55}
        color="#a88bff"
      />
    </>
  );
}
