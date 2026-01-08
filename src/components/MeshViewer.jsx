import React, { useEffect, useRef, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useGLTF } from '@react-three/drei';
import { Matrix4, BufferGeometry, BufferAttribute } from 'three';
import { useGeometry } from '../contexts/GeometryContext';
import { extractGeometryData } from '../services/registrationService';

// Helper to create Matrix4 from 16-element array
const createMatrix4 = (matrixArray) => {
  const matrix = new Matrix4();
  if (matrixArray && matrixArray.length === 16) {
    matrix.fromArray(matrixArray);
  }
  return matrix;
};

// Helper to extract all geometries from a Three.js object
const extractAllGeometries = (object) => {
  const geometries = [];
  object.traverse((child) => {
    if (child.isMesh && child.geometry) {
      geometries.push(child.geometry);
    }
  });
  return geometries;
};

// Helper to merge geometry data from multiple geometries
const mergeGeometryData = (geometries) => {
  if (geometries.length === 0) return null;
  if (geometries.length === 1) return extractGeometryData(geometries[0]);

  // Merge all vertices and faces
  let totalVertices = 0;
  let totalFaces = 0;
  const allData = geometries.map(geom => {
    const data = extractGeometryData(geom);
    totalVertices += data.vertices.length;
    totalFaces += data.faces.length;
    return data;
  });

  const mergedVertices = new Float32Array(totalVertices);
  const mergedFaces = new Uint32Array(totalFaces);

  let vertexOffset = 0;
  let faceOffset = 0;
  let vertexIndexOffset = 0;

  for (const data of allData) {
    mergedVertices.set(data.vertices, vertexOffset);
    
    // Offset face indices by the current vertex count
    for (let i = 0; i < data.faces.length; i++) {
      mergedFaces[faceOffset + i] = data.faces[i] + vertexIndexOffset;
    }
    
    vertexOffset += data.vertices.length;
    faceOffset += data.faces.length;
    vertexIndexOffset += data.vertices.length / 3;
  }

  return { vertices: mergedVertices, faces: mergedFaces };
};

const GLTFModel = ({ url, meshId, transformMatrix }) => {
  const { scene } = useGLTF(url);
  const { registerGeometry, getGeometry, getGeometryVersion } = useGeometry();
  const groupRef = useRef();
  
  const clone = useMemo(() => scene.clone(), [scene]);
  const matrix = useMemo(() => createMatrix4(transformMatrix), [transformMatrix]);
  const geometryVersion = getGeometryVersion(meshId);

  useEffect(() => {
    const geometries = extractAllGeometries(clone);
    const data = mergeGeometryData(geometries);
    if (data) {
      registerGeometry(meshId, data.vertices, data.faces);
    }
  }, [clone, meshId, registerGeometry]);

  // Update geometry when vertices change
  useEffect(() => {
    if (geometryVersion === 0) return;
    const geometry = getGeometry(meshId);
    if (!geometry) return;

    clone.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const positionAttribute = child.geometry.attributes.position;
        if (positionAttribute && positionAttribute.array.length === geometry.vertices.length) {
          positionAttribute.array.set(geometry.vertices);
          positionAttribute.needsUpdate = true;
          child.geometry.computeVertexNormals();
          child.geometry.computeBoundingSphere();
        }
      }
    });
  }, [geometryVersion, meshId, getGeometry, clone]);

  return (
    <group ref={groupRef} matrixAutoUpdate={false} matrix={matrix}>
      <primitive object={clone} />
    </group>
  );
};

const OBJModel = ({ url, meshId, transformMatrix }) => {
  const obj = useLoader(OBJLoader, url);
  const { registerGeometry, getGeometry, getGeometryVersion } = useGeometry();
  const groupRef = useRef();
  
  const clone = useMemo(() => obj.clone(), [obj]);
  const matrix = useMemo(() => createMatrix4(transformMatrix), [transformMatrix]);
  const geometryVersion = getGeometryVersion(meshId);

  useEffect(() => {
    const geometries = extractAllGeometries(clone);
    const data = mergeGeometryData(geometries);
    if (data) {
      registerGeometry(meshId, data.vertices, data.faces);
    }
  }, [clone, meshId, registerGeometry]);

  // Update geometry when vertices change
  useEffect(() => {
    if (geometryVersion === 0) return;
    const geometry = getGeometry(meshId);
    if (!geometry) return;

    clone.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const positionAttribute = child.geometry.attributes.position;
        if (positionAttribute && positionAttribute.array.length === geometry.vertices.length) {
          positionAttribute.array.set(geometry.vertices);
          positionAttribute.needsUpdate = true;
          child.geometry.computeVertexNormals();
          child.geometry.computeBoundingSphere();
        }
      }
    });
  }, [geometryVersion, meshId, getGeometry, clone]);

  return (
    <group ref={groupRef} matrixAutoUpdate={false} matrix={matrix}>
      <primitive object={clone} />
    </group>
  );
};

const STLModel = ({ url, meshId, transformMatrix }) => {
  const geom = useLoader(STLLoader, url);
  const { registerGeometry, getGeometry, getGeometryVersion } = useGeometry();
  const meshRef = useRef();
  
  const matrix = useMemo(() => createMatrix4(transformMatrix), [transformMatrix]);
  const geometryVersion = getGeometryVersion(meshId);

  useEffect(() => {
    const data = extractGeometryData(geom);
    registerGeometry(meshId, data.vertices, data.faces);
  }, [geom, meshId, registerGeometry]);

  // Update geometry when vertices change
  useEffect(() => {
    if (geometryVersion === 0) return;
    const geometry = getGeometry(meshId);
    if (!geometry || !meshRef.current) return;

    const positionAttribute = meshRef.current.geometry.attributes.position;
    if (positionAttribute && positionAttribute.array.length === geometry.vertices.length) {
      positionAttribute.array.set(geometry.vertices);
      positionAttribute.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
      meshRef.current.geometry.computeBoundingSphere();
    }
  }, [geometryVersion, meshId, getGeometry]);

  return (
    <mesh ref={meshRef} geometry={geom} matrixAutoUpdate={false} matrix={matrix}>
      <meshStandardMaterial color="orange" />
    </mesh>
  );
};

const MeshViewer = ({ mesh }) => {
  const { url, format, id, transformMatrix } = mesh;
  
  if (format === 'gltf' || format === 'glb') {
    return <GLTFModel url={url} meshId={id} transformMatrix={transformMatrix} />;
  }
  if (format === 'obj') {
    return <OBJModel url={url} meshId={id} transformMatrix={transformMatrix} />;
  }
  if (format === 'stl') {
    return <STLModel url={url} meshId={id} transformMatrix={transformMatrix} />;
  }
  return null;
};

export default MeshViewer;
