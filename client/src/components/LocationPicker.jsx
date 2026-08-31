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

        <label className="mb-2 block text-sm font-semibold text-slate-700">

          Search Location

        </label>


        <div className="flex gap-2">

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
            placeholder="Example: Harmu Road, Ranchi"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />


          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >

            Search

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
        className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed"
      >

        📍 Use My Current Location

      </button>


      {/* ========================================
          MAP
      ======================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-300">

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

      <p className="text-xs text-slate-500">

        Search for a location, use your current
        location, or click directly on the map.

      </p>


      {/* ========================================
          SELECTED LOCATION
      ======================================== */}

      {value?.address && (

        <div className="rounded-xl border border-green-200 bg-green-50 p-4">

          <p className="text-sm font-semibold text-green-800">

            📍 Selected Location

          </p>


          <p className="mt-1 text-sm text-green-700">

            {value.address}

          </p>


          {value.district && (

            <p className="mt-1 text-xs text-green-600">

              District: {value.district}

            </p>

          )}


          <p className="mt-1 text-xs text-green-600">

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