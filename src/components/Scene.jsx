import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Center } from '@react-three/drei';
import MeshViewer from './MeshViewer';
import './Scene.css';

const Scene = ({ meshes }) => {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 50 }} className="scene-canvas">
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <OrbitControls makeDefault />
      <Grid infiniteGrid fadeDistance={50} fadeStrength={5} />
      
      <Suspense fallback={null}>
        <Center>
            {meshes.map((mesh) => (
            <MeshViewer 
                key={mesh.id} 
                url={mesh.url} 
                format={mesh.format} 
                position={mesh.position} 
            />
            ))}
        </Center>
      </Suspense>
    </Canvas>
  );
};

export default Scene;
