"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

export type MapPoint = {
  id: string;
  label: string;
  position: [number, number];
  kind?: "station" | "alert";
};

type MapViewProps = {
  points: MapPoint[];
  height?: number | string;
};

const DEFAULT_CENTER: [number, number] = [35.1796, 129.0756];

const createStopIcon = (label: string, badge: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;font-family:Arial,Helvetica,sans-serif;">
        <div style="background:rgba(255,255,255,0.95);border:1px solid rgba(0,0,0,0.08);border-radius:10px;padding:4px 8px;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.12);max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${label}
        </div>
        <div style="margin-top:4px;background:rgba(0,0,0,0.55);color:#fff;border-radius:999px;padding:2px 8px;font-size:10px;font-weight:800;">
          ${badge}
        </div>
        <div style="margin-top:2px;font-size:24px;line-height:1;">📍</div>
      </div>
    `,
    iconAnchor: [12, 36],
  });

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    const coords = points.map((point) => [
      point.position[0],
      point.position[1],
    ]) as [number, number][];

    if (coords.length === 0) {
      map.setView(DEFAULT_CENTER, 12);
      return;
    }

    if (coords.length === 1) {
      map.setView(coords[0], 13);
      return;
    }

    map.fitBounds(coords, { padding: [30, 30] });
  }, [map, points]);

  return null;
}

export default function MapView({ points, height = "100%" }: MapViewProps) {
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div style={{ height: resolvedHeight }} className="h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <CircleMarker
          center={DEFAULT_CENTER}
          radius={10}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.35,
          }}
        />
        {points.map((point, index) => {
          const badge =
            points.length === 1
              ? "관측소"
              : index === 0
                ? "출발"
                : index === points.length - 1
                  ? "도착"
                  : `경유${index}`;
          return (
            <Marker
              key={point.id}
              position={[point.position[0], point.position[1]]}
              icon={createStopIcon(point.label, badge)}
            />
          );
        })}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
