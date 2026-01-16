/**
 * Deformation Service
 * Handles communication with the mesh deformation server
 */

import { encodePlyBinary, decodePlyBinary } from './plyUtils';

const DEFORMATION_URL = import.meta.env.VITE_DEFORMATION_SERVER_URL || 'http://localhost:8001/deform';

/**
 * Send a mesh to the backend for deformation and return deformed vertices
 * @param {string} meshId - The ID of the mesh
 * @param {{ vertices: Float32Array, faces: Uint32Array }} geometry - The mesh geometry data
 * @param {number} deformationRatio - Ratio of mesh scale for deformation
 * @param {number} numberOfModes - Number of deformation modes
 * @returns {Promise<Float32Array>} - The deformed vertices
 */
export const deformMesh = async (meshId, geometry, deformationRatio, numberOfModes) => {
  const { vertices, faces } = geometry;
  const formData = new FormData();

  // Encode mesh as PLY binary
  const plyBlob = encodePlyBinary(vertices, faces);
  formData.append('mesh', plyBlob, `${meshId}.ply`);

  // Build URL with deformation parameters
  const url = new URL(DEFORMATION_URL);
  url.searchParams.set('deformation_ratio', deformationRatio.toString());
  url.searchParams.set('number_of_modes', numberOfModes.toString());

  const response = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deformation failed: ${response.status} - ${errorText}`);
  }

  // Response is binary PLY data
  const arrayBuffer = await response.arrayBuffer();
  const { vertices: deformedVertices } = decodePlyBinary(arrayBuffer);
  // console.log("change in vertices:", deformedVertices.map((v, i) => v - vertices[i]));
  return { vertices: deformedVertices, faces: faces};
};
