'use client';

import React from 'react';
import { ExcelProvider } from '@/context/ExcelContext';
import ExcelClone from '@/components/ExcelClone';

export default function ExcelPage() {
  return (
    <ExcelProvider>
      <ExcelClone />
    </ExcelProvider>
  );
}