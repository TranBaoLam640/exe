import axios from "axios";
import { readJsonValue } from "../utils/browserStorage.js";

const api = axios.create({
    baseURL: import.meta.env?.VITE_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const session = readJsonValue(
        typeof window !== "undefined" ? window.localStorage : null,
        "dorentme_session",
        null,
    );

    if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
    }

    return config;
});

export default api;
