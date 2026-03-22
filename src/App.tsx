import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ──────────────────────────────────────────────────────────────────
type Page = "feed" | "profile" | "search" | "messages" | "notifications" | "settings";

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
  bio: string;
  followers: number;
  following: number;
  posts: number;
}

interface Post {
  id: number;
  user: User;
  text: string;
  time: string;
  likes: number;
  comments: number;
  liked: boolean;
}

interface Message {
  id: number;
  text: string;
  out: boolean;
  time: string;
}

interface Dialog {
  id: number;
  user: User;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const USERS: User[] = [
  { id: 1, name: "Алексей Громов", username: "agromov", avatar: "АГ", verified: true, bio: "Дизайнер продуктов · Москва", followers: 4821, following: 312, posts: 87 },
  { id: 2, name: "Мария Соколова", username: "msokolova", avatar: "МС", verified: true, bio: "Фотограф · Санкт-Петербург", followers: 12400, following: 890, posts: 234 },
  { id: 3, name: "Денис Волков", username: "dvolkov", avatar: "ДВ", verified: false, bio: "Разработчик · Казань", followers: 1230, following: 445, posts: 56 },
  { id: 4, name: "Анна Петрова", username: "apetrova", avatar: "АП", verified: true, bio: "Маркетолог · Новосибирск", followers: 8740, following: 621, posts: 193 },
  { id: 5, name: "Игорь Смирнов", username: "ismrnov", avatar: "ИС", verified: false, bio: "Предприниматель · Екатеринбург", followers: 560, following: 203, posts: 28 },
];

const ME: User = { id: 0, name: "Вы", username: "me", avatar: "ВЫ", verified: false, bio: "Новый пользователь · Россия", followers: 0, following: 0, posts: 0 };

const INITIAL_POSTS: Post[] = [
  { id: 1, user: USERS[0], text: "Работаю над новым интерфейсом для мобильного приложения. Минимализм — это не отсутствие элементов, это их правильный выбор.", time: "2 ч", likes: 48, comments: 7, liked: false },
  { id: 2, user: USERS[1], text: "Золотой час в Петербурге — самое магическое время для съёмки. Поделюсь подборкой фотографий с прошлой недели.", time: "4 ч", likes: 214, comments: 23, liked: false },
  { id: 3, user: USERS[3], text: "Три принципа, которые помогают мне в работе: фокус, последовательность, рефлексия. Остальное — детали.", time: "6 ч", likes: 91, comments: 12, liked: false },
  { id: 4, user: USERS[2], text: "Запустил новый open-source проект. Если интересно поучаствовать — пишите в личку.", time: "1 д", likes: 35, comments: 9, liked: false },
];

const DIALOGS: Dialog[] = [
  {
    id: 1, user: USERS[0], lastMessage: "Отличная идея, давай созвонимся завтра!", time: "14:32", unread: 2,
    messages: [
      { id: 1, text: "Привет! Видел твой последний пост — очень крутой дизайн", out: true, time: "14:20" },
      { id: 2, text: "Спасибо! Работал над ним неделю", out: false, time: "14:25" },
      { id: 3, text: "Хотел бы обсудить возможное сотрудничество", out: true, time: "14:28" },
      { id: 4, text: "Отличная идея, давай созвонимся завтра!", out: false, time: "14:32" },
    ]
  },
  {
    id: 2, user: USERS[1], lastMessage: "Жду твои фото!", time: "вчера", unread: 0,
    messages: [
      { id: 1, text: "Мария, ты делаешь фотосессии?", out: true, time: "вчера" },
      { id: 2, text: "Да, конечно! Напиши какой формат тебя интересует", out: false, time: "вчера" },
      { id: 3, text: "Портрет на природе", out: true, time: "вчера" },
      { id: 4, text: "Жду твои фото!", out: false, time: "вчера" },
    ]
  },
  {
    id: 3, user: USERS[3], lastMessage: "Договорились!", time: "пн", unread: 0,
    messages: [
      { id: 1, text: "Привет! Можем обменяться опытом в маркетинге?", out: true, time: "пн" },
      { id: 2, text: "Договорились!", out: false, time: "пн" },
    ]
  },
];

const NOTIFICATIONS = [
  { id: 1, user: USERS[0], action: "лайкнул ваш пост", time: "5 мин", read: false },
  { id: 2, user: USERS[1], action: "начал(-а) на вас подписываться", time: "1 ч", read: false },
  { id: 3, user: USERS[3], action: "прокомментировал(-а): «Отличная мысль!»", time: "3 ч", read: true },
  { id: 4, user: USERS[2], action: "упомянул вас в посте", time: "вчера", read: true },
];

// ─── Avatar Component ────────────────────────────────────────────────────────
function Avatar({ user, size = "md" }: { user: User; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base", xl: "w-20 h-20 text-xl" };
  const colors = ["bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700"];
  const color = colors[user.id % colors.length];
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {user.avatar}
    </div>
  );
}

// ─── Verified Badge ──────────────────────────────────────────────────────────
function VerifiedBadge() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 ml-1 flex-shrink-0" title="Подтверждённый аккаунт">
      <Icon name="Check" size={10} className="text-white" />
    </span>
  );
}

// ─── Feed Page ───────────────────────────────────────────────────────────────
function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPost, setNewPost] = useState("");

  const toggleLike = (id: number) => {
    setPosts(posts.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const addPost = () => {
    if (!newPost.trim()) return;
    const post: Post = { id: Date.now(), user: ME, text: newPost, time: "только что", likes: 0, comments: 0, liked: false };
    setPosts([post, ...posts]);
    setNewPost("");
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">ВЫ</div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="Что у вас нового?"
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-h-[60px]"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={addPost}
                disabled={!newPost.trim()}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      </div>

      {posts.map(post => (
        <div key={post.id} className="bg-card border border-border rounded-2xl p-4 space-y-3 hover:border-muted-foreground/30 transition-colors">
          <div className="flex items-start gap-3">
            <Avatar user={post.user} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm truncate">{post.user.name}</span>
                {post.user.verified && <VerifiedBadge />}
                <span className="text-muted-foreground text-xs ml-1">·</span>
                <span className="text-muted-foreground text-xs">{post.time}</span>
              </div>
              <p className="text-muted-foreground text-xs">@{post.user.username}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{post.text}</p>
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={() => toggleLike(post.id)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${post.liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
            >
              <Icon name="Heart" size={15} className={post.liked ? "fill-rose-500 stroke-rose-500" : ""} />
              {post.likes}
            </button>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="MessageCircle" size={15} />
              {post.comments}
            </button>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto">
              <Icon name="Share2" size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Profile Page ────────────────────────────────────────────────────────────
function ProfilePage({ user }: { user: User }) {
  const [followed, setFollowed] = useState(false);
  const isOwn = user.id === ME.id;

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-secondary via-muted to-border" />
        <div className="px-5 pb-5">
          <div className="-mt-8 mb-3 flex items-end justify-between">
            <div className="ring-4 ring-card rounded-full">
              <Avatar user={user} size="xl" />
            </div>
            {isOwn ? (
              <button className="px-4 py-1.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                Редактировать
              </button>
            ) : (
              <button
                onClick={() => setFollowed(!followed)}
                className={`px-5 py-1.5 rounded-xl text-sm font-medium transition-colors ${followed ? "border border-border hover:bg-secondary" : "bg-primary text-primary-foreground hover:opacity-90"}`}
              >
                {followed ? "Вы подписаны" : "Подписаться"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 mb-1">
            <h2 className="font-bold text-lg">{user.name}</h2>
            {user.verified && <VerifiedBadge />}
          </div>
          <p className="text-muted-foreground text-sm mb-3">@{user.username}</p>
          <p className="text-sm text-foreground mb-4">{user.bio}</p>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="font-bold text-base">{user.posts}</div>
              <div className="text-xs text-muted-foreground">постов</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base">{user.followers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">подписчиков</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base">{user.following.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">подписок</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="h-2 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-2 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Search Page ─────────────────────────────────────────────────────────────
function SearchPage({ onOpenProfile }: { onOpenProfile: (u: User) => void }) {
  const [query, setQuery] = useState("");

  const filtered = USERS.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.username.toLowerCase().includes(query.toLowerCase()) ||
    u.bio.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск людей..."
          className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:border-ring transition-colors"
          autoFocus
        />
      </div>
      {!query && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Рекомендуемые</p>}
      <div className="space-y-2">
        {filtered.map(user => (
          <div
            key={user.id}
            onClick={() => onOpenProfile(user)}
            className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-muted-foreground/30 transition-all"
          >
            <Avatar user={user} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">{user.name}</span>
                {user.verified && <VerifiedBadge />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
            </div>
            <p className="text-xs text-muted-foreground flex-shrink-0">{user.followers.toLocaleString()} подп.</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Никто не найден</div>
        )}
      </div>
    </div>
  );
}

// ─── Messages Page ───────────────────────────────────────────────────────────
function MessagesPage() {
  const [dialogs, setDialogs] = useState<Dialog[]>(DIALOGS);
  const [activeDialog, setActiveDialog] = useState<Dialog | null>(null);
  const [inputText, setInputText] = useState("");

  const sendMessage = () => {
    if (!inputText.trim() || !activeDialog) return;
    const msg: Message = { id: Date.now(), text: inputText, out: true, time: "сейчас" };
    const updated = dialogs.map(d =>
      d.id === activeDialog.id
        ? { ...d, messages: [...d.messages, msg], lastMessage: inputText, time: "сейчас", unread: 0 }
        : d
    );
    setDialogs(updated);
    setActiveDialog({ ...activeDialog, messages: [...activeDialog.messages, msg] });
    setInputText("");
  };

  if (activeDialog) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
          <button onClick={() => setActiveDialog(null)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <Avatar user={activeDialog.user} />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{activeDialog.user.name}</span>
              {activeDialog.user.verified && <VerifiedBadge />}
            </div>
            <p className="text-xs text-muted-foreground">@{activeDialog.user.username}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {activeDialog.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.out ? "justify-end" : "justify-start"}`}>
              <div className={msg.out ? "message-bubble-out" : "message-bubble-in"}>
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.out ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-3 border-t border-border">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Написать сообщение..."
            className="flex-1 bg-secondary rounded-2xl px-4 py-2.5 text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim()}
            className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <Icon name="Send" size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-2 animate-fade-in">
      <h2 className="font-bold text-lg mb-4">Сообщения</h2>
      {dialogs.map(dialog => (
        <div
          key={dialog.id}
          onClick={() => setActiveDialog(dialog)}
          className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-muted-foreground/30 transition-all"
        >
          <div className="relative">
            <Avatar user={dialog.user} />
            {dialog.unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {dialog.unread}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className={`text-sm ${dialog.unread > 0 ? "font-bold" : "font-semibold"}`}>{dialog.user.name}</span>
                {dialog.user.verified && <VerifiedBadge />}
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">{dialog.time}</span>
            </div>
            <p className={`text-xs truncate ${dialog.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {dialog.lastMessage}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Notifications Page ──────────────────────────────────────────────────────
function NotificationsPage() {
  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <h2 className="font-bold text-lg mb-4">Уведомления</h2>
      <div className="space-y-2">
        {NOTIFICATIONS.map(n => (
          <div key={n.id} className={`bg-card border rounded-2xl p-4 flex items-start gap-3 transition-colors ${n.read ? "border-border" : "border-blue-200 bg-blue-50/50"}`}>
            <Avatar user={n.user} />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{n.user.name}</span>
                {n.user.verified && <VerifiedBadge />}
                {" "}<span className="text-muted-foreground">{n.action}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings Page ───────────────────────────────────────────────────────────
function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState(false);

  return (
    <div className="max-w-xl mx-auto animate-fade-in space-y-4">
      <h2 className="font-bold text-lg mb-4">Настройки</h2>
      {[
        { label: "Уведомления", desc: "Получать push-уведомления", value: notifications, toggle: () => setNotifications(!notifications) },
        { label: "Закрытый профиль", desc: "Только подписчики видят посты", value: privacy, toggle: () => setPrivacy(!privacy) },
      ].map(item => (
        <div key={item.label} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
          <button
            onClick={item.toggle}
            className={`w-11 h-6 rounded-full transition-colors relative ${item.value ? "bg-primary" : "bg-muted"}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.value ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      ))}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {["Конфиденциальность", "Безопасность", "Помощь и поддержка", "Выйти"].map((item, i) => (
          <button key={i} className={`w-full text-left px-4 py-3.5 text-sm hover:bg-secondary transition-colors flex items-center justify-between ${item === "Выйти" ? "text-destructive" : ""}`}>
            {item}
            {item !== "Выйти" && <Icon name="ChevronRight" size={16} className="text-muted-foreground" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("feed");
  const [profileUser, setProfileUser] = useState<User>(USERS[0]);

  const openProfile = (user: User) => {
    setProfileUser(user);
    setPage("profile");
  };

  const navItems: { id: Page; icon: string; label: string; badge?: number }[] = [
    { id: "feed", icon: "Home", label: "Главная" },
    { id: "search", icon: "Search", label: "Поиск" },
    { id: "messages", icon: "MessageCircle", label: "Сообщения", badge: 2 },
    { id: "notifications", icon: "Bell", label: "Уведомления", badge: 2 },
    { id: "profile", icon: "User", label: "Профиль" },
    { id: "settings", icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border px-4 py-6 sticky top-0 h-screen">
        <div className="mb-8 px-4">
          <h1 className="font-bold text-xl tracking-tight">Сфера</h1>
          <p className="text-xs text-muted-foreground">социальная сеть</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); if (item.id === "profile") setProfileUser(ME); }}
              className={`nav-item w-full ${page === item.id ? "active" : ""}`}
            >
              <div className="relative">
                <Icon name={item.icon} size={20} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-xs font-semibold">ВЫ</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Мой профиль</p>
              <p className="text-xs text-muted-foreground">@me</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 pb-24 md:pb-6 overflow-y-auto">
        {page === "feed" && <FeedPage />}
        {page === "profile" && <ProfilePage user={profileUser} />}
        {page === "search" && <SearchPage onOpenProfile={openProfile} />}
        {page === "messages" && <MessagesPage />}
        {page === "notifications" && <NotificationsPage />}
        {page === "settings" && <SettingsPage />}
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border flex items-center justify-around px-2 py-2 z-50">
        {navItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => { setPage(item.id); if (item.id === "profile") setProfileUser(ME); }}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors relative ${page === item.id ? "text-foreground" : "text-muted-foreground"}`}
          >
            <div className="relative">
              <Icon name={item.icon} size={22} />
              {item.badge && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
