import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { 
  CellPosition, 
  CellData, 
  GridSize, 
  Viewport, 
  ExcelContextType 
} from '@/types/excel';

// Create the context with a default value
const ExcelContext = createContext<ExcelContextType | undefined>(undefined);

interface ExcelProviderProps {
  children: ReactNode;
}

export const ExcelProvider: React.FC<ExcelProviderProps> = ({ children }) => {
  // State for storing cell data
  const [data, setData] = useState<CellData>({});
  
  // State for tracking which cell is being edited
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  
  // State for the content being edited
  const [editValue, setEditValue] = useState<string>('');
  
  // State for grid dimensions
  const [gridSize, setGridSize] = useState<GridSize>({ rows: 10000, cols: 1000 });
  
  // State for viewport position
  const [viewport, setViewport] = useState<Viewport>({ 
    startRow: 0, 
    startCol: 0, 
    visibleRows: 20, 
    visibleCols: 10 
  });
  
  // State for selection range
  const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<CellPosition | null>(null);
  
  // State for tracking if mouse is down (for drag selection)
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  
  // State for formula dragging
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOrigin, setDragOrigin] = useState<CellPosition | null>(null);
  const [dragTarget, setDragTarget] = useState<CellPosition | null>(null);

  // Convert column number to Excel-style column label (A, B, C, ..., Z, AA, AB, ...)
  const getColumnLabel = useCallback((col: number): string => {
    let label = '';
    let c = col;
    
    do {
      c = Math.max(0, c);
      label = String.fromCharCode(65 + (c % 26)) + label;
      c = Math.floor(c / 26) - 1;
    } while (c >= 0);
    
    return label;
  }, []);

  // Convert cell reference (e.g., "A1") to row and column indices
  const parseCellReference = useCallback((ref: string): CellPosition | null => {
    const match = ref.match(/([A-Z]+)(\d+)/);
    if (!match) return null;
    
    const colLabel = match[1];
    const row = parseInt(match[2], 10) - 1;
    
    let col = 0;
    for (let i = 0; i < colLabel.length; i++) {
      col = col * 26 + (colLabel.charCodeAt(i) - 64);
    }
    col -= 1; // Convert to 0-indexed
    
    return { row, col };
  }, []);

  // Adjust formula references when copying/dragging
  const adjustCellReferences = useCallback((formula: string, rowDiff: number, colDiff: number): string => {
    if (!formula.startsWith('=')) return formula;
    
    // Regular expression to find cell references
    const cellRefRegex = /([A-Z]+)(\d+)/g;
    
    // Replace each cell reference with adjusted reference
    return formula.replace(cellRefRegex, (match, colRef, rowRef) => {
      // Adjust row
      const newRow = parseInt(rowRef, 10) + rowDiff;
      
      // Adjust column
      let colNum = 0;
      for (let i = 0; i < colRef.length; i++) {
        colNum = colNum * 26 + (colRef.charCodeAt(i) - 64);
      }
      
      const newColNum = colNum + colDiff;
      if (newColNum <= 0) return match; // Don't adjust if it would go out of bounds
      
      // Convert back to column reference
      let newColRef = '';
      let tempColNum = newColNum;
      
      do {
        tempColNum--;
        newColRef = String.fromCharCode(65 + (tempColNum % 26)) + newColRef;
        tempColNum = Math.floor(tempColNum / 26);
      } while (tempColNum > 0);
      
      return newColRef + newRow;
    });
  }, []);

  // Evaluate a formula
  const evaluateFormula = useCallback((
    formula: string, 
    cellAddress: string, 
    visitedCells: Set<string> = new Set()
  ): string | number => {
    // Remove the leading equals sign
    const expression = formula.substring(1).trim();
    
    // Replace cell references with their values
    const cellRefRegex = /([A-Z]+\d+)/g;
    const cellRefsMatch = expression.match(cellRefRegex);
    const cellRefs = cellRefsMatch ? cellRefsMatch : [];
    
    // Check for circular references
    if (cellRefs.includes(cellAddress as never) || visitedCells.has(cellAddress)) {
      return '#CIRCULAR!';
    }
    
    // Add current cell to visited cells to detect circular references
    visitedCells.add(cellAddress);
    
    let evaluatedExpression = expression;
    
    for (const ref of cellRefs) {
      const position = parseCellReference(ref);
      if (!position) continue;
      
      const { row, col } = position;
      const cellKey = `${row},${col}`;
      const cellValue = data[cellKey] || '';
      
      // If the reference is to a cell with a formula, evaluate it recursively
      if (typeof cellValue === 'string' && cellValue.startsWith('=')) {
        try {
          const evaluatedValue = evaluateFormula(cellValue, ref, new Set(visitedCells));
          evaluatedExpression = evaluatedExpression.replace(new RegExp(ref, 'g'), String(evaluatedValue));
        } catch (error) {
          return '#ERROR!';
        }
      } else {
        // For non-formula cells, just use the value
        const numericValue = isNaN(Number(cellValue)) ? 0 : Number(cellValue);
        evaluatedExpression = evaluatedExpression.replace(new RegExp(ref, 'g'), String(numericValue));
      }
    }
    
    // Evaluate the resulting expression
    try {
      // Use Function constructor to evaluate the mathematical expression
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${evaluatedExpression}`)();
      return typeof result === 'number' ? parseFloat(result.toFixed(10)) : result;
    } catch (error) {
      return '#ERROR!';
    }
  }, [data, parseCellReference]);

  // Get the displayed value for a cell
  const getCellDisplayValue = useCallback((row: number, col: number): string | number => {
    const cellKey = `${row},${col}`;
    const value = data[cellKey] || '';
    
    if (typeof value === 'string' && value.startsWith('=')) {
      try {
        const cellAddress = `${getColumnLabel(col)}${row + 1}`;
        return evaluateFormula(value, cellAddress);
      } catch (error) {
        return '#ERROR!';
      }
    }
    
    return value;
  }, [data, evaluateFormula, getColumnLabel]);

  // Check if a cell is within the current selection range
  const isCellSelected = useCallback((row: number, col: number): boolean => {
    if (!selectionStart || !selectionEnd) return false;
    
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);
    
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [selectionStart, selectionEnd]);

  // Get the current selection range as a string (e.g., "A1:B3")
  const getSelectionRange = useCallback((): string => {
    if (!selectionStart || !selectionEnd) return '';
    
    const startLabel = `${getColumnLabel(selectionStart.col)}${selectionStart.row + 1}`;
    const endLabel = `${getColumnLabel(selectionEnd.col)}${selectionEnd.row + 1}`;
    
    return startLabel === endLabel ? startLabel : `${startLabel}:${endLabel}`;
  }, [selectionStart, selectionEnd, getColumnLabel]);

  // Handle cell selection
  const handleCellSelect = useCallback((row: number, col: number, isShiftKey = false): void => {
    // If there's an active cell, commit its value first
    if (activeCell) {
      const { row: activeRow, col: activeCol } = activeCell;
      const activeCellKey = `${activeRow},${activeCol}`;
      
      // Update data for the previous active cell
      setData(prevData => {
        const newData = {
          ...prevData,
          [activeCellKey]: editValue
        };
        return newData;
      });
      
      // Force re-evaluation of all formulas
      setTimeout(() => {
        setData(prevData => ({...prevData}));
      }, 0);
    }
    
    if (isShiftKey && selectionStart) {
      // Extend selection if shift key is pressed
      setSelectionEnd({ row, col });
    } else {
      // Start a new selection
      setSelectionStart({ row, col });
      setSelectionEnd({ row, col });
    }
    
    // Set active cell for editing
    setActiveCell({ row, col });
    const cellKey = `${row},${col}`;
    setEditValue(String(data[cellKey] || ''));
  }, [selectionStart, data, activeCell, editValue]);

  // Handle scroll to adjust viewport
  const handleScroll = useCallback((direction: 'vertical' | 'horizontal', amount: number): void => {
    setViewport(prev => {
      if (direction === 'vertical') {
        return {
          ...prev,
          startRow: Math.max(0, prev.startRow + amount)
        };
      } else {
        return {
          ...prev,
          startCol: Math.max(0, prev.startCol + amount)
        };
      }
    });
  }, []);
  
  // Add 1000 rows to the grid
  const addThousandRows = useCallback((): void => {
    setGridSize(prev => ({
      ...prev,
      rows: prev.rows + 1000
    }));
  }, []);

  const value: ExcelContextType = {
    // Data
    data,
    setData,
    
    // Active cell
    activeCell,
    setActiveCell,
    
    // Edit value
    editValue,
    setEditValue,
    
    // Grid dimensions
    gridSize,
    setGridSize,
    
    // Viewport
    viewport,
    setViewport,
    
    // Selection
    selectionStart,
    setSelectionStart,
    selectionEnd,
    setSelectionEnd,
    
    // Mouse state
    isMouseDown,
    setIsMouseDown,
    
    // Dragging
    isDragging,
    setIsDragging,
    dragOrigin,
    setDragOrigin,
    dragTarget,
    setDragTarget,
    
    // Formula helpers
    parseCellReference,
    adjustCellReferences,
    evaluateFormula,
    
    // Cell helpers
    getColumnLabel,
    getCellDisplayValue,
    isCellSelected,
    getSelectionRange,
    
    // Event handlers
    handleCellSelect,
    handleScroll,
    addThousandRows,
  };

  return (
    <ExcelContext.Provider value={value}>
      {children}
    </ExcelContext.Provider>
  );
};

// Custom hook for using the Excel context
export const useExcelContext = (): ExcelContextType => {
  const context = useContext(ExcelContext);
  if (context === undefined) {
    throw new Error('useExcelContext must be used within an ExcelProvider');
  }
  return context;
};