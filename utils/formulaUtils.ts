import { CellData } from '@/types/excel';
import { parseCellReference, getColumnLabel, safeEvaluate } from './excelUtils';

/**
 * Adjust formula references when copying/dragging
 */
export const adjustCellReferences = (formula: string, rowDiff: number, colDiff: number): string => {
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
};

/**
 * Evaluate a formula
 */
export const evaluateFormula = (
  formula: string, 
  cellAddress: string, 
  data: CellData, 
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
        const evaluatedValue = evaluateFormula(cellValue, ref, data, new Set(visitedCells));
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
  
  return safeEvaluate(evaluatedExpression);
};

/**
 * Get the displayed value for a cell
 */
export const getCellDisplayValue = (row: number, col: number, data: CellData): string | number => {
  const cellKey = `${row},${col}`;
  const value = data[cellKey] || '';
  
  if (typeof value === 'string' && value.startsWith('=')) {
    try {
      const cellAddress = `${getColumnLabel(col)}${row + 1}`;
      return evaluateFormula(value, cellAddress, data);
    } catch (error) {
      return '#ERROR!';
    }
  }
  
  return value;
};