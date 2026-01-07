import React, { createContext, useContext, useRef, useCallback } from 'react';

const GeometryContext = createContext(null);

export const GeometryProvider = ({ children }) => {
  // Map: meshId → { vertices: Float32Array, faces: Uint32Array }
  const geometryCache = useRef(new Map());

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
    } else {
      geometryCache.current.clear();
    }
  }, []);

  const value = {
    registerGeometry,
    getGeometry,
    getAllGeometries,
    clearGeometry,
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
