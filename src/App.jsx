import React, { useState, useRef } from 'react';
import './App.css';

const App = () => {
  const [polygons, setPolygons] = useState([]); // All polygons
  const [currentPolygon, setCurrentPolygon] = useState([]); // Polygon being drawn
  const [draggingPoint, setDraggingPoint] = useState(null); // Dragging vertex
  const [selectedPolygonId, setSelectedPolygonId] = useState(null); // Polygon selected for deletion
  const [history, setHistory] = useState([]); // Undo history
  const [redoStack, setRedoStack] = useState([]); // Redo stack
  const svgRef = useRef();

  // Save current state to history for undo/redo
  const saveState = () => {
    setHistory([...history, polygons]);
    setRedoStack([]); // Clear redo stack after new action
  };

  // Add a point to the current polygon or close it
  const handleMouseClick = (e) => {
    const { left, top } = svgRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    // If close to the first point, close the polygon
    if (currentPolygon.length > 2) {
      const [firstX, firstY] = currentPolygon[0];
      const distance = Math.sqrt((x - firstX) ** 2 + (y - firstY) ** 2);
      if (distance < 10) {
        saveState();
        setPolygons([...polygons, { id: Date.now(), points: currentPolygon }]);
        setCurrentPolygon([]);
        return;
      }
    }

    setCurrentPolygon([...currentPolygon, [x, y]]);
  };

  const handleMouseMove = (e) => {
    if (draggingPoint) {
      const { left, top } = svgRef.current.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;

      const updatedPolygons = polygons.map((polygon) => {
        if (polygon.id === draggingPoint.polygonId) {
          const updatedPoints = [...polygon.points];
          updatedPoints[draggingPoint.index] = [x, y];
          return { ...polygon, points: updatedPoints };
        }
        return polygon;
      });

      setPolygons(updatedPolygons);
    }
  };

  const handleMouseUp = () => {
    setDraggingPoint(null); // Stop dragging
  };

  const handleVertexDragStart = (polygonId, index) => {
    saveState();
    setDraggingPoint({ polygonId, index });
  };

  const handlePolygonSelect = (polygonId) => {
    setSelectedPolygonId(polygonId === selectedPolygonId ? null : polygonId); // Toggle selection
  };

  const handleUndo = () => {
    if (history.length > 0) {
      setRedoStack([polygons, ...redoStack]);
      const previousState = history[history.length - 1];
      setPolygons(previousState);
      setHistory(history.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setHistory([...history, polygons]);
      setPolygons(nextState);
      setRedoStack(redoStack.slice(1));
    }
  };

  const handleDeletePolygon = () => {
    if (selectedPolygonId) {
      saveState();
      setPolygons(polygons.filter((polygon) => polygon.id !== selectedPolygonId));
      setSelectedPolygonId(null);
    }
  };

  return (
    <div className="canvas">
      {/* Buttons for Undo, Redo, Delete */}
      <div className="controls">
        <button onClick={handleUndo} disabled={history.length === 0}>
          Undo
        </button>
        <button onClick={handleRedo} disabled={redoStack.length === 0}>
          Redo
        </button>
        <button onClick={handleDeletePolygon} disabled={!selectedPolygonId}>
          Delete
        </button>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="svg-canvas"
        onClick={handleMouseClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Render completed polygons */}
        {polygons.map((polygon) => (
          <g key={polygon.id} onClick={() => handlePolygonSelect(polygon.id)}>
            <polygon
              points={polygon.points.map(([x, y]) => `${x},${y}`).join(' ')}
              fill={selectedPolygonId === polygon.id ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 150, 255, 0.3)'}
              stroke={selectedPolygonId === polygon.id ? 'red' : 'blue'}
              strokeWidth="2"
            />
            {polygon.points.map(([x, y], index) => (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="5"
                fill="blue"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleVertexDragStart(polygon.id, index);
                }}
              />
            ))}
          </g>
        ))}

        {/* Render the polygon being drawn */}
        {currentPolygon.length > 0 && (
          <g>
            <polygon
              points={currentPolygon.map(([x, y]) => `${x},${y}`).join(' ')}
              fill="rgba(0, 150, 255, 0.3)"
              stroke="blue"
              strokeWidth="2"
              style={{ pointerEvents: 'none' }}
            />
            {currentPolygon.map(([x, y], index) => (
              <circle key={index} cx={x} cy={y} r="5" fill="blue" />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};

export default App;
