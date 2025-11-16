// src/networks/polkadot.ts
var POLKADOT_NETWORKS = {
  polkadot: {
    name: "Polkadot",
    chainId: "polkadot",
    rpcUrl: "wss://rpc.polkadot.io",
    nativeCurrency: {
      name: "DOT",
      symbol: "DOT",
      decimals: 10
    },
    explorerUrl: "https://polkascan.io/polkadot",
    ss58Format: 0
  },
  kusama: {
    name: "Kusama",
    chainId: "kusama",
    rpcUrl: "wss://kusama-rpc.polkadot.io",
    nativeCurrency: {
      name: "KSM",
      symbol: "KSM",
      decimals: 12
    },
    explorerUrl: "https://polkascan.io/kusama",
    ss58Format: 2
  },
  westend: {
    name: "Westend",
    chainId: "westend",
    rpcUrl: "wss://westend-rpc.polkadot.io",
    nativeCurrency: {
      name: "WND",
      symbol: "WND",
      decimals: 12
    },
    explorerUrl: "https://polkascan.io/westend",
    ss58Format: 42
  },
  "polkadot-testnet": {
    name: "Polkadot Testnet",
    chainId: "polkadot-testnet",
    rpcUrl: "wss://rpc.polkadot.io",
    nativeCurrency: {
      name: "DOT",
      symbol: "DOT",
      decimals: 10
    },
    explorerUrl: "https://polkascan.io/polkadot",
    ss58Format: 0
  },
  "polkadot-hub-testnet": {
    name: "Polkadot Hub TestNet",
    chainId: "420420422",
    rpcUrl: "https://testnet-passet-hub-eth-rpc.polkadot.io",
    nativeCurrency: {
      name: "PAS",
      symbol: "PAS",
      decimals: 18
    },
    explorerUrl: "https://blockscout-passet-hub.parity-testnet.parity.io",
    ss58Format: 0
    // EVM-compatible, uses Ethereum address format
  }
};

// src/networks/config.ts
function getNetworkConfig(networkId) {
  if (networkId in POLKADOT_NETWORKS) {
    return POLKADOT_NETWORKS[networkId];
  }
  const normalizedId = networkId.toLowerCase();
  const found = Object.entries(POLKADOT_NETWORKS).find(
    ([key]) => key.toLowerCase() === normalizedId
  );
  if (found) {
    return found[1];
  }
  throw new Error(
    `Network "${networkId}" is not supported. Supported networks: ${Object.keys(POLKADOT_NETWORKS).join(", ")}`
  );
}
function getSupportedNetworks() {
  return Object.keys(POLKADOT_NETWORKS);
}
function isNetworkSupported(networkId) {
  try {
    getNetworkConfig(networkId);
    return true;
  } catch {
    return false;
  }
}
function getAllNetworks() {
  return { ...POLKADOT_NETWORKS };
}

// src/facilitator/verify.ts
import { ApiPromise, WsProvider } from "@polkadot/api";

// src/utils/crypto.ts
import { u8aToHex, hexToU8a } from "@polkadot/util";
import { signatureVerify } from "@polkadot/util-crypto";
function signMessage(message, keypair) {
  const messageU8a = typeof message === "string" ? new TextEncoder().encode(message) : message;
  const signature = keypair.sign(messageU8a);
  return u8aToHex(signature);
}
function verifySignature(message, signature, address) {
  try {
    const messageU8a = typeof message === "string" ? new TextEncoder().encode(message) : message;
    const signatureU8a = hexToU8a(signature);
    const result = signatureVerify(messageU8a, signatureU8a, address);
    return result.isValid;
  } catch {
    return false;
  }
}
function createPaymentHash(requirements) {
  const message = JSON.stringify({
    domain: {
      name: "X402",
      version: "1",
      chainId: requirements.network
    },
    message: {
      from: requirements.from,
      to: requirements.to,
      amount: requirements.amount,
      nonce: requirements.nonce,
      timestamp: requirements.timestamp,
      resource: requirements.resource || ""
    },
    primaryType: "Payment",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "string" }
      ],
      Payment: [
        { name: "from", type: "string" },
        { name: "to", type: "string" },
        { name: "amount", type: "string" },
        { name: "nonce", type: "string" },
        { name: "timestamp", type: "uint256" },
        { name: "resource", type: "string" }
      ]
    }
  });
  return new TextEncoder().encode(message);
}
function encodePaymentPayload(payload) {
  const data = JSON.stringify(payload);
  return u8aToHex(new TextEncoder().encode(data));
}
function decodePaymentPayload(payloadHex) {
  try {
    const data = hexToU8a(payloadHex);
    const json = new TextDecoder().decode(data);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// src/utils/validation.ts
import { z } from "zod";
var PaymentRequirementsSchema = z.object({
  x402Version: z.number().int().positive(),
  scheme: z.string().min(1),
  network: z.string().min(1),
  maxAmountRequired: z.string().optional(),
  resource: z.string().optional(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  payTo: z.string().optional(),
  maxTimeoutSeconds: z.number().int().positive().optional(),
  asset: z.string().optional(),
  extra: z.record(z.any()).optional()
});
var VerifyRequestSchema = z.object({
  payload: z.string().min(1),
  details: PaymentRequirementsSchema
});
var SettleRequestSchema = z.object({
  payload: z.string().min(1),
  details: PaymentRequirementsSchema
});
function validatePaymentRequirements(requirements) {
  try {
    const data = PaymentRequirementsSchema.parse(requirements);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      };
    }
    return { valid: false, error: "Invalid payment requirements" };
  }
}
function validateVerifyRequest(request) {
  try {
    const data = VerifyRequestSchema.parse(request);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      };
    }
    return { valid: false, error: "Invalid verify request" };
  }
}
function validateSettleRequest(request) {
  try {
    const data = SettleRequestSchema.parse(request);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      };
    }
    return { valid: false, error: "Invalid settle request" };
  }
}

// src/facilitator/verify.ts
async function verifyX402Payment(payload, requirements) {
  try {
    const validation = validatePaymentRequirements(requirements);
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error || "Invalid payment requirements"
      };
    }
    if (requirements.x402Version !== 1) {
      return {
        valid: false,
        error: "Unsupported x402 version. Only version 1 is supported."
      };
    }
    if (requirements.scheme !== "exact") {
      return {
        valid: false,
        error: `Unsupported payment scheme: ${requirements.scheme}. Only 'exact' is supported.`
      };
    }
    let networkConfig;
    try {
      networkConfig = getNetworkConfig(requirements.network);
    } catch (error) {
      return {
        valid: false,
        error: `Unsupported network: ${requirements.network}`
      };
    }
    const paymentData = decodePaymentPayload(payload);
    if (!paymentData) {
      return {
        valid: false,
        error: "Invalid payload format. Could not decode payment data."
      };
    }
    if (!paymentData.from || !paymentData.to || !paymentData.amount || !paymentData.signature) {
      return {
        valid: false,
        error: "Invalid payment payload. Missing required fields."
      };
    }
    if (requirements.payTo && paymentData.to.toLowerCase() !== requirements.payTo.toLowerCase()) {
      return {
        valid: false,
        error: "Payment recipient does not match requirements."
      };
    }
    if (requirements.maxAmountRequired) {
      const paidAmount = BigInt(paymentData.amount);
      const requiredAmount = BigInt(requirements.maxAmountRequired);
      if (paidAmount < requiredAmount) {
        return {
          valid: false,
          error: `Payment amount ${paymentData.amount} is less than required ${requirements.maxAmountRequired}`
        };
      }
    }
    const maxTimeout = requirements.maxTimeoutSeconds || 300;
    const ageSeconds = (Date.now() - paymentData.timestamp) / 1e3;
    if (ageSeconds > maxTimeout) {
      return {
        valid: false,
        error: `Payment timestamp is too old. Age: ${ageSeconds}s, max: ${maxTimeout}s`
      };
    }
    const paymentHash = createPaymentHash({
      from: paymentData.from,
      to: paymentData.to,
      amount: paymentData.amount,
      nonce: paymentData.nonce,
      timestamp: paymentData.timestamp,
      network: requirements.network,
      resource: requirements.resource
    });
    const isValid = verifySignature(
      paymentHash,
      paymentData.signature,
      paymentData.from
    );
    if (!isValid) {
      return {
        valid: false,
        error: "Invalid payment signature."
      };
    }
    try {
      const api = await ApiPromise.create({ provider: new WsProvider(networkConfig.rpcUrl) });
      const accountInfo = await api.query.system.account(paymentData.from);
      const balance = accountInfo.data.free.toBigInt();
      const requiredAmount = BigInt(paymentData.amount);
      if (balance < requiredAmount) {
        await api.disconnect();
        return {
          valid: false,
          error: "Insufficient balance for payment."
        };
      }
      await api.disconnect();
    } catch (error) {
      console.warn("On-chain balance verification failed:", error);
    }
    return {
      valid: true,
      details: {
        amount: paymentData.amount,
        token: requirements.asset || "native",
        from: paymentData.from,
        to: paymentData.to,
        nonce: paymentData.nonce,
        timestamp: paymentData.timestamp
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Verification failed"
    };
  }
}

// src/facilitator/settle.ts
import { ApiPromise as ApiPromise2, WsProvider as WsProvider2 } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { hexToU8a as hexToU8a2 } from "@polkadot/util";

// src/utils/substrate.ts
import { u8aToHex as u8aToHex2 } from "@polkadot/util";
async function createTransferExtrinsic(api, to, amount) {
  return api.tx.balances.transfer({ id: to }, amount);
}
async function signAndSendTransaction(api, extrinsic, signer, options) {
  return new Promise((resolve, reject) => {
    extrinsic.signAndSend(
      signer,
      {
        nonce: options?.nonce,
        tip: options?.tip
      },
      ({ status, txHash }) => {
        if (status.isInBlock || status.isFinalized) {
          resolve(u8aToHex2(txHash));
        }
      }
    ).catch(reject);
  });
}
async function getAccountNonce(api, address) {
  const accountInfo = await api.query.system.account(address);
  return accountInfo.nonce.toNumber();
}
async function getAccountBalance(api, address) {
  const accountInfo = await api.query.system.account(address);
  return accountInfo.data.free.toBigInt();
}

// src/facilitator/settle.ts
async function settleX402Payment(payload, requirements, facilitatorPrivateKey) {
  try {
    const validation = validatePaymentRequirements(requirements);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || "Invalid payment requirements"
      };
    }
    if (requirements.x402Version !== 1) {
      return {
        success: false,
        error: "Unsupported x402 version. Only version 1 is supported."
      };
    }
    if (requirements.scheme !== "exact") {
      return {
        success: false,
        error: `Unsupported payment scheme: ${requirements.scheme}. Only 'exact' is supported.`
      };
    }
    const networkConfig = getNetworkConfig(requirements.network);
    const paymentData = decodePaymentPayload(payload);
    if (!paymentData) {
      return {
        success: false,
        error: "Invalid payload format. Could not decode payment data."
      };
    }
    const api = await ApiPromise2.create({
      provider: new WsProvider2(networkConfig.rpcUrl)
    });
    try {
      const keyring = new Keyring({
        type: "sr25519",
        ss58Format: networkConfig.ss58Format || 0
      });
      let facilitatorPair;
      if (facilitatorPrivateKey.startsWith("0x")) {
        facilitatorPair = keyring.addFromSeed(
          hexToU8a2(facilitatorPrivateKey)
        );
      } else if (facilitatorPrivateKey.length === 64) {
        facilitatorPair = keyring.addFromSeed(
          hexToU8a2("0x" + facilitatorPrivateKey)
        );
      } else {
        facilitatorPair = keyring.addFromUri(facilitatorPrivateKey);
      }
      const amount = BigInt(paymentData.amount);
      const transferExtrinsic = await createTransferExtrinsic(
        api,
        paymentData.to,
        amount
      );
      const nonce = await getAccountNonce(api, facilitatorPair.address);
      const txHash = await signAndSendTransaction(
        api,
        transferExtrinsic,
        facilitatorPair,
        { nonce }
      );
      await api.disconnect();
      return {
        success: true,
        transactionHash: txHash
      };
    } catch (error) {
      await api.disconnect();
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Settlement failed"
    };
  }
}

// src/facilitator/supported.ts
function getSupportedPayments() {
  const networks = getSupportedNetworks();
  return networks.map((network) => ({
    x402Version: 1,
    scheme: "exact",
    network,
    extra: {}
  }));
}
function isPaymentSupported(x402Version, scheme, network) {
  if (x402Version !== 1) {
    return false;
  }
  if (scheme !== "exact") {
    return false;
  }
  const supported = getSupportedPayments();
  return supported.some((p) => p.network === network);
}

// src/client/signer.ts
import { Keyring as Keyring2 } from "@polkadot/keyring";
import { hexToU8a as hexToU8a3 } from "@polkadot/util";
function createSignerFromPrivateKey(privateKey, networkId) {
  const networkConfig = getNetworkConfig(networkId);
  const keyring = new Keyring2({ type: "sr25519", ss58Format: networkConfig.ss58Format || 0 });
  let pair;
  if (privateKey.startsWith("0x")) {
    pair = keyring.addFromSeed(hexToU8a3(privateKey));
  } else if (privateKey.length === 64) {
    pair = keyring.addFromSeed(hexToU8a3("0x" + privateKey));
  } else {
    pair = keyring.addFromUri(privateKey);
  }
  return {
    address: pair.address,
    sign: async (message) => {
      const messageU8a = typeof message === "string" ? new TextEncoder().encode(message) : message;
      return pair.sign(messageU8a);
    },
    signMessage: async (message) => {
      return signMessage(message, pair);
    }
  };
}

// src/client/payment.ts
import { u8aToHex as u8aToHex3 } from "@polkadot/util";
async function createPaymentHeader(signer, options) {
  const {
    from,
    to,
    amount,
    requirements,
    nonce,
    timestamp = Date.now()
  } = options;
  const paymentNonce = nonce || generateNonce();
  const paymentHash = createPaymentHash({
    from: signer.address,
    to,
    amount,
    nonce: paymentNonce,
    timestamp,
    network: requirements.network,
    resource: requirements.resource
  });
  const signature = await signer.sign(paymentHash);
  const signatureHex = u8aToHex3(signature);
  const payload = {
    from: signer.address,
    to,
    amount,
    nonce: paymentNonce,
    timestamp,
    signature: signatureHex
  };
  const encodedPayload = encodePaymentPayload(payload);
  return {
    paymentHeader: encodedPayload,
    payload: encodedPayload,
    signature: signatureHex
  };
}
function generateNonce() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// src/axios/wrapper.ts
import axios from "axios";

// src/axios/interceptor.ts
function createX402ResponseInterceptor(axiosInstance, config) {
  return axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status !== 402) {
        return Promise.reject(error);
      }
      const originalRequest = error.config;
      if (originalRequest._retry) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      try {
        const paymentRequirements = error.response.data;
        if (!paymentRequirements || !paymentRequirements.network) {
          return Promise.reject(
            new Error("Invalid 402 response: missing payment requirements")
          );
        }
        if (config.onPaymentRequired) {
          config.onPaymentRequired(paymentRequirements);
        }
        const payTo = paymentRequirements.payTo;
        const amount = paymentRequirements.maxAmountRequired || "0";
        const resource = paymentRequirements.resource || "";
        if (!payTo) {
          return Promise.reject(
            new Error("Invalid payment requirements: missing payTo address")
          );
        }
        const paymentResult = await createPaymentHeader(config.signer, {
          from: config.signer.address,
          to: payTo,
          amount,
          requirements: paymentRequirements
        });
        if (config.onPaymentCreated) {
          config.onPaymentCreated(paymentResult.paymentHeader);
        }
        originalRequest._x402PaymentHeader = paymentResult.paymentHeader;
        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        originalRequest.headers["X-402-Payment"] = paymentResult.paymentHeader;
        if (paymentRequirements.resource) {
          originalRequest.headers["X-402-Payment-Details"] = JSON.stringify(
            paymentRequirements
          );
        }
        const retryResponse = await axiosInstance.request(originalRequest);
        const txHash = retryResponse.headers["x-settlement-tx"];
        if (txHash && config.onPaymentSettled) {
          config.onPaymentSettled(txHash);
        }
        return retryResponse;
      } catch (paymentError) {
        return Promise.reject(
          new Error(
            `Failed to handle x402 payment: ${paymentError instanceof Error ? paymentError.message : "Unknown error"}`
          )
        );
      }
    }
  );
}

// src/axios/wrapper.ts
function createX402Axios(config) {
  const { x402, ...axiosConfig } = config;
  const instance = axios.create(axiosConfig);
  createX402ResponseInterceptor(instance, x402);
  return instance;
}
function addX402Support(instance, config) {
  createX402ResponseInterceptor(instance, config);
  return instance;
}
export {
  addX402Support,
  createPaymentHash,
  createPaymentHeader,
  createSignerFromPrivateKey,
  createTransferExtrinsic,
  createX402Axios,
  decodePaymentPayload,
  encodePaymentPayload,
  getAccountBalance,
  getAccountNonce,
  getAllNetworks,
  getNetworkConfig,
  getSupportedNetworks,
  getSupportedPayments,
  isNetworkSupported,
  isPaymentSupported,
  settleX402Payment,
  signAndSendTransaction,
  signMessage,
  validatePaymentRequirements,
  validateSettleRequest,
  validateVerifyRequest,
  verifySignature,
  verifyX402Payment
};
