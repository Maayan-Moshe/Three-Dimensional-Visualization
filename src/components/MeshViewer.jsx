import React, { useEffect, useRef, useMemo, use } from "react";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { useGLTF } from "@react-three/drei";
import { decodePlyBinary } from "../services/plyUtils";
import { Matrix4, BufferGeometry, BufferAttribute } from "three";
import { useGeometry } from "../contexts/GeometryContext";
import { extractGeometryData } from "../services/registrationService";
import { mergeGroupMeshes } from "../utils/merge_group_to_single_mesh";

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
  const allData = geometries.map((geom) => {
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

/**
 * Common helper to update vertices on a BufferGeometry.
 * Used by all model types (GLTF, OBJ, STL, PLY) for consistency.
 * @param {BufferGeometry} bufferGeometry - The Three.js BufferGeometry to update
 * @param {Float32Array} newVertices - The new vertex positions
 * @returns {boolean} - Whether the update was successful
 */
export const updateGeometryVertices = (bufferGeometry, newVertices) => {
  if (!bufferGeometry) return false;
  const positionAttribute = bufferGeometry.getAttribute('position');
  if (
    positionAttribute &&
    positionAttribute.array.length === newVertices.length
  ) {
    positionAttribute.array.set(newVertices);
    positionAttribute.needsUpdate = true;
    bufferGeometry.computeVertexNormals();
    bufferGeometry.computeBoundingSphere();
    return true;
  }
  return false;
};

const GLTFModel = ({ url, meshId, transformMatrix }) => {
  const { scene } = useGLTF(url);
  const { registerGeometry, getGeometry, getGeometryVersion } = useGeometry();
  const meshRef = useRef();

  const clone = useMemo(() => scene.clone(), [scene]);
  const geometries = extractAllGeometries(clone);
  const data = mergeGeometryData(geometries);
  const geom = useMemo(() => {
    if (data) {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(data.vertices, 3));
      geometry.setIndex(new BufferAttribute(data.faces, 1));
      geometry.computeVertexNormals();
      return geometry;
    } else return new BufferGeometry(); // Empty geometry if no data
  }, [data]); 
  const matrix = useMemo(
    () => createMatrix4(transformMatrix),
    [transformMatrix]
  );
  const geometryVersion = getGeometryVersion(meshId);

  useEffect(() => {
    registerGeometry(meshId, geom.getAttribute("position"), geom.index.array);
  }, [geom, meshId, registerGeometry]);

  // Update geometry when vertices change
  useEffect(() => {
    if (!geometryLoaded || !bufferGeometry) return;
    const geometry = getGeometry(meshId);
    if (!geometry) return;
    updateGeometryVertices(bufferGeometry, geometry.vertices);
  }, [geometryVersion, meshId, getGeometry, geometryLoaded, bufferGeometry]);

  if (!geometryLoaded || !bufferGeometry) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geom}
      matrixAutoUpdate={false}
      matrix={matrix}
    >
      <meshStandardMaterial color="white" />
    </mesh>
  );
};

const OBJModel = ({ url, meshId, transformMatrix }) => {
  const obj = useLoader(OBJLoader, url);
  const { registerGeometry, getGeometry, getGeometryVersion } = useGeometry();
  const meshRef = useRef();

  const clone = useMemo(() => obj.clone(), [obj]);
  const geometries = extractAllGeometries(clone);
  const data = mergeGeometryData(geometries);
  const geom = useMemo(() => {
    if (data) {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(data.vertices, 3));
      geometry.setIndex(new BufferAttribute(data.faces, 1));
      geometry.computeVertexNormals();
      return geometry;
    } else return new BufferGeometry(); // Empty geometry if no data
  }, [data]); 
  const matrix = useMemo(
    () => createMatrix4(transformMatrix),
    [transformMatrix]
  );
  const geometryVersion = getGeometryVersion(meshId);

  useEffect(() => {
    registerGeometry(meshId, geom.getAttribute("position").array, geom.index.array);
  }, [geom, meshId, registerGeometry]);

  // Update geometry when vertices change
  useEffect(() => {
    if (!geom) return;
    const geometry = getGeometry(meshId);
    if (!geometry) return;
    updateGeometryVertices(geom, geometry.vertices);
  }, [geometryVersion, meshId, getGeometry, geom]);
  if (!geom) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geom}
      matrixAutoUpdate={false}
      matrix={matrix}
    >
      <meshStandardMaterial color="white" />
    </mesh>
  );
};

const STLModel = ({ url, meshId, transformMatrix }) => {
  const geom = useLoader(STLLoader, url);
  const { registerGeometry, getGeometry, getGeometryVersion } = useGeometry();
  const meshRef = useRef();

  const matrix = useMemo(
    () => createMatrix4(transformMatrix),
    [transformMatrix]
  );
  const geometryVersion = getGeometryVersion(meshId);

  useEffect(() => {
    const data = extractGeometryData(geom);
    registerGeometry(meshId, data.vertices, data.faces);
  }, [geom, meshId, registerGeometry]);

  // Update geometry when vertices change
  useEffect(() => {
    if (!geom) return;
    const geometry = getGeometry(meshId);
    if (!geometry) return;
    updateGeometryVertices(geom, geometry.vertices);
  }, [geometryVersion, meshId, getGeometry, geom]);
  if (!geom) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geom}
      matrixAutoUpdate={false}
      matrix={matrix}
    >
      <meshStandardMaterial color="orange" />
    </mesh>
  );
};

const PlyModel = ({ url, meshId, transformMatrix }) => {
  const ply = useLoader(PLYLoader, url);
  const geom = ply.isBufferGeometry ? ply : ply.geometry;
  const { registerGeometry, getGeometry, getGeometryVersion } = useGeometry();
  const meshRef = useRef();

  const matrix = useMemo(
    () => createMatrix4(transformMatrix),
    [transformMatrix]
  );
  const geometryVersion = getGeometryVersion(meshId);

  useEffect(() => {
    const data = extractGeometryData(geom);
    registerGeometry(meshId, data.vertices, data.faces);
  }, [geom, meshId, registerGeometry]);

  // Update geometry when vertices change
  useEffect(() => {
    if (!geom) return;
    const geometry = getGeometry(meshId);
    if (!geometry) return;
    updateGeometryVertices(geom, geometry.vertices);
  }, [geometryVersion, meshId, getGeometry, geom]);
  if (!geom) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geom}
      matrixAutoUpdate={false}
      matrix={matrix}
    >
      <meshStandardMaterial color="white" />
    </mesh>
  );
};

const MeshViewer = ({ mesh }) => {
  const { url, format, id, transformMatrix } = mesh;

  if (format === "gltf" || format === "glb") {
    return (
      <GLTFModel url={url} meshId={id} transformMatrix={transformMatrix} />
    );
  }
  if (format === "obj") {
    return <OBJModel url={url} meshId={id} transformMatrix={transformMatrix} />;
  }
  if (format === "stl") {
    return <STLModel url={url} meshId={id} transformMatrix={transformMatrix} />;
  }
  if (format === "ply") {
    return <PlyModel url={url} meshId={id} transformMatrix={transformMatrix} />;
  }
  return null;
};

export default MeshViewer;
