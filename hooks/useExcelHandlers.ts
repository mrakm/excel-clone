import { useCallback } from 'react';
import { useExcelContext } from '@/context/ExcelContext';

export const useExcelHandlers = () => {
  const {
    activeCell,
    editValue,
    setData,
    setEditValue,
    handleCellSelect
  } = useExcelContext();

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setEditValue(e.target.value);
  }, [setEditValue]);

  // Handle input blur (finish editing)
  const handleInputBlur = useCallback((): void => {
    if (activeCell) {
      const { row, col } = activeCell;
      const cellKey = `${row},${col}`;
      
      // Update the data state
      setData(prevData => {
        // Only update if value has changed
        if (prevData[cellKey] === editValue) {
          return prevData;
        }
        
        const newData = {
          ...prevData,
          [cellKey]: editValue
        };
        return newData;
      });
      
      // Force re-evaluation of all formulas
      setTimeout(() => {
        setData(prevData => ({...prevData}));
      }, 0);
    }
  }, [activeCell, editValue, setData]);

  // Handle key press in the input
  const handleKeyPress = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      // Apply the current edit
      if (activeCell) {
        const { row, col } = activeCell;
        const cellKey = `${row},${col}`;
        
        // Update the data state
        setData(prevData => {
          const newData = {
            ...prevData,
            [cellKey]: editValue
          };
          return newData;
        });
        
        // Force re-evaluation of all formulas
        setTimeout(() => {
          setData(prevData => ({...prevData}));
        }, 0);
      }
      
      // Move to the next row
      if (activeCell) {
        const { row, col } = activeCell;
        handleCellSelect(row + 1, col);
      }
    }
  }, [activeCell, editValue, handleCellSelect, setData]);

  return {
    handleInputChange,
    handleInputBlur,
    handleKeyPress
  };
};

export default useExcelHandlers;