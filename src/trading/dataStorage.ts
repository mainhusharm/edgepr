// src/trading/dataStorage.ts

import { TradingState } from './types';
import api from '../api';

/**
 * Saves the trading state to the server.
 * @param state The trading state to save.
 */
export const saveState = async (state: TradingState): Promise<void> => {
  try {
    await api.post('/api/trading-state', state);
  } catch (error) {
    console.error("Error saving state to server:", error);
  }
};

/**
 * Loads the trading state from the server.
 * @returns The loaded trading state or null if not found or error.
 */
export const loadState = async (): Promise<TradingState | null> => {
  try {
    const response = await api.get('/api/trading-state');
    return response.data;
  } catch (error) {
    console.error("Error loading state from server:", error);
    return null;
  }
};

/**
 * Clears the trading state from the server.
 */
export const clearState = async (): Promise<void> => {
  try {
    await api.delete('/api/trading-state');
  } catch (error) {
    console.error("Error clearing state from server:", error);
  }
};
