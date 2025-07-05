import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';

export const viemClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});
