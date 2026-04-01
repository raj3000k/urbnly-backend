const bcrypt = require("bcryptjs");
const prisma = require("../src/lib/prisma");

async function main() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Visit", "Booking", "Wishlist", "Property", "User" RESTART IDENTITY CASCADE;'
  );

  const hash = async (value) => bcrypt.hash(value, 10);

  const owners = [
    {
      id: "seed-owner-1",
      name: "Nandini Rao",
      email: "nandini@urbanlyhost.com",
      role: "owner",
      company: "Urbanly Hosts",
      lookingForRoommate: false,
      preferences: null,
      password: await hash("password123"),
    },
    {
      id: "seed-owner-2",
      name: "Rahul Shetty",
      email: "rahul@urbanlyhost.com",
      role: "owner",
      company: "Urbanly Hosts",
      lookingForRoommate: false,
      preferences: null,
      password: await hash("password123"),
    },
    {
      id: "seed-owner-3",
      name: "Priya Menon",
      email: "priya@urbanlyhost.com",
      role: "owner",
      company: "Urbanly Hosts",
      lookingForRoommate: false,
      preferences: null,
      password: await hash("password123"),
    },
  ];

  for (const owner of owners) {
    await prisma.user.create({ data: owner });
  }

  const properties = [
    {
      id: "1",
      ownerId: "seed-owner-1",
      title: "Local Square PG",
      location: "Whitefield",
      price: 12000,
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
      ],
      available: true,
      verified: true,
      distance: "2.5 km",
      rating: 4.7,
      reviewCount: 128,
      capacity: 2,
      totalRooms: 6,
      occupiedRooms: 4,
      roomInventory: [
        { type: "Single room", count: 2 },
        { type: "Twin sharing", count: 3 },
        { type: "Studio", count: 1 },
      ],
      description:
        "A bright co-living space designed for young professionals who want a shorter commute, reliable housekeeping, and a social but calm weekday routine.",
      roomType: "Single and twin sharing",
      deposit: 18000,
      foodIncluded: true,
      highlights: [
        "Daily housekeeping",
        "Biometric entry",
        "High-speed WiFi",
        "Rooftop work lounge",
      ],
      amenities: [
        "WiFi",
        "AC",
        "Power Backup",
        "Laundry",
        "Housekeeping",
        "Attached Bathroom",
      ],
      houseRules: [
        "Guests allowed until 9 PM",
        "No loud music after 10 PM",
        "One-month notice before move-out",
      ],
      ownerPhone: "+91 98765 43210",
      ownerResponseTime: "Usually replies in 15 mins",
      ownerRole: "Property manager",
    },
    {
      id: "2",
      ownerId: "seed-owner-2",
      title: "Urban Stay PG",
      location: "Marathahalli",
      price: 10000,
      image:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
      ],
      available: true,
      verified: false,
      distance: "3.8 km",
      rating: 4.2,
      reviewCount: 74,
      capacity: 3,
      totalRooms: 8,
      occupiedRooms: 5,
      roomInventory: [
        { type: "Twin sharing", count: 4 },
        { type: "Triple sharing", count: 3 },
        { type: "Single room", count: 1 },
      ],
      description:
        "Budget-friendly PG with practical essentials, a strong neighborhood food scene, and flexible room options for interns and early-career hires.",
      roomType: "Triple and twin sharing",
      deposit: 12000,
      foodIncluded: false,
      highlights: [
        "Walkable grocery stores",
        "Late-night security desk",
        "Fast bus access",
        "Community kitchen",
      ],
      amenities: [
        "WiFi",
        "Laundry",
        "CCTV",
        "Kitchen Access",
        "Parking",
        "Water Purifier",
      ],
      houseRules: [
        "Visitor entry with ID only",
        "Shared kitchen must be cleaned after use",
        "Electric appliances on approval",
      ],
      ownerPhone: "+91 99887 66554",
      ownerResponseTime: "Usually replies in 30 mins",
      ownerRole: "Owner",
    },
    {
      id: "3",
      ownerId: "seed-owner-3",
      title: "Local Square PG 2",
      location: "Whitefield",
      price: 14000,
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      ],
      available: true,
      verified: true,
      distance: "4 km",
      rating: 4.9,
      reviewCount: 186,
      capacity: 1,
      totalRooms: 5,
      occupiedRooms: 3,
      roomInventory: [
        { type: "Private room", count: 4 },
        { type: "Premium suite", count: 1 },
      ],
      description:
        "Premium Whitefield stay focused on quieter rooms, better work-from-home ergonomics, and polished common areas for residents who spend time indoors.",
      roomType: "Private rooms",
      deposit: 20000,
      foodIncluded: true,
      highlights: [
        "Private study nooks",
        "Gym access",
        "Weekend deep cleaning",
        "Women-friendly floor access",
      ],
      amenities: ["WiFi", "AC", "Gym", "Lift", "Housekeeping", "Meals"],
      houseRules: [
        "Quiet hours after 10:30 PM",
        "No smoking inside rooms",
        "Emergency contacts required at move-in",
      ],
      ownerPhone: "+91 98989 12121",
      ownerResponseTime: "Usually replies in 10 mins",
      ownerRole: "Community host",
    },
  ];

  for (const property of properties) {
    await prisma.property.create({ data: property });
  }

  const residents = [
    {
      id: "seed-user-1",
      name: "Aarav Shah",
      email: "aarav@infosys.com",
      role: "customer",
      company: "Infosys",
      currentProperty: { connect: { id: "1" } },
      lookingForRoommate: true,
      preferences: {
        sleepSchedule: "early_bird",
        cleanliness: "high",
        foodPreference: "veg",
        socialStyle: "balanced",
        workMode: "hybrid",
        budgetPreference: "14000",
      },
      password: await hash("password123"),
    },
    {
      id: "seed-user-2",
      name: "Megha Iyer",
      email: "megha@infosys.com",
      role: "customer",
      company: "Infosys",
      currentProperty: { connect: { id: "1" } },
      lookingForRoommate: true,
      preferences: {
        sleepSchedule: "early_bird",
        cleanliness: "high",
        foodPreference: "veg",
        socialStyle: "quiet",
        workMode: "office",
        budgetPreference: "13000",
      },
      password: await hash("password123"),
    },
    {
      id: "seed-user-3",
      name: "Rohan Bhat",
      email: "rohan@tcs.com",
      role: "customer",
      company: "TCS",
      currentProperty: { connect: { id: "2" } },
      lookingForRoommate: true,
      preferences: {
        sleepSchedule: "night_owl",
        cleanliness: "medium",
        foodPreference: "any",
        socialStyle: "social",
        workMode: "office",
        budgetPreference: "11000",
      },
      password: await hash("password123"),
    },
    {
      id: "seed-user-4",
      name: "Sana Khan",
      email: "sana@wipro.com",
      role: "customer",
      company: "Wipro",
      currentProperty: { connect: { id: "3" } },
      lookingForRoommate: false,
      preferences: {
        sleepSchedule: "early_bird",
        cleanliness: "high",
        foodPreference: "eggetarian",
        socialStyle: "balanced",
        workMode: "hybrid",
        budgetPreference: "15000",
      },
      password: await hash("password123"),
    },
    {
      id: "seed-user-5",
      name: "Dev Patel",
      email: "dev@infosys.com",
      role: "customer",
      company: "Infosys",
      currentProperty: { connect: { id: "3" } },
      lookingForRoommate: false,
      preferences: {
        sleepSchedule: "early_bird",
        cleanliness: "high",
        foodPreference: "veg",
        socialStyle: "balanced",
        workMode: "hybrid",
        budgetPreference: "14500",
      },
      password: await hash("password123"),
    },
  ];

  for (const user of residents) {
    await prisma.user.create({ data: user });
  }

  await prisma.visit.createMany({
    data: [
      {
        id: "seed-visit-1",
        userId: "seed-user-1",
        propertyId: "1",
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: "confirmed",
        phone: "+91 98765 00111",
        notes: "Would like to see the twin-sharing room and work lounge.",
      },
      {
        id: "seed-visit-2",
        userId: "seed-user-3",
        propertyId: "2",
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 36),
        status: "pending",
        phone: "+91 99880 11223",
        notes: "Coming after office hours if possible.",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
