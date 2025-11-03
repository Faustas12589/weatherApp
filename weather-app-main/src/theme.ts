export type Theme = 'light' | 'dark';

class ThemeManager {
  private currentTheme: Theme;

  constructor() {
    this.currentTheme = (localStorage.getItem('theme') as Theme) || 'light';
    this.applyTheme(this.currentTheme);
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
  }

  public toggleTheme(): void {
    const newTheme: Theme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  public getCurrentTheme(): Theme {
    return this.currentTheme;
  }
}

export const themeManager = new ThemeManager();