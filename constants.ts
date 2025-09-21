import { User, Event, Announcement, ForumPost, UserRole } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Dr. Evelyn Reed', email: 'evelyn.reed@campus.edu', password: 'password123', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=u1' },
  { id: 'u2', name: 'Prof. David Chen', email: 'david.chen@campus.edu', password: 'password123', role: UserRole.FACULTY, avatar: 'https://i.pravatar.cc/150?u=u2' },
  { id: 'u3', name: 'Alice Johnson', email: 'alice.j@campus.edu', password: 'password123', role: UserRole.STUDENT, avatar: 'https://i.pravatar.cc/150?u=u3' },
  { id: 'u4', name: 'Bob Williams', email: 'bob.w@campus.edu', password: 'password123', role: UserRole.STUDENT, avatar: 'https://i.pravatar.cc/150?u=u4' },
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Annual Tech Symposium 2024',
    description: 'Join us for a day of insightful talks and workshops from industry leaders in technology.',
    date: '2024-10-26',
    time: '09:00 AM - 05:00 PM',
    location: 'Main Auditorium',
    organizer: 'Computer Science Department',
    imageUrl: 'https://images.unsplash.com/photo-1517486808906-6538cb3b8656?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'e2',
    title: 'Career Fair',
    description: 'Connect with top companies and explore internship and full-time opportunities.',
    date: '2024-11-15',
    time: '10:00 AM - 04:00 PM',
    location: 'University Gymnasium',
    organizer: 'Career Services',
    imageUrl: 'https://images.unsplash.com/photo-1560439514-4e9645039924?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'e3',
    title: 'Guest Lecture: The Future of AI',
    description: 'A special lecture by renowned AI researcher Dr. Anya Sharma.',
    date: '2024-11-05',
    time: '02:00 PM - 03:30 PM',
    location: 'Lecture Hall C',
    organizer: 'AI Club',
  },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: 'Mid-term Examination Schedule',
    content: 'The schedule for the upcoming mid-term examinations has been posted. Please check the academic portal for details.',
    author: 'Dr. Evelyn Reed',
    authorRole: UserRole.ADMIN,
    date: '2024-10-10',
  },
  {
    id: 'a2',
    title: 'Library Closure for Maintenance',
    content: 'The central library will be closed this weekend (Oct 12-13) for scheduled maintenance. Online resources will remain available.',
    author: 'Campus Administration',
    authorRole: UserRole.ADMIN,
    date: '2024-10-09',
  },
  {
    id: 'a3',
    title: 'CS-301 Project Submissions',
    content: 'Reminder for all students in CS-301: The deadline for project proposal submissions is this Friday, Oct 14th.',
    author: 'Prof. David Chen',
    authorRole: UserRole.FACULTY,
    date: '2024-10-08',
  },
];

export const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    id: 'fp1',
    title: 'Best places to study on campus?',
    author: MOCK_USERS[2],
    date: '2024-10-05',
    content: "Hey everyone, I'm a new student and was wondering if anyone has recommendations for quiet study spots besides the main library. Thanks!",
    replies: [
      {
        id: 'fr1',
        author: MOCK_USERS[3],
        date: '2024-10-05',
        content: "The third floor of the science building is usually pretty empty and has great views!",
      },
      {
        id: 'fr2',
        author: MOCK_USERS[1],
        date: '2024-10-06',
        content: "Welcome! The graduate student lounge is also a good option if you can get access. Very quiet.",
      },
    ],
  },
  {
    id: 'fp2',
    title: 'Looking for a ride to the airport next month',
    author: MOCK_USERS[3],
    date: '2024-10-02',
    content: "Is anyone driving to the airport on the morning of Nov 22nd? Willing to chip in for gas!",
    replies: [],
  },
];