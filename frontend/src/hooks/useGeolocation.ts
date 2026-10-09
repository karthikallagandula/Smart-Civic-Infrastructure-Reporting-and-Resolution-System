import { useCallback, useState } from 'react';

export interface GeoResult {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback((): Promise<GeoResult | null> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setError('Geolocation is not supported by this browser. Please pick the location on the map instead.');
        resolve(null);
        return;
      }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result: GeoResult = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy),
          };
          setPosition(result);
          setLoading(false);
          resolve(result);
        },
        (err) => {
          const message =
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was denied. You can still select the location manually on the map.'
              : 'Could not get your current location. Please select it manually on the map.';
          setError(message);
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  return { position, loading, error, request, setPosition };
}
