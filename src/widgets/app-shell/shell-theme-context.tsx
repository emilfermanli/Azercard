import { createContext, useContext } from 'react';

export const ShellThemeContext = createContext(true);

export function useShellTheme() {
  return useContext(ShellThemeContext);
}
