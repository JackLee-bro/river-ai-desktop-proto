"use client";

import { useEffect } from "react";
import {
  AttributionControl,
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

type Stop = {
  id: string;
  keyword: string;
  placeName?: string;
  position?: { lat: number; lng: number };
};

type LeafletMapProps = {
  stops: Stop[];
};

const DEFAULT_CENTER = { lat: 35.1796, lng: 129.0756 };

const createStopIcon = (label: string, badge: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.95);border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:4px 8px;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.12);max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          <span style="overflow:hidden;text-overflow:ellipsis;">${label}</span>
          <span style="background:rgba(0,0,0,0.55);color:#fff;border-radius:999px;padding:2px 8px;font-size:10px;font-weight:800;line-height:1;">
            ${badge}
          </span>
        </div>
        <div style="margin-top:2px;font-size:24px;line-height:1;">📍</div>
      </div>
    `,
    iconAnchor: [12, 36],
  });

function FitBounds({ stops }: LeafletMapProps) {
  const map = useMap();

  useEffect(() => {
    const points = stops
      .map((stop) => stop.position)
      .filter((position): position is { lat: number; lng: number } => !!position)
      .map((position) => [position.lat, position.lng] as [number, number]);

    if (points.length === 0) {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 12);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.fitBounds(points, { padding: [30, 30] });
  }, [map, stops]);

  return null;
}

export default function LeafletMapClient({ stops }: LeafletMapProps) {
  const markers = stops
    .map((stop, index) => ({ stop, index }))
    .filter(({ stop }) => stop.position);

  return (
    <MapContainer
      center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
      zoom={12}
      scrollWheelZoom
      attributionControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <AttributionControl prefix="" position="bottomright" />
      <TileLayer
        url={`https://api.vworld.kr/req/wmts/1.0.0/${process.env.NEXT_PUBLIC_VWORLD_KEY ?? ""}/Base/{z}/{y}/{x}.png`}
        attribution="VWorld"
      />
      {markers.map(({ stop, index }) => {
        const badge =
          index === 0
            ? "출발"
            : index === stops.length - 1
              ? "도착"
              : `경유${index}`;
        const label = stop.placeName ?? stop.keyword ?? "선택된 위치";
        return (
          <Marker
            key={stop.id}
            position={[stop.position!.lat, stop.position!.lng]}
            icon={createStopIcon(label, badge)}
          />
        );
      })}
      <FitBounds stops={stops} />
    </MapContainer>
  );
}
