import { Stars } from "@react-three/drei";
import { useQuality } from "../quality";

export function FireScene() {
  const { settings } = useQuality();
  return (
    <>
      <Stars
        radius={150}
        depth={160}
        count={3500}
        factor={5}
        saturation={0.1}
        fade
        speed={0.12}
      />
      <ambientLight intensity={0.5} color="#ff6a3a" />
      <hemisphereLight args={["#ff4a1a", "#150404", 0.85]} />
      <directionalLight
        position={[22, 42, 18]}
        intensity={1.5}
        color="#ffd8a8"
        castShadow={settings.shadows}
        shadow-mapSize={[settings.shadowMapSize, settings.shadowMapSize]}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-near={0.5}
        shadow-camera-far={150}
      />
      <directionalLight
        position={[-22, 18, -14]}
        intensity={0.55}
        color="#ff8040"
      />
      <pointLight
        position={[0, -1, 0]}
        intensity={8}
        color="#ff4a0a"
        distance={30}
        decay={2}
      />
    </>
  );
}
