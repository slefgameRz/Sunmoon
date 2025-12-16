/**
 * Disaster Analysis Service
 * ระบบวิเคราะห์และอธิบายภัยพิบัติจากน้ำขึ้นน้ำลง
 * 
 * ปัจจัยหลักที่ส่งผลต่อภัยพิบัติ:
 * 1. ปรากฏการณ์ดวงจันทร์ (น้ำเป็น/น้ำตาย)
 * 2. ระดับน้ำสูงสุด
 * 3. สภาพอากาศ (ลม, ความกดอากาศ)
 * 4. ช่วงเวลาของปี (มรสุม)
 */

import type { TideData, WeatherData, TideEvent } from './tide-service';

// ประเภทภัยพิบัติที่อาจเกิดขึ้น
export type DisasterType =
  | 'flood'           // น้ำท่วมชายฝั่ง
  | 'storm_surge'     // คลื่นพายุซัดฝั่ง
  | 'high_tide'       // น้ำหนุนสูงผิดปกติ
  | 'erosion'         // การกัดเซาะชายฝั่ง
  | 'rip_current'     // กระแสน้ำดูด
  | 'none';           // ไม่มีภัยพิบัติ

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type DisasterInfo = {
  type: DisasterType;
  title: string;              // ชื่อภัยพิบัติ
  description: string;        // คำอธิบายสั้น
  detailedExplanation: string; // คำอธิบายละเอียด
  probability: number;        // ความน่าจะเป็น 0-100%
  causes: string[];           // สาเหตุการเกิด
  impactAreas: string[];      // พื้นที่ได้รับผลกระทบ
  preventionTips: string[];   // วิธีป้องกัน
};

export type RiskFactor = {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  description: string;
  contributeToRisk: boolean;
  riskContribution: number;   // 0-100 contribution to overall risk
  icon: string;               // Lucide icon name
};

export type DisasterAnalysis = {
  riskLevel: RiskLevel;
  overallRating: number;      // 0-100
  disasters: DisasterInfo[];
  factors: RiskFactor[];
  recommendations: string[];
  timestamp: string;
  location: string;
  // NEW: Additional prediction features
  riskTimeline: RiskTimeSlot[];           // ช่วงเวลาที่เสี่ยงภัย
  floodPrediction: FloodPrediction | null; // การพยากรณ์น้ำท่วม
  advanceWarnings: AdvanceWarning[];       // การเตือนล่วงหน้า
  historicalContext: HistoricalContext | null; // ข้อมูลประวัติศาสตร์
};

// NEW: ช่วงเวลาที่มีความเสี่ยง
export type RiskTimeSlot = {
  startTime: string;          // เวลาเริ่มต้น HH:MM
  endTime: string;            // เวลาสิ้นสุด HH:MM
  riskLevel: RiskLevel;       // ระดับความเสี่ยงในช่วงนั้น
  mainRisk: string;           // ความเสี่ยงหลัก
  description: string;        // คำอธิบาย
  tideLevel: number;          // ระดับน้ำโดยประมาณ
};

// NEW: การพยากรณ์น้ำท่วม
export type FloodPrediction = {
  expectedLevel: number;      // ระดับน้ำท่วมที่คาดการณ์ (ซม.)
  peakTime: string;           // เวลาที่น้ำสูงสุด
  duration: number;           // ระยะเวลาที่น้ำท่วม (นาที)
  affectedAreas: string[];    // พื้นที่ที่อาจได้รับผลกระทบ
  floodType: 'minor' | 'moderate' | 'major' | 'severe'; // ระดับความรุนแรง
  causedBy: string[];         // สาเหตุหลัก
  confidence: number;         // ความมั่นใจในการพยากรณ์ 0-100%
};

// NEW: การเตือนภัยล่วงหน้า
export type AdvanceWarning = {
  type: DisasterType;
  warningLevel: 'watch' | 'advisory' | 'warning' | 'emergency';
  title: string;
  message: string;
  timeUntil: string;          // เวลาที่เหลือก่อนเกิด e.g., "2 ชั่วโมง"
  expectedTime: string;       // เวลาที่คาดว่าจะเกิด
  actionRequired: string[];   // สิ่งที่ต้องทำ
};

// NEW: ข้อมูลประวัติศาสตร์
export type HistoricalContext = {
  similarEvents: HistoricalEvent[];
  lastMajorEvent: HistoricalEvent | null;
  averageOccurrence: string;  // ความถี่โดยเฉลี่ย
  seasonalPattern: string;    // รูปแบบตามฤดูกาล
};

export type HistoricalEvent = {
  date: string;
  eventType: DisasterType;
  severity: string;
  maxWaterLevel: number;
  description: string;
};

// Constants for thresholds
const THRESHOLDS = {
  HIGH_TIDE_LEVEL: 2.5,       // เมตร - ระดับน้ำสูงที่เริ่มเสี่ยง
  CRITICAL_TIDE_LEVEL: 3.0,   // เมตร - ระดับน้ำสูงวิกฤต
  HIGH_WIND_SPEED: 8,         // m/s - ลมแรง
  STORM_WIND_SPEED: 15,       // m/s - พายุ
  LOW_PRESSURE: 1005,         // hPa - ความกดอากาศต่ำ
  CRITICAL_PRESSURE: 995,     // hPa - ความกดอากาศต่ำมาก
  HIGH_TIDE_RANGE: 2.0,       // เมตร - ช่วงขึ้นลงสูง
};

/**
 * คำนวณช่วงขึ้นลงของน้ำ (Tide Range)
 */
function calculateTideRange(tideEvents: TideEvent[]): number {
  if (tideEvents.length < 2) return 0;

  const levels = tideEvents.map(e => e.level);
  const maxLevel = Math.max(...levels);
  const minLevel = Math.min(...levels);

  return maxLevel - minLevel;
}

/**
 * หาระดับน้ำสูงสุดของวัน
 */
function getMaxTideLevel(tideEvents: TideEvent[]): number {
  if (tideEvents.length === 0) return 0;
  const highTides = tideEvents.filter(e => e.type === 'high');
  if (highTides.length === 0) return Math.max(...tideEvents.map(e => e.level));
  return Math.max(...highTides.map(e => e.level));
}

/**
 * ตรวจสอบเดือนมรสุม (พฤษภาคม-ตุลาคม = มรสุมตะวันตกเฉียงใต้, พฤศจิกายน-เมษายน = มรสุมตะวันออกเฉียงเหนือ)
 */
function getMonsoonSeason(date: Date): { season: 'southwest' | 'northeast' | 'transition'; riskMultiplier: number } {
  const month = date.getMonth() + 1; // 1-12

  if (month >= 5 && month <= 10) {
    // มรสุมตะวันตกเฉียงใต้ - ทะเลอันดามันเสี่ยงสูง
    return { season: 'southwest', riskMultiplier: 1.3 };
  } else if (month >= 11 || month <= 2) {
    // มรสุมตะวันออกเฉียงเหนือ - อ่าวไทยเสี่ยงสูง
    return { season: 'northeast', riskMultiplier: 1.2 };
  } else {
    // ช่วงเปลี่ยนผ่าน
    return { season: 'transition', riskMultiplier: 1.0 };
  }
}

/**
 * สร้างคำอธิบายสาเหตุการเกิดน้ำหนุนสูง
 */
function explainHighTideCause(tideData: TideData): string[] {
  const causes: string[] = [];

  // ปัจจัยดวงจันทร์
  if (tideData.tideStatus === 'น้ำเป็น') {
    causes.push(`เป็นช่วง "น้ำเป็น" (Spring Tide) ${tideData.isWaxingMoon ? 'ข้างขึ้น' : 'ข้างแรม'} ${tideData.lunarPhaseKham} ค่ำ ซึ่งแรงดึงดูดของดวงจันทร์และดวงอาทิตย์เรียงตัวตรงกัน ทำให้น้ำขึ้นสูงกว่าปกติ`);
  }

  if (tideData.lunarPhaseKham <= 2 || tideData.lunarPhaseKham >= 14) {
    causes.push(`อยู่ใกล้วัน${tideData.isWaxingMoon ? 'เพ็ญ' : 'ดับ'} (${tideData.lunarPhaseKham} ค่ำ) ซึ่งเป็นช่วงที่น้ำหนุนสูงที่สุดในรอบเดือน`);
  }

  if (tideData.isSeaLevelHighToday) {
    causes.push('ระดับน้ำทะเลหนุนสูงวันนี้ อาจเกิดน้ำท่วมในพื้นที่ต่ำ');
  }

  return causes;
}

/**
 * สร้างคำอธิบายสาเหตุพายุและคลื่น
 */
function explainStormSurgeCause(weatherData: WeatherData): string[] {
  const causes: string[] = [];
  const windSpeed = weatherData.wind.speed;
  const pressure = weatherData.main.pressure;

  if (windSpeed > THRESHOLDS.HIGH_WIND_SPEED) {
    causes.push(`ความเร็วลม ${windSpeed} m/s (${(windSpeed * 3.6).toFixed(0)} km/h) สูงพอที่จะทำให้เกิดคลื่นลมแรง`);
  }

  if (pressure < THRESHOLDS.LOW_PRESSURE) {
    causes.push(`ความกดอากาศต่ำ (${pressure} hPa) ทำให้ระดับน้ำทะเลสูงขึ้น เนื่องจากความกดอากาศที่ลดลง 1 hPa ทำให้น้ำสูงขึ้นประมาณ 1 ซม.`);
  }

  return causes;
}

/**
 * สร้างข้อมูลภัยพิบัติน้ำหนุนสูง
 */
function createHighTideDisaster(tideData: TideData, probability: number): DisasterInfo {
  return {
    type: 'high_tide',
    title: 'น้ำหนุนสูงผิดปกติ',
    description: 'ระดับน้ำทะเลสูงขึ้นเกินปกติจากอิทธิพลของดวงจันทร์และดวงอาทิตย์',
    detailedExplanation: `ปรากฏการณ์น้ำหนุนสูงเกิดจากการรวมตัวของแรงดึงดูดจากดวงจันทร์และดวงอาทิตย์ในช่วง "${tideData.tideStatus}" 
    
ปัจจุบันอยู่ในช่วง${tideData.isWaxingMoon ? 'ข้างขึ้น' : 'ข้างแรม'} ${tideData.lunarPhaseKham} ค่ำ ${tideData.lunarPhaseKham <= 2 || tideData.lunarPhaseKham >= 14 ? 'ซึ่งเป็นช่วงที่น้ำหนุนสูงสุดในรอบเดือน' : ''}

กลไกการเกิด:
- แรงดึงดูดของดวงจันทร์ทำให้น้ำทะเลนูนออกไปทั้งด้านที่หันไปหาดวงจันทร์และด้านตรงข้าม
- ในช่วงน้ำเป็น ดวงอาทิตย์และดวงจันทร์อยู่ในแนวเดียวกัน แรงดึงดูดจึงรวมกัน
- ทำให้น้ำขึ้นสูงกว่าปกติ 20-30%`,
    probability,
    causes: explainHighTideCause(tideData),
    impactAreas: [
      'พื้นที่ท่าเรือและชายฝั่ง',
      'บ้านเรือนที่อยู่ติดริมน้ำ',
      'ถนนและทางเดินใกล้ชายฝั่ง',
      'บ่อเลี้ยงสัตว์น้ำ',
    ],
    preventionTips: [
      'ย้ายสิ่งของสำคัญไปที่สูง',
      'จอดเรือให้แน่นหนา',
      'หลีกเลี่ยงการจอดรถใกล้ชายฝั่ง',
      'ติดตามข่าวสารจากกรมอุตุนิยมวิทยา',
    ],
  };
}

/**
 * สร้างข้อมูลภัยพิบัติน้ำท่วมชายฝั่ง
 */
function createFloodDisaster(tideData: TideData, weatherData: WeatherData, probability: number): DisasterInfo {
  const maxLevel = getMaxTideLevel(tideData.tideEvents);

  return {
    type: 'flood',
    title: 'น้ำท่วมชายฝั่ง',
    description: 'น้ำท่วมในพื้นที่ต่ำใกล้ชายฝั่งจากน้ำทะเลหนุนสูงรวมกับปัจจัยอื่นๆ',
    detailedExplanation: `น้ำท่วมชายฝั่งเกิดจากปัจจัยหลายอย่างรวมกัน:

1. **น้ำทะเลหนุนสูง**: ระดับน้ำสูงสุดวันนี้ ${maxLevel.toFixed(2)} เมตร
2. **อิทธิพลดวงจันทร์**: ${tideData.tideStatus === 'น้ำเป็น' ? 'ช่วงน้ำเป็น (Spring Tide) แรงดึงดูดสูง' : 'ช่วงน้ำตาย (Neap Tide)'}
3. **ลมและคลื่น**: ความเร็วลม ${weatherData.wind.speed} m/s
4. **ความกดอากาศ**: ${weatherData.main.pressure} hPa ${weatherData.main.pressure < THRESHOLDS.LOW_PRESSURE ? '(ต่ำ - ส่งผลให้น้ำสูงขึ้น)' : '(ปกติ)'}

เมื่อปัจจัยเหล่านี้รวมกัน น้ำทะเลจะหนุนสูงจนไหลเข้าท่วมพื้นที่ต่ำริมชายฝั่ง`,
    probability,
    causes: [
      ...explainHighTideCause(tideData),
      ...explainStormSurgeCause(weatherData),
    ],
    impactAreas: [
      'ชุมชนริมชายฝั่งที่อยู่ต่ำกว่าระดับน้ำทะเล',
      'ถนนและทางเดินริมคลอง',
      'พื้นที่เกษตรกรรมใกล้ทะเล',
      'ระบบระบายน้ำในเมือง',
    ],
    preventionTips: [
      'เตรียมกระสอบทรายกั้นน้ำ',
      'ย้ายสิ่งของมีค่าขึ้นที่สูง',
      'เตรียมเส้นทางอพยพ',
      'ติดตามระดับน้ำอย่างใกล้ชิด',
      'ตัดกระแสไฟฟ้าในพื้นที่เสี่ยงน้ำท่วม',
    ],
  };
}

/**
 * สร้างข้อมูลภัยพิบัติคลื่นพายุซัดฝั่ง
 */
function createStormSurgeDisaster(weatherData: WeatherData, probability: number): DisasterInfo {
  return {
    type: 'storm_surge',
    title: 'คลื่นพายุซัดฝั่ง (Storm Surge)',
    description: 'คลื่นขนาดใหญ่ที่เกิดจากลมแรงและความกดอากาศต่ำพัดเข้าหาฝั่ง',
    detailedExplanation: `คลื่นพายุซัดฝั่ง (Storm Surge) เป็นปรากฏการณ์ที่น้ำทะเลถูกผลักเข้าหาฝั่งโดยลมแรง

กลไกการเกิด:
- **ลมพายุ**: ลมแรง ${weatherData.wind.speed} m/s ผลักน้ำทะเลเข้าหาฝั่ง
- **ความกดอากาศต่ำ**: ${weatherData.main.pressure} hPa ทำให้น้ำทะเล "นูน" ขึ้นมา
- **ภูมิประเทศ**: อ่าวแคบหรือปากแม่น้ำทำให้น้ำถูกบีบเข้ามากขึ้น

ผลกระทบ:
- คลื่นสูงขึ้นหลายเมตรเหนือระดับน้ำขึ้นปกติ
- ซัดเข้าฝั่งอย่างรุนแรงและรวดเร็ว
- อาจทำลายสิ่งปลูกสร้างริมชายฝั่ง`,
    probability,
    causes: explainStormSurgeCause(weatherData),
    impactAreas: [
      'ชายฝั่งทะเลเปิด',
      'ปากแม่น้ำและอ่าว',
      'สิ่งปลูกสร้างริมทะเล',
      'เรือที่จอดใกล้ฝั่ง',
    ],
    preventionTips: [
      'อพยพออกจากพื้นที่ชายฝั่งทันที',
      'นำเรือออกไปจอดในที่กำบัง',
      'หลีกเลี่ยงการลงทะเล',
      'ฟังคำเตือนจากทางการอย่างเคร่งครัด',
    ],
  };
}

/**
 * สร้างข้อมูลภัยพิบัติการกัดเซาะชายฝั่ง
 */
function createErosionDisaster(tideData: TideData, weatherData: WeatherData, probability: number): DisasterInfo {
  return {
    type: 'erosion',
    title: 'การกัดเซาะชายฝั่ง',
    description: 'คลื่นและกระแสน้ำกัดเซาะหาดทรายและแนวชายฝั่ง',
    detailedExplanation: `การกัดเซาะชายฝั่งเกิดจากพลังงานคลื่นที่กระทบชายฝั่งอย่างต่อเนื่อง

ปัจจัยที่ส่งผล:
- **คลื่นจากลม**: ความเร็วลม ${weatherData.wind.speed} m/s สร้างคลื่นกัดเซาะ
- **น้ำขึ้นสูง**: ระดับน้ำที่สูงขึ้นทำให้คลื่นซัดถึงส่วนที่สูงกว่าปกติ
- **กระแสน้ำ**: น้ำ${tideData.waterLevelStatus}ทำให้เกิดกระแสน้ำแรง

ผลกระทบระยะยาว:
- การสูญเสียพื้นที่ชายหาด
- การพังทลายของแนวป้องกันชายฝั่ง
- การเปลี่ยนแปลงภูมิประเทศชายฝั่งถาวร`,
    probability,
    causes: [
      `คลื่นลมแรงจากลมความเร็ว ${weatherData.wind.speed} m/s`,
      'ระดับน้ำที่สูงทำให้คลื่นซัดถึงส่วนบนของหาด',
      'กระแสน้ำขึ้น-ลงที่แรง',
    ],
    impactAreas: [
      'ชายหาดท่องเที่ยว',
      'แนวป้องกันชายฝั่ง',
      'สิ่งปลูกสร้างริมหาด',
      'ท่าเรือและสะพาน',
    ],
    preventionTips: [
      'สังเกตรอยแตกร้าวบนแผ่นดิน',
      'ไม่เข้าใกล้ขอบผาหรือที่ดินที่กำลังถูกกัดเซาะ',
      'รายงานการกัดเซาะให้หน่วยงานท้องถิ่นทราบ',
    ],
  };
}

/**
 * วิเคราะห์ความเสี่ยงภัยพิบัติจากข้อมูลน้ำและอากาศ
 */
export function analyzeDisasterRisk(
  tideData: TideData,
  weatherData: WeatherData,
  date: Date = new Date(),
  locationName: string = 'ตำแหน่งที่เลือก'
): DisasterAnalysis {
  const disasters: DisasterInfo[] = [];
  const factors: RiskFactor[] = [];
  const recommendations: string[] = [];

  // คำนวณค่าต่างๆ
  const maxTideLevel = getMaxTideLevel(tideData.tideEvents);
  const tideRange = calculateTideRange(tideData.tideEvents);
  const monsoon = getMonsoonSeason(date);
  const windSpeed = weatherData.wind.speed;
  const pressure = weatherData.main.pressure;

  // ============ วิเคราะห์ปัจจัยเสี่ยง ============

  // 1. ปัจจัยดวงจันทร์
  const lunarRiskContribution = tideData.tideStatus === 'น้ำเป็น' ? 25 : 10;
  factors.push({
    id: 'lunar',
    name: 'ปัจจัยดวงจันทร์',
    value: `${tideData.isWaxingMoon ? 'ข้างขึ้น' : 'ข้างแรม'} ${tideData.lunarPhaseKham} ค่ำ`,
    description: tideData.tideStatus === 'น้ำเป็น'
      ? `ช่วง "น้ำเป็น" - แรงดึงดูดจากดวงจันทร์และดวงอาทิตย์รวมกัน ทำให้น้ำขึ้นสูงกว่าปกติ`
      : `ช่วง "น้ำตาย" - แรงดึงดูดหักล้างกัน น้ำขึ้นลดลง`,
    contributeToRisk: tideData.tideStatus === 'น้ำเป็น',
    riskContribution: lunarRiskContribution,
    icon: 'Moon',
  });

  // 2. ระดับน้ำสูงสุด
  const tideRiskContribution = maxTideLevel >= THRESHOLDS.CRITICAL_TIDE_LEVEL ? 30
    : maxTideLevel >= THRESHOLDS.HIGH_TIDE_LEVEL ? 20 : 10;
  factors.push({
    id: 'tide_level',
    name: 'ระดับน้ำสูงสุด',
    value: maxTideLevel,
    unit: 'เมตร',
    description: maxTideLevel >= THRESHOLDS.CRITICAL_TIDE_LEVEL
      ? `ระดับน้ำสูงมาก (≥${THRESHOLDS.CRITICAL_TIDE_LEVEL}ม.) เสี่ยงน้ำท่วมสูง`
      : maxTideLevel >= THRESHOLDS.HIGH_TIDE_LEVEL
        ? `ระดับน้ำค่อนข้างสูง (≥${THRESHOLDS.HIGH_TIDE_LEVEL}ม.) ควรระวัง`
        : 'ระดับน้ำปกติ',
    contributeToRisk: maxTideLevel >= THRESHOLDS.HIGH_TIDE_LEVEL,
    riskContribution: tideRiskContribution,
    icon: 'Waves',
  });

  // 3. ความเร็วลม
  const windRiskContribution = windSpeed >= THRESHOLDS.STORM_WIND_SPEED ? 25
    : windSpeed >= THRESHOLDS.HIGH_WIND_SPEED ? 15 : 5;
  factors.push({
    id: 'wind',
    name: 'ความเร็วลม',
    value: windSpeed,
    unit: 'm/s',
    description: windSpeed >= THRESHOLDS.STORM_WIND_SPEED
      ? `ลมแรงมาก (≥${THRESHOLDS.STORM_WIND_SPEED}m/s) อาจเกิดพายุ`
      : windSpeed >= THRESHOLDS.HIGH_WIND_SPEED
        ? `ลมแรง (≥${THRESHOLDS.HIGH_WIND_SPEED}m/s) คลื่นสูง`
        : 'ลมเบาถึงปานกลาง',
    contributeToRisk: windSpeed >= THRESHOLDS.HIGH_WIND_SPEED,
    riskContribution: windRiskContribution,
    icon: 'Wind',
  });

  // 4. ความกดอากาศ
  const pressureRiskContribution = pressure <= THRESHOLDS.CRITICAL_PRESSURE ? 20
    : pressure <= THRESHOLDS.LOW_PRESSURE ? 10 : 0;
  factors.push({
    id: 'pressure',
    name: 'ความกดอากาศ',
    value: pressure,
    unit: 'hPa',
    description: pressure <= THRESHOLDS.CRITICAL_PRESSURE
      ? `ความกดอากาศต่ำมาก (≤${THRESHOLDS.CRITICAL_PRESSURE}hPa) น้ำทะเลสูงขึ้นหลายเซนติเมตร`
      : pressure <= THRESHOLDS.LOW_PRESSURE
        ? `ความกดอากาศต่ำ (≤${THRESHOLDS.LOW_PRESSURE}hPa) อาจส่งผลต่อระดับน้ำ`
        : 'ความกดอากาศปกติ',
    contributeToRisk: pressure <= THRESHOLDS.LOW_PRESSURE,
    riskContribution: pressureRiskContribution,
    icon: 'Gauge',
  });

  // 5. ฤดูมรสุม
  factors.push({
    id: 'monsoon',
    name: 'ฤดูกาล',
    value: monsoon.season === 'southwest' ? 'มรสุมตะวันตกเฉียงใต้'
      : monsoon.season === 'northeast' ? 'มรสุมตะวันออกเฉียงเหนือ' : 'ช่วงเปลี่ยนผ่าน',
    description: monsoon.season !== 'transition'
      ? `ช่วงมรสุม - ทะเลมีคลื่นลมแรงกว่าปกติ`
      : 'ช่วงเปลี่ยนผ่านมรสุม สภาพอากาศค่อนข้างปกติ',
    contributeToRisk: monsoon.riskMultiplier > 1.0,
    riskContribution: monsoon.riskMultiplier > 1.0 ? 10 : 0,
    icon: 'CloudRain',
  });

  // ============ คำนวณความเสี่ยงรวม ============
  const baseRisk = factors.reduce((sum, f) => sum + f.riskContribution, 0);
  const adjustedRisk = Math.min(100, baseRisk * monsoon.riskMultiplier);

  // กำหนดระดับความเสี่ยง
  let riskLevel: RiskLevel;
  if (adjustedRisk >= 70) {
    riskLevel = 'critical';
  } else if (adjustedRisk >= 50) {
    riskLevel = 'high';
  } else if (adjustedRisk >= 30) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // ============ สร้างข้อมูลภัยพิบัติ ============

  // น้ำหนุนสูง
  if (tideData.isSeaLevelHighToday || maxTideLevel >= THRESHOLDS.HIGH_TIDE_LEVEL) {
    const prob = Math.min(90, 40 + lunarRiskContribution + tideRiskContribution);
    disasters.push(createHighTideDisaster(tideData, prob));
  }

  // น้ำท่วมชายฝั่ง
  if (maxTideLevel >= THRESHOLDS.HIGH_TIDE_LEVEL &&
    (tideData.tideStatus === 'น้ำเป็น' || pressure < THRESHOLDS.LOW_PRESSURE)) {
    const prob = Math.min(80, adjustedRisk);
    disasters.push(createFloodDisaster(tideData, weatherData, prob));
  }

  // คลื่นพายุซัดฝั่ง
  if (windSpeed >= THRESHOLDS.HIGH_WIND_SPEED) {
    const prob = Math.min(75, 20 + windRiskContribution + pressureRiskContribution);
    disasters.push(createStormSurgeDisaster(weatherData, prob));
  }

  // การกัดเซาะ
  if (windSpeed >= THRESHOLDS.HIGH_WIND_SPEED && tideRange >= THRESHOLDS.HIGH_TIDE_RANGE) {
    const prob = Math.min(60, 30 + windRiskContribution);
    disasters.push(createErosionDisaster(tideData, weatherData, prob));
  }

  // ============ สร้างคำแนะนำ ============
  if (riskLevel === 'critical') {
    recommendations.push('⚠️ สถานการณ์วิกฤต: ควรอพยพออกจากพื้นที่ชายฝั่งทันที');
    recommendations.push('ติดตามข่าวสารจากกรมอุตุนิยมวิทยาอย่างใกล้ชิด');
    recommendations.push('เตรียมอุปกรณ์ฉุกเฉินและยา');
  } else if (riskLevel === 'high') {
    recommendations.push('🔴 ความเสี่ยงสูง: ไม่ควรทำกิจกรรมทางทะเล');
    recommendations.push('ย้ายสิ่งของสำคัญไปที่สูง');
    recommendations.push('จอดเรือให้แน่นหนาหรือนำเรือไปจอดในที่กำบัง');
  } else if (riskLevel === 'medium') {
    recommendations.push('🟡 ความเสี่ยงปานกลาง: ระมัดระวังในการทำกิจกรรมริมทะเล');
    recommendations.push('ติดตามสภาพอากาศอย่างต่อเนื่อง');
  } else {
    recommendations.push('🟢 ความเสี่ยงต่ำ: สามารถทำกิจกรรมทางทะเลได้ตามปกติ');
    recommendations.push('ไม่ลืมเช็คสภาพอากาศก่อนออกทะเล');
  }

  // ============ สร้างข้อมูลพยากรณ์เพิ่มเติม ============

  // สร้าง Risk Timeline
  const riskTimeline = createRiskTimeline(tideData, weatherData, riskLevel);

  // สร้าง Flood Prediction
  const floodPrediction = createFloodPrediction(tideData, weatherData, maxTideLevel, adjustedRisk);

  // สร้าง Advance Warnings
  const advanceWarnings = createAdvanceWarnings(tideData, weatherData, disasters, date);

  // สร้าง Historical Context
  const historicalContext = createHistoricalContext(tideData, monsoon, date);

  return {
    riskLevel,
    overallRating: Math.round(adjustedRisk),
    disasters,
    factors,
    recommendations,
    timestamp: new Date().toISOString(),
    location: locationName,
    riskTimeline,
    floodPrediction,
    advanceWarnings,
    historicalContext,
  };
}

/**
 * สร้าง Timeline ช่วงเวลาที่มีความเสี่ยง
 */
function createRiskTimeline(
  tideData: TideData,
  weatherData: WeatherData,
  overallRiskLevel: RiskLevel
): RiskTimeSlot[] {
  const timeline: RiskTimeSlot[] = [];

  // วิเคราะห์จาก tide events
  for (const event of tideData.tideEvents) {
    if (event.type === 'high') {
      const [hour] = event.time.split(':').map(Number);
      const startHour = Math.max(0, hour - 2);
      const endHour = Math.min(23, hour + 2);

      // กำหนดระดับความเสี่ยงตามระดับน้ำ
      let slotRiskLevel: RiskLevel = 'low';
      let mainRisk = 'น้ำขึ้นปกติ';

      if (event.level >= THRESHOLDS.CRITICAL_TIDE_LEVEL) {
        slotRiskLevel = 'critical';
        mainRisk = 'น้ำหนุนสูงวิกฤต';
      } else if (event.level >= THRESHOLDS.HIGH_TIDE_LEVEL) {
        slotRiskLevel = 'high';
        mainRisk = 'น้ำหนุนสูง';
      } else if (event.level >= 2.0) {
        slotRiskLevel = 'medium';
        mainRisk = 'น้ำหนุนค่อนข้างสูง';
      }

      // เพิ่มความเสี่ยงถ้าลมแรง
      if (weatherData.wind.speed >= THRESHOLDS.HIGH_WIND_SPEED && slotRiskLevel !== 'critical') {
        if (slotRiskLevel === 'high') slotRiskLevel = 'critical';
        else if (slotRiskLevel === 'medium') slotRiskLevel = 'high';
        else slotRiskLevel = 'medium';
        mainRisk += ' + ลมแรง';
      }

      timeline.push({
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        riskLevel: slotRiskLevel,
        mainRisk,
        description: `ช่วงน้ำขึ้นสูงสุด เวลา ${event.time} น. ระดับน้ำ ${event.level.toFixed(2)} ม.`,
        tideLevel: event.level,
      });
    }
  }

  // เรียงตามเวลา
  timeline.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return timeline;
}

/**
 * สร้างการพยากรณ์น้ำท่วม
 */
function createFloodPrediction(
  tideData: TideData,
  weatherData: WeatherData,
  maxTideLevel: number,
  overallRisk: number
): FloodPrediction | null {
  // ถ้าไม่มีความเสี่ยงน้ำท่วม ไม่ต้องสร้าง prediction
  if (maxTideLevel < THRESHOLDS.HIGH_TIDE_LEVEL && !tideData.isSeaLevelHighToday) {
    return null;
  }

  // คำนวณระดับน้ำท่วมที่คาดการณ์ (cm above normal)
  let expectedLevel = 0;

  // ปัจจัยจากน้ำขึ้นสูง
  if (maxTideLevel >= THRESHOLDS.CRITICAL_TIDE_LEVEL) {
    expectedLevel += 50; // 50 cm จากน้ำหนุนสูงมาก
  } else if (maxTideLevel >= THRESHOLDS.HIGH_TIDE_LEVEL) {
    expectedLevel += 30; // 30 cm จากน้ำหนุนสูง
  }

  // ปัจจัยจากน้ำเป็น/น้ำตาย
  if (tideData.tideStatus === 'น้ำเป็น') {
    expectedLevel += 20; // เพิ่ม 20 cm ช่วงน้ำเป็น
  }

  // ปัจจัยจากความกดอากาศต่ำ (1 hPa ลด = น้ำสูง ~1 cm)
  if (weatherData.main.pressure < THRESHOLDS.LOW_PRESSURE) {
    const pressureDiff = THRESHOLDS.LOW_PRESSURE - weatherData.main.pressure;
    expectedLevel += pressureDiff; // cm
  }

  // ปัจจัยจากลม
  if (weatherData.wind.speed >= THRESHOLDS.HIGH_WIND_SPEED) {
    expectedLevel += Math.floor(weatherData.wind.speed * 2); // ลม 10 m/s = +20 cm
  }

  // หาเวลาน้ำสูงสุด
  const highTideEvent = tideData.tideEvents.find(e => e.type === 'high');
  const peakTime = highTideEvent?.time || '12:00';

  // คำนวณระยะเวลาน้ำท่วม (นาที)
  const duration = expectedLevel > 50 ? 180 : expectedLevel > 30 ? 120 : 60;

  // กำหนดระดับความรุนแรง
  let floodType: FloodPrediction['floodType'];
  if (expectedLevel >= 80) floodType = 'severe';
  else if (expectedLevel >= 50) floodType = 'major';
  else if (expectedLevel >= 30) floodType = 'moderate';
  else floodType = 'minor';

  // สร้างรายการสาเหตุ
  const causedBy: string[] = [];
  if (maxTideLevel >= THRESHOLDS.HIGH_TIDE_LEVEL) {
    causedBy.push(`น้ำทะเลหนุนสูง (${maxTideLevel.toFixed(2)} ม.)`);
  }
  if (tideData.tideStatus === 'น้ำเป็น') {
    causedBy.push(`ช่วงน้ำเป็น (${tideData.isWaxingMoon ? 'ข้างขึ้น' : 'ข้างแรม'} ${tideData.lunarPhaseKham} ค่ำ)`);
  }
  if (weatherData.main.pressure < THRESHOLDS.LOW_PRESSURE) {
    causedBy.push(`ความกดอากาศต่ำ (${weatherData.main.pressure} hPa)`);
  }
  if (weatherData.wind.speed >= THRESHOLDS.HIGH_WIND_SPEED) {
    causedBy.push(`ลมแรง (${weatherData.wind.speed} m/s)`);
  }

  // พื้นที่ได้รับผลกระทบ
  const affectedAreas: string[] = [];
  if (expectedLevel >= 10) affectedAreas.push('ท่าเรือและชายฝั่ง');
  if (expectedLevel >= 20) affectedAreas.push('ถนนริมน้ำ');
  if (expectedLevel >= 30) affectedAreas.push('บ้านเรือนริมคลอง');
  if (expectedLevel >= 50) affectedAreas.push('พื้นที่ต่ำใกล้ทะเล');
  if (expectedLevel >= 80) affectedAreas.push('ชุมชนริมชายฝั่งทั้งหมด');

  // คำนวณความมั่นใจ
  const confidence = Math.max(50, Math.min(90, 70 + (causedBy.length * 5)));

  return {
    expectedLevel,
    peakTime,
    duration,
    affectedAreas,
    floodType,
    causedBy,
    confidence,
  };
}

/**
 * สร้างการเตือนภัยล่วงหน้า
 */
function createAdvanceWarnings(
  tideData: TideData,
  weatherData: WeatherData,
  disasters: DisasterInfo[],
  date: Date
): AdvanceWarning[] {
  const warnings: AdvanceWarning[] = [];
  const now = new Date();

  // หาเวลาน้ำขึ้นสูงสุดถัดไป
  for (const event of tideData.tideEvents) {
    if (event.type === 'high' && event.level >= THRESHOLDS.HIGH_TIDE_LEVEL) {
      const [hour, minute] = event.time.split(':').map(Number);
      const eventTime = new Date(date);
      eventTime.setHours(hour, minute, 0, 0);

      // คำนวณเวลาที่เหลือ
      const timeDiffMs = eventTime.getTime() - now.getTime();
      const hoursUntil = Math.floor(timeDiffMs / (1000 * 60 * 60));
      const minutesUntil = Math.floor((timeDiffMs % (1000 * 60 * 60)) / (1000 * 60));

      // ถ้ายังไม่ถึงเวลา
      if (timeDiffMs > 0) {
        const timeUntil = hoursUntil > 0
          ? `${hoursUntil} ชั่วโมง ${minutesUntil} นาที`
          : `${minutesUntil} นาที`;

        // กำหนดระดับเตือนภัย
        let warningLevel: AdvanceWarning['warningLevel'] = 'watch';
        if (event.level >= THRESHOLDS.CRITICAL_TIDE_LEVEL) {
          warningLevel = timeDiffMs < 3600000 ? 'emergency' : 'warning';
        } else if (event.level >= THRESHOLDS.HIGH_TIDE_LEVEL) {
          warningLevel = timeDiffMs < 3600000 ? 'warning' : 'advisory';
        }

        // สร้างคำแนะนำการปฏิบัติ
        const actionRequired: string[] = [];
        if (warningLevel === 'emergency') {
          actionRequired.push('อพยพออกจากพื้นที่ต่ำทันที');
          actionRequired.push('ติดต่อหน่วยกู้ภัยถ้าต้องการความช่วยเหลือ');
        } else if (warningLevel === 'warning') {
          actionRequired.push('ย้ายสิ่งของมีค่าไปที่สูง');
          actionRequired.push('เตรียมเส้นทางอพยพ');
          actionRequired.push('ติดตามสถานการณ์อย่างใกล้ชิด');
        } else if (warningLevel === 'advisory') {
          actionRequired.push('ติดตามระดับน้ำ');
          actionRequired.push('เตรียมพร้อมย้ายสิ่งของถ้าจำเป็น');
        } else {
          actionRequired.push('ติดตามข่าวสารสภาพอากาศ');
        }

        warnings.push({
          type: 'high_tide',
          warningLevel,
          title: `น้ำหนุนสูง ${event.level.toFixed(2)} ม.`,
          message: `คาดว่าจะมีน้ำหนุนสูงระดับ ${event.level.toFixed(2)} เมตร ในเวลา ${event.time} น.`,
          timeUntil,
          expectedTime: event.time,
          actionRequired,
        });
      }
    }
  }

  // เตือนลมแรง
  if (weatherData.wind.speed >= THRESHOLDS.HIGH_WIND_SPEED) {
    warnings.push({
      type: 'storm_surge',
      warningLevel: weatherData.wind.speed >= THRESHOLDS.STORM_WIND_SPEED ? 'warning' : 'advisory',
      title: `ลมแรง ${weatherData.wind.speed} m/s`,
      message: `ตรวจพบความเร็วลม ${weatherData.wind.speed} m/s อาจเกิดคลื่นลมแรงได้`,
      timeUntil: 'กำลังเกิดขึ้น',
      expectedTime: 'ปัจจุบัน',
      actionRequired: [
        'หลีกเลี่ยงการออกทะเล',
        'จอดเรือในที่กำบังลม',
        'ไม่เข้าใกล้ชายฝั่งที่มีคลื่นแรง',
      ],
    });
  }

  return warnings;
}

/**
 * สร้างข้อมูลประวัติศาสตร์
 */
function createHistoricalContext(
  tideData: TideData,
  monsoon: { season: 'southwest' | 'northeast' | 'transition'; riskMultiplier: number },
  date: Date
): HistoricalContext | null {
  // สร้างข้อมูลประวัติศาสตร์อ้างอิง (ในระบบจริงควรดึงจาก database)
  const month = date.getMonth() + 1;

  // ข้อมูลเหตุการณ์ในอดีต (ตัวอย่าง)
  const historicalEvents: HistoricalEvent[] = [];

  // เพิ่มข้อมูลตามฤดูกาล
  if (monsoon.season === 'northeast') {
    historicalEvents.push({
      date: '2554-11',
      eventType: 'flood',
      severity: 'รุนแรง',
      maxWaterLevel: 3.5,
      description: 'น้ำท่วมใหญ่ภาคกลางและชายฝั่งอ่าวไทย',
    });
  }

  if (tideData.tideStatus === 'น้ำเป็น') {
    historicalEvents.push({
      date: '2567-10',
      eventType: 'high_tide',
      severity: 'ปานกลาง',
      maxWaterLevel: 2.8,
      description: 'น้ำทะเลหนุนสูงช่วงน้ำเป็นเดือนตุลาคม',
    });
  }

  // กำหนดความถี่โดยเฉลี่ย
  let averageOccurrence = 'น้อย';
  if (tideData.isSeaLevelHighToday) {
    averageOccurrence = 'ประมาณ 2-4 ครั้งต่อเดือน ในช่วงน้ำเป็น';
  }

  // รูปแบบตามฤดูกาล
  let seasonalPattern = '';
  if (monsoon.season === 'southwest') {
    seasonalPattern = 'มรสุมตะวันตกเฉียงใต้: ทะเลอันดามันมีคลื่นลมแรง ชายฝั่งตะวันตกเสี่ยงสูงกว่า';
  } else if (monsoon.season === 'northeast') {
    seasonalPattern = 'มรสุมตะวันออกเฉียงเหนือ: อ่าวไทยมีคลื่นลมแรง ชายฝั่งตะวันออกเสี่ยงสูงกว่า โดยเฉพาะเดือน พ.ย.-ม.ค.';
  } else {
    seasonalPattern = 'ช่วงเปลี่ยนผ่านมรสุม: สภาพอากาศไม่แน่นอน ควรติดตามพยากรณ์อย่างใกล้ชิด';
  }

  // หาเหตุการณ์ใหญ่ล่าสุด
  const lastMajorEvent = historicalEvents.length > 0 ? historicalEvents[0] : null;

  return {
    similarEvents: historicalEvents,
    lastMajorEvent,
    averageOccurrence,
    seasonalPattern,
  };
}

/**
 * แปลงระดับความเสี่ยงเป็นภาษาไทย
 */
export function getRiskLevelText(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'วิกฤต';
    case 'high': return 'สูง';
    case 'medium': return 'ปานกลาง';
    case 'low': return 'ต่ำ';
  }
}

/**
 * ได้สีสำหรับระดับความเสี่ยง
 */
export function getRiskLevelColor(level: RiskLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case 'critical':
      return { bg: 'bg-red-600', text: 'text-red-700', border: 'border-red-500' };
    case 'high':
      return { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-500' };
    case 'medium':
      return { bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-500' };
    case 'low':
      return { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-500' };
  }
}

/**
 * แปลงระดับเตือนภัยเป็นภาษาไทย
 */
export function getWarningLevelText(level: AdvanceWarning['warningLevel']): string {
  switch (level) {
    case 'emergency': return 'ฉุกเฉิน';
    case 'warning': return 'เตือนภัย';
    case 'advisory': return 'ระวังภัย';
    case 'watch': return 'เฝ้าระวัง';
  }
}

/**
 * ได้สีสำหรับระดับเตือนภัย
 */
export function getWarningLevelColor(level: AdvanceWarning['warningLevel']): string {
  switch (level) {
    case 'emergency': return 'bg-red-600';
    case 'warning': return 'bg-orange-500';
    case 'advisory': return 'bg-yellow-500';
    case 'watch': return 'bg-blue-500';
  }
}

/**
 * แปลงระดับน้ำท่วมเป็นภาษาไทย
 */
export function getFloodTypeText(type: FloodPrediction['floodType']): string {
  switch (type) {
    case 'severe': return 'รุนแรงมาก';
    case 'major': return 'รุนแรง';
    case 'moderate': return 'ปานกลาง';
    case 'minor': return 'เล็กน้อย';
  }
}

