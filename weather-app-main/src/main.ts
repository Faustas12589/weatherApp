import { themeManager } from './theme.ts';
import { SearchManager } from './search.ts';
import { WeatherDisplayManager } from './weatherDisplay.ts';
import './style.css';

class WeatherApp {
  weatherDisplay: WeatherDisplayManager;
  private searchManager: SearchManager;

  constructor() {
    this.weatherDisplay = new WeatherDisplayManager();
    this.searchManager = new SearchManager('Personal Code');
  }

  async onCityAdded(weatherData: any) {
    this.weatherDisplay.addWeatherCard(weatherData);
  }

  getSearchManager(): SearchManager {
    return this.searchManager;
  }
}

const fonts = [
  'Arial, sans-serif',
  'Georgia, serif',
  '"Courier New", monospace',
  'Impact, sans-serif',
  '"Comic Sans MS", cursive',
  'system-ui, sans-serif',
  '"Times New Roman", serif'
];

let currentFontIndex = 0;
let appInstance: WeatherApp;

function rotateFont() {
  const h1 = document.querySelector('h1');
  if (h1) {
    h1.style.fontFamily = fonts[currentFontIndex];
    currentFontIndex = (currentFontIndex + 1) % fonts.length;
  }
}

function updatePageDisplay() {
  const pageDisplay = document.getElementById('page-display');
  if (pageDisplay && appInstance) {
    pageDisplay.textContent = appInstance.weatherDisplay.getPage();
  }
}
async function loadSavedCities() {
  const savedCities = appInstance.weatherDisplay.loadCityList();

  for (const cityKey of savedCities) {
    try {
      const [cityName] = cityKey.split('-');
      const weatherData = await appInstance.getSearchManager().handleSearch(cityName);
      appInstance.weatherDisplay.addWeatherCard(weatherData);
    } catch (error) {
      console.error(`Failed to load city ${cityKey}:`, error);
    }
  }
}

function initializeApp() {
  const app = document.getElementById('app')!;

  app.innerHTML = `
    <div class="TopText">
      <h1>Weather</h1>
    </div>

    <h2 id="process"></h2>


    <button id="theme-toggle" class="button is-outlined is-rounded custom-theme-btn" >
          Switch to Light mode
    </button>


<div class="navigation-container">
  <button id="prev" class="navigation-btn"><img src="public/prev.png" alt="Previous"></button>
  <div id="page-display" class="page-info">1/1</div>
  <button id="next" class="navigation-btn"><img src="public/next.png" alt="Next"></button>
</div>



    <div class="controls">
      <input
        id="searchBar"
        type="text"
        placeholder="Search by city, ZIP or coordinates..."
      />
      <div id="suggestions" class="suggestions-container"></div>
    </div>

    <div id="weather-cards" class="weather-cards-container" style="min-height: 100px; padding: 20px;">
    </div>
  `;

  appInstance = new WeatherApp();

  const searchBar = document.getElementById('searchBar') as HTMLInputElement;
  
  console.log('Setting up search input...');
  
  appInstance.getSearchManager().setupSearchInput(searchBar, (weatherData) => {
    if (weatherData) {
      appInstance.weatherDisplay.addWeatherCard(weatherData);
    }
  });

  searchBar.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
      const query = searchBar.value.trim();
      
      if (query) {
        try {
          const weatherData = await appInstance.getSearchManager().handleSearch(query);
          appInstance.weatherDisplay.addWeatherCard(weatherData);
        } catch (error) {
          console.error('Search error:', error);
        }
      }
    }
  });

  document.addEventListener('coordinatesSelected', async (event: any) => {
    const { lat, lon } = event.detail;
    try {
      const weatherData = await appInstance.getSearchManager().handleSearch(`${lat},${lon}`);
      appInstance.weatherDisplay.addWeatherCard(weatherData);
    } catch (error) {
      console.error('Coordinate search error:', error);
    }
  });
  loadSavedCities();  

}



function initializeTheme() {
  const toggleButton = document.getElementById('theme-toggle') as HTMLButtonElement;

  toggleButton.addEventListener('click', () => {
    themeManager.toggleTheme();
    updateButtonText();
  });

  function updateButtonText(): void {
    const currentTheme = themeManager.getCurrentTheme();
    toggleButton.textContent = `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`;
  }

  const nextCardsButton = document.getElementById('next') as HTMLButtonElement;
  nextCardsButton.addEventListener('click', () => {
    appInstance.weatherDisplay.showNextPage();
    updatePageDisplay()
  });

  const prevCardsButton = document.getElementById('prev') as HTMLButtonElement;
  prevCardsButton.addEventListener('click', () => {
    appInstance.weatherDisplay.showPrevPage();
    updatePageDisplay()
  });

  updateButtonText();
}

initializeApp();
initializeTheme();
setInterval(rotateFont, 300);
  setTimeout(() =>
  {
    updatePageDisplay();
  }, 400);

