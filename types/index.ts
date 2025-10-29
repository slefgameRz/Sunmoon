export interface LocationData {
  lat: number;
  lon: number;
  name: string;
}

export interface WeatherInfo {
  temp: string;
  feelsLike: string;
  wind: string;
  windGust: string | null;
  humidity: string;
  description: string;
  emoji: string;
}