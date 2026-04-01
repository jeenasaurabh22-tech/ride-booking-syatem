import { useEffect, useState } from "react";
import api from "../lib/api";

const CityAutocomplete = ({ label, value, onChange, placeholder }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isPickingCity, setIsPickingCity] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/cities/suggest?q=${encodeURIComponent(query)}`);
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("City autocomplete error:", err);
        setSuggestions([]);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [value]);

  const handlePick = (city) => {
    setIsPickingCity(true);
    onChange(city);
    setSuggestions([]);
    setIsFocused(false);
    setTimeout(() => setIsPickingCity(false), 100);
  };

  return (
    <div className="field-wrap">
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => !isPickingCity && setIsFocused(true)}
        onBlur={() => !isPickingCity && setTimeout(() => setIsFocused(false), 150)}
      />
      {isFocused && value.trim() && suggestions.length > 0 && (
        <div className="suggestions-panel">
          {suggestions.map((city) => (
            <button 
              type="button" 
              key={city} 
              className="suggestion-item" 
              onMouseDown={() => handlePick(city)}
              onClick={(e) => e.preventDefault()}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
