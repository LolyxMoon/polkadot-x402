/**
 * Generate key pairs for facilitator, buyer, and seller wallets
 */

const { ethers } = require('ethers');

function generateKeyPair() {
  const wallet = ethers.Wallet.createRandom();
  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
  };
}

console.log('Generating key pairs for Polkadot Hub TestNet...\n');

const facilitator = generateKeyPair();
const buyer = generateKeyPair();
const seller = generateKeyPair();

console.log('Generated Key Pairs:');
console.log('===================\n');

console.log('FACILITATOR:');
console.log(`  Private Key: ${facilitator.privateKey}`);
console.log(`  Address:     ${facilitator.address}\n`);

console.log('BUYER:');
console.log(`  Private Key: ${buyer.privateKey}`);
console.log(`  Address:     ${buyer.address}\n`);

console.log('SELLER:');
console.log(`  Private Key: ${seller.privateKey}`);
console.log(`  Address:     ${seller.address}\n`);

console.log('Environment Variables:');
console.log('======================\n');
console.log(`FACILITATOR_PRIVATE_KEY=${facilitator.privateKey}`);
console.log(`BUYER_PRIVATE_KEY=${buyer.privateKey}`);
console.log(`SELLER_PRIVATE_KEY=${seller.privateKey}\n`);

console.log('Public Addresses (computed automatically):');
console.log('==========================================\n');
console.log(`FACILITATOR_ADDRESS=${facilitator.address}`);
console.log(`BUYER_ADDRESS=${buyer.address}`);
console.log(`SELLER_ADDRESS=${seller.address}\n`);

// Export for use in other scripts
module.exports = { facilitator, buyer, seller };

