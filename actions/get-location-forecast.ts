"use server";

import type { LocationData } from "@/lib/tide-service";
import { fetchForecast, type ForecastResult } from "@/lib/services/forecast";

export type { ForecastResult };

export async function getLocationForecast(
  location: LocationData,
  date: Date = new Date(),
): Promise<ForecastResult> {
  return fetchForecast(location, { date });
}
