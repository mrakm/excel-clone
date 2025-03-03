import { CellPosition } from '@/types/excel';

/**
 * Convert column number to Excel-style column label (A, B, C, ..., Z, AA, AB, ...)
 */
export const getColumnLabel = (col: number): string => {
  let label = '';
  let c = col;
  
  do {
    c = Math.max(0, c);
    label = String.fromCharCode(65 + (c % 26)) + label;
    c = Math.floor(c / 26) - 1;
  } while (c >= 0);
  
  return label;
};

/**
 * Convert cell reference (e.g., "A1") to row and column indices
 */
export const parseCellReference = (ref: string): CellPosition | null => {
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
};

/**
 * Checks if a cell is within the current selection range
 */
export const isCellInSelectionRange = (
  row: number, 
  col: number, 
  selectionStart: CellPosition | null, 
  selectionEnd: CellPosition | null
): boolean => {
  if (!selectionStart || !selectionEnd) return false;
  
  const minRow = Math.min(selectionStart.row, selectionEnd.row);
  const maxRow = Math.max(selectionStart.row, selectionEnd.row);
  const minCol = Math.min(selectionStart.col, selectionEnd.col);
  const maxCol = Math.max(selectionStart.col, selectionEnd.col);
  
  return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
};

/**
 * Checks if a cell is within a drag selection range
 */
export const isCellInDragRange = (
  row: number, 
  col: number, 
  dragOrigin: CellPosition | null, 
  dragTarget: CellPosition | null
): boolean => {
  if (!dragOrigin || !dragTarget) return false;
  
  const minRow = Math.min(dragOrigin.row, dragTarget.row);
  const maxRow = Math.max(dragOrigin.row, dragTarget.row);
  const minCol = Math.min(dragOrigin.col, dragTarget.col);
  const maxCol = Math.max(dragOrigin.col, dragTarget.col);
  
  return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
};

/**
 * Get the selection range as a string (e.g., "A1:B3")
 */
export const getSelectionRangeString = (
  selectionStart: CellPosition | null, 
  selectionEnd: CellPosition | null
): string => {
  if (!selectionStart || !selectionEnd) return '';
  
  const startLabel = `${getColumnLabel(selectionStart.col)}${selectionStart.row + 1}`;
  const endLabel = `${getColumnLabel(selectionEnd.col)}${selectionEnd.row + 1}`;
  
  return startLabel === endLabel ? startLabel : `${startLabel}:${endLabel}`;
};

/**
 * Safely evaluate a mathematical expression
 */
export const safeEvaluate = (expression: string): number | string => {
  try {
    // Use Function constructor to evaluate the mathematical expression
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${expression}`)();
    return typeof result === 'number' ? parseFloat(result.toFixed(10)) : result;
  } catch (error) {
    return '#ERROR!';
  }
};