import { InOut } from "./InOut";

// weather-display.ts
export class WeatherDisplayManager {
  private weatherCardsContainer: HTMLElement;
  private savedCities: Set<string> = new Set();
  private readonly MAX_CARDS = 10;
  private weatherIO: InOut;
  private currentPage = 0;

  weatherIcons: Record<string, string> = {
  "clear sky": "public/sunny.png",
  "scattered clouds": "public/cloudy.png",
  "broken clouds": "public/partialyCloudy.png",
  "overcast clouds" :"public/cloudy.png",
  "shower rain": "public/rain.png",
  "rain": "public/rain.png",
  "light rain": "public/rain.png",
  "thunderstorm": "public/thunderStorm.png",
  "snow": "public/snow.png",
  "mist": "public/rain.png"
  };

getPage(): string {
  const totalPages = Math.ceil(this.savedCities.size / this.MAX_CARDS) || 1;
  const currentPageDisplay = this.currentPage + 1;
  return `${currentPageDisplay}/${totalPages}`;
}

  showNextPage(): void {
    const cards = Array.from(this.weatherCardsContainer.querySelectorAll('.weather-card'));
    
    if (cards.length === 0) return;
    
    cards.forEach(card => {
      (card as HTMLElement).style.display = 'none';
    });
    
    this.currentPage = (this.currentPage + 1) % Math.ceil(cards.length / this.MAX_CARDS);
    
    const startIndex = this.currentPage * this.MAX_CARDS;
    const endIndex = startIndex + this.MAX_CARDS;
    
    cards.slice(startIndex, endIndex).forEach(card => {
      (card as HTMLElement).style.display = 'block';
    });
    
  }

    showPrevPage(): void {
    const cards = Array.from(this.weatherCardsContainer.querySelectorAll('.weather-card'));
    
    if (cards.length === 0) return;
    
    cards.forEach(card => {
      (card as HTMLElement).style.display = 'none';
    });
    
    this.currentPage = (this.currentPage - 1) % Math.ceil(cards.length / this.MAX_CARDS);
    
    const startIndex = this.currentPage * this.MAX_CARDS;
    const endIndex = startIndex + this.MAX_CARDS;
    
    cards.slice(startIndex, endIndex).forEach(card => {
      (card as HTMLElement).style.display = 'block';
    });
    
  }


  addWeatherCard(weatherData: any): void {
    const cityKey = `${weatherData.name}-${weatherData.sys.country}`;
    
    if (this.savedCities.has(cityKey)) {
      this.moveCardToFront(cityKey);
      this.updateWeatherCard(weatherData);
      return;
    }

    this.savedCities.add(cityKey);

    this.weatherIO.saveCities(this.getSavedCities());


    const card = this.createWeatherCard(weatherData, cityKey);


    const firstChild = this.weatherCardsContainer.firstChild;
    if (firstChild) {
      this.weatherCardsContainer.insertBefore(card, firstChild);
    } 
    else {
      this.weatherCardsContainer.appendChild(card);
    }

    this.resetPagination();
  }

  private moveCardToFront(cityKey: string): void {
    const card = this.weatherCardsContainer.querySelector(`[data-city="${cityKey}"]`);
    if (card && card !== this.weatherCardsContainer.firstChild) {
      this.weatherCardsContainer.insertBefore(card, this.weatherCardsContainer.firstChild);
    }
  }

  private resetPagination(): void {
    const cards = Array.from(this.weatherCardsContainer.querySelectorAll('.weather-card'));
    cards.forEach((card, index) => {
      (card as HTMLElement).style.display = index < this.MAX_CARDS ? 'block' : 'none';
    });
    this.currentPage = 0;
  }

  constructor() {
    this.weatherCardsContainer = document.getElementById('weather-cards')!;
    this.weatherIO = new InOut();
  }

    public loadCityList(): string[] {
    return this.weatherIO.loadCities();
  }

  

  getWeatherIcon(description: string): string {
  const key = description.toLowerCase();
  return this.weatherIcons[key] || key;
  }

  removeWeatherCard(cityKey: string): void {
    const card = this.weatherCardsContainer.querySelector(`[data-city="${cityKey}"]`);
    if (card) {
      card.remove();
      this.savedCities.delete(cityKey);
      this.weatherIO.saveCities(this.getSavedCities());
    }
  }

  private createWeatherCard(weatherData: any, cityKey: string): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'weather-card';
    card.setAttribute('data-city', cityKey);
    
    card.innerHTML = `
      <button class="weather-card-close">×</button>
      <div class="weather-card-header">
        <h3 class="weather-card-city">${weatherData.name}, ${weatherData.sys.country}</h3>
        <div class="weather-card-temp">${Math.round(weatherData.main.temp)}°C</div>
      </div>

  <img class="weather-icon" src="${this.getWeatherIcon(weatherData.weather[0].description)}" alt="${weatherData.weather[0].description}">
  <div class="weather-card-description">
    ${new Date(weatherData.sys.sunrise*1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - 
    ${new Date(weatherData.sys.sunset*1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
  </div>      
  
  <div class="weather-card-details">
        <div class="weather-card-detail">
          <span class="weather-card-detail-label">Feels like:</span>
          <span>${Math.round(weatherData.main.feels_like)}°C</span>
        </div>
        <div class="weather-card-detail">
          <span class="weather-card-detail-label">Humidity:</span>
          <span>${weatherData.main.humidity}%</span>
        </div>
        <div class="weather-card-detail">
          <span class="weather-card-detail-label">Wind:</span>
          <span>${weatherData.wind.speed} m/s</span>
        </div>
        <div class="weather-card-detail">
          <span class="weather-card-detail-label">Pressure:</span>
          <span>${weatherData.main.pressure} hPa</span>
        </div>
      </div>
    `;

    const closeButton = card.querySelector('.weather-card-close') as HTMLButtonElement;
    closeButton.addEventListener('click', () => {
      this.removeWeatherCard(cityKey);
    });

    return card;
  }

  private updateWeatherCard(weatherData: any): void {
    const cityKey = `${weatherData.name}-${weatherData.sys.country}`;
    const card = this.weatherCardsContainer.querySelector(`[data-city="${cityKey}"]`);
    
    if (card) {
      const tempElement = card.querySelector('.weather-card-temp');
      const descriptionElement = card.querySelector('.weather-card-description');
      const feelsLikeElement = card.querySelector('.weather-card-detail:nth-child(1) span:last-child');
      const humidityElement = card.querySelector('.weather-card-detail:nth-child(2) span:last-child');
      const windElement = card.querySelector('.weather-card-detail:nth-child(3) span:last-child');
      const pressureElement = card.querySelector('.weather-card-detail:nth-child(4) span:last-child');

      if (tempElement) tempElement.textContent = `${Math.round(weatherData.main.temp)}°C`;
      if (descriptionElement) descriptionElement.textContent = 
      `${new Date(weatherData.sys.sunrise*1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - 
      ${new Date(weatherData.sys.sunset*1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
      if (feelsLikeElement) feelsLikeElement.textContent = `${Math.round(weatherData.main.feels_like)}°C`;
      if (humidityElement) humidityElement.textContent = `${weatherData.main.humidity}%`;
      if (windElement) windElement.textContent = `${weatherData.wind.speed} m/s`;
      if (pressureElement) pressureElement.textContent = `${weatherData.main.pressure} hPa`;
    }
  }

  getSavedCities(): string[] {
    return Array.from(this.savedCities);
  }

  clearAllCards(): void {
    this.weatherCardsContainer.innerHTML = '';
    this.savedCities.clear();
    this.weatherIO.clearCities();
  }
}