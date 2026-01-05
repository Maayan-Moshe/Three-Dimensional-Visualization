import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import MeshCard from "./components/MeshCard";
import "./App.css";

function App() {
  const [meshes, setMeshes] = useState([]);

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
    const meshToRemove = meshes.find(mesh => mesh.id === meshId);
    if (meshToRemove) {
      URL.revokeObjectURL(meshToRemove.url);
    }
    setMeshes((prev) => prev.filter(mesh => mesh.id !== meshId));
  };

  useEffect(() => {
    return () => {
      meshes.forEach((mesh) => URL.revokeObjectURL(mesh.url));
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      <Header onUpload={handleFileUpload} onClear={clearMeshes} />
      <Navbar onUpload={handleFileUpload} onClear={clearMeshes} />

      <div className="flex-1 overflow-auto p-4">
        {meshes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p className="text-xl">Upload a 3D file to get started</p>
          </div>
        ) : (
          <div
            className="flex flex-row gap-4 h-full"
          >
            {meshes.map((mesh) => (
              <MeshCard key={mesh.id} mesh={mesh} onClose={removeMesh} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
