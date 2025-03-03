# Excel Clone with TypeScript and Next.js

A feature-rich spreadsheet application built with TypeScript, Next.js, and React window for virtualization. This project demonstrates best practices for building complex web applications with modern JavaScript frameworks.

[![IMAGE ALT TEXT HERE](http://img.youtube.com/vi/4IlMR5EGD6k/0.jpg)](http://www.youtube.com/watch?v=4IlMR5EGD6k)

## Features

- Formula support with proper reference handling
- Cell selection with keyboard navigation
- Fill handle for formula dragging and copying
- Virtualized grid for handling large spreadsheets
- Type-safe code with TypeScript
- Component-based architecture
- Context API for state management
- Custom hooks for logic separation
- Responsive design with Tailwind CSS

## Technical Overview

### Architecture

This Excel clone is built with a component-based architecture, following modern React best practices:

- **Context-based State Management**: Using React Context API to manage application state
- **Component Separation**: Components are separated by responsibility
- **Custom Hooks**: Logic is extracted into custom hooks for better reusability
- **Virtualization**: Using React Window to render only visible cells for performance
- **TypeScript**: Full type safety throughout the application

### Key Components

- `ExcelProvider`: Manages the global state and provides context to all components
- `Grid`: Renders the virtualized grid with react-window
- `Cell`: Individual cell component with selection and editing capabilities
- `Header`: Contains the formula bar and application controls
- `Footer`: Displays metadata and additional controls

### Formula Handling

The application includes full formula support:

- Formula parsing and evaluation
- Cell reference resolution
- Circular reference detection
- Automatic recalculation when dependencies change
- Formula dragging with smart cell reference adjustment

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

- Type in cells just like in Excel
- Use formulas starting with '=' (e.g., =A1+B1)
- Click and drag to select multiple cells
- Drag from the bottom-right corner of a cell to copy formulas
- Use arrow keys for navigation
- Press Enter to commit changes and move down
- Press Tab to move right

## Project Structure

```
excel-clone-typescript/
├── app/                    # Next.js app directory
│   ├── excel/              # Excel application route
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/             # React components
│   ├── Cell.tsx            # Individual cell component
│   ├── CellEditor.tsx      # Formula editor
│   ├── ExcelClone.tsx      # Main application component
│   ├── Footer.tsx          # Application footer
│   ├── Grid.tsx            # Virtualized grid
│   └── Header.tsx          # Application header
├── context/                # React context
│   └── ExcelContext.tsx    # Global state management
├── hooks/                  # Custom React hooks
│   └── useExcelHandlers.ts # Input handling logic
├── types/                  # TypeScript type definitions
│   └── excel.ts            # Excel-related types
├── utils/                  # Utility functions
│   ├── excelUtils.ts       # General Excel utilities
│   └── formulaUtils.ts     # Formula processing utilities
└── [Configuration files]   # Various config files
```

## License

MIT
