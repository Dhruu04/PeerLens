import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ClassData, Student, GradingScaleField, Review, Milestone } from '../utils/math';
import { normalizeNationality } from '../utils/math';
import { hashCode } from '../utils/csv';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, deleteDoc, runTransaction, setDoc } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
  
  export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  }

  export interface WorkspaceSettings {
    activeClassId?: string | null;
    activeTab?: string;
    shortcuts?: any[];
    featureToggles?: any;
    emailSettings?: {
      service?: string;
      brevoApiKey?: string;
      brevoSenderEmail?: string;
      brevoSenderName?: string;
      emailJsServiceId?: string;
      emailJsTemplateId?: string;
      emailJsPublicKey?: string;
    };
    theme?: string;
    updatedAt?: string;
  }
  
  export interface ToastAction {
    label: string;
    onClick: () => void;
  }

  export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    action?: ToastAction;
    createdAt: number;
  }
  
  interface ClassContextType {
    classes: ClassData[];
    activeClassId: string | null;
    activeClass: ClassData | null;
    loading: boolean;
    firebaseConfig: FirebaseConfig | null;
    isCloudSynced: boolean;
    toasts: ToastMessage[];
    
    // Admin Profiles (Model B - Isolated Environments)
    activeAdminProfile: string;
    adminProfiles: string[];
    switchAdminProfile: (profile: string) => void;
    createAdminProfile: (profile: string) => void;
    deleteAdminProfile: (profile: string) => void;
    
    // Admin Authentication (Option A - Secure Access Control)
    user: User | null;
    authLoading: boolean;
    loginAdmin: (email: string, password: string) => Promise<void>;
    signupAdmin: (email: string, password: string) => Promise<void>;
    logoutAdmin: () => Promise<void>;
    
    // Actions
    createClass: (name: string) => string;
    deleteClass: (id: string) => void;
    selectClass: (id: string | null) => void;
    updateGradingConfig: (classId: string, fields: GradingScaleField[], targetScale?: number | null, notify?: boolean) => void;
    updateTeamBaseGrade: (classId: string, teamName: string, grade: number) => void;
    setAllTeamBaseGrades: (classId: string, grades: Record<string, number>) => void;
    importRoster: (classId: string, students: Student[], clearExisting?: boolean) => void;
    addStudent: (classId: string, student: Omit<Student, 'submitted'>) => void;
    enrollStudent: (classId: string, student: Omit<Student, 'submitted' | 'id'> & { id?: string }) => Promise<{ success: boolean; studentId: string; message?: string }>;
    updateStudent: (classId: string, studentId: string, updatedFields: Partial<Student>) => void;
    deleteStudent: (classId: string, studentId: string) => void;
    deleteStudents: (classId: string, studentIds: string[]) => void;
    submitPeerReviews: (classId: string, reviewerId: string, reviews: Omit<Review, 'reviewerId'>[]) => Promise<void>;
    batchSubmitClassReviews: (classId: string, reviews: Review[], submittedStudentIds?: string[], silent?: boolean) => void;
    resetClassReviews: (classId: string, silent?: boolean) => void;
    clearClassRoster: (classId: string, silent?: boolean) => void;
    saveClassDeadline: (classId: string, deadline: string | null) => void;
    archiveActiveMilestone: (classId: string, milestoneName: string) => void;
    deleteMilestone: (classId: string, milestoneId: string) => void;
    
    // Settings / UI
    restoreClassesSnapshot: (snapshot: ClassData[]) => void;
    saveFirebaseConfig: (config: FirebaseConfig | null) => void;
    syncWorkspaceSettingsToCloud: (partial: Partial<WorkspaceSettings>) => Promise<void>;
    addToast: (message: string, type: ToastMessage['type'], options?: { action?: ToastAction; duration?: number }) => string;
    removeToast: (id: string) => void;
  }
  
  const ClassContext = createContext<ClassContextType | undefined>(undefined);
  
  const getDefaultClass = (): ClassData => {
    return {
      id: 'c_default',
      name: 'Intro to Web Development',
      targetScale: 20,
      teamBaseGrades: {},
      fields: [
        { id: 'f_quality', name: 'Quality of Contribution', description: 'Produces thorough, accurate deliverables on schedule with high attention to detail.', min: 1, max: 20, weight: 34 },
        { id: 'f_collaboration', name: 'Collaboration & Communication', description: 'Active engagement, responsiveness, transparency, and constructive teamwork.', min: 1, max: 20, weight: 33 },
        { id: 'f_reliability', name: 'Reliability & Commitment', description: 'Punctuality, meeting milestone deadlines, and dependable follow-through on assignments.', min: 1, max: 20, weight: 33 }
      ],
      students: [
        { id: 's_1', name: 'Matteo Rossi', email: 'matteo.rossi@unipr.it', groupName: 'Alpha Team', university: 'University of Parma', degree: 'Computer Science', studentType: 'Normal', isInternational: false, isExchange: false, currentCountry: 'Italy', originalCountry: 'Italy', originalUniversity: 'University of Parma', currentUniversity: 'University of Parma', gender: 'Male', nationality: 'Italy', englishProficiency: 'Fluent (C1/C2)', submitted: false },
        { id: 's_2', name: 'Sophie Laurent', email: 'sophie.laurent@etu.sorbonne.fr', groupName: 'Alpha Team', university: 'University of Parma', degree: 'Data Science & AI', studentType: 'Erasmus', isInternational: true, isExchange: true, currentCountry: 'Italy', originalCountry: 'France', originalUniversity: 'Sorbonne University', currentUniversity: 'University of Parma', gender: 'Female', nationality: 'France', englishProficiency: 'Fluent (C1/C2)', submitted: false },
        { id: 's_3', name: 'Lukas Weber', email: 'lukas.weber@tum.de', groupName: 'Alpha Team', university: 'TU Munich', degree: 'Software Engineering', studentType: 'Normal', isInternational: false, isExchange: false, currentCountry: 'Germany', originalCountry: 'Germany', originalUniversity: 'TU Munich', currentUniversity: 'TU Munich', gender: 'Male', nationality: 'Germany', englishProficiency: 'Advanced (B2)', submitted: false },
        { id: 's_4', name: 'Chiara Ferrari', email: 'chiara.ferrari@unipr.it', groupName: 'Beta Team', university: 'University of Parma', degree: 'Biomedical Engineering', studentType: 'Normal', isInternational: false, isExchange: false, currentCountry: 'Italy', originalCountry: 'Italy', originalUniversity: 'University of Parma', currentUniversity: 'University of Parma', gender: 'Female', nationality: 'Italy', englishProficiency: 'Fluent (C1/C2)', submitted: false },
        { id: 's_5', name: 'Pietro Bernardi', email: 'pietro.bernardi@tum.de', groupName: 'Beta Team', university: 'TU Munich', degree: 'Mechanical Engineering', studentType: 'Erasmus', isInternational: true, isExchange: true, currentCountry: 'Germany', originalCountry: 'Italy', originalUniversity: 'University of Parma', currentUniversity: 'TU Munich', gender: 'Male', nationality: 'Italy', englishProficiency: 'Fluent (C1/C2)', submitted: false },
        { id: 's_6', name: 'Valentina Moretti', email: 'valentina.moretti@polimi.it', groupName: 'Beta Team', university: 'Politecnico di Milano', degree: 'Computer Science', studentType: 'Normal', isInternational: false, isExchange: false, currentCountry: 'Italy', originalCountry: 'Italy', originalUniversity: 'Politecnico di Milano', currentUniversity: 'Politecnico di Milano', gender: 'Female', nationality: 'Italy', englishProficiency: 'Native / Bilingual', submitted: false }
      ],
      reviews: []
    };
  };
  
  export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeAdminProfile, setActiveAdminProfile] = useState<string>(() => {
      return localStorage.getItem('peer_grading_active_profile') || 'default';
    });
    const [adminProfiles, setAdminProfiles] = useState<string[]>(() => {
      const profiles = localStorage.getItem('peer_grading_profiles');
      return profiles ? JSON.parse(profiles) : ['default'];
    });

    // Admin authentication session states
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [studentOwnerUid, setStudentOwnerUid] = useState<string>('');

    const [classes, setClasses] = useState<ClassData[]>([]);
    const classesRef = useRef<ClassData[]>(classes);
    useEffect(() => {
      classesRef.current = classes;
    }, [classes]);

    const [activeClassId, setActiveClassId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const removeToast = useCallback((id: string) => {
      const timer = toastTimersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        toastTimersRef.current.delete(id);
      }
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((
      message: string,
      type: ToastMessage['type'],
      options?: { action?: ToastAction; duration?: number }
    ): string => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      const duration = options?.duration ?? (options?.action ? 30000 : 2800);
      const newToast: ToastMessage = {
        id,
        message,
        type,
        duration,
        action: options?.action,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        // Keep active undo toast alive, while limiting total toasts to 2
        const activeUndo = prev.filter(t => t.action && t.id !== id);
        return [...activeUndo, newToast].slice(-2);
      });

      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      toastTimersRef.current.set(id, timer);

      return id;
    }, [removeToast]);
  
    // Load config and profile lists initially
    useEffect(() => {
      try {
        // First check if there is a firebase config in the URL parameters (for students)
        const params = new URLSearchParams(window.location.search);
        const fbParam = params.get('fb');
        if (fbParam) {
          try {
            const decoded = JSON.parse(atob(fbParam));
            const config: FirebaseConfig = {
              apiKey: decoded.a,
              projectId: decoded.p,
              authDomain: decoded.d,
              storageBucket: '',
              messagingSenderId: '',
              appId: decoded.i
            };
            setFirebaseConfig(config);
            setIsCloudSynced(true);
            
            // Save the student's admin owner UID temporarily
            if (decoded.o) {
              setStudentOwnerUid(decoded.o);
            }
          } catch (urlFbErr) {
            console.error('Failed to parse URL firebase config', urlFbErr);
          }
        }

        // Migrate global legacy firebase config to default profile
        const oldConfig = localStorage.getItem('peer_grading_firebase_config');
        if (oldConfig) {
          localStorage.setItem('peer_grading_firebase_config_default', oldConfig);
          localStorage.removeItem('peer_grading_firebase_config');
        }
      } catch (err) {
        console.error('Failed to initialize local configurations', err);
      }
    }, []);

    // Load config whenever activeAdminProfile changes (Model A profile isolation)
    useEffect(() => {
      // If we loaded a temporary config in student mode from URL, don't overwrite it
      const params = new URLSearchParams(window.location.search);
      if (params.get('fb')) return;

      try {
        const storedConfig = localStorage.getItem(`peer_grading_firebase_config_${activeAdminProfile}`);
        if (storedConfig) {
          const parsedConfig = JSON.parse(storedConfig);
          setFirebaseConfig(parsedConfig);
          setIsCloudSynced(true);
        } else {
          setFirebaseConfig(null);
          setIsCloudSynced(false);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load profile specific firebase config', err);
      }
    }, [activeAdminProfile]);

    // Firebase Auth session listener hook
    useEffect(() => {
      if (!isCloudSynced || !firebaseConfig) {
        setAuthLoading(false);
        setUser(null);
        return;
      }

      let unsubscribeAuth: (() => void) | null = null;
      try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        
        setAuthLoading(true);
        unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setAuthLoading(false);
        }, (err) => {
          console.error('Auth session state change error:', err);
          setAuthLoading(false);
        });
      } catch (err) {
        console.error('Failed to initialize Firebase Auth listener:', err);
        setAuthLoading(false);
      }

      return () => {
        if (unsubscribeAuth) {
          unsubscribeAuth();
        }
      };
    }, [firebaseConfig, isCloudSynced]);

    // Real-Time Firebase Sync Effect (strictly scoped by secure admin UID or student owner UID)
    useEffect(() => {
      if (!isCloudSynced || !firebaseConfig || loading) {
        return;
      }

      // Admins must be logged in. Students must have studentOwnerUid parsed from invitation link URL
      const ownerUid = user ? user.uid : studentOwnerUid;
      if (!ownerUid) {
        return;
      }

      let unsubscribe: (() => void) | null = null;
      try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const db = getFirestore(app);
        
        // Listen strictly to authenticated admin's secure UID collection path
        const profileClassesRef = collection(db, 'admins', ownerUid, 'classes');
        
        unsubscribe = onSnapshot(profileClassesRef, (snapshot) => {
          let hasSettingsDoc = false;
          const cloudClasses: ClassData[] = [];

          snapshot.forEach((doc) => {
            // Intercept special workspace configuration document
            if (doc.id === '_settings_workspace') {
              hasSettingsDoc = true;
              const data = doc.data() as WorkspaceSettings;
              handleApplyWorkspaceSettings(data);
              return;
            }

            const data = doc.data();
            cloudClasses.push({
              id: doc.id,
              name: data.name || 'Untitled Class',
              fields: Array.isArray(data.fields) ? data.fields : [],
              students: Array.isArray(data.students) ? data.students : [],
              reviews: Array.isArray(data.reviews) ? data.reviews : [],
              deadline: data.deadline || null,
              milestones: Array.isArray(data.milestones) ? data.milestones : [],
              targetScale: typeof data.targetScale === 'number' ? data.targetScale : null,
              teamBaseGrades: data.teamBaseGrades && typeof data.teamBaseGrades === 'object' ? data.teamBaseGrades : {}
            });
          });

          // Only overwrite local state if Firestore collection has active classrooms
          if (cloudClasses.length > 0) {
            setClasses(cloudClasses);
            
            // Only write back to localStorage if we are in admin mode (to prevent students from polluting their local storages)
            if (user) {
              localStorage.setItem(`peer_grading_classes_${activeAdminProfile}`, JSON.stringify(cloudClasses));
            }
            
            setActiveClassId((prev) => {
              if (prev && cloudClasses.some(c => c.id === prev)) {
                return prev;
              }
              const savedActiveId = localStorage.getItem('peer_active_class_id');
              if (savedActiveId && cloudClasses.some(c => c.id === savedActiveId)) {
                return savedActiveId;
              }
              return cloudClasses.length > 0 ? cloudClasses[0].id : null;
            });
          } else {
            // Firestore collection has 0 classrooms. 
            // If the user is authenticated, and they have classes in their memory/localStorage,
            // push them to Firestore as a first-time migration.
            if (user && classesRef.current && classesRef.current.length > 0) {
              console.log('Auto-migration: Firestore collection is empty, pushing local classes.');
              persistClasses(classesRef.current);
            }
          }

          // Initial workspace settings cloud backup if not already present
          if (user && !hasSettingsDoc) {
            const currentActiveClass = localStorage.getItem('peer_active_class_id');
            const currentTab = localStorage.getItem('peer_active_tab') || 'hub';
            const currentShortcuts = localStorage.getItem('peerlens_shortcuts_v3');
            const currentFeatures = localStorage.getItem('peer_feature_toggles_v2');
            const emailService = localStorage.getItem('peer_email_service') || 'brevo';
            const brevoApiKey = localStorage.getItem('peer_brevo_api_key') || '';
            const brevoSenderEmail = localStorage.getItem('peer_brevo_sender_email') || '';
            const brevoSenderName = localStorage.getItem('peer_brevo_sender_name') || '';
            const emailJsServiceId = localStorage.getItem('peer_emailjs_service_id') || '';
            const emailJsTemplateId = localStorage.getItem('peer_emailjs_template_id') || '';
            const emailJsPublicKey = localStorage.getItem('peer_emailjs_user_id') || '';
            const theme = localStorage.getItem('peerlens_theme') || 'academic-navy';

            syncWorkspaceSettingsToCloud({
              activeClassId: currentActiveClass || null,
              activeTab: currentTab,
              shortcuts: currentShortcuts ? JSON.parse(currentShortcuts) : null,
              featureToggles: currentFeatures ? JSON.parse(currentFeatures) : null,
              emailSettings: {
                service: emailService,
                brevoApiKey,
                brevoSenderEmail,
                brevoSenderName,
                emailJsServiceId,
                emailJsTemplateId,
                emailJsPublicKey
              },
              theme
            });
          }
        }, (err) => {
          console.error('Firestore secure real-time sync error:', err);
        });
      } catch (err) {
        console.error('Failed to initialize Firestore sync:', err);
      }

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [firebaseConfig, isCloudSynced, activeAdminProfile, user, studentOwnerUid, loading]);

    // Re-hydrate workspace settings from cloud
    const handleApplyWorkspaceSettings = (data: WorkspaceSettings) => {
      if (!data) return;

      // 1. Active class
      if (data.activeClassId) {
        localStorage.setItem('peer_active_class_id', data.activeClassId);
        setActiveClassId((prev) => {
          if (classesRef.current.some(c => c.id === data.activeClassId)) {
            return data.activeClassId!;
          }
          return prev;
        });
      }

      // 2. Active tab
      if (data.activeTab) {
        localStorage.setItem('peer_active_tab', data.activeTab);
        window.dispatchEvent(new CustomEvent('peerlens_tab_synced', { detail: data.activeTab }));
      }

      // 3. Shortcuts
      if (Array.isArray(data.shortcuts) && data.shortcuts.length > 0) {
        localStorage.setItem('peerlens_shortcuts_v3', JSON.stringify(data.shortcuts));
        window.dispatchEvent(new CustomEvent('peerlens_shortcuts_changed', { detail: data.shortcuts }));
      }

      // 4. Feature toggles
      if (data.featureToggles) {
        localStorage.setItem('peer_feature_toggles_v2', JSON.stringify(data.featureToggles));
        window.dispatchEvent(new CustomEvent('peerlens_features_synced', { detail: data.featureToggles }));
      }

      // 5. Email settings
      if (data.emailSettings) {
        const es = data.emailSettings;
        if (es.service) localStorage.setItem('peer_email_service', es.service);
        if (es.brevoApiKey) {
          localStorage.setItem('peer_brevo_api_key', es.brevoApiKey);
          localStorage.setItem('peerlens_brevo_key', es.brevoApiKey);
        }
        if (es.brevoSenderEmail) {
          localStorage.setItem('peer_brevo_sender_email', es.brevoSenderEmail);
          localStorage.setItem('peerlens_brevo_sender', es.brevoSenderEmail);
        }
        if (es.brevoSenderName) {
          localStorage.setItem('peer_brevo_sender_name', es.brevoSenderName);
          localStorage.setItem('peerlens_brevo_name', es.brevoSenderName);
        }
        if (es.emailJsServiceId) {
          localStorage.setItem('peer_emailjs_service_id', es.emailJsServiceId);
          localStorage.setItem('peerlens_emailjs_service', es.emailJsServiceId);
        }
        if (es.emailJsTemplateId) {
          localStorage.setItem('peer_emailjs_template_id', es.emailJsTemplateId);
          localStorage.setItem('peerlens_emailjs_template', es.emailJsTemplateId);
        }
        if (es.emailJsPublicKey) {
          localStorage.setItem('peer_emailjs_user_id', es.emailJsPublicKey);
          localStorage.setItem('peerlens_emailjs_public', es.emailJsPublicKey);
        }
      }

      // 6. Theme
      if (data.theme) {
        localStorage.setItem('peerlens_theme', data.theme);
        window.dispatchEvent(new CustomEvent('peerlens_theme_synced', { detail: data.theme }));
      }
    };

    // Cloud helper to sync workspace settings to cloud using existing allowed classes subcollection path
    const syncWorkspaceSettingsToCloud = async (partial: Partial<WorkspaceSettings>) => {
      if (!isCloudSynced || !firebaseConfig || !user) return;
      try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const db = getFirestore(app);
        // Store in classes subcollection with system ID so it matches existing Firestore security rules
        const settingsDocRef = doc(db, 'admins', user.uid, 'classes', '_settings_workspace');
        
        // Deep-clean to eliminate ANY undefined values for Firestore
        const cleanPayload = JSON.parse(JSON.stringify({
          ...partial,
          updatedAt: new Date().toISOString()
        }));

        await setDoc(settingsDocRef, cleanPayload, { merge: true });
      } catch (err) {
        console.warn('Could not sync workspace settings to cloud:', err);
      }
    };

    // Authentication Action Handlers
    const loginAdmin = async (email: string, password: string) => {
      if (!firebaseConfig) {
        addToast('No active cloud database. Link a Firebase project first.', 'warning');
        return;
      }
      try {
        setAuthLoading(true);
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        await signInWithEmailAndPassword(auth, email, password);
        addToast('Sign in successful!', 'success');
      } catch (err: any) {
        console.error('Login action error', err);
        const friendlyMsg = err?.code === 'auth/invalid-credential' 
          ? 'Invalid credentials. Double-check your details.' 
          : err?.message || 'Access denied.';
        addToast(friendlyMsg, 'error');
        throw err;
      } finally {
        setAuthLoading(false);
      }
    };

    const signupAdmin = async (email: string, password: string) => {
      if (!firebaseConfig) {
        addToast('No active cloud database. Link a Firebase project first.', 'warning');
        return;
      }
      try {
        setAuthLoading(true);
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        await createUserWithEmailAndPassword(auth, email, password);
        addToast('Admin account created successfully!', 'success');
      } catch (err: any) {
        console.error('Registration error', err);
        const friendlyMsg = err?.code === 'auth/email-already-in-use' 
          ? 'This email address is already in use.' 
          : err?.message || 'Failed to sign up.';
        addToast(friendlyMsg, 'error');
        throw err;
      } finally {
        setAuthLoading(false);
      }
    };

    const logoutAdmin = async () => {
      if (!firebaseConfig) {
        setUser(null);
        return;
      }
      try {
        setAuthLoading(true);
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        await signOut(auth);
        setUser(null);
        setClasses([]);
        setActiveClassId(null);
        addToast('Logged out securely.', 'info');
      } catch (err: any) {
        console.error('Sign out error', err);
        addToast('Failed to log out.', 'error');
      } finally {
        setAuthLoading(false);
      }
    };

    // Load classes whenever activeAdminProfile changes
    useEffect(() => {
      setLoading(true);
      try {
        const targetKey = `peer_grading_classes_${activeAdminProfile}`;
        const storedClasses = localStorage.getItem(targetKey);
        
        if (storedClasses) {
          try {
            const parsedClasses = JSON.parse(storedClasses) as ClassData[];
            if (Array.isArray(parsedClasses)) {
              // Standardize shape to prevent rendering crashes from malformed storage
              const validated = parsedClasses.map((c) => ({
                id: c.id || 'c_' + Math.random().toString(36).substring(2, 9),
                name: c.name || 'Untitled Class',
                fields: Array.isArray(c.fields) ? c.fields : [],
                students: Array.isArray(c.students) ? c.students : [],
                reviews: Array.isArray(c.reviews) ? c.reviews : [],
                deadline: c.deadline || null,
                milestones: Array.isArray(c.milestones) ? c.milestones : [],
                targetScale: typeof c.targetScale === 'number' ? c.targetScale : null,
                teamBaseGrades: c.teamBaseGrades && typeof c.teamBaseGrades === 'object' ? c.teamBaseGrades : {}
              }));
              
              setClasses(validated);
              const savedActiveId = localStorage.getItem('peer_active_class_id');
              if (savedActiveId && validated.some(c => c.id === savedActiveId)) {
                setActiveClassId(savedActiveId);
              } else if (validated.length > 0) {
                setActiveClassId(validated[0].id);
                localStorage.setItem('peer_active_class_id', validated[0].id);
              } else {
                setActiveClassId(null);
              }
            } else {
              throw new Error('Data in localStorage is not an array.');
            }
          } catch (e) {
            console.warn(`Malformed localStorage data detected for profile ${activeAdminProfile}. Falling back.`, e);
            localStorage.removeItem(targetKey);
            setClasses([]);
            setActiveClassId(null);
          }
        } else {
          // If default profile has nothing, check if there is an unmigrated global database
          if (activeAdminProfile === 'default') {
            const oldClasses = localStorage.getItem('peer_grading_classes');
            if (oldClasses) {
              try {
                localStorage.setItem('peer_grading_classes_default', oldClasses);
                localStorage.removeItem('peer_grading_classes'); // migrate
                const parsed = JSON.parse(oldClasses);
                setClasses(parsed);
                if (parsed.length > 0) setActiveClassId(parsed[0].id);
              } catch (migErr) {
                const defaultClass = getDefaultClass();
                setClasses([defaultClass]);
                setActiveClassId(defaultClass.id);
                localStorage.setItem('peer_grading_classes_default', JSON.stringify([defaultClass]));
              }
            } else {
              // Populate initial demo class for the default profile
              const defaultClass = getDefaultClass();
              setClasses([defaultClass]);
              setActiveClassId(defaultClass.id);
              localStorage.setItem('peer_grading_classes_default', JSON.stringify([defaultClass]));
            }
          } else {
            // New custom profile starts with an empty workspace
            setClasses([]);
            setActiveClassId(null);
          }
        }
      } catch (err) {
        console.error('Failed to load profile specific classes', err);
      } finally {
        setLoading(false);
      }
    }, [activeAdminProfile]);
  
    // Live multi-tab synchronization for localStorage
    useEffect(() => {
      const handleStorageChange = (e: StorageEvent) => {
        const targetKey = `peer_grading_classes_${activeAdminProfile}`;
        if (e.key === targetKey && e.newValue) {
          try {
            const parsedClasses = JSON.parse(e.newValue) as ClassData[];
            if (Array.isArray(parsedClasses)) {
              const validated = parsedClasses.map((c) => ({
                id: c.id || 'c_' + Math.random().toString(36).substring(2, 9),
                name: c.name || 'Untitled Class',
                fields: Array.isArray(c.fields) ? c.fields : [],
                students: Array.isArray(c.students) ? c.students : [],
                reviews: Array.isArray(c.reviews) ? c.reviews : [],
                deadline: c.deadline || null,
                milestones: Array.isArray(c.milestones) ? c.milestones : [],
                targetScale: typeof c.targetScale === 'number' ? c.targetScale : null,
                teamBaseGrades: c.teamBaseGrades && typeof c.teamBaseGrades === 'object' ? c.teamBaseGrades : {}
              }));
              setClasses(validated);
            }
          } catch (err) {
            console.error('Failed to sync storage change', err);
          }
        }
      };
 
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }, [activeAdminProfile]);
  
    const sanitizeClassForFirestore = (c: ClassData): any => {
      return {
        id: c.id,
        name: c.name || 'Untitled Class',
        fields: Array.isArray(c.fields) ? c.fields.map(f => ({
          id: f.id,
          name: f.name || '',
          description: f.description || '',
          min: typeof f.min === 'number' ? f.min : 1,
          max: typeof f.max === 'number' ? f.max : 10,
          weight: typeof f.weight === 'number' ? f.weight : 1
        })) : [],
        students: Array.isArray(c.students) ? c.students.map(s => ({
          id: s.id,
          name: s.name || '',
          email: s.email || '',
          groupName: s.groupName || '',
          university: s.university || '',
          degree: s.degree || '',
          studentType: s.studentType || 'Normal',
          gender: s.gender || 'Prefer not to say',
          nationality: s.nationality || '',
          englishProficiency: s.englishProficiency || '',
          isInternational: !!s.isInternational,
          isExchange: !!s.isExchange,
          currentCountry: s.currentCountry || '',
          originalCountry: s.originalCountry || '',
          originalUniversity: s.originalUniversity || '',
          currentUniversity: s.currentUniversity || '',
          submitted: !!s.submitted
        })) : [],
        reviews: Array.isArray(c.reviews) ? c.reviews.map(r => ({
          reviewerId: r.reviewerId || '',
          recipientId: r.recipientId || '',
          scores: r.scores || {},
          praiseTags: Array.isArray(r.praiseTags) ? r.praiseTags : [],
          strengthsText: r.strengthsText !== undefined ? r.strengthsText : null,
          growthText: r.growthText !== undefined ? r.growthText : null
        })) : [],
        deadline: c.deadline !== undefined ? c.deadline : null,
        milestones: Array.isArray(c.milestones) ? c.milestones.map(m => ({
          id: m.id,
          name: m.name || '',
          date: m.date || new Date().toISOString(),
          reviews: Array.isArray(m.reviews) ? m.reviews.map(mr => ({
            reviewerId: mr.reviewerId || '',
            recipientId: mr.recipientId || '',
            scores: mr.scores || {},
            praiseTags: Array.isArray(mr.praiseTags) ? mr.praiseTags : [],
            strengthsText: mr.strengthsText !== undefined ? mr.strengthsText : null,
            growthText: mr.growthText !== undefined ? mr.growthText : null
          })) : []
        })) : [],
        targetScale: typeof c.targetScale === 'number' ? c.targetScale : null,
        teamBaseGrades: c.teamBaseGrades && typeof c.teamBaseGrades === 'object' ? c.teamBaseGrades : {}
      };
    };

    // Save classes to localStorage whenever they change
    const persistClasses = async (updatedClasses: ClassData[]) => {
      classesRef.current = updatedClasses;
      setClasses(updatedClasses);
      
      // Save local backup unconditionally for full offline and instant availability
      localStorage.setItem(`peer_grading_classes_${activeAdminProfile}`, JSON.stringify(updatedClasses));

      if (isCloudSynced && firebaseConfig) {
        const ownerUid = user ? user.uid : studentOwnerUid;
        if (!ownerUid) return;

        try {
          const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
          const db = getFirestore(app);
          for (const c of updatedClasses) {
            const classDocRef = doc(db, 'admins', ownerUid, 'classes', c.id);
            
            await runTransaction(db, async (transaction) => {
              const sfDoc = await transaction.get(classDocRef);
              
              if (!sfDoc.exists()) {
                // Document does not exist in Firestore. Set it directly.
                transaction.set(classDocRef, sanitizeClassForFirestore(c));
              } else {
                // Document exists. Safe merge of reviews and students submitted statuses to prevent overwrites.
                const cloudData = sfDoc.data() as ClassData;
                const params = new URLSearchParams(window.location.search);
                const urlStudentId = params.get('studentId');
                
                if (urlStudentId) {
                  // Student mode: Merge specifically to preserve other students' data and reviews
                  const otherReviews = (cloudData.reviews || []).filter(r => r.reviewerId !== urlStudentId);
                  const myNewReviews = (c.reviews || []).filter(r => r.reviewerId === urlStudentId);
                  const mergedReviews = [...otherReviews, ...myNewReviews];
                  
                  const mergedStudents = (c.students || []).map(s => {
                    const cloudStudent = (cloudData.students || []).find(cs => cs.id === s.id);
                    if (s.id === urlStudentId) {
                      return { ...s, submitted: true };
                    }
                    return {
                      ...s,
                      submitted: cloudStudent ? cloudStudent.submitted : s.submitted
                    };
                  });
                  
                  const updatedClass = {
                    ...cloudData, // Preserve cloud-authoritative fields (deadline, milestones, configurations)
                    students: mergedStudents,
                    reviews: mergedReviews
                  };
                  transaction.set(classDocRef, sanitizeClassForFirestore(updatedClass));
                } else {
                  // Admin mode: Authoritative updates
                  // If clearing roster or resetting reviews, overwrite directly
                  const isClearingRoster = c.students.length === 0;
                  const isResetOrArchive = c.reviews.length === 0 && !c.students.some(s => s.submitted);
                  if (isClearingRoster || isResetOrArchive) {
                    transaction.set(classDocRef, sanitizeClassForFirestore(c));
                  } else {
                    const localStudentIds = new Set(c.students.map(s => s.id));
                    
                    // Keep cloud reviews for any student still in the roster who hasn't been re-reviewed locally
                    const cloudReviewsToKeep = (cloudData.reviews || []).filter(r => 
                      localStudentIds.has(r.reviewerId) && 
                      !c.reviews.some(lr => lr.reviewerId === r.reviewerId)
                    );
                    
                    const mergedReviews = [...c.reviews, ...cloudReviewsToKeep];
                    
                    const mergedStudents = c.students.map(s => {
                      const cloudStudent = (cloudData.students || []).find(cs => cs.id === s.id);
                      return { 
                        ...s,
                        submitted: s.submitted || (cloudStudent ? cloudStudent.submitted : false)
                      };
                    });
                    
                    const updatedClass = {
                      ...c,
                      students: mergedStudents,
                      reviews: mergedReviews
                    };
                    transaction.set(classDocRef, sanitizeClassForFirestore(updatedClass));
                  }
                }
              }
            });
          }
        } catch (err) {
          console.error('Failed to sync changes to Firestore via transaction:', err);
        }
      }
    };
  
    // Find active class
    const activeClass = classes.find((c) => c.id === activeClassId) || null;
  
    // Admin Profiles actions implementation
    const createAdminProfile = (profileName: string) => {
      const sanitized = profileName.trim().toLowerCase();
      if (!sanitized) {
        addToast('Profile name cannot be empty.', 'warning');
        return;
      }
      if (adminProfiles.includes(sanitized)) {
        addToast(`Admin profile "${profileName}" already exists!`, 'warning');
        return;
      }
      const updated = [...adminProfiles, sanitized];
      setAdminProfiles(updated);
      localStorage.setItem('peer_grading_profiles', JSON.stringify(updated));
      
      setActiveAdminProfile(sanitized);
      localStorage.setItem('peer_grading_active_profile', sanitized);
      addToast(`Admin profile "${profileName}" created successfully.`, 'success');
    };

    const switchAdminProfile = (profileName: string) => {
      if (adminProfiles.includes(profileName)) {
        setActiveAdminProfile(profileName);
        localStorage.setItem('peer_grading_active_profile', profileName);
        addToast(`Switched workspace to Admin: "${profileName}"`, 'info');
      }
    };

    const deleteAdminProfile = (profileName: string) => {
      if (profileName === 'default') {
        addToast('The default workspace profile cannot be deleted.', 'warning');
        return;
      }
      const remaining = adminProfiles.filter(p => p !== profileName);
      setAdminProfiles(remaining);
      localStorage.setItem('peer_grading_profiles', JSON.stringify(remaining));
      localStorage.removeItem(`peer_grading_classes_${profileName}`);
      
      if (activeAdminProfile === profileName) {
        setActiveAdminProfile('default');
        localStorage.setItem('peer_grading_active_profile', 'default');
      }
      addToast(`Workspace profile "${profileName}" deleted permanently.`, 'info');
    };

    // Helper to always retrieve the freshest synchronous classes state
    const getCurrentClasses = () => classesRef.current.length > 0 ? classesRef.current : classes;

    // Actions
    const createClass = (name: string): string => {
      const id = 'c_' + Math.random().toString(36).substring(2, 9);
      const newClass: ClassData = {
        id,
        name,
        fields: [{ id: 'f_overall', name: 'Performance Contribution', min: 1, max: 10, weight: 1 }],
        students: [],
        reviews: []
      };
      persistClasses([...getCurrentClasses(), newClass]);
      setActiveClassId(id);
      localStorage.setItem('peer_active_class_id', id);
      syncWorkspaceSettingsToCloud({ activeClassId: id });
      addToast(`Class "${name}" successfully created!`, 'success');
      return id;
    };
  
    const deleteClass = async (id: string) => {
      const current = getCurrentClasses();
      const targetClass = current.find((c) => c.id === id);
      const snapshot = JSON.parse(JSON.stringify(current)) as ClassData[];

      const remainingClasses = current.filter((c) => c.id !== id);
      persistClasses(remainingClasses);

      if (isCloudSynced && firebaseConfig) {
        const ownerUid = user ? user.uid : studentOwnerUid;
        if (ownerUid) {
          try {
            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
            const db = getFirestore(app);
            const classDocRef = doc(db, 'admins', ownerUid, 'classes', id);
            await deleteDoc(classDocRef);
          } catch (err) {
            console.error('Failed to delete class from Firestore:', err);
          }
        }
      }
      
      if (activeClassId === id) {
        const nextId = remainingClasses.length > 0 ? remainingClasses[0].id : null;
        setActiveClassId(nextId);
        if (nextId) localStorage.setItem('peer_active_class_id', nextId);
        else localStorage.removeItem('peer_active_class_id');
        syncWorkspaceSettingsToCloud({ activeClassId: nextId });
      }

      const className = targetClass ? targetClass.name : 'Class';
      addToast(`Class "${className}" deleted`, 'warning', {
        duration: 30000,
        action: {
          label: 'Undo',
          onClick: () => {
            restoreClassesSnapshot(snapshot);
            setActiveClassId(id);
            localStorage.setItem('peer_active_class_id', id);
            syncWorkspaceSettingsToCloud({ activeClassId: id });
            addToast(`Restored class "${className}"`, 'success');
          }
        }
      });
    };
  
    const selectClass = (id: string | null) => {
      setActiveClassId(id);
      if (id) {
        localStorage.setItem('peer_active_class_id', id);
      } else {
        localStorage.removeItem('peer_active_class_id');
      }
      syncWorkspaceSettingsToCloud({ activeClassId: id });
    };
  
    const updateGradingConfig = (classId: string, fields: GradingScaleField[], targetScale?: number | null, notify: boolean = false) => {
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          return { 
            ...c, 
            fields,
            targetScale: targetScale !== undefined ? targetScale : c.targetScale
          };
        }
        return c;
      });
      persistClasses(updatedClasses);
      if (notify) {
        addToast('Grading configuration successfully updated.', 'success');
      }
    };

    const updateTeamBaseGrade = (classId: string, teamName: string, grade: number) => {
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          const newTeamGrades = { ...(c.teamBaseGrades || {}) };
          newTeamGrades[teamName] = grade;
          return {
            ...c,
            teamBaseGrades: newTeamGrades
          };
        }
        return c;
      });
      persistClasses(updatedClasses);
    };

    const setAllTeamBaseGrades = (classId: string, grades: Record<string, number>) => {
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            teamBaseGrades: { ...grades }
          };
        }
        return c;
      });
      persistClasses(updatedClasses);
      addToast('Updated base grades for all teams.', 'success');
    };
  
    const importRoster = (classId: string, newStudents: Student[], clearExisting = false) => {
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          const mergedStudents = clearExisting 
            ? newStudents 
            : [...c.students.filter(existing => !newStudents.some(n => n.id === existing.id)), ...newStudents];
          
          return { ...c, students: mergedStudents };
        }
        return c;
      });
      persistClasses(updatedClasses);
      addToast(`Successfully imported ${newStudents.length} students.`, 'success');
    };
  
    const addStudent = (classId: string, studentData: Omit<Student, 'submitted'>) => {
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          // Check for duplicate Email (case-insensitive)
          if (c.students.some(s => s.email.toLowerCase() === studentData.email.toLowerCase())) {
            addToast(`Student with email ${studentData.email} already exists in this class!`, 'error');
            return c;
          }
          const newStudent: Student = { 
            ...studentData, 
            nationality: normalizeNationality(studentData.nationality),
            submitted: false 
          };
          addToast(`Student "${studentData.name}" added successfully!`, 'success');
          return { ...c, students: [...c.students, newStudent] };
        }
        return c;
      });
      persistClasses(updatedClasses);
    };

    const enrollStudent = async (
      classId: string,
      studentData: Omit<Student, 'submitted' | 'id'> & { id?: string }
    ): Promise<{ success: boolean; studentId: string; message?: string }> => {
      const normEmail = studentData.email.trim().toLowerCase();
      const normalizedNation = normalizeNationality(studentData.nationality);
      const newStudentId = studentData.id?.trim() || 'std_' + Math.abs(hashCode(normEmail || studentData.name));
      
      const studentToEnroll: Student = {
        ...studentData,
        id: newStudentId,
        name: studentData.name.trim(),
        email: normEmail,
        groupName: studentData.groupName?.trim() || 'General Team',
        nationality: normalizedNation,
        gender: studentData.gender?.trim() || 'Prefer not to say',
        englishProficiency: studentData.englishProficiency?.trim() || 'Fluent (C1/C2)',
        university: studentData.university?.trim() || '',
        degree: studentData.degree?.trim() || '',
        studentType: studentData.studentType?.trim() || 'Normal',
        submitted: false
      };

      // 1. If Cloud Synced with Firebase, do transactional write to Firestore
      if (isCloudSynced && firebaseConfig) {
        const ownerUid = user ? user.uid : studentOwnerUid;
        if (ownerUid) {
          try {
            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
            const db = getFirestore(app);
            const classDocRef = doc(db, 'admins', ownerUid, 'classes', classId);
            
            await runTransaction(db, async (transaction) => {
              const sfDoc = await transaction.get(classDocRef);
              if (!sfDoc.exists()) {
                throw new Error('Classroom not found in cloud database.');
              }
              const cloudData = sfDoc.data() as ClassData;
              const currentStudents = cloudData.students || [];
              
              // Check if already registered by email or ID (case-insensitive)
              const existingIndex = currentStudents.findIndex(
                s => s.email.toLowerCase() === normEmail || s.id === newStudentId
              );
              
              let updatedStudents: Student[];
              if (existingIndex >= 0) {
                // Update profile with new info while preserving submitted status
                const existing = currentStudents[existingIndex];
                updatedStudents = [...currentStudents];
                updatedStudents[existingIndex] = {
                  ...existing,
                  ...studentToEnroll,
                  submitted: existing.submitted
                };
              } else {
                updatedStudents = [...currentStudents, studentToEnroll];
              }
              
              const updatedClass = {
                ...cloudData,
                students: updatedStudents
              };
              
              transaction.set(classDocRef, sanitizeClassForFirestore(updatedClass));
            });
          } catch (err: any) {
            console.error('Failed to enroll student via Firestore transaction:', err);
            return { success: false, studentId: newStudentId, message: err.message || 'Failed to sync with cloud.' };
          }
        }
      }

      // 2. Update local state and localStorage
      setClasses(prevClasses => {
        const updated = prevClasses.map(c => {
          if (c.id === classId) {
            const existingIdx = c.students.findIndex(
              s => s.email.toLowerCase() === normEmail || s.id === newStudentId
            );
            let updatedStudents: Student[];
            if (existingIdx >= 0) {
              const existing = c.students[existingIdx];
              updatedStudents = [...c.students];
              updatedStudents[existingIdx] = {
                ...existing,
                ...studentToEnroll,
                submitted: existing.submitted
              };
            } else {
              updatedStudents = [...c.students, studentToEnroll];
            }
            return { ...c, students: updatedStudents };
          }
          return c;
        });
        localStorage.setItem(`peer_grading_classes_${activeAdminProfile}`, JSON.stringify(updated));
        return updated;
      });

      return { success: true, studentId: newStudentId };
    };
 
    const updateStudent = (classId: string, studentId: string, updatedFields: Partial<Student>) => {
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          const updatedStudents = c.students.map((s) => {
            if (s.id === studentId) {
              return { ...s, ...updatedFields };
            }
            return s;
          });
          return { ...c, students: updatedStudents };
        }
        return c;
      });
      persistClasses(updatedClasses);
    };
  
    const deleteStudent = (classId: string, studentId: string) => {
      const current = getCurrentClasses();
      const targetClass = current.find(c => c.id === classId);
      const studentToDelete = targetClass?.students.find(s => s.id === studentId);
      const snapshot = JSON.parse(JSON.stringify(current)) as ClassData[];

      const updatedClasses = current.map((c) => {
        if (c.id === classId) {
          // Remove their student record AND any reviews they wrote or received
          const filteredStudents = c.students.filter((s) => s.id !== studentId);
          const filteredReviews = c.reviews.filter(
            (r) => r.reviewerId !== studentId && r.recipientId !== studentId
          );
          return { ...c, students: filteredStudents, reviews: filteredReviews };
        }
        return c;
      });
      persistClasses(updatedClasses);

      const studentName = studentToDelete ? studentToDelete.name : 'Student';
      addToast(`Removed "${studentName}" from class`, 'warning', {
        duration: 30000,
        action: {
          label: 'Undo',
          onClick: () => {
            restoreClassesSnapshot(snapshot);
            addToast(`Restored "${studentName}" to class`, 'success');
          }
        }
      });
    };

    const deleteStudents = (classId: string, studentIds: string[]) => {
      const current = getCurrentClasses();
      const snapshot = JSON.parse(JSON.stringify(current)) as ClassData[];
      const idSet = new Set(studentIds);

      const updatedClasses = current.map((c) => {
        if (c.id === classId) {
          const filteredStudents = c.students.filter((s) => !idSet.has(s.id));
          const filteredReviews = c.reviews.filter(
            (r) => !idSet.has(r.reviewerId) && !idSet.has(r.recipientId)
          );
          return { ...c, students: filteredStudents, reviews: filteredReviews };
        }
        return c;
      });
      persistClasses(updatedClasses);

      addToast(`Deleted ${studentIds.length} student${studentIds.length > 1 ? 's' : ''}`, 'warning', {
        duration: 30000,
        action: {
          label: 'Undo',
          onClick: () => {
            restoreClassesSnapshot(snapshot);
            addToast(`Restored ${studentIds.length} students`, 'success');
          }
        }
      });
    };
  
    const submitPeerReviews = async (
      classId: string,
      reviewerId: string,
      newReviews: Omit<Review, 'reviewerId'>[]
    ) => {
      // Find class
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          // Remove existing reviews written by this reviewer (to prevent duplication)
          const remainingReviews = c.reviews.filter((r) => r.reviewerId !== reviewerId);
          
          // Construct fully formatted review objects
          const formattedReviews: Review[] = newReviews.map((r) => ({
            ...r,
            reviewerId
          }));
  
          // Mark reviewer as submitted = true
          const updatedStudents = c.students.map((s) => {
            if (s.id === reviewerId) {
              return { ...s, submitted: true };
            }
            return s;
          });
  
          return {
            ...c,
            students: updatedStudents,
            reviews: [...remainingReviews, ...formattedReviews]
          };
        }
        return c;
      });
      
      persistClasses(updatedClasses);
      addToast('Thank you! Your peer feedback was submitted successfully.', 'success');
    };

    const batchSubmitClassReviews = (
      classId: string,
      allReviews: Review[],
      submittedStudentIds?: string[],
      silent?: boolean
    ) => {
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          const submittedSet = submittedStudentIds ? new Set(submittedStudentIds) : null;
          const updatedStudents = c.students.map((s) => {
            if (!submittedSet || submittedSet.has(s.id)) {
              return { ...s, submitted: true };
            }
            return s;
          });

          return {
            ...c,
            students: updatedStudents,
            reviews: allReviews
          };
        }
        return c;
      });

      persistClasses(updatedClasses);
      if (!silent) {
        addToast(`Successfully populated reviews for ${allReviews.length} evaluations.`, 'success');
      }
    };
  
    const saveClassDeadline = (classId: string, deadline: string | null) => {
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          return { ...c, deadline };
        }
        return c;
      });
      persistClasses(updatedClasses);
    };
 
    const archiveActiveMilestone = (classId: string, milestoneName: string) => {
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          const milestones = c.milestones || [];
          const newMilestone: Milestone = {
            id: 'm_' + Math.random().toString(36).substring(2, 9),
            name: milestoneName,
            date: new Date().toISOString(),
            reviews: [...c.reviews]
          };
          
          // Reset reviews and students submission states for the new session
          const resetStudents = c.students.map((s) => ({ ...s, submitted: false }));
          
          return {
            ...c,
            milestones: [...milestones, newMilestone],
            reviews: [],
            students: resetStudents
          };
        }
        return c;
      });
      persistClasses(updatedClasses);
      addToast(`Milestone "${milestoneName}" successfully archived. Active feedback reset for next sprint!`, 'success');
    };
 
    const deleteMilestone = (classId: string, milestoneId: string) => {
      const updatedClasses = getCurrentClasses().map((c) => {
        if (c.id === classId) {
          const milestones = (c.milestones || []).filter((m) => m.id !== milestoneId);
          return { ...c, milestones };
        }
        return c;
      });
      persistClasses(updatedClasses);
      addToast('Historical milestone deleted.', 'info');
    };
 
    const resetClassReviews = (classId: string, silent: boolean = false) => {
      const currentList = classesRef.current.length > 0 ? classesRef.current : classes;
      const snapshot = JSON.parse(JSON.stringify(currentList)) as ClassData[];
      const updatedClasses = currentList.map((c) => {
        if (c.id === classId) {
          const resetStudents = c.students.map((s) => ({ ...s, submitted: false }));
          return { ...c, students: resetStudents, reviews: [] };
        }
        return c;
      });
      persistClasses(updatedClasses);
      if (!silent) {
        addToast('All peer feedback data has been reset', 'warning', {
          duration: 30000,
          action: {
            label: 'Undo',
            onClick: () => {
              restoreClassesSnapshot(snapshot);
              addToast('Restored all peer evaluations and review statuses', 'success');
            }
          }
        });
      }
    };

    const clearClassRoster = (classId: string, silent: boolean = false) => {
      const currentList = classesRef.current.length > 0 ? classesRef.current : classes;
      const snapshot = JSON.parse(JSON.stringify(currentList)) as ClassData[];
      const targetClass = currentList.find((c) => c.id === classId);
      const studentCount = targetClass?.students.length || 0;

      const updatedClasses = currentList.map((c) => {
        if (c.id === classId) {
          return { ...c, students: [], reviews: [] };
        }
        return c;
      });
      persistClasses(updatedClasses);
      if (!silent) {
        addToast(`Cleared class roster (${studentCount} students)`, 'warning', {
          duration: 30000,
          action: {
            label: 'Undo',
            onClick: () => {
              restoreClassesSnapshot(snapshot);
              addToast('Restored class roster and evaluations', 'success');
            }
          }
        });
      }
    };
  
    const restoreClassesSnapshot = (snapshot: ClassData[]) => {
      if (Array.isArray(snapshot) && snapshot.length > 0) {
        setClasses(snapshot);
        classesRef.current = snapshot;
        localStorage.setItem(`peer_grading_classes_${activeAdminProfile}`, JSON.stringify(snapshot));
        // Persist restored state to cloud database to maintain 100% sync
        persistClasses(snapshot);
      }
    };

    const saveFirebaseConfig = (config: FirebaseConfig | null) => {
      setFirebaseConfig(config);
      const targetKey = `peer_grading_firebase_config_${activeAdminProfile}`;
      if (config) {
        localStorage.setItem(targetKey, JSON.stringify(config));
        setIsCloudSynced(true);
        addToast(`Firebase sync active for workspace "${activeAdminProfile}"!`, 'success');
      } else {
        localStorage.removeItem(targetKey);
        setIsCloudSynced(false);
        addToast(`Switched workspace "${activeAdminProfile}" to Local-First Mode.`, 'info');
      }
    };
  
    return (
      <ClassContext.Provider
        value={{
          classes,
          activeClassId,
          activeClass,
          loading,
          firebaseConfig,
          isCloudSynced,
          toasts,
          activeAdminProfile,
          adminProfiles,
          switchAdminProfile,
          createAdminProfile,
          deleteAdminProfile,
          user,
          authLoading,
          loginAdmin,
          signupAdmin,
          logoutAdmin,
          createClass,
          deleteClass,
          selectClass,
          updateGradingConfig,
          updateTeamBaseGrade,
          setAllTeamBaseGrades,
          importRoster,
          addStudent,
          enrollStudent,
          updateStudent,
          deleteStudent,
          deleteStudents,
          submitPeerReviews,
          batchSubmitClassReviews,
          resetClassReviews,
          clearClassRoster,
          saveClassDeadline,
          archiveActiveMilestone,
          deleteMilestone,
          restoreClassesSnapshot,
          saveFirebaseConfig,
          syncWorkspaceSettingsToCloud,
          addToast,
          removeToast
        }}
      >
        {children}
      </ClassContext.Provider>
    );
  };
  
  export const useClass = () => {
    const context = useContext(ClassContext);
    if (context === undefined) {
      throw new Error('useClass must be used within a ClassProvider');
    }
    return context;
  };
