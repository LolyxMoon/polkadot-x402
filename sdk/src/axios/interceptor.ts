/**
 * Axios interceptor for automatic x402 payment handling
 */

import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { PaymentRequirements, PolkadotSigner } from '../types';
import { createPaymentHeader } from '../client/payment';

export interface X402InterceptorConfig {
  signer: PolkadotSigner;
  network: string;
  facilitatorUrl?: string;
  onPaymentRequired?: (requirements: PaymentRequirements) => void;
  onPaymentCreated?: (paymentHeader: string) => void;
  onPaymentSettled?: (txHash: string) => void;
}

/**
 * Create x402 response interceptor
 */
export function createX402ResponseInterceptor(
  axiosInstance: AxiosInstance,
  config: X402InterceptorConfig
): number {
  return axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // Only handle 402 Payment Required errors
      if (error.response?.status !== 402) {
        return Promise.reject(error);
      }

      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _x402PaymentHeader?: string;
      };

      // Prevent infinite retry loops
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Extract payment requirements from 402 response
        const paymentRequirements = error.response.data as PaymentRequirements;

        if (!paymentRequirements || !paymentRequirements.network) {
          return Promise.reject(
            new Error('Invalid 402 response: missing payment requirements')
          );
        }

        // Call onPaymentRequired callback if provided
        if (config.onPaymentRequired) {
          config.onPaymentRequired(paymentRequirements);
        }

        // Extract payment details
        const payTo = paymentRequirements.payTo;
        const amount = paymentRequirements.maxAmountRequired || '0';
        const resource = paymentRequirements.resource || '';

        if (!payTo) {
          return Promise.reject(
            new Error('Invalid payment requirements: missing payTo address')
          );
        }

        // Create payment header
        const paymentResult = await createPaymentHeader(config.signer, {
          from: config.signer.address,
          to: payTo,
          amount,
          requirements: paymentRequirements,
        });

        // Call onPaymentCreated callback if provided
        if (config.onPaymentCreated) {
          config.onPaymentCreated(paymentResult.paymentHeader);
        }

        // Store payment header for retry
        originalRequest._x402PaymentHeader = paymentResult.paymentHeader;

        // Add payment header to request headers
        if (!originalRequest.headers) {
          originalRequest.headers = {} as any;
        }
        originalRequest.headers['X-402-Payment'] = paymentResult.paymentHeader;
        if (paymentRequirements.resource) {
          originalRequest.headers['X-402-Payment-Details'] = JSON.stringify(
            paymentRequirements
          );
        }

        // Retry the original request with payment header
        const retryResponse = await axiosInstance.request(originalRequest);

        // Extract settlement transaction hash from response headers
        const txHash = retryResponse.headers['x-settlement-tx'] as string;
        if (txHash && config.onPaymentSettled) {
          config.onPaymentSettled(txHash);
        }

        return retryResponse;
      } catch (paymentError) {
        return Promise.reject(
          new Error(
            `Failed to handle x402 payment: ${
              paymentError instanceof Error ? paymentError.message : 'Unknown error'
            }`
          )
        );
      }
    }
  );
}

