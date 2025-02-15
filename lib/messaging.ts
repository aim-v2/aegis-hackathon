import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  talk_to_ai(text: {name: string, rules: string, user_msg?: string}): Promise<string>;
  get_safety_score(text: {name: string, rules: string, uuid: number}): Promise<ScoreData>;
}

export type ScoreData = {score: number, from_blockchain: boolean};
export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();