import { useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";


// ========================================
// FIX LEAFLET MARKER ICON
// ========================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// ========================================
// MAP CLICK HANDLER
// ========================================

const MapClickHandler = ({
  onLocationSelect,
}) => {

  useMapEvents({

    click: (event) => {

      const {
        lat,
        lng,
      } = event.latlng;


      onLocationSelect(
        lat,
        lng
      );

    },

  });


  return null;
};


// ========================================
// LOCATION PICKER
// ========================================

const LocationPicker = ({
  value,
  onChange,
}) => {

  // ========================================
  // STATE
  // ========================================

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  // ========================================
  // DEFAULT JHARKHAND LOCATION
  // ========================================

  const defaultPosition = [

    23.3441,

    85.3096,

  ];


  // ========================================
  // SEARCH LOCATION
  // ========================================

  const handleSearch = async () => {

    if (!search.trim()) {

      return;

    }


    try {

      setLoading(true);

      setMessage("");


      const response =
        await fetch(

          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            search
          )}&limit=1&countrycodes=in`

        );


      const results =
        await response.json();


      if (!results.length) {

        setMessage(
          "Location not found. Try another search."
        );

        return;

      }


      const result =
        results[0];


      const latitude =
        Number(result.lat);


      const longitude =
        Number(result.lon);


      // ========================================
      // EXTRACT ADDRESS
      // ========================================

      const address =
        result.display_name;


      const addressData =
        result.address || {};


      const district =
        addressData.state_district ||
        addressData.county ||
        "";


      const state =
        addressData.state ||
        "Jharkhand";


      const pincode =
        addressData.postcode ||
        "";


      // ========================================
      // SEND LOCATION TO PARENT
      // ========================================

      onChange({

        address,

        district,

        state,

        pincode,

        latitude,

        longitude,

      });


    } catch (error) {

      console.error(
        "Location search error:",
        error
      );


      setMessage(
        "Unable to search location."
      );

    } finally {

      setLoading(false);

    }

  };


  // ========================================
  // SELECT MAP LOCATION
  // ========================================

  const handleLocationSelect = async (
    latitude,
    longitude
  ) => {

    try {

      setLoading(true);

      setMessage("");


      const response =
        await fetch(

          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`

        );


      const result =
        await response.json();


      const addressData =
        result.address || {};


      const address =
        result.display_name ||
        "";


      const district =
        addressData.state_district ||
        addressData.county ||
        "";


      const state =
        addressData.state ||
        "Jharkhand";


      const pincode =
        addressData.postcode ||
        "";


      onChange({

        address,

        district,

        state,

        pincode,

        latitude,

        longitude,

      });


    } catch (error) {

      console.error(
        "Reverse geocoding error:",
        error
      );


      setMessage(
        "Unable to identify this location."
      );

    } finally {

      setLoading(false);

    }

  };


  // ========================================
  // USE CURRENT LOCATION
  // ========================================

  const handleCurrentLocation = () => {

    if (!navigator.geolocation) {

      setMessage(
        "Geolocation is not supported by your browser."
      );

      return;

    }


    setLoading(true);

    setMessage("");


    navigator.geolocation.getCurrentPosition(

      (position) => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;


        handleLocationSelect(
          latitude,
          longitude
        );

      },


      () => {

        setLoading(false);

        setMessage(
          "Unable to access your current location."
        );

      }

    );

  };


  // ========================================
  // CURRENT MAP POSITION
  // ========================================

  const mapPosition =

    value?.latitude &&
    value?.longitude

      ? [
          value.latitude,
          value.longitude,
        ]

      : defaultPosition;


  // ========================================
  // UI
  // ========================================

  return (

    <div className="space-y-4">


      {/* ========================================
          SEARCH
      ======================================== */}

      <div>

        <label className="mb-2 block text-sm font-semibold text-[#315d56]">

          Search Location

        </label>


        <div className="flex w-full items-stretch gap-2">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                event.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Search location (e.g. Harmu Road, Ranchi)..."
            className="min-w-0 flex-1 rounded-xl border border-[#dbe5df] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb] sm:px-4 sm:py-3"
          />

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="shrink-0 rounded-xl bg-[#0b514a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#073f3a] disabled:cursor-not-allowed disabled:bg-[#8fb5ad] sm:px-5 sm:py-3"
          >
            {loading ? "Searching..." : "🔍 Search"}
          </button>
        </div>

      </div>


      {/* ========================================
          CURRENT LOCATION
      ======================================== */}

      <button
        type="button"
        onClick={handleCurrentLocation}
        disabled={loading}
        className="w-full rounded-lg border border-[#bcd9cf] bg-[#e9f4f0] px-4 py-3 font-semibold text-[#087f70] transition hover:bg-[#d8ebe4] disabled:cursor-not-allowed"
      >

        📍 Use My Current Location

      </button>


      {/* ========================================
          MAP
      ======================================== */}

      <div className="overflow-hidden rounded-xl border border-[#dbe5df]">

        <MapContainer
          center={mapPosition}
          zoom={13}
          scrollWheelZoom={true}
          className="h-80 w-full"
        >

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          <MapClickHandler
            onLocationSelect={
              handleLocationSelect
            }
          />


          {value?.latitude &&
            value?.longitude && (

              <Marker
                position={[
                  value.latitude,
                  value.longitude,
                ]}
              />

            )}

        </MapContainer>

      </div>


      {/* ========================================
          INSTRUCTION
      ======================================== */}

      <p className="text-xs text-[#71827c]">

        Search for a location, use your current
        location, or click directly on the map.

      </p>


      {/* ========================================
          SELECTED LOCATION
      ======================================== */}

      {value?.address && (

        <div className="rounded-xl border border-[#bcd9cf] bg-[#e9f4f0] p-4">

          <p className="text-sm font-semibold text-[#0a4f47]">

            📍 Selected Location

          </p>


          <p className="mt-1 text-sm text-[#087f70]">

            {value.address}

          </p>


          {value.district && (

            <p className="mt-1 text-xs text-[#087f70]">

              District: {value.district}

            </p>

          )}


          <p className="mt-1 text-xs text-[#087f70]">

            Coordinates:{" "}

            {value.latitude?.toFixed(6)},{" "}

            {value.longitude?.toFixed(6)}

          </p>

        </div>

      )}


      {/* ========================================
          MESSAGE
      ======================================== */}

      {message && (

        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">

          {message}

        </p>

      )}

    </div>

  );

};


export default LocationPicker;