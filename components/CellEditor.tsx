import React, { useEffect, useRef } from 'react';
import { useExcelContext } from '@/context/ExcelContext';
import { CELL_EDITOR_PLACEHOLDER } from '@/constants/textConstants';

interface CellEditorProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

const CellEditor: React.FC<CellEditorProps> = ({
  handleInputChange,
  handleInputBlur,
  handleKeyPress,
}) => {
  const { 
    activeCell, 
    editValue, 
    getColumnLabel,
    selectionStart,
    selectionEnd,
    getSelectionRange
  } = useExcelContext();
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when activeCell changes
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeCell]);

  if (!activeCell) {
    return null;
  }

  const cellLabel = selectionStart && selectionEnd && 
    (selectionStart.row !== selectionEnd.row || selectionStart.col !== selectionEnd.col) 
      ? getSelectionRange() 
      : `${getColumnLabel(activeCell.col)}${activeCell.row + 1}`;

  return (
    <div className="flex space-x-2 mt-2">
      <div className="bg-white border px-2 py-1">
        {cellLabel}
      </div>
      <input
        ref={inputRef}
        type="text"
        className="border px-2 py-1 flex-grow"
        value={editValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyPress={handleKeyPress}
        placeholder={CELL_EDITOR_PLACEHOLDER}
      />
    </div>
  );
};

export default CellEditor;
