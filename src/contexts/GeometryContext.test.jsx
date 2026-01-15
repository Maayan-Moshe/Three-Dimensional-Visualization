import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { GeometryProvider, useGeometry } from './GeometryContext';

// Test component to access context
const TestComponent = ({ onMount }) => {
  const context = useGeometry();
  onMount(context);
  return null;
};

describe('GeometryContext', () => {
  it('registers and retrieves geometry', () => {
    let context;
    render(
      <GeometryProvider>
        <TestComponent onMount={(ctx) => { context = ctx; }} />
      </GeometryProvider>
    );

    const vertices = new Float32Array([0, 0, 0, 1, 1, 1]);
    const faces = new Uint32Array([0, 1, 2]);

    act(() => {
      context.registerGeometry('mesh1', vertices, faces);
    });

    const geometry = context.getGeometry('mesh1');
    expect(geometry).toBeDefined();
    expect(geometry.vertices).toEqual(vertices);
    expect(geometry.faces).toEqual(faces);
  });

  it('updateGeometry increments version', () => {
    let context;
    render(
      <GeometryProvider>
        <TestComponent onMount={(ctx) => { context = ctx; }} />
      </GeometryProvider>
    );

    const vertices = new Float32Array([0, 0, 0, 1, 1, 1]);
    const faces = new Uint32Array([0, 1, 2]);

    act(() => {
      context.registerGeometry('mesh1', vertices, faces);
    });

    expect(context.getGeometryVersion('mesh1')).toBe(0);

    const newVertices = new Float32Array([1, 1, 1, 2, 2, 2]);
    act(() => {
      context.updateGeometry('mesh1', newVertices);
    });

    expect(context.getGeometryVersion('mesh1')).toBe(1);
    expect(context.getGeometry('mesh1').vertices).toEqual(newVertices);
  });

  it('updateGeometry preserves faces', () => {
    let context;
    render(
      <GeometryProvider>
        <TestComponent onMount={(ctx) => { context = ctx; }} />
      </GeometryProvider>
    );

    const vertices = new Float32Array([0, 0, 0, 1, 1, 1]);
    const faces = new Uint32Array([0, 1, 2]);

    act(() => {
      context.registerGeometry('mesh1', vertices, faces);
    });

    const newVertices = new Float32Array([1, 1, 1, 2, 2, 2]);
    act(() => {
      context.updateGeometry('mesh1', newVertices);
    });

    expect(context.getGeometry('mesh1').faces).toEqual(faces);
  });

  it('updateFullGeometry updates both vertices and faces', () => {
    let context;
    render(
      <GeometryProvider>
        <TestComponent onMount={(ctx) => { context = ctx; }} />
      </GeometryProvider>
    );

    const vertices = new Float32Array([0, 0, 0]);
    const faces = new Uint32Array([0, 1, 2]);

    act(() => {
      context.registerGeometry('mesh1', vertices, faces);
    });

    const newVertices = new Float32Array([1, 1, 1, 2, 2, 2, 3, 3, 3]);
    const newFaces = new Uint32Array([0, 1, 2, 1, 2, 3]);

    act(() => {
      context.updateFullGeometry('mesh1', newVertices, newFaces);
    });

    expect(context.getGeometryVersion('mesh1')).toBe(1);
    expect(context.getGeometry('mesh1').vertices).toEqual(newVertices);
    expect(context.getGeometry('mesh1').faces).toEqual(newFaces);
  });

  it('clearGeometry removes geometry and version', () => {
    let context;
    render(
      <GeometryProvider>
        <TestComponent onMount={(ctx) => { context = ctx; }} />
      </GeometryProvider>
    );

    const vertices = new Float32Array([0, 0, 0]);
    const faces = new Uint32Array([0, 1, 2]);

    act(() => {
      context.registerGeometry('mesh1', vertices, faces);
      context.updateGeometry('mesh1', vertices);
    });

    expect(context.getGeometryVersion('mesh1')).toBe(1);

    act(() => {
      context.clearGeometry('mesh1');
    });

    expect(context.getGeometry('mesh1')).toBeUndefined();
    expect(context.getGeometryVersion('mesh1')).toBe(0);
  });

  it('multiple updateGeometry calls increment version correctly', () => {
    let context;
    render(
      <GeometryProvider>
        <TestComponent onMount={(ctx) => { context = ctx; }} />
      </GeometryProvider>
    );

    const vertices = new Float32Array([0, 0, 0]);
    const faces = new Uint32Array([0, 1, 2]);

    act(() => {
      context.registerGeometry('mesh1', vertices, faces);
    });

    expect(context.getGeometryVersion('mesh1')).toBe(0);

    act(() => {
      context.updateGeometry('mesh1', new Float32Array([1, 1, 1]));
    });
    expect(context.getGeometryVersion('mesh1')).toBe(1);

    act(() => {
      context.updateGeometry('mesh1', new Float32Array([2, 2, 2]));
    });
    expect(context.getGeometryVersion('mesh1')).toBe(2);

    act(() => {
      context.updateGeometry('mesh1', new Float32Array([3, 3, 3]));
    });
    expect(context.getGeometryVersion('mesh1')).toBe(3);
  });
});
