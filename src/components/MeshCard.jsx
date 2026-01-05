import React from 'react';
import Scene from './Scene';
import './MeshCard.css';

const MeshCard = ({ mesh, onClose, syncedCamera, onCameraChange }) => {

  return (
    <div className="mesh-card">
      <div className="mesh-card-header">
        <span className="mesh-card-title">{mesh.name}</span>
        <button 
          className="mesh-card-close" 
          onClick={() => onClose(mesh.id)}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="mesh-card-content">
        <Scene 
          meshes={[mesh]} 
          syncedCamera={syncedCamera}
          onCameraChange={onCameraChange}
        />
      </div>
    </div>
  );
};

export default MeshCard;
