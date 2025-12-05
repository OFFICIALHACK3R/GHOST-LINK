import { Contact } from './types';

export const AI_CONTACT_ID = 'system-root-ai';

export const AI_CONTACT: Contact = {
  id: AI_CONTACT_ID,
  publicKey: 'SYSTEM_ROOT_KEY_V1',
  name: 'SYSTEM_ROOT',
  isAi: true,
  avatarSeed: 'root-access'
};