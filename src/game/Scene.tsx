import { Environment, Sky } from "@react-three/drei";

export function Scene() {
  return (
    <>
      <Sky sunPosition={[20, 30, 10]} turbidity={6} rayleigh={1.5} />
      <Environment preset="sunset" />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
      />
    </>
  );
}
