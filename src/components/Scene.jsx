import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import MeshViewer from './MeshViewer';
import './Scene.css';

const SyncedControls = ({ syncedCamera, onCameraChange }) => {
  const { camera } = useThree();
  const controlsRef = useRef();
  const isUpdating = useRef(false);

  // Update local camera when synced state changes
  useEffect(() => {
    if (syncedCamera && controlsRef.current && !isUpdating.current) {
      isUpdating.current = true;
      camera.position.set(...syncedCamera.position);
      if (syncedCamera.zoom !== undefined && camera.zoom !== undefined) {
        camera.zoom = syncedCamera.zoom;
        camera.updateProjectionMatrix();
      }
      controlsRef.current.target.set(...syncedCamera.target);
      controlsRef.current.update();
      setTimeout(() => {
        isUpdating.current = false;
      }, 0);
    }
  }, [syncedCamera, camera]);

  // Sync camera changes to parent
  useFrame(() => {
    if (controlsRef.current && syncedCamera && !isUpdating.current) {
      const currentZoom = camera.zoom !== undefined ? camera.zoom : null;
      const syncedZoom = syncedCamera.zoom !== undefined ? syncedCamera.zoom : null;
      
      const hasChanged = 
        camera.position.x !== syncedCamera.position[0] ||
        camera.position.y !== syncedCamera.position[1] ||
        camera.position.z !== syncedCamera.position[2] ||
        controlsRef.current.target.x !== syncedCamera.target[0] ||
        controlsRef.current.target.y !== syncedCamera.target[1] ||
        controlsRef.current.target.z !== syncedCamera.target[2] ||
        (currentZoom !== null && currentZoom !== syncedZoom);

      if (hasChanged) {
        const newState = {
          position: [camera.position.x, camera.position.y, camera.position.z],
          target: [
            controlsRef.current.target.x,
            controlsRef.current.target.y,
            controlsRef.current.target.z
          ]
        };
        
        if (currentZoom !== null) {
          newState.zoom = currentZoom;
        }
        
        onCameraChange(newState);
      }
    }
  });

  return <OrbitControls ref={controlsRef} makeDefault />;
};

const Scene = ({ meshes, syncedCamera, onCameraChange }) => {
  return (
    <Canvas 
      orthographic 
      camera={{ position: [0, 5, 10], zoom: 50 }} 
      className="scene-canvas"
    >
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <SyncedControls syncedCamera={syncedCamera} onCameraChange={onCameraChange} />
      
      <Suspense fallback={null}>
        <Center>
            {meshes.map((mesh) => (
            <MeshViewer 
                key={mesh.id} 
                mesh={mesh}
            />
            ))}
        </Center>
      </Suspense>
    </Canvas>
  );
};

export default Scene;
