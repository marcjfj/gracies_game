import { Stars } from "@react-three/drei";
import { useQuality } from "../quality";

export function IceScene() {
  const { settings } = useQuality();
  return (
    <>
      <Stars
        radius={150}
        depth={190}
        count={12000}
        factor={10}
        saturation={0.35}
        fade
        speed={0.2}
      />
      <ambientLight intensity={0.55} color="#cfe6ff" />
      <hemisphereLight args={["#e8f4ff", "#0f2235", 0.9]} />
      <directionalLight
        position={[30, 40, 20]}
        intensity={2.1}
        color="#f6fbff"
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
        position={[-28, 22, -16]}
        intensity={0.6}
        color="#8ebaff"
      />
    </>
  );
}
