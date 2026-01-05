# Three-Dimensional Visualization

A modern, interactive 3D model viewer built with React, Three.js, and React Three Fiber. Upload and view multiple 3D models simultaneously in an intuitive web interface.

## Features

- **Multi-Format Support**: Load and display various 3D file formats (OBJ, GLB, GLTF, FBX, etc.)
- **Multiple Models**: Upload and view multiple 3D models side by side
- **Interactive Viewing**: Rotate, zoom, and pan to explore 3D models
- **Real-time Rendering**: Smooth 3D rendering powered by Three.js and WebGL
- **Responsive Design**: Modern UI with Tailwind CSS
- **File Management**: Easy upload and removal of 3D models

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server (using Rolldown)
- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Useful helpers for React Three Fiber
- **Tailwind CSS 4** - Utility-first CSS framework
- **ESLint** - Code linting

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Three-Dimensional-Visualization
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Linting

Run ESLint to check code quality:
```bash
npm run lint
```

## Project Structure

```
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── Header.jsx   # Top header with controls
│   │   ├── Navbar.jsx   # Navigation bar
│   │   ├── MeshCard.jsx # Individual 3D model card
│   │   ├── MeshViewer.jsx # 3D model renderer
│   │   └── Scene.jsx    # 3D scene setup
│   ├── assets/          # Project assets
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── index.html           # HTML entry point
├── package.json         # Project dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── eslint.config.js     # ESLint configuration
```

## Usage

1. **Upload Models**: Click the upload button or use the file input to select 3D model files
2. **View Models**: Each uploaded model appears in its own card with an interactive 3D viewer
3. **Interact**: Use mouse controls to rotate, zoom, and pan the 3D models
4. **Remove Models**: Click the close button on any model card to remove it
5. **Clear All**: Use the clear button to remove all models at once

## Supported File Formats

The viewer supports common 3D file formats including:
- GLB (Binary glTF)
- GLTF (GL Transmission Format)
- OBJ (Wavefront Object)
- FBX (Filmbox)
- And more through Three.js loaders

## License

This project is private and not licensed for public use.

## Contributing

This is a private project. Contributions are not currently accepted.
