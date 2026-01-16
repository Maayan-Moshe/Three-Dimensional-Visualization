import { useEffect, useRef, useMemo } from "react";
import { surfaceLoader } from "../services/mesh_loaders";
import { Matrix4, BufferGeometry, BufferAttribute } from "three";
import { useGeometry } from "../contexts/GeometryContext";
import { extractGeometryData } from "../services/registrationService";

// Helper to create Matrix4 from 16-element array
const createMatrix4 = (matrixArray) => {
  const matrix = new Matrix4();
  if (matrixArray && matrixArray.length === 16) {
    matrix.fromArray(matrixArray);
  }
  return matrix;
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

/**
 * Common helper to update both vertices and faces on a BufferGeometry.
 * @param {BufferGeometry} bufferGeometry - The Three.js BufferGeometry to update
 * @param {Float32Array} newVertices - The new vertex positions
 * @param {Uint32Array} newFaces - The new face indices
 * @returns {boolean} - Whether the update was successful
 */
export const updateFullBufferGeometry = (bufferGeometry, newVertices, newFaces) => {
  if (!bufferGeometry) return false;
  
  // Update vertices
  const positionAttribute = bufferGeometry.getAttribute('position');
  if (positionAttribute && positionAttribute.array.length === newVertices.length) {
    positionAttribute.array.set(newVertices);
    positionAttribute.needsUpdate = true;
  } else {
    // Vertex count changed, need to create new attribute
    bufferGeometry.setAttribute('position', new BufferAttribute(newVertices, 3));
  }
  
  // Update faces (index)
  const indexAttribute = bufferGeometry.getIndex();
  if (indexAttribute && indexAttribute.array.length === newFaces.length) {
    indexAttribute.array.set(newFaces);
    indexAttribute.needsUpdate = true;
  } else {
    // Face count changed, need to set new index
    bufferGeometry.setIndex(new BufferAttribute(newFaces, 1));
  }
  
  bufferGeometry.computeVertexNormals();
  bufferGeometry.computeBoundingSphere();
  return true;
};


function MeshViewer({ mesh }) {
  const { url, format, id: meshId, transformMatrix } = mesh;
  console.log(`Rendering MeshViewer for mesh ID: ${meshId}, URL: ${url}, format: ${format}`);
  // Cache the loaded surface data - surfaceLoader uses hooks internally that cache by URL,
  // but we memoize the result to avoid reprocessing on every render
  const data = useMemo(() => surfaceLoader(url, format), [url, format]);
  const { registerGeometry, getGeometry, getGeometryVersion } = useGeometry();
  const meshRef = useRef();

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
    //TODO check if data is indeed registered as we get error in MeshCard about missing geometry
    const regitered_data = extractGeometryData(geom);
    registerGeometry(meshId, regitered_data.vertices, regitered_data.faces);
  }, [geom, meshId, registerGeometry]);

  // Update geometry when vertices or faces change
  useEffect(() => {
    if (!geom) return;
    const geometry = getGeometry(meshId);
    if (!geometry || !meshRef.current) return;
    updateFullBufferGeometry(geom, geometry.vertices, geometry.faces);
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


export default MeshViewer;
