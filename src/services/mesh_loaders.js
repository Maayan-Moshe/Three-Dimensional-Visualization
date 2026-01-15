import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';

function surfaceLoader(url, format) {
    switch (format.toLowerCase()) {
        case 'gltf': return gltfLoader(url);
        case 'obj': return objLoader(url);
        case 'stl': return stlLoader(url);
        case 'ply': return plyLoader(url);
        case 'glb': return gltfLoader(url);
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}

function gltfLoader(url) {
    const { scene } = useGLTF(url);
    return getFromSceneObj(scene);
};


function objLoader(url) {
    const obj = useLoader(OBJLoader, url);
    return getFromSceneObj(obj);
};


function stlLoader(url) {
    const stl = useLoader(STLLoader, url);
    const geometry = stl.isBufferGeometry ? stl : stl.geometry;
    return geometry;
}


function plyLoader(url) {
    const ply = useLoader(PLYLoader, url);
    const geometry = ply.isBufferGeometry ? ply : ply.geometry;
    return geometry;
}


function getFromSceneObj(sceneObj) {
    const clone = useMemo(() => sceneObj.clone(), [sceneObj]);
    const geometries = extractAllGeometries(clone);
    const data = mergeGeometryData(geometries);
    const geom = useMemo(() => {
        if (data) {
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(data.vertices, 3));
        geometry.setIndex(new BufferAttribute(data.faces, 1));
        geometry.computeVertexNormals();
        return geometry;
        }
    }, new BufferGeometry()); // Empty geometry if no data

    return geom;
}


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


export { surfaceLoader };