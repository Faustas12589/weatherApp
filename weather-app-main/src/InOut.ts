export class InOut {
  private readonly STORAGE_KEY = 'savedCities';

  saveCities(cities: string[]): void {
    try {
      const data = JSON.stringify(cities);
      localStorage.setItem(this.STORAGE_KEY, data);
    } catch (error) {
      console.error('Error saving cities to localStorage:', error);
    }
  }

  loadCities(): string[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const cities = JSON.parse(data);
        return cities;
      }
    } catch (error) {
      console.error('Error loading cities from localStorage:', error);
    }
    return [];
  }

  clearCities(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Cities cleared successfully');
    } catch (error) {
      console.error('Error clearing cities from localStorage:', error);
    }
  }
}