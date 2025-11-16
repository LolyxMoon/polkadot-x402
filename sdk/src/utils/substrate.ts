/**
 * Substrate transaction utilities
 */

import { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';
import { u8aToHex } from '@polkadot/util';

/**
 * Create a balance transfer extrinsic
 */
export async function createTransferExtrinsic(
  api: ApiPromise,
  to: string,
  amount: bigint
) {
  return api.tx.balances.transfer({ id: to }, amount);
}

/**
 * Sign and send a transaction
 */
export async function signAndSendTransaction(
  api: ApiPromise,
  extrinsic: any,
  signer: KeyringPair,
  options?: {
    nonce?: number;
    tip?: bigint;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    extrinsic
      .signAndSend(
        signer,
        {
          nonce: options?.nonce,
          tip: options?.tip,
        },
        ({ status, txHash }: { status: any; txHash: any }) => {
          if (status.isInBlock || status.isFinalized) {
            resolve(u8aToHex(txHash));
          }
        }
      )
      .catch(reject);
  });
}

/**
 * Get account nonce
 */
export async function getAccountNonce(
  api: ApiPromise,
  address: string
): Promise<number> {
  const accountInfo = await api.query.system.account(address);
  return (accountInfo as any).nonce.toNumber();
}

/**
 * Get account balance
 */
export async function getAccountBalance(
  api: ApiPromise,
  address: string
): Promise<bigint> {
  const accountInfo = await api.query.system.account(address);
  return (accountInfo as any).data.free.toBigInt();
}

