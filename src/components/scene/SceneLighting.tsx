export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.55} color="#c5b4a0" />
      <hemisphereLight args={["#b0b8c7", "#32261b", 1.15]} />
      <directionalLight position={[-3, 6, 4]} color="#ffcd8e" intensity={2.5} />
      <directionalLight position={[4, 5, -3]} color="#92aedc" intensity={1.5} />
      <pointLight
        position={[0, 5, 2]}
        intensity={8}
        color="#e8b775"
        distance={12}
        decay={2}
      />
    </>
  );
}
