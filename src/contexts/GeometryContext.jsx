import React, { createContext, useContext, useRef, useCallback, useState } from 'react';

const GeometryContext = createContext(null);

export const GeometryProvider = ({ children }) => {
  // Map: meshId → { vertices: Float32Array, faces: Uint32Array }
  const geometryCache = useRef(new Map());
  // State to trigger re-renders when geometry is updated
  const [geometryVersion, setGeometryVersion] = useState({});

  const registerGeometry = useCallback((meshId, vertices, faces) => {
    geometryCache.current.set(meshId, { vertices, faces });
  }, []);

  const getGeometry = useCallback((meshId) => {
    return geometryCache.current.get(meshId);
  }, []);

  const getAllGeometries = useCallback(() => {
    return geometryCache.current;
  }, []);

  const clearGeometry = useCallback((meshId) => {
    if (meshId) {
      geometryCache.current.delete(meshId);
      setGeometryVersion(prev => {
        const newVersion = { ...prev };
        delete newVersion[meshId];
        return newVersion;
      });
    } else {
      geometryCache.current.clear();
      setGeometryVersion({});
    }
  }, []);

  const updateGeometry = useCallback((meshId, newVertices) => {
    const existing = geometryCache.current.get(meshId);
    if (existing) {
      geometryCache.current.set(meshId, { vertices: newVertices, faces: existing.faces });
      // Increment version to trigger re-render
      setGeometryVersion(prev => ({
        ...prev,
        [meshId]: (prev[meshId] || 0) + 1
      }));
    }
  }, []);

  const getGeometryVersion = useCallback((meshId) => {
    return geometryVersion[meshId] || 0;
  }, [geometryVersion]);

  const value = {
    registerGeometry,
    getGeometry,
    getAllGeometries,
    clearGeometry,
    updateGeometry,
    getGeometryVersion,
  };

  return (
    <GeometryContext.Provider value={value}>
      {children}
    </GeometryContext.Provider>
  );
};

export const useGeometry = () => {
  const context = useContext(GeometryContext);
  if (!context) {
    throw new Error('useGeometry must be used within a GeometryProvider');
  }
  return context;
};

export default GeometryContext;
