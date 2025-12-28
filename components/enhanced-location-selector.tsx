"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Waves,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Thermometer,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  CalendarIcon,
  Moon,
  Clock,
  Star,
  Compass,
  Activity,
  Radio,
  Anchor,
  TrendingDown,
  TrendingUp,
  Map,
  History,
  Calendar as CalendarDays,
  Droplet,
  Wind,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLocationForecast,
} from "@/actions/get-location-forecast";
import {
  type LocationData,
  type TideData,
  type WeatherData,
} from "@/lib/tide-service";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import MapSelector from "./map-selector";
import { WaterLevelGraphV2 as WaterLevelGraph } from "./water-level-graph-v2";
import ApiStatusDashboard from "./api-status-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DisasterAlert from "./disaster-alert";
import {
  analyzeDisasterRisk,
  type DisasterAnalysis,
} from "@/lib/disaster-analysis";
import RiskAreaMap from "./RiskAreaMap";
import HistoricalEventsPanel from "./HistoricalEventsPanel";
import MultiDayForecast from "./MultiDayForecast";
import QuickActions from "./QuickActions";
import WeatherTrends from "./WeatherTrends";
import { HeroCardSkeleton, MetricCardSkeleton, GraphSkeleton } from "./LoadingSkeletons";
import FavoriteLocations from "./FavoriteLocations";
import SettingsPanel from "./SettingsPanel";
import SafetyTips from "./SafetyTips";
import ThemeToggle from "./ThemeToggle";

// Import distance and offline storage utilities
import {
  findNearestPier,
  getDistanceCategory,
  getDistanceCategoryText,
  getDistanceCategoryColor,
  getPierTypeIcon,
  getPierTypeText,
  type NearestPier,
} from "@/lib/distance-utils";
import {
  loadTideDataCache,
  saveTideDataCache,
  loadWeatherDataCache,
  saveWeatherDataCache,
  initializeOfflineStorage,
} from "@/lib/offline-storage";

// Import water level comparison for flood warnings
import {
  compareWaterLevel,
  type WaterLevelComparison,
} from "@/lib/water-level-comparison";

// Import elevation service
import { getElevation } from "@/lib/elevation-service";

import { TideStatusHero } from "./tide-status-hero";



// Enhanced default values with new properties
const defaultTideData = {
  isWaxingMoon: true,
  lunarPhaseKham: 0,
  tideStatus: "ไม่ทราบ" as "น้ำเป็น" | "น้ำตาย",
  highTideTime: "N/A",
  lowTideTime: "N/A",
  isSeaLevelHighToday: false,
  currentWaterLevel: 0,
  waterLevelStatus: "ไม่ทราบ",
  waterLevelReference: "ไม่ทราบแหล่งอ้างอิง",
  seaLevelRiseReference: "ไม่ทราบแหล่งอ้างอิง",
  pierDistance: 0,
  pierReference: "ไม่ทราบแหล่งอ้างอิง",
  tideEvents: [],
  timeRangePredictions: [],
  graphData: [],
  apiStatus: "error" as const,
  apiStatusMessage: "ไม่มีข้อมูล",
  lastUpdated: new Date().toISOString(),
};

const defaultWeatherData = {
  main: { temp: 0, feels_like: 0, humidity: 0, pressure: 0 },
  weather: [{ description: "ไม่ทราบ", icon: "01d" }],
  wind: { speed: 0, deg: 0 },
  name: "ไม่ทราบ",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isTideData = (value: unknown): value is TideData => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.tideStatus === "string" &&
    typeof value.apiStatus === "string" &&
    typeof value.apiStatusMessage === "string" &&
    typeof value.currentWaterLevel === "number"
  );
};

const isWeatherData = (value: unknown): value is WeatherData => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.main) &&
    typeof value.main.temp === "number" &&
    Array.isArray(value.weather) &&
    value.weather.length > 0 &&
    isRecord(value.weather[0]) &&
    typeof value.weather[0].description === "string" &&
    isRecord(value.wind) &&
    typeof value.wind.speed === "number"
  );
};

export default function EnhancedLocationSelector() {
  const latInputId = "lat-input";
  const lonInputId = "lon-input";
  const dateLabelId = "date-label";
  const [selectedLocation, setSelectedLocation] = useState<LocationData>({
    lat: 13.7563,
    lon: 100.5018,
    name: "กรุงเทพมหานคร",
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const alertShown = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [currentTideData, setCurrentTideData] =
    useState<TideData>(defaultTideData);
  const [currentWeatherData, setCurrentWeatherData] =
    useState<WeatherData>(defaultWeatherData);

  // ... existing code ...

  const [nearestPierInfo, setNearestPierInfo] = useState<NearestPier | null>(
    null,
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [disasterAnalysis, setDisasterAnalysis] = useState<DisasterAnalysis | null>(null);
  const [waterLevelComparison, setWaterLevelComparison] = useState<WaterLevelComparison | null>(null);
  const [userElevation, setUserElevation] = useState<number | undefined>(undefined);


  const handleCoordinateChange = (value: string, field: "lat" | "lon") => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setSelectedLocation((prev) => ({
      ...prev,
      [field]: numValue,
      name: `${field === "lat" ? numValue : prev.lat}, ${field === "lon" ? numValue : prev.lon}`,
    }));
  };

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    if (typeof window !== "undefined") {
      localStorage.setItem("lastLocation", JSON.stringify(location));
    }
  };
  // Update nearest pier information
  const updateNearestPier = useCallback(() => {
    const pier = findNearestPier(selectedLocation.lat, selectedLocation.lon);
    if (pier) {
      setNearestPierInfo(pier);
    }
  }, [selectedLocation.lat, selectedLocation.lon]);

  // Enhanced fetch function with better error handling and offline cache support
  const fetchForecastData = useCallback(async () => {
    if (!isHydrated || !selectedLocation) return;

    setLoading(true);
    let cachedTideData: TideData | null = null;
    let cachedWeatherData: WeatherData | null = null;

    try {
      const tideCacheRaw = loadTideDataCache(
        selectedLocation.lat,
        selectedLocation.lon,
        selectedDate,
      );
      if (isTideData(tideCacheRaw)) {
        cachedTideData = tideCacheRaw;
      }

      const weatherCacheRaw = loadWeatherDataCache(
        selectedLocation.lat,
        selectedLocation.lon,
      );
      if (isWeatherData(weatherCacheRaw)) {
        cachedWeatherData = weatherCacheRaw;
      }

      if (cachedTideData && cachedWeatherData) {
        console.log("Loading data from cache...");
        setCurrentTideData({
          ...cachedTideData,
          isFromCache: true,
          apiStatusMessage: "ข้อมูลจากแคช (ออฟไลน์)",
        });
        setCurrentWeatherData(cachedWeatherData);
      }

      const result = await getLocationForecast(
        selectedLocation,
        selectedDate || new Date(),
      );

      if (result?.tideData && result?.weatherData) {
        saveTideDataCache(
          selectedLocation.lat,
          selectedLocation.lon,
          selectedDate || new Date(),
          result.tideData,
        );
        saveWeatherDataCache(
          selectedLocation.lat,
          selectedLocation.lon,
          result.weatherData,
        );

        setCurrentTideData({
          ...result.tideData,
          isFromCache: false,
        });
        setCurrentWeatherData(result.weatherData);
      } else {
        const fallbackMessage = result?.error || "ไม่พบข้อมูล";

        if (cachedTideData) {
          setCurrentTideData({
            ...cachedTideData,
            isFromCache: true,
            apiStatusMessage: "ข้อมูลจากแคช (API ล้มเหลว)",
          });
        } else {
          setCurrentTideData({
            ...defaultTideData,
            apiStatus: "error",
            apiStatusMessage: fallbackMessage,
            lastUpdated: new Date().toISOString(),
          });
        }
        setCurrentWeatherData(defaultWeatherData);
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);

      if (!cachedTideData) {
        const tideCacheRaw = loadTideDataCache(
          selectedLocation.lat,
          selectedLocation.lon,
          selectedDate,
        );
        if (isTideData(tideCacheRaw)) {
          cachedTideData = tideCacheRaw;
        }
      }

      if (!cachedWeatherData) {
        const weatherCacheRaw = loadWeatherDataCache(
          selectedLocation.lat,
          selectedLocation.lon,
        );
        if (isWeatherData(weatherCacheRaw)) {
          cachedWeatherData = weatherCacheRaw;
        }
      }

      if (cachedTideData && cachedWeatherData) {
        console.log("Network error - using cached data");
        setCurrentTideData({
          ...cachedTideData,
          isFromCache: true,
          apiStatusMessage: "ข้อมูลจากแคช (เครือข่ายอื่น)",
        });
        setCurrentWeatherData(cachedWeatherData);
      } else {
        const fallbackMessage =
          error instanceof Error && error.message
            ? error.message
            : "ไม่สามารถโหลดข้อมูลได้";
        setCurrentTideData({
          ...defaultTideData,
          apiStatus: "error",
          apiStatusMessage: fallbackMessage,
          lastUpdated: new Date().toISOString(),
        });
        setCurrentWeatherData(defaultWeatherData);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, selectedDate, isHydrated]);

  // Enhanced geolocation function with IP fallback
  const getCurrentLocation = useCallback(async () => {
    if (typeof window === "undefined") return;

    setGettingLocation(true);
    setGeoError(null);

    try {
      // Try browser geolocation first with short timeout
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 5000, // Short 5 second timeout
              maximumAge: 120000,
            });
          },
        );

        const newLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          name: "ตำแหน่งปัจจุบัน (GPS)",
        };

        setSelectedLocation(newLocation);
        localStorage.setItem("lastLocation", JSON.stringify(newLocation));

        setTimeout(() => {
          if (isHydrated) {
            fetchForecastData();
          }
        }, 100);

        setGettingLocation(false);
        return; // Success!
      } catch {
        console.log("Browser geolocation failed, trying IP geolocation...");
      }

      // Fallback to IP geolocation API
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("IP API failed");

        const data = await response.json();

        if (data.latitude && data.longitude) {
          const newLocation = {
            lat: data.latitude,
            lon: data.longitude,
            name: `ตำแหน่งโดยประมาณ (${data.city || data.region || "IP"})`,
          };

          setSelectedLocation(newLocation);
          localStorage.setItem("lastLocation", JSON.stringify(newLocation));

          setTimeout(() => {
            if (isHydrated) {
              fetchForecastData();
            }
          }, 100);

          setGettingLocation(false);
          return; // Success with IP!
        }
      } catch {
        console.log("IP geolocation failed, using Bangkok default...");
      }

      // Final fallback: Bangkok
      const bangkokLocation = {
        lat: 13.7563,
        lon: 100.5018,
        name: "กรุงเทพมหานคร (ค่าพื้นฐาน)",
      };

      setSelectedLocation(bangkokLocation);
      localStorage.setItem("lastLocation", JSON.stringify(bangkokLocation));

      setTimeout(() => {
        if (isHydrated) {
          fetchForecastData();
        }
      }, 100);

    } catch (error) {
      console.error("All geolocation methods failed:", error);
      setGeoError("ไม่สามารถหาตำแหน่งได้ กรุณาใช้แผนที่หรือใส่พิกัดเอง");
    } finally {
      setGettingLocation(false);
    }
  }, [isHydrated, fetchForecastData]);
  // Initialize on hydration
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      // Initialize offline storage
      initializeOfflineStorage();

      const savedLocation = localStorage.getItem("lastLocation");

      if (savedLocation) {
        try {
          setSelectedLocation(JSON.parse(savedLocation));
        } catch (error) {
          console.error("Error parsing saved location:", error);
        }
      }
    }
  }, []);

  // Fetch data when dependencies change (live updates)
  useEffect(() => {
    fetchForecastData();
  }, [fetchForecastData]);

  // Update nearest pier and cache stats when location changes
  useEffect(() => {
    if (isHydrated) {
      updateNearestPier();

      // Fetch user elevation when locations changes
      getElevation(selectedLocation.lat, selectedLocation.lon).then(data => {
        if (data) {
          setUserElevation(data.elevation);
        } else {
          setUserElevation(undefined);
        }
      });
    }
  }, [
    selectedLocation.lat,
    selectedLocation.lon,
    isHydrated,
    updateNearestPier,
  ]);

  // Update water level comparison when tide data or location changes
  useEffect(() => {
    if (isHydrated && currentTideData && currentTideData.currentWaterLevel > 0) {
      const comparison = compareWaterLevel(
        selectedLocation.lat,
        selectedLocation.lon,
        currentTideData.currentWaterLevel,
        userElevation // Pass user elevation
      );
      setWaterLevelComparison(comparison);
    }
  }, [
    selectedLocation.lat,
    selectedLocation.lon,
    currentTideData.currentWaterLevel,
    userElevation, // Add dependency
    isHydrated,
  ]);



  // Auto-refresh when location coordinates change
  useEffect(() => {
    if (isHydrated) {
      const timeoutId = setTimeout(() => {
        fetchForecastData();
      }, 500); // Debounce for 500ms to avoid too many requests
      return () => clearTimeout(timeoutId);
    }
  }, [
    selectedLocation.lat,
    selectedLocation.lon,
    isHydrated,
    fetchForecastData,
  ]);

  // Real-time updates when critical factors change
  useEffect(() => {
    if (isHydrated && currentWeatherData?.wind?.speed) {
      const windSpeed = currentWeatherData.wind.speed;

      // Alert for high wind speeds (potential storm)
      if (windSpeed > 10 && !alertShown.current) {
        alertShown.current = true;
        console.warn(
          `ตรวจพบความเร็วลมสูง ${windSpeed} m/s อาจมีพายุกำลังเข้ามา`,
        );
        setTimeout(() => {
          alertShown.current = false;
        }, 300000); // Reset after 5 minutes
      }
    }
  }, [currentWeatherData?.wind?.speed, isHydrated]);

  // Real-time tide level monitoring
  useEffect(() => {
    if (isHydrated && currentTideData?.currentWaterLevel) {
      const waterLevel = currentTideData.currentWaterLevel;

      // Alert for dangerously high water levels
      if (waterLevel > 2.5 && !alertShown.current) {
        alertShown.current = true;
        console.warn(
          `ตรวจพบระดับน้ำสูงผิดปกติ ${waterLevel.toFixed(2)} ม. อาจเกิดน้ำท่วม`,
        );
        setTimeout(() => {
          alertShown.current = false;
        }, 300000); // Reset after 5 minutes
      }
    }
  }, [currentTideData?.currentWaterLevel, isHydrated]);

  // Auto-refresh based on tide cycle changes
  useEffect(() => {
    if (isHydrated && currentTideData?.tideStatus) {
      const tideStatus = currentTideData.tideStatus;

      // More frequent updates during spring tides
      const refreshInterval =
        tideStatus === "น้ำเป็น" ? 15 * 60 * 1000 : 30 * 60 * 1000; // 15 or 30 minutes

      const intervalId = setInterval(() => {
        fetchForecastData();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [currentTideData?.tideStatus, fetchForecastData, isHydrated]);

  // Analyze disaster risk when tide or weather data changes
  useEffect(() => {
    if (isHydrated && currentTideData && currentWeatherData && currentTideData.apiStatus !== 'error') {
      try {
        const analysis = analyzeDisasterRisk(
          currentTideData,
          currentWeatherData,
          selectedDate || new Date(),
          selectedLocation.name
        );
        setDisasterAnalysis(analysis);
      } catch (error) {
        console.error('Error analyzing disaster risk:', error);
        setDisasterAnalysis(null);
      }
    }
  }, [currentTideData, currentWeatherData, selectedDate, selectedLocation.name, isHydrated]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" aria-label="ตัวเลือกตำแหน่งและเวลา" role="region">

      {/* Water Level Hero - Top Priority */}
      {!loading && currentTideData.apiStatus !== 'error' && (
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 text-white">
          {/* Main Water Level Display */}
          <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Location Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium text-blue-100">
                    {selectedLocation.name || `${selectedLocation.lat.toFixed(4)}°, ${selectedLocation.lon.toFixed(4)}°`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-100">
                  <Clock className="w-4 h-4" />
                  {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Large Water Level Display */}
              <div className="text-center py-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Waves className="w-8 h-8 md:w-10 md:h-10" />
                  <span className="text-lg md:text-xl font-medium text-blue-100">ระดับน้ำปัจจุบัน</span>
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight">
                    {currentTideData.currentWaterLevel?.toFixed(2) || "0.00"}
                  </span>
                  <span className="text-2xl md:text-3xl font-bold text-blue-200">เมตร</span>
                </div>
                <p className="text-sm text-blue-200 mt-2">
                  {currentTideData.waterLevelStatus || "กำลังวิเคราะห์"}
                </p>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {/* High Tide */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-blue-100" style={{ fontSize: '16px' }}>น้ำขึ้นสูง</span>
                  </div>
                  <div className="text-xl md:text-2xl font-bold">
                    {currentTideData.highTideTime || "--:--"}
                  </div>
                </div>

                {/* Low Tide */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-blue-100" style={{ fontSize: '16px' }}>น้ำลงต่ำ</span>
                  </div>
                  <div className="text-xl md:text-2xl font-bold">
                    {currentTideData.lowTideTime || "--:--"}
                  </div>
                </div>

                {/* Temperature */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Thermometer className="w-4 h-4" />
                    <span className="text-blue-100" style={{ fontSize: '16px' }}>อุณหภูมิ</span>
                  </div>
                  <div className="text-xl md:text-2xl font-bold">
                    {Math.round(currentWeatherData?.main?.temp || 0)}°C
                  </div>
                </div>

                {/* Tide Status */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Moon className="w-4 h-4" />
                    <span className="text-blue-100" style={{ fontSize: '16px' }}>สถานะ</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold">
                    {currentTideData.tideStatus === "น้ำเป็น" ? "น้ำเป็น" : "น้ำตาย"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection Area - Compact Controls */}
      <div className="p-4 md:p-6 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900/30 dark:to-slate-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Location Controls - Compact */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-blue-100 dark:border-slate-700 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">ตำแหน่ง</h3>
                </div>

                {/* Current Location Display */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-slate-900/50 rounded-xl border border-blue-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">ตำแหน่งที่เลือก</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {selectedLocation.name || `${selectedLocation.lat.toFixed(4)}°, ${selectedLocation.lon.toFixed(4)}°`}
                  </p>
                </div>

                {/* Location Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsMapDialogOpen(true)}
                    className="h-12 border-blue-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <Map className="w-4 h-4 mr-2 text-blue-500" />
                    แผนที่
                  </Button>
                  <Button
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="h-12 border-blue-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {gettingLocation ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4 mr-2 text-blue-500" />
                    )}
                    ปัจจุบัน
                  </Button>
                </div>

                {/* Update Button */}
                <Button
                  onClick={fetchForecastData}
                  disabled={loading}
                  className="w-full h-12 mt-4 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 dark:shadow-blue-900/20"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-5 w-5 mr-2" />
                  )}
                  {loading ? "กำลังโหลด..." : "อัปเดตข้อมูล"}
                </Button>
              </div>
            </div>

            {/* Calendar - Inline Display */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-blue-100 dark:border-slate-700 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">เลือกวันที่</h3>
                  </div>
                  {/* Today Indicator */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      วันนี้: {format(new Date(), "d MMM", { locale: th })}
                    </div>
                  </div>
                </div>

                {/* Inline Calendar with Loading State */}
                <div className="flex justify-center relative">
                  {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 rounded-xl flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">กำลังโหลดข้อมูล...</span>
                      </div>
                    </div>
                  )}
                  <Calendar
                    mode="single"
                    selected={selectedDate || new Date()}
                    onSelect={(date) => setSelectedDate(date)}
                    locale={th}
                    className="rounded-xl border border-slate-100 dark:border-slate-700"
                    modifiers={{
                      selected: selectedDate || new Date(),
                      today: new Date()
                    }}
                    modifiersStyles={{
                      selected: {
                        backgroundColor: 'rgb(34 197 94)',
                        color: 'white',
                        fontWeight: 'bold'
                      },
                      today: {
                        border: '2px solid rgb(59 130 246)',
                        borderRadius: '8px'
                      }
                    }}
                  />
                </div>

                {/* Selected Date Badge */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">วันที่เลือก:</span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-semibold text-sm flex items-center gap-2">
                    {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                    {selectedDate ? format(selectedDate, "PPPP", { locale: th }) : format(new Date(), "PPPP", { locale: th }) + " (วันนี้)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section - Responsive Dashboard */}
      <Tabs
        defaultValue="forecast"
        className="w-full mt-8"
        aria-label="แผงควบคุมพยากรณ์และสถานะระบบ"
      >
        <TabsList
          className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 h-auto bg-blue-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-blue-100 dark:border-slate-700"
          role="tablist"
          aria-label="เลือกประเภทข้อมูล"
        >
          <TabsTrigger
            value="forecast"
            className="flex items-center gap-2 py-3"
            aria-describedby="forecast-tab-description"
          >
            <Waves className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">พยากรณ์</span>วันนี้
          </TabsTrigger>
          <TabsTrigger
            value="multiday"
            className="flex items-center gap-2 py-3"
            aria-describedby="multiday-tab-description"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">พยากรณ์</span>7 วัน
          </TabsTrigger>
          <TabsTrigger
            value="riskmap"
            className="flex items-center gap-2 py-3"
            aria-describedby="riskmap-tab-description"
          >
            <Map className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">แผนที่</span>เสี่ยง
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="flex items-center gap-2 py-3"
            aria-describedby="status-tab-description"
          >
            <Activity className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">สถานะ</span>ระบบ
          </TabsTrigger>
        </TabsList>

        {/* Hidden descriptions for screen readers */}
        <div id="forecast-tab-description" className="sr-only">
          แสดงข้อมูลพยากรณ์น้ำขึ้นน้ำลง สภาพอากาศ และกราฟแสดงระดับน้ำทั้งวัน
        </div>
        <div id="multiday-tab-description" className="sr-only">
          แสดงพยากรณ์น้ำขึ้นน้ำลงล่วงหน้า 7 วัน พร้อมระดับความเสี่ยง
        </div>
        <div id="riskmap-tab-description" className="sr-only">
          แสดงแผนที่พื้นที่เสี่ยงภัยและประวัติเหตุการณ์ภัยพิบัติ
        </div>
        <div id="status-tab-description" className="sr-only">
          แสดงสถานะการทำงานของ API และสุขภาพระบบ
        </div>

        <TabsContent
          value="forecast"
          className="space-y-6"
          role="tabpanel"
          aria-labelledby="forecast-tab"
          tabIndex={0}
        >
          <div className="space-y-6">
            {loading ? (
              <Card className="shadow-xl">
                <CardContent className="flex flex-col items-center justify-center py-16 px-8">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Waves className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    กำลังโหลดข้อมูล...
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
                    กำลังดึงข้อมูลน้ำขึ้นน้ำลงและสภาพอากาศสำหรับ{" "}
                    {selectedLocation.name}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Current Status Hero Banner - Enhanced */}
                <Card className="relative overflow-hidden shadow-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-sky-600 text-white border-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  <div className="absolute inset-0 overflow-hidden opacity-20">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-300 rounded-full blur-3xl"></div>
                  </div>
                  <CardContent
                    className="relative py-10 md:py-12 px-6 md:px-8"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      {/* Left: Main Water Level Display */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md hover:bg-white/30 transition-all duration-300">
                            <Waves className="h-8 w-8" aria-hidden="true" />
                          </div>
                          <div>
                            <h2 className="text-xl md:text-2xl font-bold">
                              ระดับน้ำปัจจุบัน
                            </h2>
                            <p className="text-blue-100 text-sm md:text-base font-medium">
                              {currentTideData.waterLevelStatus ||
                                "กำลังวิเคราะห์"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <div className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight">
                            {currentTideData.currentWaterLevel?.toFixed(2)}
                          </div>
                          <div className="text-2xl md:text-3xl font-bold pb-3">
                            เมตร
                          </div>
                        </div>
                      </div>

                      {/* Right: Tide Status & Time */}
                      <div className="grid grid-cols-2 gap-4 lg:text-right">
                        {/* Current Time */}
                        <div className="lg:col-span-2 flex items-center justify-center lg:justify-end gap-3 px-4 py-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300">
                          <Clock className="h-5 w-5" aria-hidden="true" />
                          <div>
                            <div className="text-xs text-blue-100">
                              เวลาปัจจุบัน
                            </div>
                            <div className="text-lg md:text-xl font-bold">
                              {new Date().toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>

                        {/* High Tide */}
                        <div className="px-4 py-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300 text-center">
                          <div className="flex justify-center mb-1">
                            <TrendingUp className="w-7 h-7" />
                          </div>
                          <div className="text-xs text-blue-100 font-medium">
                            น้ำขึ้นสูง
                          </div>
                          <div className="text-lg md:text-xl font-bold">
                            {currentTideData.highTideTime || "--:--"}
                          </div>
                        </div>

                        {/* Low Tide */}
                        <div className="px-4 py-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300 text-center">
                          <div className="flex justify-center mb-1">
                            <TrendingDown className="w-7 h-7" />
                          </div>
                          <div className="text-xs text-blue-100 font-medium">
                            น้ำลงต่ำ
                          </div>
                          <div className="text-lg md:text-xl font-bold">
                            {currentTideData.lowTideTime || "--:--"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Tide Status */}
                      <div className="text-center">
                        <div className="text-xs text-blue-100 font-medium mb-1">
                          สถานะน้ำ
                        </div>
                        <div className="text-lg md:text-xl font-bold">
                          {currentTideData.tideStatus === "น้ำเป็น"
                            ? "น้ำเป็น"
                            : "น้ำตาย"}
                        </div>
                      </div>
                      {/* Lunar Phase */}
                      <div className="text-center">
                        <div className="text-xs text-blue-100 font-medium mb-1">
                          ข้างจันทร์
                        </div>
                        <div className="text-lg md:text-xl font-bold">
                          {currentTideData.lunarPhaseKham}{" "}
                          {currentTideData.isWaxingMoon ? "ขึ้น" : "แรม"}
                        </div>
                      </div>
                      {/* Location */}
                      <div className="text-center">
                        <div className="text-xs text-blue-100 font-medium mb-1">
                          พิกัด
                        </div>
                        <div className="text-sm md:text-base font-sans font-bold truncate">
                          {selectedLocation.lat.toFixed(2)}° N
                        </div>
                      </div>
                      {/* Reference */}
                      <div className="text-center">
                        <div className="text-xs text-blue-100 font-medium mb-1">
                          สถานะ API
                        </div>
                        <div className="inline-flex items-center gap-1">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              currentTideData.apiStatus === "success"
                                ? "bg-green-400"
                                : currentTideData.apiStatus === "loading"
                                  ? "bg-yellow-400 animate-pulse"
                                  : "bg-red-400",
                            )}
                          />
                          <span className="text-xs font-bold">
                            {currentTideData.apiStatus === "success"
                              ? "ปกติ"
                              : "ตรวจสอบ"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Metrics Grid - Responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {/* High Tide Card */}
                  <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl">
                          <ArrowUp
                            className="h-6 w-6 text-red-600 dark:text-red-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-red-700 dark:text-red-300">
                            {currentTideData.tideEvents
                              .find((e) => e.type === "high")
                              ?.level.toFixed(1) || "--"}
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400">
                            เมตร
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        น้ำขึ้นสูงสุด
                      </h3>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {currentTideData.highTideTime || "--:--"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Low Tide Card */}
                  <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                          <ArrowDown
                            className="h-6 w-6 text-blue-600 dark:text-blue-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-blue-700 dark:text-blue-300">
                            {currentTideData.tideEvents
                              .find((e) => e.type === "low")
                              ?.level.toFixed(1) || "--"}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            เมตร
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        น้ำลงต่ำสุด
                      </h3>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {currentTideData.lowTideTime || "--:--"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Lunar Phase Card */}
                  <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-900/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
                          <Moon
                            className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-yellow-700 dark:text-yellow-300">
                            {currentTideData.lunarPhaseKham}
                          </div>
                          <div className="text-xs text-yellow-600 dark:text-yellow-400">
                            ค่ำ
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        ข้างดวงจันทร์
                      </h3>
                      <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                        {currentTideData.isWaxingMoon ? "ขึ้น" : "แรม"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Tide Status Card */}
                  <Card className="shadow-lg hover:shadow-xl transition-all duration-200 border-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-900/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                          <Activity
                            className="h-6 w-6 text-purple-600 dark:text-purple-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="text-right">
                          <div className="p-2 bg-white/10 rounded-lg inline-flex">
                            <Waves className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        สถานะน้ำขึ้นลง
                      </h3>
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                        {currentTideData.tideStatus === "น้ำเป็น"
                          ? "น้ำเป็น"
                          : "น้ำตาย"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Weather Information - Enhanced */}
                {currentWeatherData && currentWeatherData.main && (
                  <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                          <Thermometer
                            className="h-6 w-6 text-green-600 dark:text-green-400"
                            aria-hidden="true"
                          />
                        </div>
                        สภาพอากาศ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                              <Thermometer className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {Math.round(currentWeatherData.main.temp)}°C
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            อุณหภูมิ
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                              <Sun className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {Math.round(currentWeatherData.main.feels_like)}°C
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            รู้สึกเหมือน
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                              <Droplet className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {currentWeatherData.main.humidity}%
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            ความชื้น
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                              <Wind className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {currentWeatherData.wind?.speed || 0} m/s
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            ความเร็วลม
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Disaster Risk Analysis Alert */}
                {disasterAnalysis && (
                  <DisasterAlert analysis={disasterAnalysis} />
                )}

                {/* Flood Warning Banner - แสดงเมื่อระดับน้ำสูงกว่าปกติ */}
                {waterLevelComparison && (waterLevelComparison.status === "warning" || waterLevelComparison.status === "critical") && (
                  <div className={cn(
                    "p-4 rounded-xl border shadow-lg animate-pulse",
                    waterLevelComparison.status === "critical"
                      ? "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700"
                      : "bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700"
                  )}>
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        waterLevelComparison.status === "critical"
                          ? "bg-red-100 dark:bg-red-800"
                          : "bg-orange-100 dark:bg-orange-800"
                      )}>
                        <AlertCircle className={cn(
                          "h-6 w-6",
                          waterLevelComparison.status === "critical"
                            ? "text-red-600 dark:text-red-400"
                            : "text-orange-600 dark:text-orange-400"
                        )} />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-bold text-lg",
                          waterLevelComparison.status === "critical"
                            ? "text-red-800 dark:text-red-200"
                            : "text-orange-800 dark:text-orange-200"
                        )}>
                          {waterLevelComparison.status === "critical" ? "🚨 แจ้งเตือนวิกฤต!" : "⚠️ แจ้งเตือน"}
                        </h3>
                        <p className={cn(
                          "text-sm mt-1",
                          waterLevelComparison.status === "critical"
                            ? "text-red-700 dark:text-red-300"
                            : "text-orange-700 dark:text-orange-300"
                        )}>
                          {waterLevelComparison.statusText}
                        </p>

                        {/* Elevation Context */}
                        {waterLevelComparison.groundElevation !== undefined && (
                          <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg text-xs">
                            <p>🏔 พื้นที่สูงจากทะเล: <b>{waterLevelComparison.groundElevation.toFixed(2)} ม.</b> (MSL)</p>
                            <p>💧 ระดับน้ำทะเล: <b>{waterLevelComparison.currentLevel.toFixed(2)} ม.</b> (MSL)</p>
                          </div>
                        )}

                        {waterLevelComparison.referencePoint && waterLevelComparison.groundElevation === undefined && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            📍 จุดอ้างอิง: {waterLevelComparison.referencePoint.name} ({waterLevelComparison.distanceKm.toFixed(1)} กม.)
                          </p>
                        )}
                        {waterLevelComparison.groundElevation === undefined && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            ระดับน้ำปัจจุบัน: {waterLevelComparison.currentLevel.toFixed(2)} ม. | MSL อ้างอิง: {waterLevelComparison.referenceLevel.toFixed(2)} ม.
                          </p>
                        )}

                      </div>
                    </div>
                  </div>
                )}


                {/* Quick Actions Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      ดำเนินการด่วน
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      แชร์ข้อมูลหรือคัดลอกพิกัด
                    </p>
                  </div>
                  <QuickActions
                    location={selectedLocation}
                    tideData={currentTideData}
                  />
                </div>

                {/* Weather Trends */}
                {currentWeatherData && currentWeatherData.main.temp > 0 && (
                  <WeatherTrends weatherData={currentWeatherData} />
                )}

                {/* Nearest Pier Information Card */}
                {nearestPierInfo && (
                  <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-950/30 dark:via-red-950/30 dark:to-pink-950/30">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                          <Anchor
                            className="h-6 w-6 text-orange-600 dark:text-orange-400"
                            aria-hidden="true"
                          />
                        </div>
                        ท่าเรือที่ใกล้ที่สุด
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pier Info Left */}
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              ชื่อท่าเรือ
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {nearestPierInfo.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                              <Radio className="h-4 w-4" />
                              ประเภท
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">
                                {getPierTypeIcon(nearestPierInfo.type)}
                              </span>
                              <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
                                {getPierTypeText(nearestPierInfo.type)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              จังหวัด
                            </div>
                            <div className="text-base font-semibold text-gray-700 dark:text-gray-300">
                              {nearestPierInfo.region}
                            </div>
                          </div>
                        </div>

                        {/* Pier Distance Right */}
                        <div className="space-y-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                              <TrendingDown className="h-4 w-4" />
                              ระยะห่าง
                            </div>
                            <div className="flex items-baseline gap-2 mb-3">
                              <div className="text-4xl font-black text-orange-600 dark:text-orange-400">
                                {nearestPierInfo.distance.toFixed(1)}
                              </div>
                              <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                                กม.
                              </div>
                            </div>
                            <Badge
                              className={cn(
                                "px-3 py-1.5 text-sm font-semibold",
                                getDistanceCategoryColor(
                                  getDistanceCategory(
                                    nearestPierInfo.distance,
                                  ),
                                ),
                              )}
                            >
                              {getDistanceCategoryText(
                                getDistanceCategory(nearestPierInfo.distance),
                              )}
                            </Badge>
                          </div>

                          {/* Coordinates */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                              พิกัด
                            </div>
                            <div className="font-sans text-sm text-gray-700 dark:text-gray-300">
                              <div>{nearestPierInfo.lat.toFixed(4)}° N</div>
                              <div>{nearestPierInfo.lon.toFixed(4)}° E</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cache Status Badge */}
                      {currentTideData.isFromCache && (
                        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700/50 rounded-lg flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                            {currentTideData.apiStatusMessage}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Hero Status Display - Clear & Focused */}
                <div className="mb-6">
                  <TideStatusHero
                    status={currentTideData.waterLevelStatus}
                    currentLevel={currentTideData.currentWaterLevel}
                    nextEvent={(() => {
                      if (!currentTideData.tideEvents) return undefined;
                      const now = new Date();
                      const currentMinutes = now.getHours() * 60 + now.getMinutes();
                      const next = currentTideData.tideEvents.find(e => {
                        const [h, m] = e.time.split(':').map(Number);
                        return (h * 60 + m) > currentMinutes;
                      });
                      return next ? {
                        type: next.type,
                        time: next.time,
                        level: next.level
                      } : undefined;
                    })()}
                    dataSource={currentTideData.dataSource}
                  />
                </div>

                {/* Consolidated Water Level Experience */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">
                      กราฟระดับน้ำ (24 ชั่วโมง)
                    </h3>
                  </div>
                  {currentTideData.graphData &&
                    currentTideData.graphData.length > 0 && (
                      <WaterLevelGraph tideData={currentTideData} location={selectedLocation} />
                    )}
                </div>

                {/* Status Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        currentTideData.apiStatus === "success"
                          ? "bg-green-500"
                          : currentTideData.apiStatus === "loading"
                            ? "bg-yellow-500 animate-pulse"
                            : "bg-red-500",
                      )}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {currentTideData.apiStatusMessage}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    อัปเดตล่าสุด:{" "}
                    {new Date(currentTideData.lastUpdated).toLocaleString(
                      "th-TH",
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Multi-Day Forecast Tab */}
        <TabsContent
          value="multiday"
          className="space-y-6"
          role="tabpanel"
          aria-labelledby="multiday-tab"
          tabIndex={0}
        >
          <MultiDayForecast currentLocation={selectedLocation} />
        </TabsContent>

        {/* Risk Map Tab */}
        <TabsContent
          value="riskmap"
          className="space-y-6"
          role="tabpanel"
          aria-labelledby="riskmap-tab"
          tabIndex={0}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskAreaMap
              currentLocation={selectedLocation}
              onLocationSelect={(lat, lon) => {
                setSelectedLocation({
                  lat,
                  lon,
                  name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                });
              }}
            />
            <HistoricalEventsPanel currentLocation={selectedLocation} />
          </div>
        </TabsContent>

        <TabsContent
          value="status"
          className="space-y-6"
          role="tabpanel"
          aria-labelledby="status-tab"
          tabIndex={0}
        >
          {/* Theme Toggle in header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">ตั้งค่าและสถานะระบบ</h2>
            <ThemeToggle />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <ApiStatusDashboard
                tideApiStatus={currentTideData.apiStatus}
                weatherApiStatus="success"
                lastUpdated={currentTideData.lastUpdated}
                onRefresh={fetchForecastData}
              />

              <SettingsPanel />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <FavoriteLocations
                currentLocation={selectedLocation}
                onSelectLocation={(loc) => {
                  setSelectedLocation(loc);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("lastLocation", JSON.stringify(loc));
                  }
                }}
              />

              <SafetyTips currentRiskLevel={disasterAnalysis?.riskLevel || "low"} />
            </div>
          </div>
        </TabsContent>
      </Tabs >

      {/* Map selector dialog */}
      <MapSelector
        isOpen={isMapDialogOpen}
        currentLocation={selectedLocation}
        onSelectLocationAction={(newLocation: LocationData) => {
          setSelectedLocation(newLocation);
          if (typeof window !== "undefined") {
            localStorage.setItem("lastLocation", JSON.stringify(newLocation));
          }
          setIsMapDialogOpen(false);
        }}
        onCloseAction={() => setIsMapDialogOpen(false)}
      />
    </div >
  );
}
