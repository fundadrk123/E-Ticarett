import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import neighbourhoods from "../node_modules/turkey-neighbourhoods/src/data/neighbourhoods.json" with { type: "json" };
import { getCities } from "turkey-neighbourhoods";

const __dirname = dirname(fileURLToPath(import.meta.url));

const districtPostalMap = new Map();

for (const row of neighbourhoods) {
  const [cityCode, cityName, district, , postalCode] = row;
  const key = `${cityCode}|${district}`;
  if (!districtPostalMap.has(key)) {
    districtPostalMap.set(key, { cityCode, cityName, district, postalCode });
  }
}

const cities = getCities().map((city) => {
  const districts = [];
  for (const [, value] of districtPostalMap) {
    if (value.cityCode === city.code) {
      districts.push({
        name: value.district,
        postalCode: value.postalCode,
      });
    }
  }
  districts.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  return {
    code: city.code,
    name: city.name,
    districts,
  };
});

cities.sort((a, b) => a.name.localeCompare(b.name, "tr"));

const output = join(__dirname, "../src/data/turkiye-locations.json");
writeFileSync(output, JSON.stringify(cities, null, 2), "utf8");
console.log(`✅ ${cities.length} il, ${districtPostalMap.size} ilçe kaydedildi → ${output}`);
