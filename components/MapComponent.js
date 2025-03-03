import React, { useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// import 'react-leaflet-markercluster/styles'
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import selectedMarker from './marker-iconred.png';
import MarkerClusterGroup from "react-leaflet-markercluster";
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

      <MapContainer center={[2, 15]} zoom={3.5} style={{ height: "100vh", width: "100vw" }} ref={mapRef}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerClusterGroup showCoverageOnHover={false} >
        {markers && markers.map((item, i) => (
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
                <div className="flex flex-col items-center w-100 max-w-[300px] p-2">
                  <h3 className="text-xl font-semibold ">{item.peuple ? item.peuple : "No peuple"}</h3>
                  <div className="text-lg mt-1 text-gray-700 align-left w-100">{item.celebrite ? item.celebrite : "No peuple"}</div>
                  <div className="text-lg mt-1 text-gray-500 align-left w-100">{item.destination ? item.destination : "No destination"}</div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 mt-2 rounded hover:bg-blue-100 transition-colors flex items-center justify-between w-[160px]"
                  >
                    <div className="text-lg">Watch video</div>
                    <ArrowTopRightOnSquareIcon width={20} height={20} className="ml-1" />
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        ))}
        </MarkerClusterGroup>
      </MapContainer>
    </>
  );
};

export default MapComponent;