import React, { useState } from 'react';
import Scene from './Scene';
import { useGeometry } from '../contexts/GeometryContext';
import { deformMesh } from '../services/deformationService';
import { cleanMesh } from '../services/cleaningService';
import './MeshCard.css';

const MeshCard = ({ mesh, onClose, syncedCamera, onCameraChange }) => {
  const [deformationRatio, setDeformationRatio] = useState(0.1);
  const [numberOfModes, setNumberOfModes] = useState(3);
  const [isDeforming, setIsDeforming] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const { getGeometry, updateGeometry, updateFullGeometry } = useGeometry();

  const handleNumberOfModesChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1) {
      setNumberOfModes(value);
    } else if (e.target.value === '') {
      setNumberOfModes(1);
    }
  };

  const handleClean = async () => {
    const geometry = getGeometry(mesh.id);
    if (!geometry) {
      console.error('No geometry found for mesh:', mesh.id);
      return;
    }

    setIsCleaning(true);
    try {
      const { vertices, faces } = await cleanMesh(mesh.id, geometry);
      updateFullGeometry(mesh.id, vertices, faces);
    } catch (error) {
      console.error('Cleaning failed:', error);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDeform = async () => {
    const geometry = getGeometry(mesh.id);
    if (!geometry) {
      console.error('No geometry found for mesh:', mesh.id);
      return;
    }

    setIsDeforming(true);
    try {
      const deformedVertices = await deformMesh(mesh.id, geometry, deformationRatio, numberOfModes);
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
            <label htmlFor={`ratio-${mesh.id}`}>Deformation Ratio</label>
            <input
              id={`ratio-${mesh.id}`}
              type="number"
              value={deformationRatio}
              onChange={(e) => setDeformationRatio(parseFloat(e.target.value) || 0)}
              step="0.01"
              disabled={isDeforming}
            />
          </div>
          <div className="deform-input-group">
            <label htmlFor={`modes-${mesh.id}`}>Number of Modes</label>
            <input
              id={`modes-${mesh.id}`}
              type="number"
              value={numberOfModes}
              onChange={handleNumberOfModesChange}
              min="1"
              step="1"
              disabled={isDeforming}
            />
          </div>
          <button
            className="deform-button"
            onClick={handleDeform}
            disabled={isDeforming || isCleaning}
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
          <button
            className="clean-button"
            onClick={handleClean}
            disabled={isCleaning || isDeforming}
          >
            {isCleaning ? (
              <>
                <span className="spinner"></span>
                Cleaning...
              </>
            ) : (
              'Clean Mesh'
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
