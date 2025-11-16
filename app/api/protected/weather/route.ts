/**
 * GET /api/protected/weather - Protected weather API endpoint requiring x402 payment
 * 
 * This endpoint provides weather data for Buenos Aires and is protected by x402 payment:
 * - Returns 402 Payment Required if no valid payment header
 * - Includes payment requirements in 402 response
 * - Returns hardcoded Buenos Aires weather data if payment is valid and meets requirements
 * 
 * Query parameters:
 * - units: Temperature units - "celsius" or "fahrenheit" (optional, defaults to "celsius")
 * 
 * Headers required for access:
 * - X-402-Payment: Payment payload (hex string or JSON)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get hardcoded weather data for Buenos Aires
 */
function getWeatherData(units: string = 'celsius') {
  // Hardcoded Buenos Aires weather data
  const baseTempCelsius = 22; // Typical Buenos Aires temperature
  const baseTempFahrenheit = Math.round((baseTempCelsius * 9/5) + 32);
  
  return {
    city: 'Buenos Aires',
    temperature: units === 'celsius' ? baseTempCelsius : baseTempFahrenheit,
    units: units === 'celsius' ? '°C' : '°F',
    condition: 'Partly Cloudy',
    description: 'Partly cloudy with light breeze',
    humidity: 65,
    windSpeed: units === 'celsius' ? 15 : 9, // km/h or mph
    windSpeedUnits: units === 'celsius' ? 'km/h' : 'mph',
    pressure: 1013,
    visibility: '10.0',
    uvIndex: 5,
    timestamp: new Date().toISOString(),
    coordinates: {
      lat: -34.6037,
      lon: -58.3816,
    },
  };
}

export async function GET(request: NextRequest) {
  // Extract query parameters
  const { searchParams } = request.nextUrl;
  const units = searchParams.get('units') || 'celsius';

  // Validate units parameter
  if (units !== 'celsius' && units !== 'fahrenheit') {
    return NextResponse.json(
      {
        error: 'Invalid units parameter. Use "celsius" or "fahrenheit"',
      },
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Payment verification is handled by middleware
  // If we reach here, payment has been verified
  // Check for payment verification header set by middleware
  const paymentVerified = request.headers.get('X-Payment-Verified');
  
  if (paymentVerified !== 'true') {
    // This shouldn't happen if middleware is working correctly
    return NextResponse.json(
      {
        error: 'Payment verification required',
      },
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // Get hardcoded Buenos Aires weather data
    const weatherData = getWeatherData(units);

    return NextResponse.json(
      {
        success: true,
        data: weatherData,
        payment: {
          verified: true,
          amount: request.headers.get('X-Payment-Amount') || '0',
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch weather data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-402-Payment',
    },
  });
}

