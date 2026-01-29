export type Station = {
  id: string;
  name?: string;
  stationName?: string;
  stationNameEn?: string;
  codeNumber?: string;
  address?: string;
  river?: string;
  riverName?: string;
  basinName?: string;
  basinArea?: string;
  coords?: [number, number];
  latitude?: string;
  longitude?: string;
  latitudeDms?: string;
  longitudeDms?: string;
  category?: string;
  observationMethod?: string;
  observationStartDate?: string;
  transmissionMethod?: string;
  maxGaugeLevel?: string;
  flowMeasurementYn?: string;
  tidalInfluenceYn?: string;
  distFromMouthOrConfluence?: string;
  locationNote?: string;
  photoUrl?: string;
  photos?: {
    url: string;
    caption?: string | null;
    sortOrder?: number | null;
  }[];
  updatedAt?: string;
};

export type StationsResponse = {
  total: number;
  page: number;
  size: number;
  stations: Station[];
};
