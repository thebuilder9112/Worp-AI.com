import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, syncUserProfile, UserProfile, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

export type ThemeType = 'warp-emerald' | 'cyber-pulse' | 'ocean-depth' | 'sunset-lava' | 'royal-void' | 'arctic-ice' | 'custom' | 'warp-dark';
export type ChatMode = 'standard' | 'code' | 'art' | 'research';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  chatMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;
  friendlyMode: boolean;
  setFriendlyMode: (val: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_ACCENTS: Record<string, string> = {
  'warp-dark': '113 113 122', // Zinc neutral
  'warp-emerald': '16 185 129',
  'cyber-pulse': '236 72 153',
  'ocean-depth': '14 165 233',
  'sunset-lava': '249 115 22',
  'royal-void': '139 92 246',
  'arctic-ice': '45 212 191',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<ThemeType>('warp-dark');
  const [accentColor, setAccentColorState] = useState<string>('113 113 122');
  const [chatMode, setChatModeState] = useState<ChatMode>('standard');
  const [friendlyMode, setFriendlyModeState] = useState(false);
  const [isDarkMode, setIsDarkModeState] = useState(true);

  // Handle Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const syncedProfile = await syncUserProfile(user);
        setProfile(syncedProfile);
        setThemeState(syncedProfile.theme as ThemeType || 'warp-dark');
        setAccentColorState(syncedProfile.accentColor || '113 113 122');
        // @ts-ignore
        setFriendlyModeState(syncedProfile.friendlyMode || false);
        // @ts-ignore
        setIsDarkModeState(syncedProfile.isDarkMode !== false); // Default to true
        
        // Listen for real-time profile updates
        const profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
           if (doc.exists()) {
             const data = doc.data() as UserProfile & { friendlyMode?: boolean; isDarkMode?: boolean };
             setProfile(data);
             setThemeState(data.theme as ThemeType || 'warp-dark');
             setAccentColorState(data.accentColor || '113 113 122');
             setFriendlyModeState(data.friendlyMode || false);
             setIsDarkModeState(data.isDarkMode !== false);
           }
        });
        
        setLoading(false);
        return () => profileUnsubscribe();
      } else {
        setProfile(null);
        const savedTheme = localStorage.getItem('warpmind-theme') as ThemeType;
        const savedColor = localStorage.getItem('warpmind-accent');
        const savedFriendly = localStorage.getItem('warpmind-friendly') === 'true';
        const savedDark = localStorage.getItem('warpmind-dark') !== 'false';
        if (savedTheme) setThemeState(savedTheme);
        if (savedColor) setAccentColorState(savedColor);
        setFriendlyModeState(savedFriendly);
        setIsDarkModeState(savedDark);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    const newAccent = THEME_ACCENTS[newTheme] || accentColor;
    setAccentColorState(newAccent);
    
    // Auto toggle dark mode based on theme if desirable, but user wants manual toggle usually.
    // However, user said "dark one for the dark theme and the light one for the light theme".
    // I'll assume warp-dark specifically wants dark mode, and maybe others can be light?
    if (newTheme === 'warp-dark') setIsDarkModeState(true);
    if (newTheme === 'arctic-ice') setIsDarkModeState(false);

    if (!user) {
      localStorage.setItem('warpmind-theme', newTheme);
      localStorage.setItem('warpmind-accent', newAccent);
    }
    
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        theme: newTheme,
        accentColor: newAccent,
        isDarkMode: newTheme === 'warp-dark' ? true : (newTheme === 'arctic-ice' ? false : isDarkMode),
        updatedAt: serverTimestamp()
      });
    }
  };

  const setAccentColor = async (color: string) => {
    setAccentColorState(color);
    if (!user) localStorage.setItem('warpmind-accent', color);
    
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        accentColor: color,
        theme: 'custom',
        updatedAt: serverTimestamp()
      });
      setThemeState('custom');
    }
  };

  const setChatMode = (mode: ChatMode) => {
    setChatModeState(mode);
  };

  const setFriendlyMode = async (val: boolean) => {
    setFriendlyModeState(val);
    if (!user) localStorage.setItem('warpmind-friendly', String(val));
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        friendlyMode: val,
        updatedAt: serverTimestamp()
      });
    }
  };

  const setIsDarkMode = async (val: boolean) => {
    setIsDarkModeState(val);
    if (!user) localStorage.setItem('warpmind-dark', String(val));
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        isDarkMode: val,
        updatedAt: serverTimestamp()
      });
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-chat-mode', chatMode);
    document.documentElement.setAttribute('data-friendly', String(friendlyMode));
    document.documentElement.setAttribute('data-dark', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.style.setProperty('--accent-color', accentColor);
    document.documentElement.style.setProperty('--accent-glow', `${accentColor} / 0.15`);
  }, [theme, accentColor, chatMode, friendlyMode, isDarkMode]);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, 
      accentColor, setAccentColor, 
      chatMode, setChatMode,
      friendlyMode, setFriendlyMode,
      isDarkMode, setIsDarkMode,
      user, profile, loading 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
