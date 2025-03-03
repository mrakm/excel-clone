import React from 'react';
import { useExcelContext } from '@/context/ExcelContext';
import { FOOTER_POSITION, FOOTER_SELECTED, FOOTER_ADD_ROWS } from '@/constants/textConstants';

const Footer: React.FC = () => {
  const { 
    viewport,
    getColumnLabel,
    selectionStart,
    selectionEnd,
    getSelectionRange,
    addThousandRows
  } = useExcelContext();

  return (
    <div className="p-2 bg-gray-100 border-t">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {FOOTER_POSITION.replace('{startRow}', (viewport.startRow + 1).toString())
                .replace('{endRow}', (viewport.startRow + viewport.visibleRows).toString())
                .replace('{startCol}', getColumnLabel(viewport.startCol))
                .replace('{endCol}', getColumnLabel(viewport.startCol + viewport.visibleCols - 1))}
        </div>
        {selectionStart && selectionEnd && (
          <div className="text-sm text-gray-600 mx-2">
            {FOOTER_SELECTED.replace('{selectionRange}', getSelectionRange())}
          </div>
        )}
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
          onClick={addThousandRows}
        >
          {FOOTER_ADD_ROWS}
        </button>
      </div>
    </div>
  );
};

export default Footer;
