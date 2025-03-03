import React, { useCallback, useRef, useEffect } from 'react';
import { VariableSizeGrid as VirtualGrid } from 'react-window';
import { useExcelContext } from '@/context/ExcelContext';
import Cell from '@/components/Cell';

const Grid: React.FC = () => {
  const {
    gridSize,
    viewport,
    setViewport,
    activeCell,
    editValue,
    handleCellSelect,
    getColumnLabel,
    getCellDisplayValue,
    isCellSelected,
    isDragging,
    dragOrigin,
    dragTarget,
    isMouseDown,
    setIsMouseDown,
    setIsDragging,
    setDragOrigin,
    setDragTarget,
    setData,
    data,
    adjustCellReferences,
    setEditValue,
    handleScroll,
  } = useExcelContext();

  const gridRef = useRef<VirtualGrid>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const columnWidthMap: any = useRef({
    0: 50,
    default: 100,
  });

  const getColumnWidth = useCallback((index: number) => {
    return columnWidthMap?.current?.[index] || columnWidthMap.current.default;
  }, []);

  const getRowHeight = useCallback(() => 35, []);

  // Handle mouse down on a cell
  const handleMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent): void => {
      e.preventDefault(); // Prevent text selection

      // If we're clicking on a different cell, commit current cell's edits first
      if (activeCell && (activeCell.row !== row || activeCell.col !== col)) {
        const { row: activeRow, col: activeCol } = activeCell;
        const activeCellKey = `${activeRow},${activeCol}`;

        // Update data for the previous active cell
        if (data[activeCellKey] !== editValue) {
          setData(prevData => {
            const newData = {
              ...prevData,
              [activeCellKey]: editValue,
            };
            return newData;
          });

          // Force re-evaluation of all formulas
          setTimeout(() => {
            setData(prevData => ({ ...prevData }));
          }, 0);
        }
      }

      // Get target element for more precise fill handle detection
      const target = e.currentTarget as HTMLDivElement;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top; // y position within the element

      // Check if click is in the bottom-right corner (fill handle)
      const isFillHandleArea =
        activeCell &&
        activeCell.row === row &&
        activeCell.col === col &&
        x > rect.width - 15 &&
        y > rect.height - 15;

      console.log('Mouse down', {
        row,
        col,
        isFillHandleArea,
        x,
        y,
        width: rect.width,
        height: rect.height,
      });

      // Set mouseDown state first
      setIsMouseDown(true);

      if (isFillHandleArea) {
        // Start dragging operation
        console.log('Starting drag from', row, col);
        setIsDragging(true);
        setDragOrigin({ row, col });
        setDragTarget({ row, col });
      } else {
        // Handle normal cell selection
        handleCellSelect(row, col, e.shiftKey);
      }
    },
    [
      handleCellSelect,
      activeCell,
      data,
      editValue,
      setIsMouseDown,
      setIsDragging,
      setDragOrigin,
      setDragTarget,
      setData,
    ]
  );

  // Handle mouse enter on a cell (for drag selection)
  const handleMouseEnter = useCallback(
    (row: number, col: number): void => {
      if (isMouseDown) {
        if (isDragging) {
          console.log('Dragging to', row, col);
          setDragTarget({ row, col });

          // Ensure the cell we're dragging to is visible
          setViewport(prev => {
            let newViewport = { ...prev };

            if (row < prev.startRow) {
              newViewport.startRow = row;
            } else if (row >= prev.startRow + prev.visibleRows - 2) {
              newViewport.startRow = Math.max(0, row - prev.visibleRows + 3);
            }

            if (col < prev.startCol) {
              newViewport.startCol = col;
            } else if (col >= prev.startCol + prev.visibleCols - 2) {
              newViewport.startCol = Math.max(0, col - prev.visibleCols + 3);
            }

            return newViewport;
          });
        } else if (activeCell) {
          // This is a selection operation, not a drag
          handleCellSelect(activeCell.row, activeCell.col, true);

          // Update the selection end
          setViewport(prev => {
            let newViewport = { ...prev };

            if (row < prev.startRow) {
              newViewport.startRow = row;
            } else if (row >= prev.startRow + prev.visibleRows - 2) {
              newViewport.startRow = Math.max(0, row - prev.visibleRows + 3);
            }

            if (col < prev.startCol) {
              newViewport.startCol = col;
            } else if (col >= prev.startCol + prev.visibleCols - 2) {
              newViewport.startCol = Math.max(0, col - prev.visibleCols + 3);
            }

            return newViewport;
          });
        }
      }
    },
    [isMouseDown, isDragging, activeCell, handleCellSelect, setDragTarget, setViewport]
  );

  // Handle mouse up (end selection or dragging)
  const handleMouseUp = useCallback(() => {
    console.log('Mouse up', { isDragging, dragOrigin, dragTarget });

    // If we were dragging, apply the formula to all cells in the range
    if (isDragging && dragOrigin && dragTarget) {
      const originCellKey = `${dragOrigin.row},${dragOrigin.col}`;
      const sourceFormula = String(data[originCellKey] || '');

      console.log('Processing drag from', dragOrigin, 'to', dragTarget);
      console.log('Source formula:', sourceFormula);

      // Determine the range of cells to fill
      const minRow = Math.min(dragOrigin.row, dragTarget.row);
      const maxRow = Math.max(dragOrigin.row, dragTarget.row);
      const minCol = Math.min(dragOrigin.col, dragTarget.col);
      const maxCol = Math.max(dragOrigin.col, dragTarget.col);

      // Only process if we have actually dragged to a different cell
      if (minRow !== maxRow || minCol !== maxCol) {
        // Create new data with adjusted formulas for each cell in the range
        const newData = { ...data };

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            // Skip the original cell
            if (r === dragOrigin.row && c === dragOrigin.col) continue;

            const rowDiff = r - dragOrigin.row;
            const colDiff = c - dragOrigin.col;
            const cellKey = `${r},${c}`;

            // Adjust formula references for the new position
            if (sourceFormula.startsWith('=')) {
              newData[cellKey] = adjustCellReferences(sourceFormula, rowDiff, colDiff);
              console.log(`Set ${cellKey} to`, newData[cellKey]);
            } else {
              // For non-formulas, just copy the value
              newData[cellKey] = sourceFormula;
              console.log(`Copied to ${cellKey}:`, sourceFormula);
            }
          }
        }

        // Update the data state
        setData(newData);

        // Force re-evaluation of all formulas
        setTimeout(() => {
          setData(prevData => ({ ...prevData }));
        }, 0);
      }
    }

    // Reset drag states
    setIsMouseDown(false);
    setIsDragging(false);
    setDragOrigin(null);
    setDragTarget(null);
  }, [
    isDragging,
    dragOrigin,
    dragTarget,
    data,
    adjustCellReferences,
    setData,
    setIsMouseDown,
    setIsDragging,
    setDragOrigin,
    setDragTarget,
  ]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setEditValue(e.target.value);
    },
    [setEditValue]
  );

  // Handle input blur (finish editing)
  const handleInputBlur = useCallback((): void => {
    if (activeCell) {
      const { row, col } = activeCell;
      const cellKey = `${row},${col}`;

      // Only update if value has changed - necessary to prevent double triggers
      if (data[cellKey] !== editValue) {
        // Update the data state
        setData(prevData => {
          const newData = {
            ...prevData,
            [cellKey]: editValue,
          };
          return newData;
        });

        // Force re-evaluation of all formulas
        setTimeout(() => {
          setData(prevData => ({ ...prevData }));
        }, 0);
      }
    }
  }, [activeCell, editValue, data, setData]);

  // Handle key press in the input
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter') {
        // Apply the current edit
        if (activeCell) {
          const { row, col } = activeCell;
          const cellKey = `${row},${col}`;

          // Update the data state
          setData(prevData => {
            const newData = {
              ...prevData,
              [cellKey]: editValue,
            };
            return newData;
          });

          // Force re-evaluation of all formulas
          setTimeout(() => {
            setData(prevData => ({ ...prevData }));
          }, 0);
        }

        // Move to the next row
        if (activeCell) {
          const { row, col } = activeCell;
          handleCellSelect(row + 1, col);
        }
      }
    },
    [activeCell, editValue, handleCellSelect, setData]
  );

  // Handle navigation keys
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (!activeCell) return;

      const { row, col } = activeCell;
      let newRow = row;
      let newCol = col;
      let handled = false;

      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1);
          handled = true;
          break;
        case 'ArrowDown':
          newRow = row + 1;
          handled = true;
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1);
          handled = true;
          break;
        case 'ArrowRight':
          newCol = col + 1;
          handled = true;
          break;
        case 'Tab':
          e.preventDefault(); // This is critical to prevent default tab behavior
          e.stopPropagation(); // This ensures the event doesn't bubble up
          newCol = col + 1;
          handled = true;
          break;
        default:
          return;
      }

      // Only proceed if we handled a navigation key
      if (handled) {
        // Apply the current edit to the cell
        if (activeCell) {
          const cellKey = `${row},${col}`;

          // Update the data state
          setData(prevData => {
            const newData = {
              ...prevData,
              [cellKey]: editValue,
            };
            return newData;
          });

          // Force re-evaluation of all formulas
          setTimeout(() => {
            setData(prevData => ({ ...prevData }));
          }, 0);
        }

        // Handle selection with Shift key
        if (e.shiftKey) {
          // If there's no selection yet, start one from the current cell
          if (!activeCell) return;
          handleCellSelect(newRow, newCol, true);
        } else {
          // Move to the new cell (without extending selection)
          handleCellSelect(newRow, newCol);
        }
      }
    },
    [activeCell, editValue, handleCellSelect, setData]
  );

  // Handle grid scroll events
  const handleGridScroll = useCallback(
    ({ scrollTop, scrollLeft }: { scrollTop: number; scrollLeft: number }): void => {
      const newStartRow = Math.floor(scrollTop / 35);
      const newStartCol = Math.floor(scrollLeft / 100);

      setViewport(prev => ({
        ...prev,
        startRow: newStartRow,
        startCol: newStartCol,
      }));
    },
    [setViewport]
  );

  // Set up global event listeners for keyboard navigation and mouse interactions
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    const handleKeyboardEvents = (e: KeyboardEvent) => {
      // Only handle navigation keys when not typing in an input
      // Check if the active element is not an input
      if (
        activeCell &&
        document.activeElement !== inputRef.current &&
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight')
      ) {
        handleKeyDown(e as unknown as React.KeyboardEvent);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('keydown', handleKeyboardEvents);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('keydown', handleKeyboardEvents);
    };
  }, [activeCell, handleKeyDown, handleMouseUp]);

  // Render the cell component for the virtual grid
  const renderCell = useCallback(
    ({
      columnIndex,
      rowIndex,
      style,
    }: {
      columnIndex: number;
      rowIndex: number;
      style: React.CSSProperties;
    }) => {
      return (
        <Cell
          rowIndex={rowIndex}
          columnIndex={columnIndex}
          style={style}
          getColumnLabel={getColumnLabel}
          activeCell={activeCell}
          editValue={editValue}
          handleMouseDown={handleMouseDown}
          handleMouseEnter={handleMouseEnter}
          handleInputChange={handleInputChange}
          handleInputBlur={handleInputBlur}
          handleKeyPress={handleKeyPress}
          handleKeyDown={handleKeyDown}
          getCellDisplayValue={getCellDisplayValue}
          isCellSelected={isCellSelected}
          isDragging={isDragging}
          dragOrigin={dragOrigin}
          dragTarget={dragTarget}
          inputRef={inputRef}
        />
      );
    },
    [
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
    ]
  );

  return (
    <div className="flex-grow overflow-hidden relative">
      <div className="flex absolute top-2 right-2 z-10">
        <div className="mr-2">
          <button className="bg-gray-200 p-2 border" onClick={() => handleScroll('vertical', -5)}>
            ▲
          </button>
          <button
            className="bg-gray-200 p-2 border mt-1"
            onClick={() => handleScroll('vertical', 5)}
          >
            ▼
          </button>
        </div>
        <div>
          <button className="bg-gray-200 p-2 border" onClick={() => handleScroll('horizontal', -5)}>
            ◀
          </button>
          <button
            className="bg-gray-200 p-2 border ml-1"
            onClick={() => handleScroll('horizontal', 5)}
          >
            ▶
          </button>
        </div>
      </div>

      <VirtualGrid
        ref={gridRef}
        className="border-collapse"
        columnCount={gridSize.cols + 1}
        columnWidth={getColumnWidth}
        height={window.innerHeight - 150}
        rowCount={gridSize.rows + 1}
        rowHeight={getRowHeight}
        width={window.innerWidth}
        onScroll={handleGridScroll}
        style={{ overflow: 'auto' }}
      >
        {renderCell}
      </VirtualGrid>
    </div>
  );
};

export default Grid;
