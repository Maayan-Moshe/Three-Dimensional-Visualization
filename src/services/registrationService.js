/**
 * Registration Service
 * Handles communication with the mesh registration server
 */

import { encodePlyBinary } from './plyUtils';

const REGISTRATION_URL = import.meta.env.VITE_REGISTRATION_SERVER_URL || 'http://localhost:8001/register';

/**
 * Extract vertices and faces from a Three.js geometry or mesh
 * @param {THREE.BufferGeometry} geometry - The geometry to extract data from
 * @returns {{ vertices: Float32Array, faces: Uint32Array }}
 */
export const extractGeometryData = (geometry) => {
  // Get position attribute (vertices)
  const positionAttribute = geometry.attributes.position;
  const vertices = new Float32Array(positionAttribute.array);

  // Get index attribute (faces) or generate from non-indexed geometry
  let faces;
  if (geometry.index) {
    faces = new Uint32Array(geometry.index.array);
  } else {
    // Non-indexed geometry: generate sequential indices
    const numVertices = positionAttribute.count;
    faces = new Uint32Array(numVertices);
    for (let i = 0; i < numVertices; i++) {
      faces[i] = i;
    }
  }

  return { vertices, faces };
};

/**
 * Register meshes with the external server
 * @param {Map<string, { vertices: Float32Array, faces: Uint32Array }>} geometryMap - Map of meshId to geometry data
 * @param {number} voxelSize - Voxel size for downsampling (default: 0.05)
 * @returns {Promise<Object>} - Object mapping meshId to 16-element transformation matrix array
 */
export const registerMeshes = async (geometryMap, voxelSize = 0.05) => {
  const formData = new FormData();

  // Add PLY binary data for each mesh
  for (const [meshId, { vertices, faces }] of geometryMap) {
    const plyBlob = encodePlyBinary(vertices, faces);
    formData.append(`mesh_${meshId}`, plyBlob, `${meshId}.ply`);
  }

  // Build URL with voxel size query parameter
  const url = new URL(REGISTRATION_URL);
  url.searchParams.set('voxel_size', voxelSize.toString());

  const response = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Registration failed: ${response.status} - ${errorText}`);
  }

  // Backend response format:
  // {
  //   "reference_mesh_id": "...",
  //   "voxel_size": ...,
  //   "mesh_count": ...,
  //   "transformations": {
  //     "meshId": [[4x4 row-major matrix]]
  //   }
  // }
  const result = await response.json();
  
  // Convert transformation matrices to column-major order for Three.js
  const transformations = {};
  for (const [meshId, matrix] of Object.entries(result.transformations)) {
    // Convert from row-major (numpy) to column-major (Three.js)
    // Row-major: [[r0c0, r0c1, r0c2, r0c3], [r1c0, r1c1, r1c2, r1c3], ...]
    // Column-major: [r0c0, r1c0, r2c0, r3c0, r0c1, r1c1, r2c1, r3c1, ...]
    transformations[meshId] = [
      matrix[0][0], matrix[1][0], matrix[2][0], matrix[3][0],
      matrix[0][1], matrix[1][1], matrix[2][1], matrix[3][1],
      matrix[0][2], matrix[1][2], matrix[2][2], matrix[3][2],
      matrix[0][3], matrix[1][3], matrix[2][3], matrix[3][3],
    ];
  }
  
  return transformations;
};

export default { extractGeometryData, registerMeshes };
