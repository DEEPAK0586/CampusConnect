import React, { useState, createContext, useContext, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { User, View, Event, Announcement, ForumPost, Reminder, ForumReply } from './types';
import { UserRole } from './types';
import { MOCK_USERS, MOCK_EVENTS, MOCK_ANNOUNCEMENTS, MOCK_FORUM_POSTS } from './constants';
import { DashboardIcon, CalendarIcon, MegaphoneIcon, ChatBubbleIcon, PlusIcon, ChevronDownIcon, LogoutIcon, BellIcon, UserIcon, ShieldCheckIcon, PencilIcon, TrashIcon } from './components/Icons';
import { Button, Card, Modal, Input, Textarea, FileInput, Select, ConfirmationModal } from './components/UI';

// --- HELPERS ---
function getFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
}

// --- AUTH CONTEXT ---
interface AuthContextType {
  currentUser: User | null;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  login: (credentials: { email: string; password: string }) => boolean;
  logout: () => void;
  register: (userDetails: Omit<User, 'id' | 'avatar' | 'password'> & {password: string}) => boolean;
  updateUser: (updatedDetails: Partial<Omit<User, 'id' | 'role'>>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => getFromLocalStorage('campus-connect-users', MOCK_USERS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getFromLocalStorage('campus-connect-currentUser', null));

  useEffect(() => {
    localStorage.setItem('campus-connect-users', JSON.stringify(users));
  }, [users]);

  const login = ({ email, password }) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('campus-connect-currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('campus-connect-currentUser');
  };


  const register = (userDetails) => {
    if (users.some(u => u.email === userDetails.email)) {
      return false;
    }
    const newUser: User = {
      ...userDetails,
      id: `u${users.length + 1}`,
      avatar: `https://i.pravatar.cc/150?u=u${users.length + 1}`,
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem('campus-connect-currentUser', JSON.stringify(newUser));
    return true;
  };
  
  const updateUser = (updatedDetails: Partial<Omit<User, 'id' | 'role'>>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updatedDetails };
    setCurrentUser(updatedUser);
    localStorage.setItem('campus-connect-currentUser', JSON.stringify(updatedUser));


    setUsers(prevUsers => 
        prevUsers.map(u => u.id === currentUser.id ? updatedUser : u)
    );
  };

  const value = useMemo(() => ({ currentUser, users, setUsers, login, logout, register, updateUser }), [currentUser, users]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- DATA CONTEXT ---
interface DataContextType {
    events: Event[];
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
    announcements: Announcement[];
    setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
    forumPosts: ForumPost[];
    setForumPosts: React.Dispatch<React.SetStateAction<ForumPost[]>>;
    reminders: Reminder[];
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
}

const DataContext = createContext<DataContextType | null>(null);

const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [events, setEvents] = useState<Event[]>(() => getFromLocalStorage('campus-connect-events', MOCK_EVENTS));
    const [announcements, setAnnouncements] = useState<Announcement[]>(() => getFromLocalStorage('campus-connect-announcements', MOCK_ANNOUNCEMENTS));
    const [forumPosts, setForumPosts] = useState<ForumPost[]>(() => getFromLocalStorage('campus-connect-forums', MOCK_FORUM_POSTS));
    const [reminders, setReminders] = useState<Reminder[]>(() => getFromLocalStorage('campus-connect-reminders', []));


    useEffect(() => {
        localStorage.setItem('campus-connect-events', JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        localStorage.setItem('campus-connect-announcements', JSON.stringify(announcements));
    }, [announcements]);
    
    useEffect(() => {
        localStorage.setItem('campus-connect-forums', JSON.stringify(forumPosts));
    }, [forumPosts]);
    
    useEffect(() => {
        localStorage.setItem('campus-connect-reminders', JSON.stringify(reminders));
    }, [reminders]);

    const value = useMemo(() => ({
        events, setEvents, announcements, setAnnouncements, forumPosts, setForumPosts, reminders, setReminders
    }), [events, announcements, forumPosts, reminders]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}


// --- AUTH VIEW ---

const AuthView: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const { login, register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
    const [error, setError] = useState('');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const existingUsers = getFromLocalStorage<User[]>('campus-connect-users', []);
        const userExists = existingUsers.find(u => u.email === email);
        
        if (!userExists) {
            setError('No account found with this email.');
            return;
        }

        const success = login({ email, password });
        if (!success) {
            setError('Invalid password. Please try again.');
        }
    };
    
    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = register({ name, email, password, role });
        if (!success) {
            setError('An account with this email already exists.');
        }
    };

    const handleToggleView = () => {
        setIsLoginView(!isLoginView);
        setError('');
        setName('');
        setEmail('');
        setPassword('');
        setRole(UserRole.STUDENT);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-sm p-8">
                <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-2">CampusConnect</h1>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
                    {isLoginView ? 'Welcome back!' : 'Create your account'}
                </p>
                
                {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>}

                <form onSubmit={isLoginView ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
                    {!isLoginView && (
                        <Input label="Full Name" id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                    )}
                    <Input label="Email Address" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <Input label="Password" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    {!isLoginView && (
                        <Select label="Role" id="role" value={role} onChange={e => setRole(e.target.value as UserRole)}>
                            <option value={UserRole.STUDENT}>Student</option>
                            <option value={UserRole.FACULTY}>Faculty</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                        </Select>
                    )}
                    <Button type="submit" className="w-full !mt-6">{isLoginView ? 'Sign In' : 'Sign Up'}</Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    {isLoginView ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={handleToggleView} className="font-medium text-primary-600 hover:text-primary-500">
                        {isLoginView ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </Card>
        </div>
    );
};

// --- LAYOUT COMPONENTS ---

const Sidebar: React.FC<{ view: View; setView: (view: View) => void }> = ({ view, setView }) => {
  const { currentUser } = useAuth();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'events', label: 'Events', icon: CalendarIcon },
    { id: 'announcements', label: 'Announcements', icon: MegaphoneIcon },
    { id: 'forums', label: 'Forums', icon: ChatBubbleIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  if (currentUser?.role === UserRole.ADMIN) {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheckIcon });
  }


  return (
    <aside className="w-64 bg-white dark:bg-gray-800 flex-shrink-0 flex flex-col border-r dark:border-gray-700">
        <div className="h-16 flex items-center justify-center px-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">CampusConnect</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => {
                const isActive = view === item.id;
                return (
                    <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); setView(item.id as View) }} 
                       className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                       }`}>
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </a>
                )
            })}
        </nav>
    </aside>
  );
};

const Header: React.FC<{ view: View }> = ({ view }) => {
  const { currentUser, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pageTitle = view.charAt(0).toUpperCase() + view.slice(1);

  if (!currentUser) return null;

  return (
    <header className="h-16 bg-white dark:bg-gray-800 flex items-center justify-between px-6 border-b dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{pageTitle}</h2>
        <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-3">
                <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 rounded-full"/>
                <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</p>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20">
                    <button onClick={logout} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600">
                        <LogoutIcon className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    </header>
  );
};


// --- VIEW COMPONENTS ---

const DashboardView: React.FC = () => {
    const { currentUser } = useAuth();
    const { events, announcements } = useData();
    const upcomingEvent = events.length > 0 ? [...events].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] : null;
    const recentAnnouncements = announcements.slice(0, 2);

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome, {currentUser?.name.split(' ')[0]}!</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Event */}
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Upcoming Event</h3>
                    {upcomingEvent ? (
                        <Card className="p-6">
                            <h4 className="text-xl font-bold text-primary-600 dark:text-primary-400">{upcomingEvent.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{new Date(upcomingEvent.date).toDateString()} at {upcomingEvent.time} &middot; {upcomingEvent.location}</p>
                            <p className="text-gray-700 dark:text-gray-300">{upcomingEvent.description}</p>
                        </Card>
                    ) : (
                        <Card className="p-6"><p className="text-gray-500 dark:text-gray-400">No upcoming events scheduled.</p></Card>
                    )}
                </div>
                
                {/* Quick Stats */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Campus at a Glance</h3>
                    <div className="space-y-4">
                        <Card className="p-4 flex items-center">
                            <CalendarIcon className="w-8 h-8 text-blue-500 mr-4"/>
                            <div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{events.length}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center">
                            <MegaphoneIcon className="w-8 h-8 text-green-500 mr-4"/>
                            <div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{announcements.length}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Announcements</p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Recent Announcements */}
            <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Recent Announcements</h3>
                <div className="space-y-4">
                {recentAnnouncements.length > 0 ? recentAnnouncements.map(ann => (
                    <Card key={ann.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-gray-800 dark:text-gray-100">{ann.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">By {ann.author} on {new Date(ann.date).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ann.authorRole === UserRole.ADMIN ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>{ann.authorRole}</span>
                        </div>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">{ann.content}</p>
                    </Card>
                )) : (
                    <Card className="p-4"><p className="text-gray-500 dark:text-gray-400">No recent announcements.</p></Card>
                )}
                </div>
            </div>
        </div>
    )
};

const EventsView: React.FC = () => {
    const { currentUser } = useAuth();
    const { events, setEvents, reminders, setReminders } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
    const [eventImageFile, setEventImageFile] = useState<File | null>(null);
    const [reminderEvent, setReminderEvent] = useState<Event | null>(null);
    
    const canManageEvent = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.FACULTY;

    const openCreateModal = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    }
    
    const openEditModal = (event: Event) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    }

    const handleSaveEvent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const eventData = Object.fromEntries(formData.entries()) as Omit<Event, 'id' | 'imageUrl'>;

        const saveEvent = (imageUrl?: string) => {
            if (editingEvent) {
                // Update existing event
                const updatedEvent = { ...editingEvent, ...eventData, imageUrl: imageUrl !== undefined ? imageUrl : editingEvent.imageUrl };
                setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? updatedEvent : ev));
            } else {
                // Create new event
                const newEvent: Event = { ...eventData, id: `e${Date.now()}`, imageUrl };
                setEvents(prev => [newEvent, ...prev]);
            }
            setIsModalOpen(false);
            setEditingEvent(null);
            setEventImageFile(null);
        };

        if (eventImageFile) {
            const reader = new FileReader();
            reader.onloadend = () => saveEvent(reader.result as string);
            reader.readAsDataURL(eventImageFile);
        } else {
            saveEvent();
        }
    };
    
    const handleDeleteEvent = () => {
        if (!deletingEvent) return;
        setEvents(prev => prev.filter(ev => ev.id !== deletingEvent.id));
        setDeletingEvent(null);
    };

    const handleInitiateReminderFlow = async (event: Event) => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications.');
            return;
        }

        if (Notification.permission === 'granted') {
            setReminderEvent(event);
            return;
        }

        if (Notification.permission === 'denied') {
            alert('Notification permission has been blocked. Please enable it in your browser settings to set reminders.');
            return;
        }
        
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setReminderEvent(event);
        } else {
            alert('You have denied notification permissions, so you will not be able to set reminders.');
        }
    };

    const handleSetReminder = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!reminderEvent) return;

        const formData = new FormData(e.currentTarget);
        const date = formData.get('reminderDate') as string;
        const time = formData.get('reminderTime') as string;

        if (!date || !time) {
            alert("Please select a valid date and time.");
            return;
        }

        const remindAt = new Date(`${date}T${time}`).getTime();

        if (remindAt <= Date.now()) {
            alert("Reminder time must be in the future.");
            return;
        }
        
        const newReminder: Reminder = {
            eventId: reminderEvent.id,
            eventTitle: reminderEvent.title,
            remindAt,
        };

        const updatedReminders = [...reminders.filter(r => r.eventId !== reminderEvent.id), newReminder];
        setReminders(updatedReminders);
        setReminderEvent(null);
    };
    
    const handleCancelReminder = (eventId: string) => {
        const updatedReminders = reminders.filter(r => r.eventId !== eventId);
        setReminders(updatedReminders);
    };
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Upcoming Events</h2>
                {canManageEvent && (
                    <Button onClick={openCreateModal}>
                        <PlusIcon className="w-5 h-5 mr-2 inline-block"/>
                        Create Event
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => {
                    const reminder = reminders.find(r => r.eventId === event.id);
                    const isReminderSet = !!reminder;
                    
                    return (
                        <Card key={event.id} className="flex flex-col">
                            {event.imageUrl && (
                                 <img src={event.imageUrl} alt={event.title} className="w-full h-48 object-cover" />
                            )}
                             <div className="p-5 flex-grow relative">
                                {canManageEvent && (
                                    <div className="absolute top-3 right-3 flex space-x-2">
                                        <button onClick={() => openEditModal(event)} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                                            <PencilIcon className="w-4 h-4"/>
                                        </button>
                                        <button onClick={() => setDeletingEvent(event)} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 pr-16">{event.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-3 h-[60px]">{event.description}</p>
                                <div className="mt-4 text-sm space-y-2 text-gray-600 dark:text-gray-400">
                                    <p><strong>Time:</strong> {event.time}</p>
                                    <p><strong>Location:</strong> {event.location}</p>
                                    <p><strong>Organizer:</strong> {event.organizer}</p>
                                </div>
                            </div>
                            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                {isReminderSet ? (
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                            Reminder set for {new Date(reminder.remindAt).toLocaleString()}
                                        </p>
                                        <Button variant="secondary" onClick={() => handleCancelReminder(event.id)}>
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <Button onClick={() => handleInitiateReminderFlow(event)} className="w-full">
                                        <BellIcon className="w-4 h-4 mr-2 inline"/>
                                        Set Reminder
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )
                })}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEvent ? "Edit Event" : "Create New Event"}>
                <form className="space-y-4" onSubmit={handleSaveEvent}>
                    <Input label="Event Title" id="title" name="title" type="text" defaultValue={editingEvent?.title} required />
                    <Textarea label="Description" id="description" name="description" defaultValue={editingEvent?.description} required />
                    <FileInput label="Event Image" id="imageUrl" name="imageUrl" accept="image/*" onChange={(e) => setEventImageFile(e.target.files?.[0] || null)} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date" id="date" name="date" type="date" defaultValue={editingEvent?.date} required/>
                        <Input label="Time" id="time" name="time" type="time" defaultValue={editingEvent?.time} required/>
                    </div>
                    <Input label="Location" id="location" name="location" type="text" defaultValue={editingEvent?.location} required/>
                    <Input label="Organizer" id="organizer" name="organizer" type="text" defaultValue={editingEvent?.organizer || currentUser?.name} required/>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">{editingEvent ? "Save Changes" : "Create Event"}</Button>
                    </div>
                </form>
            </Modal>
             <ConfirmationModal
                isOpen={!!deletingEvent}
                onClose={() => setDeletingEvent(null)}
                onConfirm={handleDeleteEvent}
                title="Delete Event"
            >
                Are you sure you want to delete the event "{deletingEvent?.title}"? This action cannot be undone.
            </ConfirmationModal>
            {reminderEvent && (
                 <Modal isOpen={!!reminderEvent} onClose={() => setReminderEvent(null)} title={`Set Reminder for "${reminderEvent.title}"`}>
                    <form className="space-y-4" onSubmit={handleSetReminder}>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Event is on: {new Date(reminderEvent.date).toLocaleDateString()} at {reminderEvent.time}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Reminder Date" id="reminderDate" name="reminderDate" type="date" required />
                            <Input label="Reminder Time" id="reminderTime" name="reminderTime" type="time" required />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" type="button" onClick={() => setReminderEvent(null)}>Cancel</Button>
                            <Button type="submit">Set Reminder</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    )
};

const AnnouncementsView: React.FC = () => {
    const { currentUser } = useAuth();
    const { announcements, setAnnouncements } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

    const canManage = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.FACULTY;

    const openCreateModal = () => {
        setEditingAnnouncement(null);
        setIsModalOpen(true);
    };

    const openEditModal = (ann: Announcement) => {
        setEditingAnnouncement(ann);
        setIsModalOpen(true);
    };

    const handleSaveAnnouncement = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        
        if (editingAnnouncement) {
            const updatedAnn = { ...editingAnnouncement, title, content };
            setAnnouncements(prev => prev.map(a => a.id === updatedAnn.id ? updatedAnn : a));
        } else {
            const newAnn: Announcement = {
                id: `a${Date.now()}`,
                title,
                content,
                author: currentUser!.name,
                authorRole: currentUser!.role,
                date: new Date().toISOString().split('T')[0],
            };
            setAnnouncements(prev => [newAnn, ...prev]);
        }
        setIsModalOpen(false);
    };

    const handleDeleteAnnouncement = () => {
        if (!deletingAnnouncement) return;
        setAnnouncements(prev => prev.filter(a => a.id !== deletingAnnouncement.id));
        setDeletingAnnouncement(null);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Announcements</h2>
                {canManage && (
                    <Button onClick={openCreateModal}>
                        <PlusIcon className="w-5 h-5 mr-2 inline-block"/>
                        Create Announcement
                    </Button>
                )}
            </div>
            <div className="space-y-5">
                {announcements.map(ann => (
                     <Card key={ann.id} className="p-5 relative">
                        {canManage && (
                           <div className="absolute top-3 right-3 flex space-x-2">
                               <button onClick={() => openEditModal(ann)} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                                   <PencilIcon className="w-4 h-4"/>
                               </button>
                               <button onClick={() => setDeletingAnnouncement(ann)} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                                   <TrashIcon className="w-4 h-4"/>
                               </button>
                           </div>
                        )}
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white pr-16">{ann.title}</h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ann.authorRole === UserRole.ADMIN ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>{ann.authorRole}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Posted by {ann.author} on {new Date(ann.date).toLocaleDateString()}</p>
                        <p className="mt-3 text-gray-700 dark:text-gray-300">{ann.content}</p>
                    </Card>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}>
                <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                    <Input label="Title" id="title" name="title" defaultValue={editingAnnouncement?.title} required />
                    <Textarea label="Content" id="content" name="content" defaultValue={editingAnnouncement?.content} required />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">{editingAnnouncement ? 'Save Changes' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>
            <ConfirmationModal
                isOpen={!!deletingAnnouncement}
                onClose={() => setDeletingAnnouncement(null)}
                onConfirm={handleDeleteAnnouncement}
                title="Delete Announcement"
            >
                Are you sure you want to delete the announcement "{deletingAnnouncement?.title}"? This action cannot be undone.
            </ConfirmationModal>
        </div>
    )
};

const ForumsView: React.FC = () => {
    const { currentUser } = useAuth();
    const { forumPosts, setForumPosts } = useData();
    const [replyContents, setReplyContents] = useState<Record<string, string>>({});

    const handleReplyChange = (postId: string, content: string) => {
        setReplyContents(prev => ({...prev, [postId]: content}));
    };

    const handlePostReply = (postId: string) => {
        if (!currentUser) return;
        const content = replyContents[postId];
        if (!content || !content.trim()) return;

        const newReply: ForumReply = {
            id: `fr${Date.now()}`,
            author: currentUser,
            date: new Date().toISOString().split('T')[0],
            content: content.trim(),
        };

        setForumPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === postId
                    ? { ...post, replies: [...post.replies, newReply] }
                    : post
            )
        );
        
        handleReplyChange(postId, ''); // Clear input field after submit
    };

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Discussion Forums</h2>
            <div className="space-y-6">
                {forumPosts.map(post => (
                    <Card key={post.id}>
                        <div className="p-5 border-b dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{post.title}</h3>
                            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <img src={post.author.avatar} alt={post.author.name} className="w-6 h-6 rounded-full mr-2"/>
                                <span>{post.author.name} &middot; {new Date(post.date).toLocaleDateString()}</span>
                            </div>
                            <p className="mt-3 text-gray-700 dark:text-gray-300">{post.content}</p>
                        </div>
                        <div className="p-5 bg-gray-50/50 dark:bg-gray-800/50">
                            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">{post.replies.length} Replies</h4>
                            <div className="space-y-4">
                                {post.replies.map(reply => (
                                    <div key={reply.id} className="flex items-start space-x-3">
                                        <img src={reply.author.avatar} alt={reply.author.name} className="w-8 h-8 rounded-full" />
                                        <div className="flex-1 bg-white dark:bg-gray-700 p-3 rounded-lg">
                                            <div className="flex items-center text-sm">
                                                <p className="font-semibold text-gray-800 dark:text-gray-100">{reply.author.name}</p>
                                                <p className="ml-2 text-gray-500 dark:text-gray-400">&middot; {new Date(reply.date).toLocaleDateString()}</p>
                                            </div>
                                            <p className="mt-1 text-gray-600 dark:text-gray-300">{reply.content}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2">
                                    <Textarea 
                                      id={`reply-${post.id}`} 
                                      label="Your Reply" 
                                      placeholder="Write a reply..."
                                      value={replyContents[post.id] || ''}
                                      onChange={(e) => handleReplyChange(post.id, e.target.value)}
                                    />
                                    <Button className="mt-2" onClick={() => handlePostReply(post.id)}>Post Reply</Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
};

const ProfileView: React.FC = () => {
    const { currentUser, updateUser } = useAuth();
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [avatar, setAvatar] = useState(currentUser?.avatar || '');
    const [successMessage, setSuccessMessage] = useState('');
    
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
    const [avatarPrompt, setAvatarPrompt] = useState('');
    const [generatedAvatar, setGeneratedAvatar] = useState('');
    const [isGenerationLoading, setIsGenerationLoading] = useState(false);

    // Hidden file input ref
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setEmail(currentUser.email);
            setAvatar(currentUser.avatar);
        }
    }, [currentUser]);

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser({ name, email, avatar });
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleGenerateAvatar = async () => {
        if (!avatarPrompt) return;
        setIsGenerationLoading(true);
        setGeneratedAvatar('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: avatarPrompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/png',
                  aspectRatio: '1:1',
                },
            });
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            setGeneratedAvatar(imageUrl);
        } catch (error) {
            console.error("Error generating avatar:", error);
            alert("Failed to generate avatar. Please try again.");
        } finally {
            setIsGenerationLoading(false);
        }
    };
    
    const useGeneratedAvatar = () => {
        if(generatedAvatar) {
            setAvatar(generatedAvatar);
        }
        setIsGeneratingAvatar(false);
        setAvatarPrompt('');
        setGeneratedAvatar('');
    };


    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Your Profile</h2>
            <Card className="max-w-4xl mx-auto">
                <form onSubmit={handleSaveChanges}>
                    <div className="p-6 space-y-6">
                        {/* Avatar Section */}
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-2">Profile Picture</h3>
                            <div className="flex items-center space-x-6">
                                <img src={avatar} alt="Current avatar" className="w-24 h-24 rounded-full object-cover" />
                                <div className="space-x-3">
                                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Upload Picture</Button>
                                    <Button type="button" onClick={() => setIsGeneratingAvatar(true)}>Generate with AI</Button>
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" />
                                </div>
                            </div>
                        </div>

                        {/* Personal Info Section */}
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <Input label="Full Name" id="profile-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                                <Input label="Email Address" id="profile-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end items-center space-x-4 rounded-b-lg">
                        {successMessage && <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>}
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Card>

            <Modal isOpen={isGeneratingAvatar} onClose={() => setIsGeneratingAvatar(false)} title="Generate Avatar with AI">
                <div className="space-y-4">
                    <Textarea 
                        label="Describe your new avatar"
                        id="avatar-prompt"
                        placeholder="e.g., A watercolor painting of a fox reading a book"
                        value={avatarPrompt}
                        onChange={(e) => setAvatarPrompt(e.target.value)}
                    />
                    
                    {isGenerationLoading && (
                        <div className="text-center p-4">
                            <p className="text-gray-600 dark:text-gray-300">Generating your new avatar...</p>
                            {/* A simple spinner */}
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mt-4"></div>
                        </div>
                    )}
                    
                    {generatedAvatar && !isGenerationLoading && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Generated Image:</p>
                            <img src={generatedAvatar} alt="Generated avatar" className="w-48 h-48 rounded-lg mx-auto object-cover" />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setIsGeneratingAvatar(false)}>Cancel</Button>
                        {generatedAvatar && !isGenerationLoading ? (
                             <Button type="button" onClick={useGeneratedAvatar}>Use This Image</Button>
                        ) : (
                            <Button type="button" onClick={handleGenerateAvatar} disabled={isGenerationLoading || !avatarPrompt}>
                                {isGenerationLoading ? 'Generating...' : 'Generate'}
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- ADMIN VIEW ---
const AdminView: React.FC = () => {
    const { users } = useAuth();
    const { events, setEvents, announcements, setAnnouncements, forumPosts } = useData();
    const roleCounts = useMemo(() => {
        return users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<UserRole, number>);
    }, [users]);
    
    // NOTE: This view simply re-implements the modals from other views for simplicity.
    // In a larger app, modals and forms would be extracted into reusable components.
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

    const handleSaveEvent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const eventData = Object.fromEntries(formData.entries()) as Omit<Event, 'id' | 'imageUrl'>;
        const updatedEvent = { ...editingEvent, ...eventData };
        setEvents(prev => prev.map(ev => ev.id === editingEvent!.id ? updatedEvent : ev));
        setEditingEvent(null);
    };
    
    const handleDeleteEvent = () => {
        if (!deletingEvent) return;
        setEvents(prev => prev.filter(ev => ev.id !== deletingEvent.id));
        setDeletingEvent(null);
    };
    
    const handleSaveAnnouncement = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const updatedAnn = { ...editingAnnouncement, title, content };
        setAnnouncements(prev => prev.map(a => a.id === updatedAnn.id ? updatedAnn : a));
        setEditingAnnouncement(null);
    };

    const handleDeleteAnnouncement = () => {
        if (!deletingAnnouncement) return;
        setAnnouncements(prev => prev.filter(a => a.id !== deletingAnnouncement.id));
        setDeletingAnnouncement(null);
    };

    return (
        <div className="p-6 space-y-8">
            {/* Analytics */}
            <section>
                <h3 className="text-2xl font-bold mb-4">Data Analytics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 text-center">
                        <p className="text-3xl font-bold">{users.length}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                    </Card>
                    <Card className="p-4 text-center">
                        <p className="text-3xl font-bold">{events.length}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
                    </Card>
                    <Card className="p-4 text-center">
                        <p className="text-3xl font-bold">{announcements.length}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Announcements</p>
                    </Card>
                    <Card className="p-4 text-center">
                        <p className="text-3xl font-bold">{forumPosts.length}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Forum Posts</p>
                    </Card>
                </div>
                <Card className="mt-4 p-4">
                    <h4 className="font-semibold mb-2">Users by Role</h4>
                    <div className="flex justify-around">
                        {Object.values(UserRole).map(role => (
                            <div key={role} className="text-center">
                                <p className="text-2xl font-bold">{roleCounts[role] || 0}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </section>

            {/* User Management */}
            <section>
                <h3 className="text-2xl font-bold mb-4">User Management</h3>
                <Card className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-3">ID</th>
                                <th className="p-3">User</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Password</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b dark:border-gray-700">
                                    <td className="p-3 font-mono text-xs">{user.id}</td>
                                    <td className="p-3 flex items-center space-x-3">
                                        <img src={user.avatar} className="w-8 h-8 rounded-full" />
                                        <span>{user.name}</span>
                                    </td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">{user.role}</td>
                                    <td className="p-3 font-mono text-xs">{user.password}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </section>

             {/* Event Management */}
            <section>
                <h3 className="text-2xl font-bold mb-4">Event Management</h3>
                <Card className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-3">Title</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Location</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map(event => (
                                <tr key={event.id} className="border-b dark:border-gray-700">
                                    <td className="p-3">{event.title}</td>
                                    <td className="p-3">{event.date}</td>
                                    <td className="p-3">{event.location}</td>
                                    <td className="p-3">
                                        <div className="flex space-x-2">
                                            <button onClick={() => setEditingEvent(event)} className="text-primary-600 hover:underline">Edit</button>
                                            <button onClick={() => setDeletingEvent(event)} className="text-red-600 hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </section>
            
            {/* Announcement Management */}
            <section>
                <h3 className="text-2xl font-bold mb-4">Announcement Management</h3>
                <Card className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-3">Title</th>
                                <th className="p-3">Author</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {announcements.map(ann => (
                                <tr key={ann.id} className="border-b dark:border-gray-700">
                                    <td className="p-3">{ann.title}</td>
                                    <td className="p-3">{ann.author}</td>
                                    <td className="p-3">{ann.date}</td>
                                    <td className="p-3">
                                        <div className="flex space-x-2">
                                            <button onClick={() => setEditingAnnouncement(ann)} className="text-primary-600 hover:underline">Edit</button>
                                            <button onClick={() => setDeletingAnnouncement(ann)} className="text-red-600 hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </section>
            
            {/* Modals for Admin View */}
            <Modal isOpen={!!editingEvent} onClose={() => setEditingEvent(null)} title="Edit Event">
                <form className="space-y-4" onSubmit={handleSaveEvent}>
                    <Input label="Event Title" id="title" name="title" type="text" defaultValue={editingEvent?.title} required />
                    <Textarea label="Description" id="description" name="description" defaultValue={editingEvent?.description} required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date" id="date" name="date" type="date" defaultValue={editingEvent?.date} required/>
                        <Input label="Time" id="time" name="time" type="time" defaultValue={editingEvent?.time} required/>
                    </div>
                    <Input label="Location" id="location" name="location" type="text" defaultValue={editingEvent?.location} required/>
                    <Input label="Organizer" id="organizer" name="organizer" type="text" defaultValue={editingEvent?.organizer} required/>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" type="button" onClick={() => setEditingEvent(null)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Modal>
             <ConfirmationModal isOpen={!!deletingEvent} onClose={() => setDeletingEvent(null)} onConfirm={handleDeleteEvent} title="Delete Event">
                Are you sure you want to delete the event "{deletingEvent?.title}"? This action cannot be undone.
            </ConfirmationModal>
            
            <Modal isOpen={!!editingAnnouncement} onClose={() => setEditingAnnouncement(null)} title='Edit Announcement'>
                <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                    <Input label="Title" id="title" name="title" defaultValue={editingAnnouncement?.title} required />
                    <Textarea label="Content" id="content" name="content" defaultValue={editingAnnouncement?.content} required />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setEditingAnnouncement(null)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Modal>
            <ConfirmationModal isOpen={!!deletingAnnouncement} onClose={() => setDeletingAnnouncement(null)} onConfirm={handleDeleteAnnouncement} title="Delete Announcement">
                Are you sure you want to delete the announcement "{deletingAnnouncement?.title}"? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Main />
      </DataProvider>
    </AuthProvider>
  );
}

const Main = () => {
    const { currentUser } = useAuth();
    const { setReminders } = useData();
    const [view, setView] = useState<View>('dashboard');

    useEffect(() => {
        const checkReminders = () => {
            const storedReminders = getFromLocalStorage('campus-connect-reminders', []) as Reminder[];
            if (storedReminders.length === 0) return;

            const now = Date.now();
            const dueReminders = storedReminders.filter(r => r.remindAt <= now);
            
            if (dueReminders.length > 0) {
                const upcomingReminders = storedReminders.filter(r => r.remindAt > now);
                if (Notification.permission === 'granted') {
                    dueReminders.forEach(reminder => {
                        new Notification('CampusConnect Reminder', {
                            body: `Your event "${reminder.eventTitle}" is starting soon!`,
                        });
                    });
                }
                setReminders(upcomingReminders);
            }
        };

        const intervalId = setInterval(checkReminders, 15000); // Check every 15 seconds
        return () => clearInterval(intervalId);
    }, [setReminders]);


    if (!currentUser) {
        return <AuthView />;
    }

    const renderView = () => {
        switch (view) {
            case 'dashboard': return <DashboardView />;
            case 'events': return <EventsView />;
            case 'announcements': return <AnnouncementsView />;
            case 'forums': return <ForumsView />;
            case 'profile': return <ProfileView />;
            case 'admin': return <AdminView />;
            default: return <DashboardView />;
        }
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <Sidebar view={view} setView={setView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header view={view} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};