// Basic cell position type
export interface CellPosition {
  row: number;
  col: number;
}

// Grid dimensions
export interface GridSize {
  rows: number;
  cols: number;
}

// Viewport state
export interface Viewport {
  startRow: number;
  startCol: number;
  visibleRows: number;
  visibleCols: number;
}

// Cell selection state
export interface CellSelectionState {
  selectionStart: CellPosition | null;
  selectionEnd: CellPosition | null;
  isMouseDown: boolean;
}

// Dragging state
export interface DraggingState {
  isDragging: boolean;
  dragOrigin: CellPosition | null;
  dragTarget: CellPosition | null;
}

// Main data storage type
export type CellData = Record<string, string | number>;

// Excel Formula Type
export interface FormulaHelpers {
  evaluateFormula: (formula: string, cellAddress: string, visitedCells?: Set<string>) => string | number;
  adjustCellReferences: (formula: string, rowDiff: number, colDiff: number) => string;
  parseCellReference: (ref: string) => CellPosition | null;
  getColumnLabel: (col: number) => string;
}

// Cell helpers
export interface CellHelpers {
  getCellDisplayValue: (row: number, col: number) => string | number;
  isCellSelected: (row: number, col: number) => boolean;
  getSelectionRange: () => string;
}

// Excel context type for the provider
export interface ExcelContextType {
  // Data
  data: CellData;
  setData: React.Dispatch<React.SetStateAction<CellData>>;
  
  // Active cell
  activeCell: CellPosition | null;
  setActiveCell: React.Dispatch<React.SetStateAction<CellPosition | null>>;
  
  // Edit value
  editValue: string;
  setEditValue: React.Dispatch<React.SetStateAction<string>>;
  
  // Grid dimensions
  gridSize: GridSize;
  setGridSize: React.Dispatch<React.SetStateAction<GridSize>>;
  
  // Viewport
  viewport: Viewport;
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
  
  // Selection
  selectionStart: CellPosition | null;
  setSelectionStart: React.Dispatch<React.SetStateAction<CellPosition | null>>;
  selectionEnd: CellPosition | null;
  setSelectionEnd: React.Dispatch<React.SetStateAction<CellPosition | null>>;
  
  // Mouse state
  isMouseDown: boolean;
  setIsMouseDown: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Dragging
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  dragOrigin: CellPosition | null;
  setDragOrigin: React.Dispatch<React.SetStateAction<CellPosition | null>>;
  dragTarget: CellPosition | null;
  setDragTarget: React.Dispatch<React.SetStateAction<CellPosition | null>>;
  
  // Formula helpers
  parseCellReference: (ref: string) => CellPosition | null;
  adjustCellReferences: (formula: string, rowDiff: number, colDiff: number) => string;
  evaluateFormula: (formula: string, cellAddress: string, visitedCells?: Set<string>) => string | number;
  
  // Cell helpers
  getColumnLabel: (col: number) => string;
  getCellDisplayValue: (row: number, col: number) => string | number;
  isCellSelected: (row: number, col: number) => boolean;
  getSelectionRange: () => string;
  
  // Event handlers
  handleCellSelect: (row: number, col: number, isShiftKey?: boolean) => void;
  handleScroll: (direction: 'vertical' | 'horizontal', amount: number) => void;
  addThousandRows: () => void;
}