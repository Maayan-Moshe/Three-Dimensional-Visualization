import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import MeshCard from "./components/MeshCard";
import { useGeometry } from "./contexts/GeometryContext";
import { registerMeshes as registerMeshesService } from "./services/registrationService";
import "./App.css";

// Identity matrix (4x4 in column-major order)
const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function App() {
  const [meshes, setMeshes] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [voxelSize, setVoxelSize] = useState(0.05);
  const { getAllGeometries } = useGeometry();
  const [syncedCamera, setSyncedCamera] = useState({
    position: [0, 5, 10],
    target: [0, 0, 0],
    zoom: 50,
  });

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    const newMeshes = files.map((file, index) => {
      const url = URL.createObjectURL(file);
      const extension = file.name.split(".").pop().toLowerCase();

      return {
        id: Math.random().toString(36).substr(2, 9),
        url,
        format: extension,
        position: [0, 0, 0],
        transformMatrix: [...IDENTITY_MATRIX],
        name: file.name,
      };
    });

    setMeshes((prev) => [...prev, ...newMeshes]);
  };

  const clearMeshes = () => {
    meshes.forEach((mesh) => URL.revokeObjectURL(mesh.url));
    setMeshes([]);
  };

  const removeMesh = (meshId) => {
    const meshToRemove = meshes.find((mesh) => mesh.id === meshId);
    if (meshToRemove) {
      URL.revokeObjectURL(meshToRemove.url);
    }
    setMeshes((prev) => prev.filter((mesh) => mesh.id !== meshId));
  };

  const handleRegisterMeshes = async () => {
    if (meshes.length === 0) return;

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      // Get all cached geometries
      const geometryMap = getAllGeometries();

      // Filter to only include geometries for current meshes
      const meshIds = new Set(meshes.map((m) => m.id));
      const filteredGeometries = new Map();
      for (const [id, data] of geometryMap) {
        if (meshIds.has(id)) {
          filteredGeometries.set(id, data);
        }
      }

      if (filteredGeometries.size === 0) {
        throw new Error(
          "No geometry data available. Please wait for meshes to load."
        );
      }

      // Call registration service with voxel size
      const transformations = await registerMeshesService(filteredGeometries, voxelSize);

      // Update meshes with new transformation matrices
      setMeshes((prev) =>
        prev.map((mesh) => {
          if (transformations[mesh.id]) {
            return {
              ...mesh,
              transformMatrix: transformations[mesh.id],
            };
          }
          return mesh;
        })
      );
    } catch (error) {
      console.error("Registration failed:", error);
      setRegistrationError(error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    return () => {
      meshes.forEach((mesh) => URL.revokeObjectURL(mesh.url));
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      <Header onUpload={handleFileUpload} onClear={clearMeshes} />
      <Navbar
        onUpload={handleFileUpload}
        onClear={clearMeshes}
        onRegister={handleRegisterMeshes}
        isRegistering={isRegistering}
        registrationError={registrationError}
        hasMeshes={meshes.length > 0}
        voxelSize={voxelSize}
        onVoxelSizeChange={setVoxelSize}
      />

      <div className="flex-1 overflow-auto p-4">
        {meshes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p className="text-xl">Upload a 3D file to get started</p>
          </div>
        ) : (
          <div className="flex flex-row gap-4 h-full">
            {meshes.map((mesh) => (
              <MeshCard
                key={mesh.id}
                mesh={mesh}
                onClose={removeMesh}
                syncedCamera={syncedCamera}
                onCameraChange={setSyncedCamera}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
