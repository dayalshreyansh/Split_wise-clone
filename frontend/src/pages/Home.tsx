import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { groupService, notificationService, inviteService } from "../api/api";

export default function Home() {
  const [groups, setGroups] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [memberEmails, setMemberEmails] = useState([""]); 

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [groupRes, noteRes] = await Promise.all([
        groupService.getAll(),
        notificationService.getAll()
      ]);
      setGroups(groupRes.data || groupRes);
      const notifications = Array.isArray(noteRes.data) ? noteRes.data : noteRes;
      setUnreadCount(notifications.filter(n => n.status === 'UNREAD').length);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const addEmailField = () => setMemberEmails([...memberEmails, ""]);

  const removeEmailField = (index) => {
    if (memberEmails.length > 1) {
      setMemberEmails(memberEmails.filter((_, i) => i !== index));
    } else {
      setMemberEmails([""]); // Reset to empty if removing the last one
    }
  };

  const updateEmail = (index, value) => {
    const newEmails = [...memberEmails];
    newEmails[index] = value;
    setMemberEmails(newEmails);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setGroupName("");
    setMemberEmails([""]);
  };

  const handleCreateGroupWithInvite = async (e) => {
    e.preventDefault();
    try {
      // 1. Create the Group
      const res = await groupService.create({ name: groupName });
      const newGroupId = res.data?.id;

      // 2. Process all invitations
      const validEmails = memberEmails.filter(email => email.trim() !== "");
      if (newGroupId && validEmails.length > 0) {
        // Use Promise.all to wait for ALL invitations to finish
        await Promise.all(
          validEmails.map(email => inviteService.send({ groupId: newGroupId, email }))
        );
      }

      // 3. CRITICAL: Refresh data BEFORE closing the modal or resetting states
      // This ensures the DOM receives the new data while the user is still looking at the modal
      await fetchDashboardData();

      // 4. Cleanup
      closeModal();
    } catch (err) {
      console.error("Submission Error:", err);
      alert("Failed to create group or send invitations. Please check the console.");
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">Your Groups</h1>
            {unreadCount > 0 && <p className="mt-2 text-emerald-600 font-semibold">You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>}
          </div>
          <button onClick={() => setIsModalOpen(true)} className="rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition">
            + Create New Group
          </button>
        </div>

        {/* Create Group Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleCreateGroupWithInvite} className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
              <h2 className="text-xl font-bold mb-6 text-slate-800">Create New Group</h2>
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group Name" className="w-full border border-slate-200 p-3 mb-4 rounded-xl" required />
              
              <div className="mb-6">
                <label className="text-sm font-semibold text-slate-600 mb-2 block">Invite Members</label>
                {memberEmails.map((email, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input type="email" value={email} onChange={(e) => updateEmail(index, e.target.value)} placeholder="Email address" className="flex-1 border border-slate-200 p-3 rounded-xl" />
                    <button type="button" onClick={() => removeEmailField(index)} className="px-3 text-slate-400 hover:text-red-500 font-bold text-lg">×</button>
                  </div>
                ))}
                <button type="button" onClick={addEmailField} className="text-sm text-emerald-600 font-bold hover:underline mt-1">+ Add another member</button>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold">Create Group</button>
                <button type="button" onClick={closeModal} className="flex-1 bg-slate-100 py-3 rounded-xl font-semibold text-slate-600">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Stats & Group Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-10">
          <StatCard title="Total Groups" value={groups.length} />
          <StatCard title="Active Groups" value={groups.length} color="text-emerald-600" />
          <StatCard title="Pending Actions" value={unreadCount} />
        </div>

        {groups.length === 0 ? <EmptyState onCreate={() => setIsModalOpen(true)} /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Link key={group.id} to={`/group/${group.id}`} className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-lg hover:-translate-y-2 transition-all">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl mb-6">👥</div>
                <h2 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition">{group.name}</h2>
                <p className="text-sm text-slate-500 mt-2">Tap to manage expenses.</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const StatCard = ({ title, value, color = "text-slate-800" }) => (
  <div className="rounded-3xl bg-white p-6 shadow-lg border border-slate-100">
    <p className="text-sm text-slate-500">{title}</p>
    <h2 className={`mt-2 text-3xl font-bold ${color}`}>{value}</h2>
  </div>
);

const EmptyState = ({ onCreate }) => (
  <div className="rounded-3xl bg-white p-16 text-center shadow-lg border border-slate-100">
    <div className="text-6xl mb-4">👥</div>
    <h2 className="text-2xl font-bold text-slate-800">No Groups Yet</h2>
    <button onClick={onCreate} className="mt-6 bg-emerald-500 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-emerald-600 transition">Create Group</button>
  </div>
);

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-slate-50 p-8 animate-pulse"><div className="max-w-7xl mx-auto space-y-6"><div className="h-10 w-64 rounded-xl bg-slate-200" /><div className="grid md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-36 rounded-3xl bg-slate-200" />)}</div></div></div>
);