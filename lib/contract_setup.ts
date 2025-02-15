import { ethers } from 'ethers';
import { SAFETY_SCORE_ABI } from './safetyScoreAbi';

const SAFETY_SCORE_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

export const safetyScoreContract = new ethers.Contract(SAFETY_SCORE_ADDRESS, SAFETY_SCORE_ABI, signer);