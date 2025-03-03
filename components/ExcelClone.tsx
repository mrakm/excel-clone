import React from 'react';
import dynamic from 'next/dynamic';
import useExcelHandlers from '@/hooks/useExcelHandlers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Dynamically import the Grid component with SSR disabled
// This is necessary because react-window uses window which is not available during SSR
const Grid = dynamic(() => import('@/components/Grid'), { ssr: false });

const ExcelClone: React.FC = () => {
  const { handleInputChange, handleInputBlur, handleKeyPress } = useExcelHandlers();

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <Header 
        handleInputChange={handleInputChange}
        handleInputBlur={handleInputBlur}
        handleKeyPress={handleKeyPress}
      />
      <Grid />
      <Footer />
    </div>
  );
};

export default ExcelClone;