import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface FullscreenSelectorProps {
  onRegionSelect: (region: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

interface SelectionState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const FullscreenSelector: React.FC<FullscreenSelectorProps> = ({
  onRegionSelect,
  onCancel
}) => {
  const [selection, setSelection] = useState<SelectionState>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });

  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    const x = e.clientX;
    const y = e.clientY;

    setSelection({
      isSelecting: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selection.isSelecting) return;

    setSelection(prev => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY
    }));
  }, [selection.isSelecting]);

  const handleMouseUp = useCallback(() => {
    if (!selection.isSelecting) return;

    const { startX, startY, currentX, currentY } = selection;
    
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Minimum selection size
    if (width > 10 && height > 10) {
      onRegionSelect({ x, y, width, height });
    } else {
      onCancel();
    }
  }, [selection, onRegionSelect, onCancel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (selection.isSelecting) {
        setSelection(prev => ({
          ...prev,
          currentX: e.clientX,
          currentY: e.clientY
        }));
      }
    };

    const handleMouseUpGlobal = () => {
      if (selection.isSelecting) {
        handleMouseUp();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('mouseup', handleMouseUpGlobal);
    
    // Prevent scrolling and context menu
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
    };
  }, [selection.isSelecting, handleMouseUp, onCancel]);

  const getSelectionStyle = () => {
    const { startX, startY, currentX, currentY } = selection;
    
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    return {
      left: x,
      top: y,
      width,
      height
    };
  };

  const overlayElement = (
    <div
      ref={overlayRef}
      className="fullscreen-capture-overlay"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        cursor: 'crosshair',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        userSelect: 'none'
      }}
    >
      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: '500',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
      >
        🖱️ Drag to select area • Press ESC to cancel
      </div>
      
      {/* Selection rectangle */}
      {selection.isSelecting && (
        <div
          className="selection-rectangle"
          style={{
            position: 'absolute',
            border: '2px solid #00aaff',
            backgroundColor: 'rgba(0, 170, 255, 0.1)',
            pointerEvents: 'none',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
            ...getSelectionStyle()
          }}
        >
          {/* Selection info */}
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              left: '0',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}
          >
            {Math.abs(selection.currentX - selection.startX)} × {Math.abs(selection.currentY - selection.startY)}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(overlayElement, document.body);
};

export default FullscreenSelector;