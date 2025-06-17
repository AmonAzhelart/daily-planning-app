import { createTheme, alpha } from '@mui/material/styles';

// Definisci prima le opzioni della palette in modo da poterle referenziare
const paletteOptions = {
    primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
    secondary: { main: '#673ab7', light: '#9575cd', dark: '#512da8' },
    background: { default: '#f0f2f5', paper: '#ffffff' },
    success: { main: '#388e3c', light: '#66bb6a', dark: '#2e7d32' },
    warning: { main: '#f57c00', light: '#ffa726', dark: '#e65100' },
    error: { main: '#d32f2f', light: '#ef5350', dark: '#c62828' },
    info: { main: '#0288d1', light: '#29b6f6', dark: '#01579b' },
    text: { primary: '#121212', secondary: '#5f6368', disabled: alpha('#000000', 0.38) },
    common: {
        black: '#000000',
        white: '#ffffff',
    },
    grey: {
        50: '#fafafa', 100: '#f5f5f5', 200: '#eeeeee', 300: '#e0e0e0',
        400: '#bdbdbd', 500: '#9e9e9e', 600: '#757575', 700: '#616161',
        800: '#424242', 900: '#212121',
        A100: '#d5d5d5', A200: '#aaaaaa', A400: '#303030', A700: '#616161',
    },
    action: {
        active: alpha('#000000', 0.54), hover: alpha('#000000', 0.04), hoverOpacity: 0.04,
        selected: alpha('#000000', 0.08), selectedOpacity: 0.08,
        disabled: alpha('#000000', 0.26), disabledBackground: alpha('#000000', 0.12), disabledOpacity: 0.38,
        focus: alpha('#000000', 0.12), focusOpacity: 0.12, activatedOpacity: 0.12,
    },
};

const epicTheme = createTheme({
  palette: paletteOptions,
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: paletteOptions.primary.dark },
    h5: { fontWeight: 600, color: paletteOptions.text.primary },
    h6: { fontWeight: 600, color: paletteOptions.text.primary},
    subtitle1: { fontSize: '1rem', fontWeight: 500, color: paletteOptions.text.secondary},
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.5px' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiPaper: { defaultProps: { elevation: 1 }, styleOverrides: { root: { transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms', border: `1px solid ${alpha(paletteOptions.common.black, 0.08)}` }}},
    MuiButton: { styleOverrides: { root: { padding: '8px 20px', borderRadius: 6 }, containedPrimary: { '&:hover': { backgroundColor: paletteOptions.primary.dark }}}},
    MuiChip: { styleOverrides: { root: { fontWeight: 500, padding: '4px 8px', height: 'auto', fontSize: '0.8rem' }}},
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit'}, styleOverrides: {root: {backgroundColor: paletteOptions.background.paper, borderBottom: `1px solid ${alpha(paletteOptions.common.black, 0.12)}`}}},
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: alpha(paletteOptions.text.primary, 0.75),
          backgroundColor: alpha(paletteOptions.primary.main, 0.04),
          borderBottom: `1px solid ${alpha(paletteOptions.primary.main, 0.15)}`,
          padding: '12px 16px',
        },
        body: {
          color: alpha(paletteOptions.text.primary, 0.9),
          padding: '10px 16px',
          borderBottom: `1px solid ${alpha(paletteOptions.common.black, 0.07)}`,
        },
      }
    },
    MuiTableRow: {
        styleOverrides: {
            root: {
                transition: 'background-color 0.2s ease-in-out',
                '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: alpha(paletteOptions.primary.main, 0.06),
                },
                '&:last-child td, &:last-child th': {
                    borderBottom: 0,
                }
            }
        }
    },
    MuiTableContainer: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                border: `1px solid ${alpha(paletteOptions.common.black, 0.1)}`
            }
        }
    },
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                backgroundColor: alpha(paletteOptions.common.black, 0.87),
                fontSize: '0.78rem',
                padding: '6px 10px',
            }
        }
    },
    MuiFab: {
        styleOverrides: {
            root: {
                boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                    boxShadow: '0px 6px 16px rgba(0,0,0,0.2)',
                }
            }
        }
    },
    MuiTextField: {
        defaultProps: {
            size: 'small',
        }
    },
    MuiSelect: {
        defaultProps: {
            size: 'small',
        }
    },
    MuiAutocomplete: {
        defaultProps: {
            size: 'small',
        }
    },
    MuiToggleButtonGroup: {
        defaultProps: {
            size: 'small',
            exclusive: true,
        },
        styleOverrides: {
            root: {
                border: `1px solid ${alpha(paletteOptions.common.black, 0.15)}`,
                borderRadius: 6,
            },
        }
    },
    MuiToggleButton: {
        styleOverrides: {
            root: {
                padding: '5px 12px',
                textTransform: 'none',
                fontWeight: 500,
                color: alpha(paletteOptions.text.primary, 0.7),
                '&.Mui-selected': {
                    color: paletteOptions.primary.main,
                    backgroundColor: alpha(paletteOptions.primary.main, 0.12),
                    '&:hover': {
                        backgroundColor: alpha(paletteOptions.primary.main, 0.2),
                    }
                },
                border: 'none',
                '&:not(:first-of-type)': {
                     marginLeft: 0,
                     borderLeft: `1px solid ${alpha(paletteOptions.common.black, 0.15)}`,
                },
            }
        }
    },
    MuiSwitch: {
        styleOverrides: {
            root: {
                width: 42,
                height: 26,
                padding: 0,
                '& .MuiSwitch-switchBase': {
                  padding: 0,
                  margin: 2,
                  transitionDuration: '300ms',
                  '&.Mui-checked': {
                    transform: 'translateX(16px)',
                    color: paletteOptions.common.white,
                    '& + .MuiSwitch-track': {
                      backgroundColor: paletteOptions.success.main,
                      opacity: 1,
                      border: 0,
                    },
                    '& .MuiSwitch-thumb': {
                        boxSizing: 'border-box',
                        width: 22,
                        height: 22,
                      },
                    '& .MuiSvgIcon-root': {
                        display: 'block',
                        fontSize: '0.9rem',
                        },
                  },
                  '&.Mui-disabled + .MuiSwitch-track': {
                    opacity: 0.5,
                  },
                },
                '& .MuiSwitch-thumb': {
                  boxSizing: 'border-box',
                  width: 22,
                  height: 22,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                },
                '& .MuiSwitch-track': {
                  borderRadius: 26 / 2,
                  backgroundColor: alpha(paletteOptions.common.black, 0.25),
                  opacity: 1,
                  // Per createTheme().transitions.create, è meglio definirlo qui se non si può accedere a epicTheme.transitions
                  // Se si usa solo 'transition' CSS, si può mettere una stringa.
                  // Per ora, lascio come stringa per semplicità, ma in un tema completo si configurerebbe transitions.
                  transition: 'background-color 500ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                },
                '& .MuiSwitch-switchBase .MuiSvgIcon-root': {
                    display: 'none',
                },
              },
        }
    }
  },
});

export default epicTheme;
