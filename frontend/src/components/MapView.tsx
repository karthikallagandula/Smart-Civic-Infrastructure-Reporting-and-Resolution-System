import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Report } from '../types';
import { CATEGORY_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS, formatCoords } from '../utils/constants';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_CENTER: [number, number] = [17.3850, 78.4867];

function markerIcon(color: string, active = false): L.DivIcon {
  const size = active ? 20 : 15;
  return L.divIcon({
    className: '',
    html: `<div class="cc-marker" style="width:${size}px;height:${size}px;background:${color};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function popupContent(report: Report, onOpen?: (id: string) => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'cc-popup';
  const safe = (v: string) =>
    v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  el.innerHTML = `
    <h4>${safe(report.complaintId)}</h4>
    <div class="cc-row"><span>${safe(CATEGORY_LABELS[report.category])}</span></div>
    <div class="cc-row"><span>Priority</span><strong style="color:${PRIORITY_COLORS[report.priority]}">${PRIORITY_LABELS[report.priority]}</strong></div>
    <div class="cc-row"><span>Status</span><strong>${STATUS_LABELS[report.status]}</strong></div>
    <div class="cc-row"><span>${safe(report.address || formatCoords(report.latitude, report.longitude))}</span></div>
  `;
  if (onOpen) {
    const button = document.createElement('button');
    button.textContent = 'View details';
    button.addEventListener('click', () => onOpen(report.id));
    el.appendChild(button);
  }
  return el;
}

export interface MapViewProps {
  reports: Report[];
  height?: string;
  onOpenReport?: (id: string) => void;
  selectedId?: string | null;
  userLocation?: { lat: number; lng: number } | null;
}

export function MapView({ reports, height = '420px', onOpenReport, selectedId, userLocation }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onOpenRef = useRef(onOpenReport);
  onOpenRef.current = onOpenReport;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(DEFAULT_CENTER, 12);
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const valid = reports.filter((r) => r.latitude != null && r.longitude != null);
    valid.forEach((report) => {
      const active = report.id === selectedId;
      const marker = L.marker([report.latitude as number, report.longitude as number], {
        icon: markerIcon(PRIORITY_COLORS[report.priority], active),
        zIndexOffset: active ? 1000 : 0,
      });
      marker.bindPopup(popupContent(report, (id) => onOpenRef.current?.(id)));
      layer.addLayer(marker);
      if (active) marker.openPopup();
    });

    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: markerIcon('#3b82f6', true),
        zIndexOffset: 2000,
      });
      userMarker.bindPopup('<div class="cc-popup"><h4>You are here</h4></div>');
      layer.addLayer(userMarker);
    }

    if (valid.length > 0 || userLocation) {
      const bounds = L.latLngBounds(valid.map((r) => [r.latitude as number, r.longitude as number] as [number, number]));
      if (userLocation) bounds.extend([userLocation.lat, userLocation.lng]);
      map.fitBounds(bounds.pad(0.2), { maxZoom: 15 });
    }
  }, [reports, selectedId, userLocation]);

  return <div ref={containerRef} style={{ height }} className="w-full overflow-hidden rounded-lg" />;
}

export interface MapPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (value: { lat: number; lng: number }) => void;
  height?: string;
}

export function MapPicker({ value, onChange, height = '300px' }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(DEFAULT_CENTER, 13);
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    map.on('click', (event: L.LeafletMouseEvent) => {
      onChangeRef.current({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }
    const latlng: [number, number] = [value.lat, value.lng];
    if (!markerRef.current) {
      const marker = L.marker(latlng, { draggable: true, icon: markerIcon('#0b2545', true) }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
      });
      markerRef.current = marker;
      map.setView(latlng, Math.max(map.getZoom(), 15));
    } else {
      markerRef.current.setLatLng(latlng);
    }
  }, [value]);

  return (
    <div>
      <div ref={containerRef} style={{ height }} className="w-full overflow-hidden rounded-lg ring-1 ring-slate-200" />
      <p className="mt-1.5 text-xs text-slate-500">Tap the map to fine-tune the location, or drag the marker.</p>
    </div>
  );
}
