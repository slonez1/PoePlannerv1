import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  BookOpen, 
  RotateCcw, 
  Search, 
  Plus, 
  Star, 
  ChevronRight, 
  Trash2, 
  CheckCircle, 
  Info, 
  Loader2, 
  ChefHat, 
  ArrowUpDown, 
  X, 
  RefreshCw, 
  Globe, 
  WifiOff, 
  CloudDownload, 
  ShieldCheck, 
  Smartphone, 
  Copy, 
  AlertTriangle, 
  Save, 
  Edit3, 
  Zap,
  Activity,
  Server,
  Clock,
  Users,
  Printer,
  CheckSquare,
  GripVertical,
  HardDrive,
  Camera,
  Wand2,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  CloudUpload
} from 'lucide-react';
import { Recipe, RotationItem, ViewState, SyncStatus, VaultData, Ingredient, User } from './types';
import { extractRecipeFromText, discoverRecipes, generateDishImage } from './services/gemini';
import { 
  signUpWithEmail, 
  signInWithEmail, 
  signOutUser, 
  onAuthStateChange,
  isAuthConfigured 
} from './services/firebase';

// --- Configuration ---
const MASCOT_IMAGE_URL = "https://lh3.googleusercontent.com/d/1YTgCTPn4YGhBj2UelnzvM_7XqBVmkVF-";
const APP_ICON_URL = "https://lh3.googleusercontent.com/d/1kpO00AHxxwLM3gDSuvYRL4cQJSUCFwbF";
const REMOTE_STORAGE_KEY = "poes_cloud_storage_v1"; // Simulates a central DB

// --- Toast Component ---
const Toast: React.FC<{ message: string; type: 'success' | 'info' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] animate-in fade-in slide-in-from-bottom-5 duration-300 no-print w-full px-4 md:w-auto">
      <div className={`
        px-8 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 flex items-center gap-4 min-w-[300px] justify-center
        ${type === 'error' ? 'bg-rose-950 border-rose-800 text-rose-100' : 'bg-slate-950 border-slate-800 text-white'}
      `}>
        {type === 'success' && <CheckCircle size={24} className="text-teal-400" />}
        {type === 'info' && <Info size={24} className="text-sky-400" />}
        {type === 'error' && <AlertTriangle size={24} className="text-rose-400" />}
        <span className="font-black uppercase tracking-widest text-[10px]">{message}</span>
      </div>
    </div>
  );
};

// --- Star Rating Component ---
const StarRating: React.FC<{ rating: number; onRate?: (n: number) => void; size?: number }> = ({ rating, onRate, size = 18 }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          disabled={!onRate}
          className={`${onRate ? 'hover:scale-125 hover:text-amber-300' : ''} transition-all ${star <= rating ? 'text-amber-400' : 'text-slate-300/50'}`}
        >
          <Star size={size} fill={star <= rating ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
};

// --- Auth Views ---
const AuthPortal: React.FC<{ onAuth: (user: User) => void; onError: (msg: string) => void }> = ({ onAuth, onError }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [useFirebase, setUseFirebase] = useState(isAuthConfigured());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (useFirebase) {
        // Use Firebase Authentication
        let user: User;
        if (isLogin) {
          user = await signInWithEmail(email, password);
        } else {
          user = await signUpWithEmail(email, password);
        }
        onAuth(user);
      } else {
        // Fallback to simulated authentication for development/demo
        await new Promise(r => setTimeout(r, 1200));
        onAuth({ id: 'demo_' + Date.now(), email, name: email.split('@')[0] });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-[4rem] border-4 border-slate-300 shadow-2xl overflow-hidden">
        <div className="relative bg-slate-950 p-12 flex flex-col justify-center text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <img src={APP_ICON_URL} className="w-16 h-16 rounded-2xl mb-8 animate-float" />
            <h2 className="text-4xl font-serif font-black mb-4 leading-tight">Welcome to <br/>the Vault.</h2>
            <p className="text-slate-400 font-medium italic">"Every great chef needs a secret collection. Keep yours safe and synced anywhere in the world."</p>
            <div className="mt-12 flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${useFirebase ? 'bg-teal-400' : 'bg-amber-400'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-400">
                {useFirebase ? 'Firebase Auth Enabled' : 'Demo Mode Active'}
              </span>
            </div>
            {!useFirebase && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-[9px] text-amber-200 font-medium leading-relaxed">
                  Configure Firebase credentials to enable secure cloud authentication.
                </p>
              </div>
            )}
        </div>
        <div className="p-12 md:p-16">
           <div className="flex gap-8 mb-12 border-b-2 border-slate-100 pb-2">
              <button onClick={() => setIsLogin(true)} className={`text-sm font-black uppercase tracking-widest ${isLogin ? 'text-slate-950 border-b-4 border-teal-500 pb-2' : 'text-slate-300'}`}>Sign In</button>
              <button onClick={() => setIsLogin(false)} className={`text-sm font-black uppercase tracking-widest ${!isLogin ? 'text-slate-950 border-b-4 border-teal-500 pb-2' : 'text-slate-300'}`}>Create Account</button>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-teal-500 focus:outline-none font-bold" placeholder="chef@poe.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                <input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-teal-500 focus:outline-none font-bold" placeholder="••••••••" />
                {!isLogin && <p className="text-[9px] text-slate-400 ml-1">Minimum 6 characters</p>}
              </div>
              <button disabled={loading} className="w-full py-5 bg-slate-950 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-teal-600 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={18} />}
                {isLogin ? 'Enter Vault' : 'Initialize Vault'}
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};

// --- Recipe Detail Modal (Re-used from previous, but refined) ---
const RecipeDetailModal: React.FC<{
  recipe: Recipe;
  onClose: () => void;
  onUpdate: (r: Recipe) => void;
  onDelete: (id: string) => void;
}> = ({ recipe, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState<Recipe>(recipe);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [imageInput, setImageInput] = useState(recipe.imageUrl || '');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => { setEdited(recipe); setImageInput(recipe.imageUrl || ''); }, [recipe]);

  const handleSave = () => { onUpdate(edited); setIsEditing(false); };
  const handleSaveImage = () => { onUpdate({ ...edited, imageUrl: imageInput }); setIsImageMenuOpen(false); };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
        const url = await generateDishImage(edited.title);
        setImageInput(url);
    } catch(e) { alert("Generation failed. Check network."); }
    finally { setIsGeneratingImage(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-950/80">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-4 border-slate-300 animate-in fade-in zoom-in-95 duration-200 printable-recipe-details">
         <div className="h-64 sm:h-80 bg-slate-200 relative shrink-0 group">
            <img src={(isImageMenuOpen ? imageInput : edited.imageUrl) || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop"} className="w-full h-full object-cover" />
            
            {!isImageMenuOpen && !isEditing && (
                <button onClick={() => setIsImageMenuOpen(true)} className="absolute top-6 left-6 p-3 bg-slate-950/50 backdrop-blur-md rounded-full hover:bg-white text-white hover:text-slate-950 transition-all border-2 border-white/20 z-10 flex items-center gap-2 group/btn shadow-lg">
                    <Camera size={20} />
                    <span className="w-0 overflow-hidden group-hover/btn:w-auto transition-all whitespace-nowrap text-xs font-black uppercase tracking-widest">Change Photo</span>
                </button>
            )}

            {isImageMenuOpen && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 z-20 animate-in fade-in duration-200">
                     <h3 className="text-white font-serif text-3xl mb-8 font-black">Manage Dish Photo</h3>
                     <div className="w-full max-w-lg space-y-6">
                         <input value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="Paste image URL here..." className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-white font-medium focus:border-teal-500 outline-none" />
                         <div className="grid grid-cols-2 gap-4">
                             <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="p-4 bg-teal-600/20 border-2 border-teal-500/50 text-teal-400 rounded-2xl font-black text-xs uppercase hover:bg-teal-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                {isGeneratingImage ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18}/>} AI Generate
                             </button>
                             <button onClick={() => setImageInput('')} className="p-4 bg-rose-600/20 border-2 border-rose-500/50 text-rose-400 rounded-2xl font-black text-xs uppercase hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"><Trash2 size={18}/> Remove</button>
                         </div>
                         <div className="flex gap-4 pt-6">
                             <button onClick={() => setIsImageMenuOpen(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-white uppercase text-xs tracking-widest">Cancel</button>
                             <button onClick={handleSaveImage} className="flex-1 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase text-xs hover:bg-teal-400 shadow-lg">Save Photo</button>
                         </div>
                     </div>
                </div>
            )}
            
            <button onClick={onClose} className="modal-close-btn absolute top-6 right-6 p-3 bg-white/50 backdrop-blur-md rounded-full hover:bg-white text-slate-900 transition-colors border-2 border-white/20 z-10"><X size={24} /></button>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 to-transparent p-8 pt-24">
               {isEditing ? (
                   <input value={edited.title} onChange={e => setEdited({...edited, title: e.target.value})} className="text-3xl sm:text-5xl font-serif text-white font-black tracking-tight mb-2 bg-transparent border-b-2 border-white/50 w-full outline-none" />
               ) : (
                   <h2 className="text-3xl sm:text-5xl font-serif text-white font-black tracking-tight mb-2 drop-shadow-lg">{edited.title}</h2>
               )}
               <div className="flex items-center gap-4">
                 <StarRating rating={edited.rating} onRate={isEditing ? (r) => setEdited({...edited, rating: r}) : undefined} size={14} />
                 <span className="text-xs font-black text-white">{edited.rating}/10</span>
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-8">
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 space-y-4">
                        {[ { label: 'Prep Time', k: 'prepTime' }, { label: 'Cook Time', k: 'cookTime' }, { label: 'Servings', k: 'servings' } ].map(m => (
                            <div key={m.k} className="flex justify-between items-center border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
                                {isEditing ? <input value={String(edited[m.k as keyof Recipe] || '')} onChange={e => setEdited({...edited, [m.k]: e.target.value})} className="font-bold text-slate-800 bg-white border rounded px-1 w-20 text-right text-xs"/> : <span className="font-bold text-slate-800 text-xs">{String(edited[m.k as keyof Recipe] || '-')}</span>}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-2 space-y-8">
                     <h3 className="font-serif text-2xl font-black flex items-center gap-2"><BookOpen className="text-teal-600"/> Instructions</h3>
                     {edited.instructions.map((step, i) => (
                         <div key={i} className="flex gap-4">
                             <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] shrink-0">{i+1}</span>
                             <p className="text-slate-700 font-medium leading-relaxed">{step}</p>
                         </div>
                     ))}
                </div>
             </div>
         </div>

         <div className="p-6 bg-slate-50 border-t-4 border-slate-200 flex justify-end gap-4 modal-actions">
            <button onClick={() => window.print()} className="px-6 py-4 bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-xs">Print</button>
            <button onClick={() => setIsEditing(!isEditing)} className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs">{isEditing ? 'Cancel' : 'Edit'}</button>
            {isEditing && <button onClick={handleSave} className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs">Save</button>}
         </div>
      </div>
    </div>
  );
};

// --- Shopping List ---
const ShoppingList: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
  <div className="printable-shopping-list bg-white p-8 rounded-[3rem] border-4 border-slate-300 shadow-xl mb-12">
    <h3 className="text-2xl font-serif font-black text-slate-950 mb-6 border-b-2 border-slate-50 pb-4">Grocery List: {recipe.title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
       {recipe.ingredients.map((ing, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
             <div className="w-5 h-5 rounded-md border-2 border-slate-200 bg-white shrink-0" />
             <span className="text-sm font-bold text-slate-700">{ing.amount} <span className="font-medium text-slate-400">{ing.item}</span></span>
          </div>
       ))}
    </div>
  </div>
);

// --- Main App Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [rotation, setRotation] = useState<RotationItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  
  const [view, setView] = useState<ViewState>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // --- Firebase Auth State Listener ---
  useEffect(() => {
    // Check for saved session first (fallback for demo mode)
    const saved = localStorage.getItem('poe_session');
    if (saved && !isAuthConfigured()) {
      setUser(JSON.parse(saved));
      setAuthInitialized(true);
      return;
    }

    // Set up Firebase auth state listener if configured
    if (isAuthConfigured()) {
      const unsubscribe = onAuthStateChange((firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          localStorage.setItem('poe_session', JSON.stringify(firebaseUser));
        } else {
          setUser(null);
          localStorage.removeItem('poe_session');
        }
        setAuthInitialized(true);
      });

      return () => unsubscribe();
    } else {
      setAuthInitialized(true);
    }
  }, []);

  // --- Persistence & Sync Engine ---

  // 1. Monitor Connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Initial Load from Local Cache
  useEffect(() => {
    if (!user) return;
    const local = localStorage.getItem(`vault_${user.id}`);
    if (local) {
      const data: VaultData = JSON.parse(local);
      setRecipes(data.recipes);
      setRotation(data.rotation);
      setLastUpdated(data.lastUpdated);
    }
  }, [user]);

  // 3. Sync Engine (Conflict Resolution)
  const syncWithCloud = useCallback(async () => {
    if (!user || !isOnline) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));

    try {
      const cloudRaw = localStorage.getItem(`${REMOTE_STORAGE_KEY}_${user.id}`);
      const cloudData: VaultData | null = cloudRaw ? JSON.parse(cloudRaw) : null;
      const localData: VaultData = { recipes, rotation, lastUpdated };

      if (!cloudData) {
        // First time cloud sync
        localStorage.setItem(`${REMOTE_STORAGE_KEY}_${user.id}`, JSON.stringify(localData));
        setSyncStatus('synced');
      } else {
        // Compare Timestamps (Last-Write-Wins)
        if (cloudData.lastUpdated > localData.lastUpdated) {
          // Cloud is newer -> Update Local
          setRecipes(cloudData.recipes);
          setRotation(cloudData.rotation);
          setLastUpdated(cloudData.lastUpdated);
          localStorage.setItem(`vault_${user.id}`, JSON.stringify(cloudData));
          setSyncStatus('synced');
        } else if (localData.lastUpdated > cloudData.lastUpdated) {
          // Local is newer -> Push to Cloud
          localStorage.setItem(`${REMOTE_STORAGE_KEY}_${user.id}`, JSON.stringify(localData));
          setSyncStatus('synced');
        } else {
          setSyncStatus('synced');
        }
      }
    } catch (e) {
      setSyncStatus('error');
    }
  }, [user, isOnline, recipes, rotation, lastUpdated]);

  // Trigger sync on changes and periodically
  useEffect(() => {
    if (user && isOnline) syncWithCloud();
  }, [user, isOnline, lastUpdated]);

  useEffect(() => {
    const interval = setInterval(() => { if(isOnline && user) syncWithCloud(); }, 30000);
    return () => clearInterval(interval);
  }, [isOnline, user, syncWithCloud]);

  // --- State Mutators ---
  const mutateVault = useCallback((newRecipes: Recipe[], newRotation: RotationItem[]) => {
    const timestamp = Date.now();
    setRecipes(newRecipes);
    setRotation(newRotation);
    setLastUpdated(timestamp);
    
    // Optimistic Local Save
    if (user) {
      localStorage.setItem(`vault_${user.id}`, JSON.stringify({
        recipes: newRecipes,
        rotation: newRotation,
        lastUpdated: timestamp
      }));
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => setToast({ message, type });

  // --- Auth Handlers ---
  const handleAuth = (u: User) => {
    setUser(u);
    if (!isAuthConfigured()) {
      // Demo mode - save to localStorage
      localStorage.setItem('poe_session', JSON.stringify(u));
    }
    // Firebase mode - session is automatically managed by onAuthStateChange
    showToast(`Welcome, Chef ${u.name}!`, 'success');
  };

  const handleLogout = async () => {
    try {
      if (isAuthConfigured()) {
        // Use Firebase sign out
        await signOutUser();
      } else {
        // Demo mode - clear local storage
        localStorage.removeItem('poe_session');
      }
      setUser(null);
      setRecipes([]);
      setRotation([]);
      setView('library');
      showToast('Signed out successfully', 'info');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      showToast(message, 'error');
    }
  };

  // --- Business Logic ---
  const addRecipe = async (input: string) => {
    setIsProcessing(true);
    try {
      const extracted = await extractRecipeFromText(input);
      let img = extracted.imageUrl;
      if (!img) img = await generateDishImage(extracted.title || 'Gourmet Dish');
      const recipe = { ...extracted, id: crypto.randomUUID(), rating: 0, notes: "", imageUrl: img } as Recipe;
      mutateVault([recipe, ...recipes], rotation);
      showToast("Imported to Vault!");
      setView('library');
    } catch (e) { showToast("Import failed. Check text.", "error"); }
    finally { setIsProcessing(false); }
  };

  const addToRotation = (id: string) => {
    if (!rotation.some(i => i.recipeId === id)) {
      mutateVault(recipes, [...rotation, { id: crypto.randomUUID(), recipeId: id }]);
      showToast("Added to Schedule");
    }
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a,b) => a.title.localeCompare(b.title));
  }, [recipes, searchQuery]);

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 size={64} className="text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Initializing Vault...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPortal onAuth={handleAuth} onError={(msg) => showToast(msg, 'error')} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Navigation */}
      <nav className="w-full md:w-20 lg:w-72 bg-slate-950 text-slate-400 flex flex-row md:flex-col items-center py-6 px-4 sticky top-0 md:h-screen z-50 no-print">
        <div className="hidden lg:flex items-center gap-4 px-4 mb-14 w-full">
          <img src={APP_ICON_URL} className="w-12 h-12 rounded-2xl border-2 border-teal-600" />
          <span className="text-xl font-serif text-white font-black">Poe's Menu</span>
        </div>
        
        <div className="flex flex-row md:flex-col gap-6 md:gap-3 w-full flex-1 justify-around md:justify-start">
          {[
            { id: 'library', icon: BookOpen, label: 'Vault' },
            { id: 'rotation', icon: RotateCcw, label: 'Schedule' },
            { id: 'discovery', icon: Search, label: 'Discover' },
            { id: 'add', icon: Plus, label: 'Import' },
            { id: 'settings', icon: UserIcon, label: 'Profile' },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id as ViewState)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${view === item.id ? 'bg-teal-500/10 text-teal-400' : 'hover:bg-slate-900'}`}>
              <item.icon size={24} /><span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Sync Pulse */}
        <div className="hidden md:flex flex-col gap-4 w-full px-4 mb-6">
           <div className="p-4 bg-slate-900 rounded-3xl border-2 border-slate-800">
              <div className="flex items-center justify-between mb-2">
                 {syncStatus === 'synced' ? <ShieldCheck className="text-teal-500" size={16}/> : 
                  syncStatus === 'offline' ? <WifiOff className="text-slate-500" size={16}/> : 
                  <RefreshCw className="text-sky-400 animate-spin" size={16}/>}
                 <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-teal-400' : 'bg-rose-500'} animate-pulse`}></div>
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                {syncStatus === 'synced' ? 'Vault Protected' : syncStatus === 'offline' ? 'Offline Mode' : 'Syncing Data...'}
              </p>
           </div>
        </div>
      </nav>

      <main className="flex-1 bg-white p-6 md:p-12 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 no-print">
            <h1 className="text-5xl font-serif text-slate-950 font-black">
                {view === 'library' && 'The Vault'}
                {view === 'rotation' && 'Schedule'}
                {view === 'discovery' && 'Discovery'}
                {view === 'add' && 'Importer'}
                {view === 'settings' && 'Account'}
            </h1>
            {view === 'library' && (
              <div className="relative group w-full md:w-[400px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search recipes..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border-4 border-slate-200 rounded-[2rem] focus:outline-none focus:border-teal-500 font-bold" />
              </div>
            )}
          </header>

          {view === 'library' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {filteredRecipes.map(r => (
                   <div key={r.id} className="bg-white rounded-[2.5rem] border-4 border-slate-300 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                      <div className="h-48 bg-slate-100 relative cursor-pointer" onClick={() => setSelectedRecipe(r)}>
                         <img src={r.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                         <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 shadow-md border-2 border-slate-300">
                            <Star size={12} className="text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black">{r.rating}</span>
                         </div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                         <h3 className="font-serif text-xl font-black mb-1 line-clamp-1">{r.title}</h3>
                         <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4">{r.category || 'Kitchen Original'}</p>
                         <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-100">
                            <button onClick={() => setSelectedRecipe(r)} className="text-teal-700 text-xs font-black uppercase tracking-widest hover:underline">View Detail</button>
                            <button onClick={() => addToRotation(r.id)} className="p-2 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-100"><RotateCcw size={16}/></button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}

          {view === 'add' && (
             <div className="max-w-3xl mx-auto bg-white border-4 border-slate-300 p-12 rounded-[4rem] shadow-2xl">
                <div className="flex items-center gap-6 mb-10">
                   <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-3xl flex items-center justify-center border-2 border-teal-200"><Plus size={32}/></div>
                   <h2 className="text-3xl font-serif font-black">Universal Importer</h2>
                </div>
                <p className="text-slate-500 font-medium mb-8">Paste a recipe URL or raw text from anywhere. Gemini AI will structure it and sync it across all your devices.</p>
                <textarea id="import-box" rows={6} className="w-full p-8 bg-slate-50 border-4 border-slate-200 rounded-[3rem] focus:border-teal-500 outline-none font-bold text-lg mb-8" placeholder="https://allrecipes.com/recipe/..."></textarea>
                <button 
                  onClick={() => { const v = (document.getElementById('import-box') as HTMLTextAreaElement).value; if(v) addRecipe(v); }}
                  disabled={isProcessing}
                  className="w-full py-8 bg-slate-950 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4 hover:bg-teal-700 shadow-xl transition-all"
                >
                   {isProcessing ? <Loader2 className="animate-spin" size={24}/> : <CloudUpload size={24}/>}
                   IMPORT TO CLOUD
                </button>
             </div>
          )}

          {view === 'rotation' && (
             <div className="space-y-12">
                {rotation.length > 0 ? (
                   <>
                      {(() => {
                         const r = recipes.find(x => x.id === rotation[0].recipeId);
                         return r ? <ShoppingList recipe={r} /> : null;
                      })()}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {rotation.map((item, idx) => {
                            const r = recipes.find(x => x.id === item.recipeId);
                            if(!r) return null;
                            return (
                               <div key={item.id} className={`p-6 rounded-[2.5rem] border-4 ${idx === 0 ? 'border-teal-500 bg-teal-50/20' : 'border-slate-200'} flex items-center gap-6`}>
                                  <img src={r.imageUrl} className="w-20 h-20 rounded-2xl object-cover" />
                                  <div className="flex-1">
                                     {idx === 0 && <span className="text-[8px] font-black uppercase text-teal-600 tracking-widest">Cooking Now</span>}
                                     <h4 className="font-serif font-black text-xl">{r.title}</h4>
                                  </div>
                                  <button onClick={() => mutateVault(recipes, rotation.filter(x => x.id !== item.id))} className="text-rose-400 p-2 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={20}/></button>
                               </div>
                            );
                         })}
                      </div>
                   </>
                ) : (
                   <div className="py-40 text-center border-4 border-dashed border-slate-200 rounded-[4rem]">
                      <RotateCcw className="mx-auto mb-6 text-slate-200" size={64}/>
                      <p className="text-slate-400 font-black uppercase tracking-[0.2em]">Schedule is empty.</p>
                   </div>
                )}
             </div>
          )}

          {view === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-10">
                <div className="bg-white border-4 border-slate-300 p-12 rounded-[4rem] shadow-xl text-center">
                   <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-inner">
                      <UserIcon size={48} className="text-slate-400" />
                   </div>
                   <h2 className="text-2xl font-serif font-black mb-1">{user.name}</h2>
                   <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">{user.email}</p>
                   
                   <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                         <p className="text-[8px] font-black uppercase text-slate-400 mb-2">Vault Items</p>
                         <p className="text-3xl font-serif font-black">{recipes.length}</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                         <p className="text-[8px] font-black uppercase text-slate-400 mb-2">Connection</p>
                         <p className={`text-sm font-black uppercase ${isOnline ? 'text-teal-600' : 'text-rose-500'}`}>{isOnline ? 'Active' : 'Offline'}</p>
                      </div>
                   </div>

                   <button onClick={handleLogout} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-rose-600 shadow-lg">
                      <LogOut size={18}/> Sign Out of Vault
                   </button>
                </div>

                <div className="bg-slate-950 p-10 rounded-[3rem] text-white">
                    <h3 className="font-serif text-xl font-black mb-4 flex items-center gap-3"><ShieldCheck className="text-teal-400"/> Resilience Protocol</h3>
                    <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">Your data is stored locally first and merged with Poe's remote cloud whenever you're online. We prioritize your most recent changes.</p>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                       <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-400"></div> Cloud: {syncStatus}</span>
                       <span className="flex items-center gap-2 text-slate-600">Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
                    </div>
                </div>
             </div>
          )}
        </div>
      </main>

      {selectedRecipe && (
         <RecipeDetailModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)} 
            onUpdate={(u) => { mutateVault(recipes.map(r => r.id === u.id ? u : r), rotation); setSelectedRecipe(u); showToast("Vault Updated"); }}
            onDelete={(id) => { mutateVault(recipes.filter(r => r.id !== id), rotation.filter(i => i.recipeId !== id)); setSelectedRecipe(null); showToast("Deleted"); }}
         />
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[600] flex flex-col items-center justify-center backdrop-blur-md bg-white/40">
           <Loader2 size={80} className="text-teal-700 animate-spin" />
           <p className="mt-10 text-xl font-black uppercase tracking-[0.5em] text-slate-950">Gemini Processing...</p>
        </div>
      )}
    </div>
  );
};

export default App;