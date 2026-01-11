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
 * @param {number} deformationMagnitudeMm - Magnitude of deformation in mm
 * @param {number} deformationAreaMm2 - Area of deformation in mm²
 * @returns {Promise<Float32Array>} - The deformed vertices
 */
export const deformMesh = async (meshId, geometry, deformationMagnitudeMm, deformationAreaMm2) => {
  const { vertices, faces } = geometry;
  const formData = new FormData();

  // Encode mesh as PLY binary
  const plyBlob = encodePlyBinary(vertices, faces);
  formData.append('mesh', plyBlob, `${meshId}.ply`);

  // Build URL with deformation parameters
  const url = new URL(DEFORMATION_URL);
  url.searchParams.set('deformation_magnitude_mm', deformationMagnitudeMm.toString());
  url.searchParams.set('deformation_area_mm2', deformationAreaMm2.toString());

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

  return deformedVertices;
};
