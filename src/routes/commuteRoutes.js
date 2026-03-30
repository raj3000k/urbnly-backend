const express = require("express");
const axios = require("axios");
const properties = require("../data/properties");

const router = express.Router();
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const GOOGLE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

function getGoogleMapsKey() {
  return process.env.GOOGLE_MAPS_API_KEY;
}

function buildPropertyAddress(property) {
  return `${property.location}, Bengaluru, Karnataka, India`;
}

function inferDurationFromDistance(distanceText) {
  const numericDistance = Number.parseFloat(distanceText);

  if (!Number.isFinite(numericDistance)) {
    return "25 mins";
  }

  const minutes = Math.max(12, Math.round(numericDistance * 7));
  return `${minutes} mins`;
}

async function geocodeAddress(address, apiKey) {
  const response = await axios.get(GOOGLE_GEOCODE_URL, {
    params: {
      address,
      key: apiKey,
    },
  });

  if (response.data.status !== "OK" || !response.data.results?.length) {
    throw new Error(response.data.error_message || `Geocoding failed for ${address}`);
  }

  const location = response.data.results[0].geometry.location;
  return {
    latitude: location.lat,
    longitude: location.lng,
  };
}

async function computeRoute(origin, destination, apiKey, fallbackDistanceText) {
  const response = await axios.post(
    GOOGLE_ROUTES_URL,
    {
      origin: {
        location: {
          latLng: origin,
        },
      },
      destination: {
        location: {
          latLng: destination,
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      units: "METRIC",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
    }
  );

  const route = response.data.routes?.[0];

  if (!route) {
    throw new Error("No route returned");
  }

  const parsedDurationSeconds = Number.parseInt(
    String(route.duration || "0s").replace("s", ""),
    10
  );
  const distanceMeters = Number(route.distanceMeters);
  const hasDistanceMeters = Number.isFinite(distanceMeters) && distanceMeters > 0;
  const durationSeconds = Number.isFinite(parsedDurationSeconds)
    ? parsedDurationSeconds
    : Math.round((Number.parseFloat(fallbackDistanceText) || 3) * 7 * 60);
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const distanceText = hasDistanceMeters
    ? `${(distanceMeters / 1000).toFixed(1)} km`
    : fallbackDistanceText;

  return {
    distanceText,
    durationText: `${durationMinutes} mins`,
    distanceMeters: hasDistanceMeters ? distanceMeters : null,
    durationSeconds,
    source: "google",
  };
}

function isLatLng(value) {
  return (
    value &&
    typeof value.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude)
  );
}

router.post("/", async (req, res) => {
  const { officeLocation, officeCoordinates, propertyIds } = req.body;

  if (!officeLocation?.trim() && !isLatLng(officeCoordinates)) {
    return res
      .status(400)
      .json({ message: "Office location or office coordinates are required" });
  }

  const matchedProperties = Array.isArray(propertyIds) && propertyIds.length
    ? properties.filter((property) => propertyIds.includes(property.id))
    : properties;

  if (!matchedProperties.length) {
    return res.status(404).json({ message: "No matching properties found" });
  }

  const apiKey = getGoogleMapsKey();

  if (!apiKey) {
    const fallbackCommutes = matchedProperties.map((property) => ({
      propertyId: property.id,
      officeLocation: officeLocation.trim(),
      distanceText: property.distance,
      durationText: inferDurationFromDistance(property.distance),
      source: "fallback",
      status: "no_api_key",
    }));

    return res.json({
      officeLocation: officeLocation.trim(),
      source: "fallback",
      data: fallbackCommutes,
      message:
        "Google Maps API key is not configured yet, so fallback commute estimates are being used.",
    });
  }

  try {
    const origin = isLatLng(officeCoordinates)
      ? officeCoordinates
      : await geocodeAddress(officeLocation.trim(), apiKey);

    const data = await Promise.all(
      matchedProperties.map(async (property) => {
        const destination = await geocodeAddress(buildPropertyAddress(property), apiKey);
        const commute = await computeRoute(
          origin,
          destination,
          apiKey,
          property.distance
        );

        return {
          propertyId: property.id,
          officeLocation: officeLocation?.trim() || "Selected office",
          ...commute,
          status: "ok",
        };
      })
    );

    res.json({
      officeLocation: officeLocation.trim(),
      officeCoordinates: origin,
      source: "google",
      data,
    });
  } catch (error) {
    const fallbackCommutes = matchedProperties.map((property) => ({
      propertyId: property.id,
      officeLocation: officeLocation.trim(),
      distanceText: property.distance,
      durationText: inferDurationFromDistance(property.distance),
      source: "fallback",
      status: "lookup_failed",
    }));

    res.json({
      officeLocation: officeLocation.trim(),
      source: "fallback",
      data: fallbackCommutes,
      message:
        error instanceof Error
          ? error.message
          : "Unable to compute commute right now, fallback estimates were used instead.",
    });
  }
});

module.exports = router;
