const express = require("express");
const axios = require("axios");

const router = express.Router();
const GOOGLE_PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";
const GOOGLE_PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";
const GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";

function getGoogleMapsKey() {
  return process.env.GOOGLE_MAPS_API_KEY;
}

router.post("/autocomplete", async (req, res) => {
  const { input, sessionToken } = req.body;

  if (!input?.trim() || input.trim().length < 3) {
    return res.json({ data: [] });
  }

  const apiKey = getGoogleMapsKey();

  if (!apiKey) {
    return res.json({
      data: [],
      message: "Google Maps API key is not configured.",
    });
  }

  try {
    const response = await axios.post(
      GOOGLE_PLACES_AUTOCOMPLETE_URL,
      {
        input: input.trim(),
        sessionToken,
        includedRegionCodes: ["in"],
        locationBias: {
          circle: {
            center: {
              latitude: 12.9716,
              longitude: 77.5946,
            },
            radius: 50000,
          },
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat",
        },
      }
    );

    const suggestions = (response.data.suggestions || [])
      .map((item) => item.placePrediction)
      .filter(Boolean)
      .map((prediction) => ({
        placeId: prediction.placeId,
        text: prediction.text?.text || "",
        mainText: prediction.structuredFormat?.mainText?.text || prediction.text?.text || "",
        secondaryText: prediction.structuredFormat?.secondaryText?.text || "",
      }));

    res.json({ data: suggestions });
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Unable to fetch autocomplete suggestions",
    });
  }
});

router.post("/details", async (req, res) => {
  const { placeId, sessionToken } = req.body;

  if (!placeId?.trim()) {
    return res.status(400).json({ message: "Place ID is required" });
  }

  const apiKey = getGoogleMapsKey();

  if (!apiKey) {
    return res.status(400).json({ message: "Google Maps API key is not configured." });
  }

  try {
    const response = await axios.get(
      `${GOOGLE_PLACE_DETAILS_URL}/${placeId.trim()}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
        },
        params: {
          sessionToken,
        },
      }
    );

    res.json({
      placeId: response.data.id,
      label:
        response.data.formattedAddress ||
        response.data.displayName?.text ||
        "Selected office",
      displayName: response.data.displayName?.text || "",
      location: response.data.location,
    });
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Unable to fetch place details",
    });
  }
});

router.post("/reverse-geocode", async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return res.status(400).json({ message: "Latitude and longitude are required" });
  }

  const apiKey = getGoogleMapsKey();

  if (!apiKey) {
    return res.status(400).json({ message: "Google Maps API key is not configured." });
  }

  try {
    const response = await axios.get(GOOGLE_GEOCODING_URL, {
      params: {
        latlng: `${Number(latitude)},${Number(longitude)}`,
        key: apiKey,
      },
    });

    const result = response.data.results?.[0];

    if (!result) {
      return res.status(404).json({ message: "Unable to find an address for this location" });
    }

    res.json({
      label: result.formatted_address,
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Unable to reverse geocode location",
    });
  }
});

module.exports = router;
