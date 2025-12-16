"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Map as PigeonMap, Marker, Overlay } from "pigeon-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    AlertTriangle,
    Info,
    Waves,
    Wind,
    CloudRain,
    ChevronDown,
    ChevronUp,
    Calendar,
    Users,
    X,
    Activity,
    Droplets
} from "lucide-react";
import {
    getAllRiskZones,
    getAllEvents,
    getZoneSeasonalRisk,
    getEventsForZone,
    getRiskZoneForLocation,
    getEventTypeThai,
    getSeverityThai,
    getSeverityColor,
    type RiskZone,
    type HistoricalEvent,
} from "@/lib/historical-data-service";
import { cn } from "@/lib/utils";
import { getRealTimeWaterLevels, type ThaiWaterLevel } from "@/lib/thaiwater-service";

interface RiskAreaMapProps {
    currentLocation: { lat: number; lon: number; name: string };
    onLocationSelect?: (lat: number, lon: number) => void;
    className?: string;
}

// Custom SVG Overlay for Risk Zones
// Pigeon Map passes these props to children: width, height, latLngToPixel, pixelToLatLng
interface RiskZoneLayerProps {
    zones: RiskZone[];
    onZoneClick: (zone: RiskZone) => void;
    selectedZoneId?: string;
    width?: number;
    height?: number;
    latLngToPixel?: (latLng: [number, number]) => [number, number];
}

function RiskZoneLayer({
    zones,
    onZoneClick,
    selectedZoneId,
    width,
    height,
    latLngToPixel
}: RiskZoneLayerProps) {
    if (!width || !height || !latLngToPixel) return null;

    return (
        <svg
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 10 }}
        >
            {zones.map(zone => {
                if (!zone.bounds) return null;

                // Calculate pixel coordinates for the bounding box
                const nw = latLngToPixel([zone.bounds.maxLat, zone.bounds.minLon]);
                const se = latLngToPixel([zone.bounds.minLat, zone.bounds.maxLon]);

                const x = nw[0];
                const y = nw[1];
                const boxWidth = se[0] - nw[0];
                const boxHeight = se[1] - nw[1];

                const currentRisk = getZoneSeasonalRisk(zone);
                const fillColor = {
                    high: "rgba(239, 68, 68, 0.2)",
                    medium: "rgba(245, 158, 11, 0.2)",
                    low: "rgba(34, 197, 94, 0.15)",
                }[currentRisk];

                const strokeColor = {
                    high: "rgba(239, 68, 68, 0.8)",
                    medium: "rgba(245, 158, 11, 0.8)",
                    low: "rgba(34, 197, 94, 0.8)",
                }[currentRisk];

                const isSelected = selectedZoneId === zone.id;

                return (
                    <g key={zone.id} onClick={() => onZoneClick(zone)} style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                        <rect
                            x={x}
                            y={y}
                            width={boxWidth}
                            height={boxHeight}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 3 : 1}
                            rx={8}
                            className="transition-all duration-300 hover:opacity-80"
                        />
                        {/* Zone Label - Centered */}
                        <text
                            x={x + boxWidth / 2}
                            y={y + boxHeight / 2}
                            textAnchor="middle"
                            fill={strokeColor}
                            fontSize="12"
                            fontWeight="bold"
                            style={{ textShadow: '0px 0px 3px rgba(255,255,255,0.8)' }}
                        >
                            {zone.name}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// Event marker component
function EventMarker({
    event,
    onClick,
    isSelected,
}: {
    event: HistoricalEvent;
    onClick: () => void;
    isSelected: boolean;
}) {
    const color = getSeverityColor(event.severity);

    return (
        <Marker
            anchor={[event.location.lat, event.location.lon]}
            onClick={onClick}
        >
            <div
                className={cn(
                    "w-3 h-3 rounded-full border border-white shadow-sm cursor-pointer transition-all hover:scale-150 transform",
                    isSelected && "scale-150 ring-2 ring-blue-400 z-50",
                    !isSelected && "opacity-80"
                )}
                style={{ backgroundColor: color }}
            />
        </Marker>
    );
}

// Live Station Marker
function StationMarker({
    station,
    onClick,
}: {
    station: ThaiWaterLevel;
    onClick: () => void;
}) {
    return (
        <Marker
            anchor={[station.lat, station.lon]}
            onClick={onClick}
        >
            <div className="relative group cursor-pointer z-20">
                <div className="absolute -top-8 -left-6 bg-white dark:bg-slate-800 px-2 py-1 rounded text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                    {station.water_level.toFixed(2)} ม.
                </div>
                <div className="w-5 h-5 rounded-sm bg-blue-500 border-2 border-white shadow-md flex items-center justify-center transform rotate-45 hover:scale-125 transition-transform">
                    <Droplets className="w-3 h-3 text-white transform -rotate-45" />
                </div>
            </div>
        </Marker>
    );
}

// Zone detail panel
function ZoneDetailPanel({
    zone,
    onClose,
}: {
    zone: RiskZone;
    onClose: () => void;
}) {
    const [showEvents, setShowEvents] = useState(true);
    const currentRisk = getZoneSeasonalRisk(zone);
    const events = getEventsForZone(zone.id);

    const riskColorClass = {
        high: "text-red-600 bg-red-100 dark:bg-red-900/30",
        medium: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
        low: "text-green-600 bg-green-100 dark:bg-green-900/30",
    }[currentRisk];

    return (
        <Card className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-auto shadow-xl z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            {zone.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {zone.description}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Risk Level */}
                <div className={cn("p-3 rounded-lg", riskColorClass)}>
                    <div className="flex items-center justify-between">
                        <span className="font-medium">ความเสี่ยงปัจจุบัน</span>
                        <Badge
                            variant="outline"
                            className={cn(
                                "font-bold",
                                currentRisk === "high" && "border-red-500 text-red-600",
                                currentRisk === "medium" && "border-amber-500 text-amber-600",
                                currentRisk === "low" && "border-green-500 text-green-600"
                            )}
                        >
                            {currentRisk === "high" ? "สูง" : currentRisk === "medium" ? "ปานกลาง" : "ต่ำ"}
                        </Badge>
                    </div>
                </div>

                {/* Monsoon Risks */}
                <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                        <Wind className="h-4 w-4" />
                        ความเสี่ยงตามฤดูมรสุม
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        {/* Similar to existing implementation... shortened for brevity in replacement but keeping core logic */}
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-center">
                            <div className="text-muted-foreground scale-90">ต.ต.เฉียงใต้</div>
                            <div className={cn("font-bold mt-1", zone.monsoonRisk.southwest === "high" ? "text-red-600" : zone.monsoonRisk.southwest === "medium" ? "text-amber-600" : "text-green-600")}>
                                {zone.monsoonRisk.southwest === "high" ? "สูง" : zone.monsoonRisk.southwest === "medium" ? "กลาง" : "ต่ำ"}
                            </div>
                        </div>
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-center">
                            <div className="text-muted-foreground scale-90">ต.อ.เฉียงเหนือ</div>
                            <div className={cn("font-bold mt-1", zone.monsoonRisk.northeast === "high" ? "text-red-600" : zone.monsoonRisk.northeast === "medium" ? "text-amber-600" : "text-green-600")}>
                                {zone.monsoonRisk.northeast === "high" ? "สูง" : zone.monsoonRisk.northeast === "medium" ? "กลาง" : "ต่ำ"}
                            </div>
                        </div>
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-center">
                            <div className="text-muted-foreground scale-90">เปลี่ยนผ่าน</div>
                            <div className={cn("font-bold mt-1", zone.monsoonRisk.transition === "high" ? "text-red-600" : zone.monsoonRisk.transition === "medium" ? "text-amber-600" : "text-green-600")}>
                                {zone.monsoonRisk.transition === "high" ? "สูง" : zone.monsoonRisk.transition === "medium" ? "กลาง" : "ต่ำ"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Historical Frequency */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">ความถี่ในอดีต</span>
                    </div>
                    <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">
                        {zone.historicalFrequency}
                    </p>
                </div>

                {/* Major Events */}
                {events.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowEvents(!showEvents)}
                            className="flex items-center justify-between w-full text-sm font-medium py-2"
                        >
                            <span className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                เหตุการณ์สำคัญ ({events.length})
                            </span>
                            {showEvents ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {showEvents && (
                            <div className="space-y-2 mt-2">
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4"
                                        style={{ borderLeftColor: getSeverityColor(event.severity) }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm">{getEventTypeThai(event.eventType)}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {event.date}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Station detail panel
function StationDetailPanel({
    station,
    onClose,
}: {
    station: ThaiWaterLevel;
    onClose: () => void;
}) {
    return (
        <Card className="absolute top-4 right-4 w-80 shadow-xl z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md animate-in slide-in-from-right">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Droplets className="h-5 w-5 text-blue-500" />
                            {station.station_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            จ.{station.province_name}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center py-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">ระดับน้ำปัจจุบัน</span>
                    <div className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                        {station.water_level.toFixed(2)}
                        <span className="text-lg ml-1 text-blue-500">ม.</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">
                        อัปเดตเมื่อ: {new Date(station.timestamp).toLocaleTimeString('th-TH')}
                    </span>
                </div>

                <div className="mt-4 text-xs text-muted-foreground text-center">
                    ข้อมูลจาก API คลังข้อมูลน้ำแห่งชาติ (ThaiWater)
                </div>
            </CardContent>
        </Card>
    );
}

// Event detail panel (Simplified for brevity)
function EventDetailPanel({
    event,
    onClose,
}: {
    event: HistoricalEvent;
    onClose: () => void;
}) {
    return (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 shadow-xl z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getSeverityColor(event.severity) }}
                            />
                            <CardTitle className="text-base">
                                {getEventTypeThai(event.eventType)}
                            </CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {event.location.name} ({event.date})
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="text-sm">{event.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                        <span className="block text-muted-foreground">ระดับน้ำ</span>
                        <span className="font-bold">{event.maxWaterLevel} ม.</span>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/10 rounded">
                        <span className="block text-muted-foreground">ผู้ได้รับผลกระทบ</span>
                        <span className="font-bold">{event.damages.affected}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function RiskAreaMap({
    currentLocation,
    onLocationSelect,
    className,
}: RiskAreaMapProps) {
    const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
    const [selectedStation, setSelectedStation] = useState<ThaiWaterLevel | null>(null);
    const [showEvents, setShowEvents] = useState(false);
    const [showStations, setShowStations] = useState(true);
    const [waterStations, setWaterStations] = useState<ThaiWaterLevel[]>([]);
    const [isLoadingStations, setIsLoadingStations] = useState(true);

    const zones = useMemo(() => getAllRiskZones(), []);
    const events = useMemo(() => getAllEvents(), []);
    const currentZone = useMemo(
        () => getRiskZoneForLocation(currentLocation.lat, currentLocation.lon),
        [currentLocation.lat, currentLocation.lon]
    );

    // Fetch live stations
    useEffect(() => {
        const fetchStations = async () => {
            setIsLoadingStations(true);
            try {
                const data = await getRealTimeWaterLevels();
                setWaterStations(data);
            } catch (error) {
                console.error("Failed to load stations", error);
            } finally {
                setIsLoadingStations(false);
            }
        };
        fetchStations();
    }, []);

    const handleMapClick = useCallback(
        ({ latLng }: { latLng: [number, number] }) => {
            if (onLocationSelect) {
                // Ensure we call this only on direct map click (not propagation) but pigeon maps handles this well
                // We might want to avoid selecting when clicking overlays, 
                // but overlays capture their own clicks.
                onLocationSelect(latLng[0], latLng[1]);
            }
            setSelectedZone(null);
            setSelectedEvent(null);
            setSelectedStation(null);
        },
        [onLocationSelect]
    );

    return (
        <Card className={cn("relative overflow-hidden border-2 border-slate-100 dark:border-slate-800", className)}>
            <CardHeader className="pb-2 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        แผนที่พื้นที่เสี่ยงและระดับน้ำ
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showStations ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowStations(!showStations)}
                            className="text-xs h-8"
                        >
                            <Activity className="h-3 w-3 mr-1" />
                            สถานีวัดน้ำ {isLoadingStations && "(...)"}
                        </Button>
                        <Button
                            variant={showEvents ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setShowEvents(!showEvents)}
                            className="text-xs h-8"
                        >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            ประวัติภัยพิบัติ
                        </Button>
                    </div>
                </div>
                {currentZone && (
                    <div className="flex items-center gap-2 mt-1">
                        <Info className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                            พื้นที่ปัจจุบัน: <span className="font-bold text-blue-600 dark:text-blue-400">{currentZone.name}</span>
                        </span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-0 relative bg-slate-100 dark:bg-slate-900">
                {/* Legend */}
                <div className="absolute top-2 left-2 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-2 shadow-md text-[10px] md:text-xs pointer-events-none">
                    <div className="font-bold mb-1">สัญลักษณ์</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500/30 border border-red-500 rounded-sm" />
                            <span>พื้นที่เสี่ยงสูง</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-blue-500 transform rotate-45 scale-75" />
                            <span>สถานีวัดระดับน้ำ</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span>ประวัติภัยพิบัติ</span>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="h-[450px] md:h-[550px] w-full relative">
                    <PigeonMap
                        center={[currentLocation.lat, currentLocation.lon]}
                        zoom={6}
                        onClick={handleMapClick}
                        attribution={false} // Clean look
                        dprs={[1, 2]}
                        minZoom={5}
                        maxZoom={12}
                    >
                        {/* Risk Zone Overlays (SVG Layer) */}
                        <RiskZoneLayer
                            zones={zones}
                            selectedZoneId={selectedZone?.id}
                            onZoneClick={(zone) => {
                                setSelectedZone(zone);
                                setSelectedEvent(null);
                                setSelectedStation(null);
                            }}
                        />

                        {/* Station markers */}
                        {showStations && waterStations.map((station) => (
                            <StationMarker
                                key={station.station_id}
                                station={station}
                                onClick={() => {
                                    setSelectedStation(station);
                                    setSelectedZone(null);
                                    setSelectedEvent(null);
                                }}
                            />
                        ))}

                        {/* Event markers */}
                        {showEvents &&
                            events.map((event) => (
                                <EventMarker
                                    key={event.id}
                                    event={event}
                                    isSelected={selectedEvent?.id === event.id}
                                    onClick={() => {
                                        setSelectedEvent(event);
                                        setSelectedZone(null);
                                        setSelectedStation(null);
                                    }}
                                />
                            ))}

                        {/* Current location marker */}
                        <Marker anchor={[currentLocation.lat, currentLocation.lon]}>
                            <div className="flex flex-col items-center">
                                <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg animate-pulse z-50 relative">
                                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                                </div>
                                <div className="mt-1 bg-black/50 text-white text-[10px] px-1 rounded backdrop-blur-sm whitespace-nowrap">
                                    คุณอยู่ที่นี่
                                </div>
                            </div>
                        </Marker>
                    </PigeonMap>
                </div>

                {/* Details Panels */}
                {selectedZone && (
                    <ZoneDetailPanel zone={selectedZone} onClose={() => setSelectedZone(null)} />
                )}

                {selectedEvent && (
                    <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
                )}

                {selectedStation && (
                    <StationDetailPanel station={selectedStation} onClose={() => setSelectedStation(null)} />
                )}
            </CardContent>
        </Card>
    );
}
