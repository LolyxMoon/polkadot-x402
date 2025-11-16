/**
 * Axios wrapper with x402 support
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { createX402ResponseInterceptor, type X402InterceptorConfig } from './interceptor';

export interface X402AxiosConfig extends AxiosRequestConfig {
  x402: X402InterceptorConfig;
}

/**
 * Create an axios instance with x402 payment support
 */
export function createX402Axios(config: X402AxiosConfig): AxiosInstance {
  const { x402, ...axiosConfig } = config;

  // Create axios instance
  const instance = axios.create(axiosConfig);

  // Add x402 interceptor
  createX402ResponseInterceptor(instance, x402);

  return instance;
}

/**
 * Add x402 support to an existing axios instance
 */
export function addX402Support(
  instance: AxiosInstance,
  config: X402InterceptorConfig
): AxiosInstance {
  createX402ResponseInterceptor(instance, config);
  return instance;
}

