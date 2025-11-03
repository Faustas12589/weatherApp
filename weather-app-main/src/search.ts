// search.ts
import axios from 'axios';

export class SearchManager {
  private apiKey: string;
  private suggestionsContainer: HTMLElement;
  private currentTimeout: number = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.suggestionsContainer = document.getElementById('suggestions')!;
  }

  setupSearchInput(searchBar: HTMLInputElement, onSearch: (weatherData: any) => void): void {
    searchBar.addEventListener('input', () => {
      const query = searchBar.value.trim();

      if (this.currentTimeout) clearTimeout(this.currentTimeout);

      if (query.length >= 2) {
        this.currentTimeout = window.setTimeout(() => {
          this.fetchLocationSuggestions(query);
        }, 300);
      } else {
        this.hideSuggestions();
      }
    });

    searchBar.addEventListener('keypress', async (event) => {
      if (event.key === 'Enter') {
        const query = searchBar.value.trim();
        if (query) {
          const data = await this.handleSearch(query);
          onSearch(data);
          this.hideSuggestions();
        }
      }
    });

    document.addEventListener('click', (event) => {
      if (!searchBar.contains(event.target as Node) && !this.suggestionsContainer.contains(event.target as Node)) {
        this.hideSuggestions();
      }
    });
  }

  async handleSearch(query: string): Promise<any> {
    try {
      this.updateStatus('Loading...');

      let weatherData;

      const coordRegex = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
      if (coordRegex.test(query)) {
        const [lat, lon] = query.split(',');
        weatherData = await this.fetchWeatherByCoords(lat.trim(), lon.trim());
      } else if (/^\d{5}$/.test(query)) {
        weatherData = await this.fetchWeatherByZIP(query, 'US');
      } else {
        weatherData = await this.fetchWeatherByCity(query);
      }

      this.updateStatus('');
      return weatherData;

    } catch (error) {
      console.error('Search error:', error);
      this.updateStatus('Error: Location not found');
      throw error;
    }
  }

  async fetchLocationSuggestions(query: string): Promise<void> {
    try {
      const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=10&appid=${this.apiKey}`;
      const response = await axios.get(url);

      const locations = response.data;
      const sortedLocations = this.sortLocationsByRelevance(locations, query);
      this.showSuggestions(sortedLocations);

    } catch (error) {
      console.error('Geocoding error:', error);
      this.hideSuggestions();
    }
  }

  private showSuggestions(locations: any[]): void {
    if (locations.length > 0) {
      const uniqueLocations = this.filterDuplicateLocations(locations).slice(0, 5);

      this.suggestionsContainer.innerHTML = uniqueLocations
        .map(location => {
          const displayName = this.formatLocationName(location);
          const type = this.getLocationType(location);
          return `
            <div class="suggestion-item" data-lat="${location.lat}" data-lon="${location.lon}">
              <span>${displayName}</span>
              <span class="suggestion-type">${type}</span>
            </div>
          `;
        })
        .join('');
      this.suggestionsContainer.style.display = 'block';

      this.addSuggestionEventListeners();
    } else {
      this.hideSuggestions();
    }
  }

  private addSuggestionEventListeners(): void {
    document.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', async () => {
        const lat = item.getAttribute('data-lat');
        const lon = item.getAttribute('data-lon');
        const displayName = item.querySelector('span:first-child')?.textContent || '';

        const searchBar = document.getElementById('searchBar') as HTMLInputElement;
        searchBar.value = displayName;
        if (lat && lon) {
          const data = await this.handleSearch(`${lat},${lon}`);
          console.log('Fetched weather:', data);
        }
        this.hideSuggestions();
      });
    });
  }

  private sortLocationsByRelevance(locations: any[], query: string): any[] {
    return locations.sort((a, b) => {
      const aExactMatch = a.name.toLowerCase() === query.toLowerCase();
      const bExactMatch = b.name.toLowerCase() === query.toLowerCase();

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      const preferredCountries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'JP'];
      const aCountryIndex = preferredCountries.indexOf(a.country);
      const bCountryIndex = preferredCountries.indexOf(b.country);

      if (aCountryIndex !== -1 && bCountryIndex === -1) return -1;
      if (aCountryIndex === -1 && bCountryIndex !== -1) return 1;
      if (aCountryIndex !== -1 && bCountryIndex !== -1) {
        return aCountryIndex - bCountryIndex;
      }

      return 0;
    });
  }

  private filterDuplicateLocations(locations: any[]): any[] {
    const seen = new Set();
    return locations.filter(location => {
      const key = `${location.name}-${location.country}-${location.state || ''}-${location.lat}-${location.lon}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private formatLocationName(location: any): string {
    const parts = [location.name];
    if (location.state) parts.push(location.state);
    parts.push(location.country);
    return parts.join(', ');
  }

  private getLocationType(location: any): string {
    if (location.country === 'US' && /^\d{5}$/.test(location.name)) return 'ZIP';
    return 'location';
  }

  hideSuggestions(): void {
    this.suggestionsContainer.style.display = 'none';
  }

  private async fetchWeatherByCoords(lat: string, lon: string): Promise<any> {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    const response = await axios.get(url);
    return response.data;
  }

  private async fetchWeatherByCity(city: string): Promise<any> {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}&units=metric`;
    const response = await axios.get(url);
    return response.data;
  }
  

  private async fetchWeatherByZIP(zip: string, country: string = 'US'): Promise<any> {
    const url = `https://api.openweathermap.org/data/2.5/weather?zip=${zip},${country}&appid=${this.apiKey}&units=metric`;
    const response = await axios.get(url);
    return response.data;
  }

private updateStatus(message: string): void {
  const h2 = document.getElementById('process');
  if (h2) {
    h2.textContent = message;
    
    setTimeout(() => {
      if (h2.textContent === message) {
        h2.textContent = '';
      }
    }, 5000);
  }
}
}
