// src/services/nepseApi.js
const PROXY_URL = "http://localhost:5000/api/nepse";

export const fetchNepseData = async () => {
    try {
        const response = await fetch(PROXY_URL);
        if (!response.ok) throw new Error("Backend offline");

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Sync Error:", error.message);
        return null; // Triggers fallback to last known values
    }
};