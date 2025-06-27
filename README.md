# Thai Weather App

This is a Next.js application for displaying weather and tide information in Thailand.

## Features

-   Current weather data (temperature, humidity, wind, pressure)
-   Tide information (waxing/waning moon, spring/neap tide, high/low tide times, current water level)
-   Location selection (current location or simulated map selection)
-   Date and time selection for tide forecasts
-   Responsive design
-   Dark mode toggle

## Getting Started

1.  **Clone the repository:**
    \`\`\`bash
    git clone <repository-url>
    cd thai-weather-app
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    # or
    yarn install
    \`\`\`

3.  **Set up Environment Variables:**
    This project uses the OpenWeatherMap API. You'll need to get an API key from [OpenWeatherMap](https://openweathermap.org/api).

    Create a `.env.local` file in the root of your project and add your API key:
    \`\`\`
    OPENWEATHER_API_KEY=your_openweathermap_api_key_here
    \`\`\`

4.  **Run the development server:**
    \`\`\`bash
    npm run dev
    # or
    yarn dev
    \`\`\`

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

-   `app/`: Next.js App Router pages and layout.
-   `actions/`: Server Actions for data fetching (e.g., `get-location-forecast.ts`).
-   `components/`: Reusable React components, including Shadcn UI components.
-   `lib/`: Utility functions (e.g., `utils.ts` for `cn` function).
-   `public/`: Static assets.
-   `styles/`: Global CSS.

## API Limitations

Please note that the free tier of OpenWeatherMap API only provides current weather data. Therefore, the "Significant Advance Forecast" section for weather will always display current conditions. For historical or future weather forecasts with specific times, a paid plan or a different API would be required.

## Contributing

Feel free to contribute by opening issues or pull requests.
