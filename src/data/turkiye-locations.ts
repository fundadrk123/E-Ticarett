import locationsData from "./turkiye-locations.json";

export interface LocationDistrict {
  name: string;
  postalCode: string;
}

export interface LocationCity {
  code: string;
  name: string;
  districts: LocationDistrict[];
}

export const turkiyeLocations = locationsData as LocationCity[];

export function getCityByName(name: string): LocationCity | undefined {
  return turkiyeLocations.find(
    (city) => city.name.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr")
  );
}

export function getDistrict(cityName: string, districtName: string) {
  const city = getCityByName(cityName);
  if (!city) return undefined;
  return city.districts.find(
    (d) => d.name.toLocaleLowerCase("tr") === districtName.toLocaleLowerCase("tr")
  );
}

export function filterOptions(options: string[], query: string, limit = 50) {
  const q = query.trim().toLocaleLowerCase("tr");
  if (!q) return options.slice(0, limit);

  const startsWith = options.filter((opt) =>
    opt.toLocaleLowerCase("tr").startsWith(q)
  );
  const includes = options.filter(
    (opt) =>
      !opt.toLocaleLowerCase("tr").startsWith(q) &&
      opt.toLocaleLowerCase("tr").includes(q)
  );

  return [...startsWith, ...includes].slice(0, limit);
}
