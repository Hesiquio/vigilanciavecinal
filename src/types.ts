
export type UserProfile = {
  name: string;
  email: string;
  avatarUrl: string;
  postalCode?: string;
  location?: string;
};

export type FamilyMember = {
  id: string; // doc id
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  status: 'pending' | 'accepted' | 'requested'; // pending: they invited you, requested: you invited them, accepted: friends
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
}

export type UserGroup = {
    id: string;
    name: string;
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
