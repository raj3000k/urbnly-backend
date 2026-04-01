const normalizeStringArray = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];

const normalizeRoomInventory = (value) =>
  Array.isArray(value)
    ? value
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.type === "string" &&
            Number.isFinite(Number(item.count))
        )
        .map((item) => ({
          type: item.type.trim(),
          count: Number(item.count),
        }))
        .filter((item) => item.type && item.count > 0)
    : [];

const serializeProperty = (property, viewer) => {
  const residents = property.residents || [];
  const interestedCount = residents.length;
  const roommateSeekersCount = residents.filter((resident) =>
    Boolean(resident.lookingForRoommate)
  ).length;
  const normalizedCompany = viewer?.company?.trim().toLowerCase();

  const colleagues = normalizedCompany
    ? residents.filter(
        (resident) =>
          resident.id !== viewer.id &&
          resident.company?.trim().toLowerCase() === normalizedCompany
      )
    : [];

  return {
    id: property.id,
    ownerId: property.ownerId,
    title: property.title,
    location: property.location,
    price: property.price,
    image: property.image,
    images: normalizeStringArray(property.images),
    available: property.available,
    verified: property.verified,
    distance: property.distance,
    rating: property.rating,
    reviewCount: property.reviewCount,
    capacity: property.capacity,
    totalRooms: property.totalRooms,
    occupiedRooms: property.occupiedRooms,
    freeRooms: Math.max((property.totalRooms || 0) - (property.occupiedRooms || 0), 0),
    roomInventory: normalizeRoomInventory(property.roomInventory),
    description: property.description,
    roomType: property.roomType,
    deposit: property.deposit,
    foodIncluded: property.foodIncluded,
    highlights: normalizeStringArray(property.highlights),
    amenities: normalizeStringArray(property.amenities),
    houseRules: normalizeStringArray(property.houseRules),
    owner: {
      name: property.owner?.name || "Unknown owner",
      phone: property.ownerPhone,
      responseTime: property.ownerResponseTime,
      role: property.ownerRole,
    },
    socialProof: {
      residentCount: residents.length,
      interestedCount,
      roommateSeekersCount,
      capacity: property.capacity,
      interestedLabel:
        property.capacity > 1
          ? `${Math.min(interestedCount, property.capacity)}/${property.capacity} interested`
          : interestedCount > 0
            ? "1 interested"
            : "No interest yet",
      colleaguesCount: colleagues.length,
      companyName: viewer?.company || "",
      colleagueNames: colleagues
        .slice(0, 3)
        .map((resident) => String(resident.name || "").trim().split(/\s+/)[0]),
    },
  };
};

const propertyInclude = {
  owner: true,
  residents: {
    select: {
      id: true,
      name: true,
      company: true,
      lookingForRoommate: true,
    },
  },
};

module.exports = {
  serializeProperty,
  propertyInclude,
};
