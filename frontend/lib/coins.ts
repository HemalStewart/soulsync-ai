export const COIN_COSTS = {
  generateImage: 5,
  chatMessage: 1,
  generateVideo: 25,
  createCharacter: 25,
} as const;

export type CoinCostKey = keyof typeof COIN_COSTS;
