import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// import 'react-leaflet-markercluster/styles'
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  ArrowTopRightOnSquareIcon,
  CalendarDateRangeIcon,
  MapPinIcon,
  StarIcon,
} from "@heroicons/react/20/solid";
import selectedMarker from "./marker-iconred.png";
import MarkerClusterGroup from "react-leaflet-markercluster";
import SpinnerImage from "@/components/SpinnerImage";
// import 'react-leaflet-markercluster/styles'

const defaultIcon = L.icon({
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: selectedMarker.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapComponent = ({ markers }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef(null);
  // console.log(markers.map((item, i) => [item.lat, item.lon]));
  return (
    <>
      <MapContainer
        center={[6, 15]}
        zoom={3.5}
        style={{ height: "100vh", width: "100vw" }}
        ref={mapRef}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerClusterGroup showCoverageOnHover={false}>
          {markers &&
            markers.map(
              (item, i) =>
                item.coordinates && (
                  <Marker
                    key={i}
                    position={item.coordinates}
                    icon={item === selectedMarker ? selectedIcon : defaultIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedMarker(item);
                      },
                    }}
                  >
                    <Popup>
                      <div className="flex w-100 max-w-[300px] flex-col justify-center p-2">
                        {item.thumbnail && (
                          <div className="mb-2 overflow-hidden rounded-xl">
                            <SpinnerImage
                              src={item.thumbnail}
                              alt={`Thumbnail for marker ${i}`}
                              width={290}
                              height={150}
                              // className="rounded-xl"
                            />
                          </div>
                        )}
                        <h3 className="mb-1 w-full text-xl font-semibold">
                          {item.peuple ? "Les " + item.peuple : "No celebrite"}
                        </h3>
                        <div className="align-left mt-1 flex w-full flex-row items-center text-lg text-gray-700">
                          <MapPinIcon
                            width={20}
                            height={20}
                            className="mr-2 text-red-600"
                          />
                          {item.destination
                            ? item.destination
                            : "No destination"}
                        </div>
                        <div className="align-left mt-0 flex w-full flex-row items-center text-lg text-gray-700">
                          <StarIcon
                            width={20}
                            height={20}
                            className="mr-2 text-blue-500"
                          />
                          {item.celebrite ? item.celebrite : "No celebrite"}
                        </div>
                        <div className="align-left mt-0 flex w-full flex-row items-center text-lg text-gray-600">
                          <CalendarDateRangeIcon
                            width={20}
                            height={20}
                            className="mr-2 text-gray-500"
                          />
                          {item.diffusion_date
                            ? item.diffusion_date
                            : "No diffusion_date"}
                        </div>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex flex-row items-center justify-center rounded px-4 py-2 transition-colors hover:bg-blue-100"
                          >
                            <div className="text-lg text-blue-500">
                              Watch video
                            </div>
                            <ArrowTopRightOnSquareIcon
                              width={20}
                              height={20}
                              className="ml-2 text-blue-500"
                            />
                          </a>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ),
            )}
        </MarkerClusterGroup>
      </MapContainer>
    </>
  );
};

export default MapComponent;
