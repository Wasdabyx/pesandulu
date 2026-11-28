const BACKEND_LOKAL = "http://127.0.0.1:5000";
const BACKEND_ONLINE = "https://muhammadhunafa.pythonanywhere.com";
const HOST_LOKAL = ["127.0.0.1", "localhost"];
const API_BASE_URL = HOST_LOKAL.includes(window.location.hostname) ? BACKEND_LOKAL : BACKEND_ONLINE;
