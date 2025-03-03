import React from 'react';
import { HEADER_TITLE, HEADER_INSTRUCTIONS } from '@/constants/textConstants';
import CellEditor from './CellEditor';

interface HeaderProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

const Header: React.FC<HeaderProps> = ({
  handleInputChange,
  handleInputBlur,
  handleKeyPress
}) => {
  return (
    <div className="p-2 bg-gray-100 border-b">
      <h1 className="text-xl font-semibold">{HEADER_TITLE}</h1>
      <p className="text-sm text-gray-600">
        {HEADER_INSTRUCTIONS}
      </p>
      <CellEditor 
        handleInputChange={handleInputChange}
        handleInputBlur={handleInputBlur}
        handleKeyPress={handleKeyPress}
      />
    </div>
  );
};

export default Header;
