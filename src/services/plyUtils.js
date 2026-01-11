/**
 * PLY Utilities
 * Functions for encoding and decoding PLY binary format
 */

/**
 * Encode vertices and faces into a binary PLY format
 * @param {Float32Array} vertices - Vertex positions (x, y, z per vertex)
 * @param {Uint32Array} faces - Face indices (3 indices per triangle)
 * @returns {Blob} - Binary PLY blob
 */
export const encodePlyBinary = (vertices, faces) => {
  const vertexCount = vertices.length / 3;
  const faceCount = faces.length / 3;

  // Create PLY header
  const header = [
    'ply',
    'format binary_little_endian 1.0',
    `element vertex ${vertexCount}`,
    'property float x',
    'property float y',
    'property float z',
    `element face ${faceCount}`,
    'property list uchar uint vertex_indices',
    'end_header\n',
  ].join('\n');

  const headerBytes = new TextEncoder().encode(header);

  // Calculate total size
  // Vertices: vertexCount * 3 floats * 4 bytes
  // Faces: faceCount * (1 byte for count + 3 uint32 indices * 4 bytes)
  const verticesSize = vertexCount * 3 * 4;
  const facesSize = faceCount * (1 + 3 * 4);
  const totalSize = headerBytes.length + verticesSize + facesSize;

  // Create output buffer
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // Write header
  new Uint8Array(buffer, 0, headerBytes.length).set(headerBytes);
  offset += headerBytes.length;

  // Write vertices (little-endian float32)
  for (let i = 0; i < vertices.length; i++) {
    view.setFloat32(offset, vertices[i], true);
    offset += 4;
  }

  // Write faces (1 byte count + 3 little-endian uint32 indices)
  for (let i = 0; i < faceCount; i++) {
    view.setUint8(offset, 3); // Triangle has 3 vertices
    offset += 1;
    view.setUint32(offset, faces[i * 3], true);
    offset += 4;
    view.setUint32(offset, faces[i * 3 + 1], true);
    offset += 4;
    view.setUint32(offset, faces[i * 3 + 2], true);
    offset += 4;
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
};

/**
 * Decode a binary PLY blob into vertices and faces
 * @param {ArrayBuffer} buffer - The PLY binary data
 * @returns {{ vertices: Float32Array, faces: Uint32Array }}
 */
export const decodePlyBinary = (buffer) => {
  const bytes = new Uint8Array(buffer);
  
  // Find end of header
  const headerEndMarker = new TextEncoder().encode('end_header\n');
  let headerEndIndex = -1;
  
  for (let i = 0; i < bytes.length - headerEndMarker.length; i++) {
    let match = true;
    for (let j = 0; j < headerEndMarker.length; j++) {
      if (bytes[i + j] !== headerEndMarker[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      headerEndIndex = i + headerEndMarker.length;
      break;
    }
  }

  if (headerEndIndex === -1) {
    throw new Error('Invalid PLY: could not find end_header');
  }

  // Parse header
  const headerText = new TextDecoder().decode(bytes.slice(0, headerEndIndex));
  const lines = headerText.split('\n');
  
  let vertexCount = 0;
  let faceCount = 0;
  
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'element' && parts[1] === 'vertex') {
      vertexCount = parseInt(parts[2], 10);
    } else if (parts[0] === 'element' && parts[1] === 'face') {
      faceCount = parseInt(parts[2], 10);
    }
  }

  // Read binary data
  const view = new DataView(buffer, headerEndIndex);
  let offset = 0;

  // Read vertices
  const vertices = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount * 3; i++) {
    vertices[i] = view.getFloat32(offset, true);
    offset += 4;
  }

  // Read faces
  const faces = new Uint32Array(faceCount * 3);
  for (let i = 0; i < faceCount; i++) {
    const count = view.getUint8(offset);
    offset += 1;
    if (count !== 3) {
      throw new Error(`Invalid PLY: expected triangular faces, got ${count} vertices`);
    }
    faces[i * 3] = view.getUint32(offset, true);
    offset += 4;
    faces[i * 3 + 1] = view.getUint32(offset, true);
    offset += 4;
    faces[i * 3 + 2] = view.getUint32(offset, true);
    offset += 4;
  }

  return { vertices, faces };
};

export default { encodePlyBinary, decodePlyBinary };
