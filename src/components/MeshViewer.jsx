import React from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useGLTF } from '@react-three/drei';

const GLTFModel = ({ url, position }) => {
  const { scene } = useGLTF(url);
  // Clone the scene to allow multiple instances of the same GLTF
  const clone = React.useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} position={position} />;
};

const OBJModel = ({ url, position }) => {
  const obj = useLoader(OBJLoader, url);
  const clone = React.useMemo(() => obj.clone(), [obj]);
  return <primitive object={clone} position={position} />;
};

const STLModel = ({ url, position }) => {
  const geom = useLoader(STLLoader, url);
  return (
    <mesh position={position} geometry={geom}>
      <meshStandardMaterial color="orange" />
    </mesh>
  );
};

const MeshViewer = ({ url, format, position }) => {
  if (format === 'gltf' || format === 'glb') return <GLTFModel url={url} position={position} />;
  if (format === 'obj') return <OBJModel url={url} position={position} />;
  if (format === 'stl') return <STLModel url={url} position={position} />;
  return null;
};

export default MeshViewer;
