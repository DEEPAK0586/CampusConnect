export enum UserRole {
  ADMIN = 'Admin',
  FACULTY = 'Faculty',
  STUDENT = 'Student',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  imageUrl?: string;
}

export interface Announcement {
  id:string;
  title: string;
  content: string;
  author: string;
  date: string;
  authorRole: UserRole;
}

export interface ForumPost {
  id: string;
  title: string;
  author: User;
  date: string;
  content: string;
  replies: ForumReply[];
}

export interface ForumReply {
  id: string;
  author: User;
  date: string;
  content: string;
}

export interface Reminder {
  eventId: string;
  eventTitle: string;
  remindAt: number; // Unix timestamp
}

export type View = 'dashboard' | 'events' | 'announcements' | 'forums' | 'profile' | 'admin';