/**
 * Deformation Service
 * Handles communication with the mesh deformation server
 */

const DEFORMATION_URL = import.meta.env.VITE_DEFORMATION_SERVER_URL || 'http://localhost:8000/deform';

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

  // Create Blobs from typed arrays
  const verticesBlob = new Blob([vertices.buffer], { type: 'application/octet-stream' });
  const facesBlob = new Blob([faces.buffer], { type: 'application/octet-stream' });

  formData.append('vertices', verticesBlob, 'vertices.bin');
  formData.append('faces', facesBlob, 'faces.bin');

  // Add metadata
  formData.append('meta', JSON.stringify({
    meshId,
    vertexCount: vertices.length / 3,  // 3 floats per vertex (x, y, z)
    faceCount: faces.length / 3,       // 3 indices per face (triangle)
    vertexType: 'float32',
    faceType: 'uint32'
  }));

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

  // Response is binary float32 data (deformed vertices)
  const arrayBuffer = await response.arrayBuffer();
  const deformedVertices = new Float32Array(arrayBuffer);

  return deformedVertices;
};
