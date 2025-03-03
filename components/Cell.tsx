import React, { RefObject } from 'react';
import { CellPosition, CellSelectionState } from '@/types/excel';

interface CellProps {
  rowIndex: number;
  columnIndex: number;
  style: React.CSSProperties;
  getColumnLabel: (col: number) => string;
  activeCell: CellPosition | null;
  editValue: string;
  handleMouseDown: (row: number, col: number, e: React.MouseEvent) => void;
  handleMouseEnter: (row: number, col: number) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  getCellDisplayValue: (row: number, col: number) => string | number;
  isCellSelected: (row: number, col: number) => boolean;
  isDragging: boolean;
  dragOrigin: CellPosition | null;
  dragTarget: CellPosition | null;
  inputRef: RefObject<HTMLInputElement>;
}

const Cell: React.FC<CellProps> = ({
  rowIndex,
  columnIndex,
  style,
  getColumnLabel,
  activeCell,
  editValue,
  handleMouseDown,
  handleMouseEnter,
  handleInputChange,
  handleInputBlur,
  handleKeyPress,
  handleKeyDown,
  getCellDisplayValue,
  isCellSelected,
  isDragging,
  dragOrigin,
  dragTarget,
  inputRef,
}) => {
  // Adjust for the header row and column
  const actualRowIndex = rowIndex - 1;
  const actualColIndex = columnIndex - 1;
  
  // Handle the corner cell (top-left)
  if (rowIndex === 0 && columnIndex === 0) {
    return (
      <div 
        style={style}
        className="bg-gray-200 border p-1 text-center sticky top-0 left-0 z-10 flex items-center justify-center"
      >
      </div>
    );
  }
  
  // Handle the header row (column labels)
  if (rowIndex === 0) {
    return (
      <div 
        style={style}
        className="bg-gray-200 border p-1 text-center sticky top-0 z-10 flex items-center justify-center"
      >
        {getColumnLabel(actualColIndex)}
      </div>
    );
  }
  
  // Handle the header column (row labels)
  if (columnIndex === 0) {
    return (
      <div 
        style={style}
        className="bg-gray-200 border p-1 text-center sticky left-0 z-10 flex items-center justify-center"
      >
        {actualRowIndex + 1}
      </div>
    );
  }
  
  // Regular cells
  const isActive = activeCell && activeCell.row === actualRowIndex && activeCell.col === actualColIndex;
  const isSelected = isCellSelected(actualRowIndex, actualColIndex);
  const isDragCell = isDragging && dragOrigin && dragTarget && 
    actualRowIndex >= Math.min(dragOrigin.row, dragTarget.row) && 
    actualRowIndex <= Math.max(dragOrigin.row, dragTarget.row) && 
    actualColIndex >= Math.min(dragOrigin.col, dragTarget.col) && 
    actualColIndex <= Math.max(dragOrigin.col, dragTarget.col);
  
  return (
    <div 
      style={style}
      className={`border p-0 relative ${
        isActive ? 'cell-active' : 
        isDragCell ? 'cell-dragging' :
        isSelected ? 'cell-selected' : 
        'bg-white'
      }`}
      onMouseDown={(e) => handleMouseDown(actualRowIndex, actualColIndex, e)}
      onMouseEnter={() => handleMouseEnter(actualRowIndex, actualColIndex)}
    >
      {isActive ? (
        <div className="relative w-full h-full">
          <input
            ref={inputRef}
            type="text"
            className="w-full h-full p-1 outline-none border-none"
            value={editValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                e.stopPropagation();
                handleKeyDown(e);
              }
            }}
          />
          {/* Fill handle for dragging - Make it more visible and touchable */}
          <div 
            className="fill-handle"
            style={{ 
              width: '10px', 
              height: '10px',
              right: '0',
              bottom: '0',
              position: 'absolute',
              backgroundColor: '#3b82f6',
              cursor: 'crosshair',
              zIndex: 10
            }}
          ></div>
        </div>
      ) : (
        <div className="p-1 overflow-hidden text-ellipsis">
          {getCellDisplayValue(actualRowIndex, actualColIndex)}
        </div>
      )}
    </div>
  );
};

export default React.memo(Cell);