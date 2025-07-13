// src/api/trip.ts
import axios from 'axios';
const BASE = 'http://localhost:5000';

export async function trip(payload: {
  prompt: string;
  temp: number;
  top_p: number;
  persona: string;
  model: string;
}) {
  const { data } = await axios.post(`${BASE}/trip`, payload);
  return data as { output: string; dna: string };
}
