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
    positionAttribute.array.count === newVertices.length
  ) {
    positionAttribute.array.set(newVertices);
    positionAttribute.needsUpdate = true;
    bufferGeometry.computeVertexNormals();
    bufferGeometry.computeBoundingSphere();
    return true;
  }
  return false;
};


function MeshViewer({ mesh }) {
  const { url, format, meshId, transformMatrix } = mesh;
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
    const data = extractGeometryData(geom);
    registerGeometry(meshId, data.vertices, data.faces);
  }, [geom, meshId, registerGeometry]);

  // Update geometry when vertices change
  useEffect(() => {
    if (geometryVersion === 0) return;
    if (!geom) return;
    const geometry = getGeometry(meshId);
    if (!geometry || !meshRef.current) return;
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


export default MeshViewer;
