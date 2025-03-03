import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import selectedMarkerImg from "./marker-iconred.png";
import MarkerClusterGroup from "react-leaflet-markercluster";

const defaultIcon = L.icon({
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: selectedMarkerImg.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapComponent = ({ markers }) => {
  // Store the index of the selected marker.
  const [selectedIndex, setSelectedIndex] = useState(null);
  const markerRefs = useRef({});

  // When the selectedIndex changes, open the popup on the corresponding marker.
  useEffect(() => {
    if (selectedIndex !== null && markerRefs.current[selectedIndex]) {
      console.log('ss');
      markerRefs.current[selectedIndex].openPopup();
    }
  }, [selectedIndex]);

  return (
    <MapContainer center={[2, 15]} zoom={3.5} style={{ height: "100vh", width: "100vw" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerClusterGroup showCoverageOnHover={false}>
        {markers &&
          markers.map((item, i) => {
            if (item.lat && item.lon) {
              return (
                <Marker
                  key={i}
                  position={[item.lat, item.lon]}
                  icon={i === selectedIndex ? selectedIcon : defaultIcon}
                  eventHandlers={{
                    click: () => setSelectedIndex(i)
                  }}
                  ref={(el) => (markerRefs.current[i] = el)}
                >
                  <Popup>
                    <div className="flex flex-col items-center w-100 max-w-[300px] p-2">
                      <h3 className="text-xl font-semibold">{item.celebrite}</h3>
                      <div className="text-lg mt-1 text-gray-700 align-left w-100">
                        {item.peuple ? item.peuple : "No peuple"}
                      </div>
                      <div className="text-lg mt-1 text-gray-500 align-left w-100">
                        {item.destination ? item.destination : "No destination"}
                      </div>
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
              );
            }
            return null;
          })}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default MapComponent;
