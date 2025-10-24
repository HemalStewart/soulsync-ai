export const COIN_COSTS = {
  generateImage: 25,
  chatMessage: 1,
  generateVideo: 75,
  createCharacter: 25,
  shareChatImage: 15,
  shareChatVideo: 30,
} as const;

export type CoinCostKey = keyof typeof COIN_COSTS;
