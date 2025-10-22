


export type UserProfile = {
  name: string;
  email: string;
  avatarUrl: string;
  postalCode?: string;
  location?: string;
  verificationTimestamp?: any;
  isSharingLocationWithFamily?: boolean;
};

export type FamilyMember = {
  id: string; // doc id
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  status: 'pending' | 'accepted' | 'requested'; // pending: they invited you, requested: you invited them, accepted: friends
  isSharingLocation?: boolean;
  location?: string;
};

export type Group = {
    id: string;
    name: string;
    ownerId: string;
}

export type GroupMember = {
    id: string; // doc id
    userId: string;
    name: string;
    email: string;
    avatarUrl: string;
    status: 'pending' | 'accepted' | 'requested';
    isSharingLocation?: boolean;
    location?: string;
}

export type UserGroup = {
    id: string;
    name: string;
    status?: 'pending' | 'accepted';
}

export type ChatMessage = {
  id?: string;
  text: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  timestamp: any;
  alertId?: string;
};

export type Aviso = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  title: string;
  description: string;
  eventTimestamp: any;
  audience: string[];
  timestamp: any;
}

export interface SosAlert {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
  location: string;
  message: string;
  category: "Robo" | "Accidentes" | "Desastres Naturales" | "Personas Sospechosas";
  audience: string[];
  videoUrl?: string; // Optional URL for the recorded video
}
