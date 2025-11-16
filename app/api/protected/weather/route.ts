/**
 * GET /api/protected/weather - Protected weather API endpoint
 * Returns hardcoded weather data for Buenos Aires.
 * Protected by x402 payment middleware.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    city: 'Buenos Aires',
    temperature: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 15,
  });
}

