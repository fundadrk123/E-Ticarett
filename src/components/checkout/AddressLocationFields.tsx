"use client";

import { useMemo } from "react";
import { SearchableSelect } from "./SearchableSelect";
import { turkiyeLocations, getCityByName } from "@/data/turkiye-locations";

interface AddressLocationFieldsProps {
  city: string;
  district: string;
  postalCode: string;
  onCityChange: (city: string, postalCode?: string) => void;
  onDistrictChange: (district: string, postalCode: string) => void;
}

export function AddressLocationFields({
  city,
  district,
  postalCode,
  onCityChange,
  onDistrictChange,
}: AddressLocationFieldsProps) {
  const cityOptions = useMemo(
    () => turkiyeLocations.map((item) => item.name),
    []
  );

  const districtOptions = useMemo(() => {
    const selectedCity = getCityByName(city);
    return selectedCity?.districts.map((d) => d.name) ?? [];
  }, [city]);

  const handleCityChange = (cityName: string) => {
    onCityChange(cityName, "");
  };

  const handleDistrictChange = (districtName: string) => {
    const selectedCity = getCityByName(city);
    const selectedDistrict = selectedCity?.districts.find(
      (d) => d.name.toLocaleLowerCase("tr") === districtName.toLocaleLowerCase("tr")
    );
    onDistrictChange(districtName, selectedDistrict?.postalCode ?? "");
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <SearchableSelect
        label="İl"
        placeholder="İl ara veya seç..."
        value={city}
        options={cityOptions}
        onChange={handleCityChange}
        required
      />
      <SearchableSelect
        label="İlçe"
        placeholder={city ? "İlçe ara veya seç..." : "Önce il seçin"}
        value={district}
        options={districtOptions}
        onChange={handleDistrictChange}
        required
        disabled={!city}
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Posta Kodu
        </label>
        <input
          readOnly
          value={postalCode}
          placeholder="Otomatik dolar"
          className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none"
        />
      </div>
    </div>
  );
}
