export type RegionId =
  | "scotland"
  | "north-east"
  | "north-west"
  | "yorkshire-humber"
  | "east-midlands"
  | "west-midlands"
  | "east-england"
  | "london"
  | "south-east"
  | "south-west"
  | "wales"

export type RegionalDefinition = {
  id: RegionId
  name: string
  nationalShare: number
  forecastFactor: number
  yesterdayChange: number
  renewableShare: number
  carbonIntensity: number
  consumers: {
    residential: number
    industrial: number
    commercial: number
  }
}

// Simplified operational regions and deterministic telemetry assumptions.
// Replace this module when a regional demand and boundary API is available.
export const regionalDefinitions: RegionalDefinition[] = [
  {
    id: "scotland",
    name: "Scotland",
    nationalShare: 0.102,
    forecastFactor: 0.98,
    yesterdayChange: -0.8,
    renewableShare: 67,
    carbonIntensity: 74,
    consumers: { residential: 35, industrial: 38, commercial: 27 },
  },
  {
    id: "north-east",
    name: "North East",
    nationalShare: 0.041,
    forecastFactor: 1.03,
    yesterdayChange: 1.2,
    renewableShare: 42,
    carbonIntensity: 118,
    consumers: { residential: 36, industrial: 39, commercial: 25 },
  },
  {
    id: "north-west",
    name: "North West",
    nationalShare: 0.112,
    forecastFactor: 1.04,
    yesterdayChange: 2.1,
    renewableShare: 34,
    carbonIntensity: 151,
    consumers: { residential: 32, industrial: 42, commercial: 26 },
  },
  {
    id: "yorkshire-humber",
    name: "Yorkshire & Humber",
    nationalShare: 0.081,
    forecastFactor: 1.02,
    yesterdayChange: 1.6,
    renewableShare: 38,
    carbonIntensity: 139,
    consumers: { residential: 31, industrial: 43, commercial: 26 },
  },
  {
    id: "east-midlands",
    name: "East Midlands",
    nationalShare: 0.073,
    forecastFactor: 1.01,
    yesterdayChange: 1.3,
    renewableShare: 29,
    carbonIntensity: 164,
    consumers: { residential: 32, industrial: 40, commercial: 28 },
  },
  {
    id: "west-midlands",
    name: "West Midlands",
    nationalShare: 0.078,
    forecastFactor: 1.03,
    yesterdayChange: 2.4,
    renewableShare: 24,
    carbonIntensity: 177,
    consumers: { residential: 31, industrial: 41, commercial: 28 },
  },
  {
    id: "east-england",
    name: "East of England",
    nationalShare: 0.092,
    forecastFactor: 1.0,
    yesterdayChange: 1.0,
    renewableShare: 36,
    carbonIntensity: 131,
    consumers: { residential: 37, industrial: 29, commercial: 34 },
  },
  {
    id: "london",
    name: "London",
    nationalShare: 0.104,
    forecastFactor: 1.07,
    yesterdayChange: 3.2,
    renewableShare: 17,
    carbonIntensity: 186,
    consumers: { residential: 34, industrial: 12, commercial: 54 },
  },
  {
    id: "south-east",
    name: "South East",
    nationalShare: 0.133,
    forecastFactor: 1.05,
    yesterdayChange: 2.7,
    renewableShare: 25,
    carbonIntensity: 158,
    consumers: { residential: 42, industrial: 22, commercial: 36 },
  },
  {
    id: "south-west",
    name: "South West",
    nationalShare: 0.088,
    forecastFactor: 0.97,
    yesterdayChange: 0.6,
    renewableShare: 44,
    carbonIntensity: 112,
    consumers: { residential: 43, industrial: 25, commercial: 32 },
  },
  {
    id: "wales",
    name: "Wales",
    nationalShare: 0.096,
    forecastFactor: 0.99,
    yesterdayChange: -0.3,
    renewableShare: 49,
    carbonIntensity: 104,
    consumers: { residential: 34, industrial: 44, commercial: 22 },
  },
]
