import mongoose from "mongoose";
import dotenv from "dotenv";
import Place from "../models/Place";
import Sport from "../models/Sport";

dotenv.config();

const rawData = [
  {
    name: "Campo Piazza Venezia",
    sport: "Basket",
    lat: 46.068349,
    lng: 11.128556,
  },
  {
    name: "Piastra Polivalente La Clarina",
    sport: "Basket",
    lat: 46.052779,
    lng: 11.125954,
  },
  {
    name: "Campetto Parco di Melta",
    sport: "Basket",
    lat: 46.097918,
    lng: 11.117626,
  },
  {
    name: "Campo Giardino Canova",
    sport: "Basket",
    lat: 46.100338,
    lng: 11.110078,
  },
  {
    name: "Campo Giardino Canova",
    sport: "Calcio",
    lat: 46.099601,
    lng: 11.109761,
  },
  {
    name: "Campetto via Valnigra",
    sport: "Basket",
    lat: 46.051517,
    lng: 11.143656,
  },
  {
    name: "Campo Parco Enzo Tortora",
    sport: "Basket",
    lat: 46.042853,
    lng: 11.1318,
  },
  {
    name: "Campo Parco Enzo Tortora",
    sport: "Pallavolo",
    lat: 46.043146,
    lng: 11.131637,
  },
  {
    name: "Campo Man Malpensada",
    sport: "Calcio",
    lat: 46.042874,
    lng: 11.132927,
  },
  {
    name: "Campo parco di Ravina",
    sport: "Basket",
    lat: 46.037529,
    lng: 11.110179,
  },
  {
    name: "Campo giardino Elsa Conci",
    sport: "Basket",
    lat: 46.0528,
    lng: 11.125952,
  },
  {
    name: "Campo via della Resistenza Povo",
    sport: "Basket",
    lat: 46.072141,
    lng: 11.162452,
  },
  { name: "Campo Marnighe", sport: "Basket", lat: 46.078405, lng: 11.141914 },
  {
    name: "Padel Trento Arena",
    sport: "Padel",
    lat: 46.075951,
    lng: 11.104666,
  },
  {
    name: "Campo Giardino Rosanna Carrozzini",
    sport: "Basket",
    lat: 46.039266,
    lng: 11.128663,
  },
  {
    name: "Campo Giardino Rosanna Carrozzini",
    sport: "Pallavolo",
    lat: 46.039268,
    lng: 11.128665,
  },
  {
    name: "Campo Giardino Rosanna Carrozzini",
    sport: "Pallavolo",
    lat: 46.03885,
    lng: 11.128863,
  },
  {
    name: "Campo Giardino Rosanna Carrozzini",
    sport: "Bocce",
    lat: 46.03887,
    lng: 11.128865,
  },
  {
    name: "Tavoli Parco di Melta",
    sport: "Ping pong",
    lat: 46.097804,
    lng: 11.114601,
  },
  {
    name: "Campo Parco Gocciadoro",
    sport: "Pallavolo",
    lat: 46.057001,
    lng: 11.136868,
  },
  {
    name: "Campo Parco Gocciadoro",
    sport: "Ping pong",
    lat: 46.056867,
    lng: 11.136917,
  },
  {
    name: "Campo Giardino Massimiliano d'Asburgo",
    sport: "Basket",
    lat: 46.080144,
    lng: 11.113983,
  },
  {
    name: "Campo Parco di Mattarello",
    sport: "Basket",
    lat: 46.007217,
    lng: 11.129627,
  },
  {
    name: "Campo Parco di Mattarello",
    sport: "Pallavolo",
    lat: 46.006938,
    lng: 11.12943,
  },
  {
    name: "Campo Parco di Mattarello",
    sport: "Bocce",
    lat: 46.007316,
    lng: 11.130723,
  },
];

const seedPlaces = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const sports = await Sport.find();
    console.log(`Found ${sports.length} sports in database.`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const data of rawData) {
      const sport = sports.find(
        (s) => s.name.toLowerCase() === data.sport.toLowerCase(),
      );

      if (!sport) {
        console.warn(
          `Sport '${data.sport}' not found in database for place '${data.name}'. Skipping.`,
        );
        skippedCount++;
        continue;
      }

      const existingPlace = await Place.findOne({
        name: data.name,
        "position.lat": data.lat,
        "position.lng": data.lng,
      });

      if (existingPlace) {
        console.log(`Place '${data.name}' already exists. Skipping.`);
        skippedCount++;
        continue;
      }

      await Place.create({
        name: data.name,
        position: {
          lat: data.lat,
          lng: data.lng,
        },
        sport: sport._id,
      });

      insertedCount++;
    }

    console.log(
      `Finished processing. Inserted: ${insertedCount}, Skipped: ${skippedCount}.`,
    );
  } catch (error) {
    console.error("Error seeding places:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedPlaces();
