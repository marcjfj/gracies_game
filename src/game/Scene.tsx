import { Stars } from "@react-three/drei";

export function Scene() {
  return (
    <>
      <Stars radius={250} depth={90} count={6000} factor={4} saturation={0.2} fade speed={0.2} />
      <ambientLight intensity={0.22} color="#6a78a3" />
      <hemisphereLight args={["#b084e6", "#140a22", 0.4]} />
      <directionalLight
        position={[25, 35, 15]}
        intensity={1.35}
        color="#eaeeff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.5}
        shadow-camera-far={140}
      />
      <directionalLight position={[-30, 18, -20]} intensity={0.35} color="#8a6bd9" />
    </>
  );
}
