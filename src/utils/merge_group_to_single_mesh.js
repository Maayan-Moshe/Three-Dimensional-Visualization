import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';


// ... assume 'group' is your THREE.Group containing meshes ...

function mergeGroupMeshes(group) {
    const geometries = [];
    const meshesToRemove = []; // Keep track of original meshes to remove later

    console.log("Merging meshes in group:", group);
    // Iterate over all children in the group
    group.traverse(function (child) {
        if (child.isMesh) {
            // Apply the child's world matrix to a clone of its geometry
            const geometry = child.geometry.clone();
            geometry.applyMatrix4(child.matrixWorld);
            geometries.push(geometry);
            meshesToRemove.push(child);
        }
    });

    if (geometries.length === 0){
        console.warn("No meshes found in the group to merge.");
        return null;
    }

    // Merge all geometries into a single BufferGeometry
    const mergedGeometry = mergeGeometries(geometries);

    // Create a single material (ensure all original meshes use compatible materials)
    // If different materials are needed, this gets more complex (using BufferGeometry groups)
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    // Create the final merged mesh
    const mergedMesh = new THREE.Mesh(mergedGeometry, material);

    // Position the merged mesh at the group's original position (optional, depending on desired hierarchy)
    // If you apply matrixWorld, the merged mesh will be at the world origin unless you handle positions carefully. 
    // It's often easier to keep the merged mesh at (0,0,0) and use it directly.

    // Remove original meshes from the scene or group
    meshesToRemove.forEach(mesh => {
        // Decide if removing from scene or group
        if (mesh.parent) mesh.parent.remove(mesh);
    });

    return mergedMesh;
}

export { mergeGroupMeshes };
