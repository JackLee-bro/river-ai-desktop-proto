import dynamic from "next/dynamic";

import type { MapPoint } from "./MapView.client";

const MapView = dynamic(() => import("./MapView.client"), { ssr: false });

export type { MapPoint };
export default MapView;
