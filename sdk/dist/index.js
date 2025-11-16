"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  addX402Support: () => addX402Support,
  createPaymentHash: () => createPaymentHash,
  createPaymentHeader: () => createPaymentHeader,
  createSignerFromPrivateKey: () => createSignerFromPrivateKey,
  createTransferExtrinsic: () => createTransferExtrinsic,
  createX402Axios: () => createX402Axios,
  decodePaymentPayload: () => decodePaymentPayload,
  encodePaymentPayload: () => encodePaymentPayload,
  getAccountBalance: () => getAccountBalance,
  getAccountNonce: () => getAccountNonce,
  getAllNetworks: () => getAllNetworks,
  getNetworkConfig: () => getNetworkConfig,
  getSupportedNetworks: () => getSupportedNetworks,
  getSupportedPayments: () => getSupportedPayments,
  isNetworkSupported: () => isNetworkSupported,
  isPaymentSupported: () => isPaymentSupported,
  settleX402Payment: () => settleX402Payment,
  signAndSendTransaction: () => signAndSendTransaction,
  signMessage: () => signMessage,
  validatePaymentRequirements: () => validatePaymentRequirements,
  validateSettleRequest: () => validateSettleRequest,
  validateVerifyRequest: () => validateVerifyRequest,
  verifySignature: () => verifySignature,
  verifyX402Payment: () => verifyX402Payment
});
module.exports = __toCommonJS(index_exports);

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
var import_api = require("@polkadot/api");

// src/utils/crypto.ts
var import_util = require("@polkadot/util");
var import_util_crypto = require("@polkadot/util-crypto");
function signMessage(message, keypair) {
  const messageU8a = typeof message === "string" ? new TextEncoder().encode(message) : message;
  const signature = keypair.sign(messageU8a);
  return (0, import_util.u8aToHex)(signature);
}
function verifySignature(message, signature, address) {
  try {
    const messageU8a = typeof message === "string" ? new TextEncoder().encode(message) : message;
    const signatureU8a = (0, import_util.hexToU8a)(signature);
    const result = (0, import_util_crypto.signatureVerify)(messageU8a, signatureU8a, address);
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
  return (0, import_util.u8aToHex)(new TextEncoder().encode(data));
}
function decodePaymentPayload(payloadHex) {
  try {
    const data = (0, import_util.hexToU8a)(payloadHex);
    const json = new TextDecoder().decode(data);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// src/utils/validation.ts
var import_zod = require("zod");
var PaymentRequirementsSchema = import_zod.z.object({
  x402Version: import_zod.z.number().int().positive(),
  scheme: import_zod.z.string().min(1),
  network: import_zod.z.string().min(1),
  maxAmountRequired: import_zod.z.string().optional(),
  resource: import_zod.z.string().optional(),
  description: import_zod.z.string().optional(),
  mimeType: import_zod.z.string().optional(),
  payTo: import_zod.z.string().optional(),
  maxTimeoutSeconds: import_zod.z.number().int().positive().optional(),
  asset: import_zod.z.string().optional(),
  extra: import_zod.z.record(import_zod.z.any()).optional()
});
var VerifyRequestSchema = import_zod.z.object({
  payload: import_zod.z.string().min(1),
  details: PaymentRequirementsSchema
});
var SettleRequestSchema = import_zod.z.object({
  payload: import_zod.z.string().min(1),
  details: PaymentRequirementsSchema
});
function validatePaymentRequirements(requirements) {
  try {
    const data = PaymentRequirementsSchema.parse(requirements);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof import_zod.z.ZodError) {
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
    if (error instanceof import_zod.z.ZodError) {
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
    if (error instanceof import_zod.z.ZodError) {
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
      const api = await import_api.ApiPromise.create({ provider: new import_api.WsProvider(networkConfig.rpcUrl) });
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
var import_api2 = require("@polkadot/api");
var import_keyring = require("@polkadot/keyring");
var import_util3 = require("@polkadot/util");

// src/utils/substrate.ts
var import_util2 = require("@polkadot/util");
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
          resolve((0, import_util2.u8aToHex)(txHash));
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
    const api = await import_api2.ApiPromise.create({
      provider: new import_api2.WsProvider(networkConfig.rpcUrl)
    });
    try {
      const keyring = new import_keyring.Keyring({
        type: "sr25519",
        ss58Format: networkConfig.ss58Format || 0
      });
      let facilitatorPair;
      if (facilitatorPrivateKey.startsWith("0x")) {
        facilitatorPair = keyring.addFromSeed(
          (0, import_util3.hexToU8a)(facilitatorPrivateKey)
        );
      } else if (facilitatorPrivateKey.length === 64) {
        facilitatorPair = keyring.addFromSeed(
          (0, import_util3.hexToU8a)("0x" + facilitatorPrivateKey)
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
var import_keyring2 = require("@polkadot/keyring");
var import_util4 = require("@polkadot/util");
function createSignerFromPrivateKey(privateKey, networkId) {
  const networkConfig = getNetworkConfig(networkId);
  const keyring = new import_keyring2.Keyring({ type: "sr25519", ss58Format: networkConfig.ss58Format || 0 });
  let pair;
  if (privateKey.startsWith("0x")) {
    pair = keyring.addFromSeed((0, import_util4.hexToU8a)(privateKey));
  } else if (privateKey.length === 64) {
    pair = keyring.addFromSeed((0, import_util4.hexToU8a)("0x" + privateKey));
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
var import_util5 = require("@polkadot/util");
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
  const signatureHex = (0, import_util5.u8aToHex)(signature);
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
var import_axios = __toESM(require("axios"));

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
  const instance = import_axios.default.create(axiosConfig);
  createX402ResponseInterceptor(instance, x402);
  return instance;
}
function addX402Support(instance, config) {
  createX402ResponseInterceptor(instance, config);
  return instance;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
