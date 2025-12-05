export interface UserIdentity {
  publicKey: string; // Base64 exported public key
  privateKey: string; // Base64 exported private key (In real app, stored in IndexedDB/OS Store)
  fingerprint: string; // Short ID derived from pubkey
  createdAt: number;
}

export interface Contact {
  id: string; // Fingerprint
  publicKey: string;
  name: string; // Nickname assigned by local user
  isAi: boolean;
  avatarSeed?: string; // For generating deterministic avatars
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string; // Decrypted content for display (simulated)
  timestamp: number;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isAiResponse?: boolean;
}

export interface ChatSession {
  contactId: string;
  lastMessagePreview: string;
  lastMessageTimestamp: number;
  unreadCount: number;
}
