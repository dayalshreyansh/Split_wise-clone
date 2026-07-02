import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { notificationService, inviteService } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Navbar() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const [notifications, setNotifications] = useState([]);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    // Only fetch data if the user is actually authenticated
    if (user) {
      fetchData();
      socket.emit("join_group", user.id); // Ensure socket is tied to user
      socket.on("new_expense_alert", (data) => setNotifications((prev) => [data, ...prev]));
    }
    return () => socket.off("new_expense_alert");
  }, [user]);

  const fetchData = async () => {
    try {
      // Run in parallel with error catching for each to prevent one failing API from breaking the whole Navbar
      const [nRes, iRes] = await Promise.all([
        notificationService.getAll().catch(() => ({ data: [] })),
        inviteService.getPending().catch(() => ({ data: [] }))
      ]);
      
      setNotifications(Array.isArray(nRes) ? nRes : nRes?.data || []);
      setInvites(Array.isArray(iRes) ? iRes : iRes?.data || []);
    } catch (error) { console.error("Data fetch error:", error); }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: 'READ' } : n));
    } catch (err) { console.error(err); }
  };

  const handleAcceptInvite = async (token) => {
  try {
    await inviteService.accept(token);

    setInvites((prev) =>
      prev.filter((i) => i.token !== token)
    );

    fetchData();

    alert("Invitation accepted!");
  } catch (err) {
  console.error("ACCEPT INVITE ERROR:");
  console.error(err);
  console.error(err.response?.data);

  alert(
    err.response?.data?.message ||
    "Failed to accept invitation."
  );
}
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  // If no user, render a basic guest navbar to prevent white screen
  if (!user) {
    return (
      <header className="h-20 border-b border-slate-200 bg-white flex items-center px-6">
        <span className="text-xl font-bold text-slate-800">SplitApp</span>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <span className="text-lg font-bold text-white">₹</span>
          </div>
          <span className="text-xl font-bold text-slate-800">SplitApp</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 text-slate-500 hover:text-emerald-600 transition relative">
              🔔
              {(notifications.filter(n => n?.status === 'UNREAD').length + invites.length) > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                <div className="flex border-b border-slate-100">
                  <button onClick={() => setActiveTab("notifications")} className={`flex-1 py-4 text-sm font-bold ${activeTab === "notifications" ? "text-emerald-600 border-b-2 border-emerald-500" : "text-slate-400"}`}>Notifications</button>
                  <button onClick={() => setActiveTab("invites")} className={`flex-1 py-4 text-sm font-bold ${activeTab === "invites" ? "text-emerald-600 border-b-2 border-emerald-500" : "text-slate-400"}`}>Invites ({invites.length})</button>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {activeTab === "notifications" ? (
                    notifications.length === 0 ? <p className="p-4 text-center text-sm text-slate-400">No notifications</p> :
                    notifications.map(n => (
                      <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-4 border-b border-slate-50 last:border-0 cursor-pointer transition hover:bg-slate-50 flex justify-between items-center ${n.status === 'UNREAD' ? 'bg-emerald-50/30' : ''}`}>
                        <span className="text-sm text-slate-700">{n.message}</span>
                        {n.status === 'UNREAD' && <div className="h-2 w-2 bg-emerald-500 rounded-full" />}
                      </div>
                    ))
                  ) : (
                    invites.length === 0 ? <p className="p-4 text-center text-sm text-slate-400">No pending invites</p> :
                    invites.map((i) => (
                    <div
                      key={i.id}
                      className="p-4 border-b border-slate-50 hover:bg-slate-50 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {i.group?.name}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            Invited by {i.inviter?.name}
                          </p>
                        </div>

                        <button
                          onClick={() => handleAcceptInvite(i.token)}
                          className="bg-emerald-50 px-3 py-1 rounded-lg text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative group cursor-pointer">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 border border-slate-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block"><p className="text-sm font-semibold text-slate-800">{user?.name}</p></div>
            </div>
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="text-xs text-slate-500">{user?.email}</p>
              <button onClick={handleLogout} className="mt-3 w-full text-left text-sm font-semibold text-red-600 hover:text-red-700">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}