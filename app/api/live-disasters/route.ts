// app/api/live-disasters/route.ts

import { NextResponse } from "next/server";
import { fetchLatestDisasters } from "@/lib/disaster-data-service";

export const GET = async () => {
    const data = await fetchLatestDisasters();
    return NextResponse.json(data);
};
