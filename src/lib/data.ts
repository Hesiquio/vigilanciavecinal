export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type SosAlert = {
  id: string;
  user: User;
  timestamp: string;
  location: string;
  message: string;
  type: 'text' | 'audio' | 'video';
  mediaUrl?: string;
};

export type ChatMessage = {
  id: string;
  user: User;
  timestamp: string;
  text: string;
};

export type FamilyMember = {
  id: string;
  name: string;
  avatarUrl: string;
  status: 'Safe' | 'Away' | 'Alert';
  lastSeen: string;
};

export const users: User[] = [
  { id: 'u1', name: 'Ana', avatarUrl: 'https://picsum.photos/seed/1/100/100' },
  { id: 'u2', name: 'Carlos', avatarUrl: 'https://picsum.photos/seed/2/100/100' },
  { id: 'u3', name: 'Elena', avatarUrl: 'https://picsum.photos/seed/3/100/100' },
  { id: 'u4', name: 'Javier', avatarUrl: 'https://picsum.photos/seed/4/100/100' },
];

export const sosAlerts: SosAlert[] = [];

export const chatMessages: ChatMessage[] = [
  { id: 'm1', user: users[0], timestamp: '10:30 AM', text: 'Buenos días a todos, ¿todo tranquilo por la colonia?' },
  { id: 'm2', user: users[3], timestamp: '10:32 AM', text: 'Hola Ana, todo bien por acá. Noche tranquila.' },
  { id: 'm3', user: users[2], timestamp: '10:35 AM', text: 'Recuerden la junta vecinal de mañana a las 7 PM.' },
  { id: 'm4', user: users[0], timestamp: '10:36 AM', text: '¡Anotado! Gracias por el recordatorio, Elena.' },
  { id: 'm5', user: users[1], timestamp: '10:40 AM', text: 'Acabo de ver un coche sospechoso cerca del parque. Envié una alerta.' },
];

export const familyMembers: FamilyMember[] = [
  { id: 'f1', name: 'Mateo (Hijo)', avatarUrl: 'https://picsum.photos/seed/5/100/100', status: 'Safe', lastSeen: 'En casa' },
  { id: 'f2', name: 'Abuela Rosa', avatarUrl: 'https://picsum.photos/seed/6/100/100', status: 'Safe', lastSeen: 'En el mercado local' },
  { id: 'f3', name: 'Sofía (Hija)', avatarUrl: 'https://picsum.photos/seed/7/100/100', status: 'Away', lastSeen: 'Escuela' },
];

export const currentUser = users[0];
