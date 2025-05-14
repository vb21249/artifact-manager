import React from 'react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import CategoryTreeDemo from './components/CategoryTree/CategoryTreeDemo';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CategoryTreeDemo />
    </ThemeProvider>
  );
}

export default App;
