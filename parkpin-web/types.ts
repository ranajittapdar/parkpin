
export interface ParkingData {
  latitude: number;
  longitude: number;
  timestamp: number;
  notes?: string;
  photo?: string; // base64 string
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARKED = 'PARKED',
  LOADING = 'LOADING',
  ERROR = 'ERROR'
}
