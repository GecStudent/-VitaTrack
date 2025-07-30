import { setCache, getCache } from '../../database/cache/redisCache';
import { getMetValue, MetValue } from './met-database';

/**
 * GPS data point structure
 */
export interface GpsDataPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  elevation?: number;
  speed?: number;
  heartRate?: number;
}

/**
 * Activity segment recognized from GPS or sensor data
 */
export interface ActivitySegment {
  activityType: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  distance?: number; // in meters
  averageSpeed?: number; // in m/s
  elevationGain?: number; // in meters
  averageHeartRate?: number;
  metValue?: number;
  caloriesBurned?: number;
  confidence: number; // 0-1 confidence score
}

/**
 * Calculate distance between two GPS points using the Haversine formula
 */
export function calculateDistance(point1: GpsDataPoint, point2: GpsDataPoint): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate speed between two GPS points
 */
export function calculateSpeed(point1: GpsDataPoint, point2: GpsDataPoint): number {
  const distance = calculateDistance(point1, point2); // in meters
  const timeDiff = (point2.timestamp.getTime() - point1.timestamp.getTime()) / 1000; // in seconds
  
  if (timeDiff <= 0) return 0;
  
  return distance / timeDiff; // in m/s
}

/**
 * Calculate elevation gain between two GPS points
 */
export function calculateElevationGain(point1: GpsDataPoint, point2: GpsDataPoint): number {
  if (!point1.elevation || !point2.elevation) return 0;
  
  const elevationDiff = point2.elevation - point1.elevation;
  return elevationDiff > 0 ? elevationDiff : 0; // Only count positive elevation changes
}

/**
 * Detect activity type based on speed and other factors
 */
export function detectActivityType(averageSpeed: number, elevationGain: number = 0): string {
  // Speed thresholds in m/s
  const speedInKmh = averageSpeed * 3.6; // Convert m/s to km/h
  
  if (speedInKmh < 2) return 'stationary';
  if (speedInKmh < 6) return 'walking';
  if (speedInKmh < 10) return 'jogging';
  if (speedInKmh < 20) return 'running';
  if (speedInKmh < 35) return 'cycling';
  return 'transport'; // Likely in a vehicle
}

/**
 * Map detected activity type to MET activity
 */
export function mapDetectedActivityToMet(activityType: string, speed: number): MetValue | undefined {
  const speedInKmh = speed * 3.6; // Convert m/s to km/h
  
  switch (activityType) {
    case 'walking':
      if (speedInKmh < 3) return getMetValue('walking_slow');
      if (speedInKmh < 5) return getMetValue('walking_moderate');
      return getMetValue('walking_brisk');
      
    case 'jogging':
      return getMetValue('jogging');
      
    case 'running':
      if (speedInKmh < 8) return getMetValue('running');
      if (speedInKmh < 12) return getMetValue('running');
      return getMetValue('running_fast');
      
    case 'cycling':
      if (speedInKmh < 15) return getMetValue('cycling_leisure');
      if (speedInKmh < 20) return getMetValue('cycling_moderate');
      return getMetValue('cycling_vigorous');
      
    case 'stationary':
      return getMetValue('stretching');
      
    default:
      return getMetValue('walking_moderate'); // Default fallback
  }
}

/**
 * Segment GPS data into distinct activities
 */
export function segmentActivities(gpsData: GpsDataPoint[], weightKg: number): ActivitySegment[] {
  if (gpsData.length < 2) return [];
  
  // Sort data by timestamp
  const sortedData = [...gpsData].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  const segments: ActivitySegment[] = [];
  let currentSegment: ActivitySegment | null = null;
  let segmentPoints: GpsDataPoint[] = [];
  
  // Process each GPS point
  for (let i = 1; i < sortedData.length; i++) {
    const prevPoint = sortedData[i - 1];
    const currentPoint = sortedData[i];
    
    // Calculate metrics between points
    const speed = calculateSpeed(prevPoint, currentPoint);
    const timeDiff = (currentPoint.timestamp.getTime() - prevPoint.timestamp.getTime()) / 1000; // in seconds
    
    // Skip if time difference is too large (gap in data)
    if (timeDiff > 300) { // 5 minutes gap
      if (currentSegment && segmentPoints.length > 1) {
        // Finalize current segment
        finalizeSegment(currentSegment, segmentPoints, weightKg);
        segments.push(currentSegment);
      }
      
      // Reset for new segment
      currentSegment = null;
      segmentPoints = [];
      continue;
    }
    
    // Detect activity type for this point
    const elevationGain = calculateElevationGain(prevPoint, currentPoint);
    const activityType = detectActivityType(speed, elevationGain);
    
    // If this is the first point or activity type changed, start a new segment
    if (!currentSegment || currentSegment.activityType !== activityType) {
      if (currentSegment && segmentPoints.length > 1) {
        // Finalize previous segment
        finalizeSegment(currentSegment, segmentPoints, weightKg);
        segments.push(currentSegment);
      }
      
      // Start new segment
      currentSegment = {
        activityType,
        startTime: prevPoint.timestamp,
        endTime: currentPoint.timestamp,
        duration: timeDiff / 60, // Convert to minutes
        confidence: 0.7, // Initial confidence
      };
      
      segmentPoints = [prevPoint, currentPoint];
    } else {
      // Continue current segment
      currentSegment.endTime = currentPoint.timestamp;
      currentSegment.duration += timeDiff / 60; // Add to duration in minutes
      segmentPoints.push(currentPoint);
    }
  }
  
  // Finalize the last segment
  if (currentSegment && segmentPoints.length > 1) {
    finalizeSegment(currentSegment, segmentPoints, weightKg);
    segments.push(currentSegment);
  }
  
  return segments;
}

/**
 * Finalize segment by calculating all metrics
 */
function finalizeSegment(segment: ActivitySegment, points: GpsDataPoint[], weightKg: number): void {
  // Calculate distance
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i - 1], points[i]);
  }
  segment.distance = totalDistance;
  
  // Calculate average speed
  segment.averageSpeed = totalDistance / (segment.duration * 60); // m/s
  
  // Calculate elevation gain
  let totalElevationGain = 0;
  for (let i = 1; i < points.length; i++) {
    totalElevationGain += calculateElevationGain(points[i - 1], points[i]);
  }
  segment.elevationGain = totalElevationGain;
  
  // Calculate average heart rate if available
  const heartRates = points.filter(p => p.heartRate).map(p => p.heartRate as number);
  if (heartRates.length > 0) {
    segment.averageHeartRate = heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length;
  }
  
  // Map to MET value
  const metActivity = mapDetectedActivityToMet(segment.activityType, segment.averageSpeed);
  if (metActivity) {
    segment.metValue = metActivity.met;
    
    // Calculate calories burned
    // Calories = MET * weight in kg * duration in hours
    segment.caloriesBurned = metActivity.met * weightKg * (segment.duration / 60);
  }
  
  // Adjust confidence based on data quality
  if (points.length > 10) {
    segment.confidence = Math.min(0.95, segment.confidence + 0.1);
  }
  if (segment.averageHeartRate) {
    segment.confidence = Math.min(0.98, segment.confidence + 0.1);
  }
}

/**
 * Validate calorie burn estimates by comparing different calculation methods
 */
export function validateCalorieBurn(
  metCalories: number,
  heartRateCalories: number | null,
  userWeight: number,
  duration: number
): {
  validatedCalories: number;
  confidence: number;
  method: string;
} {
  // If we don't have heart rate data, just use MET calculation
  if (!heartRateCalories) {
    return {
      validatedCalories: Math.round(metCalories),
      confidence: 0.7,
      method: 'met_only'
    };
  }
  
  // Calculate the difference between methods
  const difference = Math.abs(metCalories - heartRateCalories);
  const percentDifference = difference / ((metCalories + heartRateCalories) / 2);
  
  // If the methods are reasonably close, use the average
  if (percentDifference < 0.2) { // Less than 20% difference
    return {
      validatedCalories: Math.round((metCalories + heartRateCalories) / 2),
      confidence: 0.9,
      method: 'combined_average'
    };
  }
  
  // If there's a significant difference, prefer heart rate data if available
  // but cap it to reasonable limits
  const maxReasonableCalories = 15 * userWeight * (duration / 60); // ~15 kcal/kg/hour for very intense exercise
  
  if (heartRateCalories > maxReasonableCalories) {
    return {
      validatedCalories: Math.round(maxReasonableCalories),
      confidence: 0.6,
      method: 'capped_heart_rate'
    };
  }
  
  return {
    validatedCalories: Math.round(heartRateCalories),
    confidence: 0.8,
    method: 'heart_rate_preferred'
  };
}