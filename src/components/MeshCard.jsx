import React, { useState } from 'react';
import Scene from './Scene';
import { useGeometry } from '../contexts/GeometryContext';
import { deformMesh } from '../services/deformationService';
import './MeshCard.css';

const MeshCard = ({ mesh, onClose, syncedCamera, onCameraChange }) => {
  const [magnitudeMm, setMagnitudeMm] = useState(1.0);
  const [areaMm2, setAreaMm2] = useState(100.0);
  const [isDeforming, setIsDeforming] = useState(false);
  const { getGeometry, updateGeometry } = useGeometry();

  const handleDeform = async () => {
    const geometry = getGeometry(mesh.id);
    if (!geometry) {
      console.error('No geometry found for mesh:', mesh.id);
      return;
    }

    setIsDeforming(true);
    try {
      const deformedVertices = await deformMesh(mesh.id, geometry, magnitudeMm, areaMm2);
      updateGeometry(mesh.id, deformedVertices);
    } catch (error) {
      console.error('Deformation failed:', error);
    } finally {
      setIsDeforming(false);
    }
  };

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
      <div className="mesh-card-actions">
        <div className="deform-controls">
          <div className="deform-input-group">
            <label htmlFor={`magnitude-${mesh.id}`}>Magnitude (mm)</label>
            <input
              id={`magnitude-${mesh.id}`}
              type="number"
              value={magnitudeMm}
              onChange={(e) => setMagnitudeMm(parseFloat(e.target.value) || 0)}
              step="0.1"
              disabled={isDeforming}
            />
          </div>
          <div className="deform-input-group">
            <label htmlFor={`area-${mesh.id}`}>Area (mm²)</label>
            <input
              id={`area-${mesh.id}`}
              type="number"
              value={areaMm2}
              onChange={(e) => setAreaMm2(parseFloat(e.target.value) || 0)}
              step="10"
              disabled={isDeforming}
            />
          </div>
          <button
            className="deform-button"
            onClick={handleDeform}
            disabled={isDeforming}
          >
            {isDeforming ? (
              <>
                <span className="spinner"></span>
                Deforming...
              </>
            ) : (
              'Deform'
            )}
          </button>
        </div>
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
