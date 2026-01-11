/**
 * Cleaning Service
 * Handles communication with the mesh cleaning server
 */

import { encodePlyBinary, decodePlyBinary } from './plyUtils';

const CLEANING_URL = import.meta.env.VITE_CLEANING_SERVER_URL || 'http://localhost:8001/clean';

/**
 * Send a mesh to the backend for cleaning and return cleaned vertices and faces
 * @param {string} meshId - The ID of the mesh
 * @param {{ vertices: Float32Array, faces: Uint32Array }} geometry - The mesh geometry data
 * @returns {Promise<{ vertices: Float32Array, faces: Uint32Array }>} - The cleaned mesh geometry
 */
export const cleanMesh = async (meshId, geometry) => {
  const { vertices, faces } = geometry;
  const formData = new FormData();

  // Encode mesh as PLY binary
  const plyBlob = encodePlyBinary(vertices, faces);
  formData.append('mesh', plyBlob, `${meshId}.ply`);

  const response = await fetch(CLEANING_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cleaning failed: ${response.status} - ${errorText}`);
  }

  // Response is binary PLY data
  const arrayBuffer = await response.arrayBuffer();
  const { vertices: cleanedVertices, faces: cleanedFaces } = decodePlyBinary(arrayBuffer);

  return {
    vertices: cleanedVertices,
    faces: cleanedFaces,
  };
};
