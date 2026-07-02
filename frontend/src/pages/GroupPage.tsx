import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  groupService,
  expenseService,
  inviteService,
  settlementService
} from "../api/api";

const socket = io("http://localhost:5000");

/**
 * PRODUCTION-GRADE GROUP MANAGEMENT COMPONENT
 * Implements: Real-time synchronization, Three-state settlement flow (Settle, Confirm, Request),
 * Defensive ID comparisons, and modularized sub-components.
 */
export default function GroupPage() {
  const { groupId } = useParams();
  
  // -- STATE MANAGEMENT --
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  // -- FORM STATES --
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');
  
  const currentUserId = localStorage.getItem("userId");

  // -- API INTEGRATION --
  const loadGroupDetails = useCallback(async () => {
  try {
    setLoading(true);

    const [g, e, b, p] = await Promise.all([
      groupService.getById(groupId),
      expenseService.getAll(groupId),
      groupService.getBalances(groupId),
      inviteService.getGroupPending(groupId),
    ]);

    setGroup(g.data);
    setExpenses(e.data.expenses || []);
    setSettlements(b.data.suggestedSettlements || []);
    setPendingInvites(p.data || []);
  } catch (err) {
    console.error("CRITICAL_FETCH_ERROR:", err);
  } finally {
    setLoading(false);
  }
}, [groupId]);

  // -- LIFECYCLE & SOCKETS --
  useEffect(() => {
    loadGroupDetails();
    socket.emit("join_group", groupId);
    socket.on("settlement_finalized", loadGroupDetails);
    socket.on("new_expense_alert", loadGroupDetails);
    
    return () => {
      socket.off("settlement_finalized");
      socket.off("new_expense_alert");
    };
  }, [groupId, loadGroupDetails]);

  // -- ACTION HANDLERS --
  const handleAddExpense = async (e) => {
  e.preventDefault();

  try {
    if (file) {
      const scan = await expenseService.scanReceipt(file);
      console.log("Receipt Items:", scan.data.items);
    }

    const payload = {
      description: desc,
      totalAmount: Number(amount),
      splitType: "EQUAL",
      splits: group.members.map((m) => ({
        userId: m.user.id,
      })),
    };

    await expenseService.add(groupId, payload);

    setDesc("");
    setAmount("");
    setFile(null);
    setIsExpenseModalOpen(false);

    loadGroupDetails();
  } catch (err) {
    console.error("ADD EXPENSE ERROR", err);

    alert(
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Failed to add expense"
    );
  }
};

  const handleAddMember = async (e) => {
  e.preventDefault();

  try {
    const res = await inviteService.send(groupId, {
      email: memberEmail,
    });

    alert(res.data.message);

    setMemberEmail("");
    setIsMemberModalOpen(false);

    // Optional if backend returns pending invites
    loadGroupDetails();
  } catch (err) {
    console.error("INVITATION_ERROR:", err);

    alert(
      err.response?.data?.message ||
      "Failed to send invitation."
    );
  }
};

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Syncing ledger...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tighter">{group?.name}</h1>
            <p className="text-slate-500 mt-2">Managing shared group finances</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsExpenseModalOpen(true)} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition">Add Expense</button>
            <button onClick={() => setIsMemberModalOpen(true)} className="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-2xl font-bold hover:bg-slate-50 transition">Intive Member</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <SettlementSection settlements={settlements} currentUserId={currentUserId} loadGroupDetails={loadGroupDetails} />
            <section className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Transaction History</h2>
              {expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center pb-6 border-b border-slate-50 mb-6">
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{exp.description}</p>
                    <p className="text-sm text-slate-400">Paid by {exp.paidBy?.name}</p>
                  </div>
                  <span className="text-xl font-mono font-bold text-slate-900">${exp.totalAmount}</span>
                </div>
              ))}
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
              <h2 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Active Participants</h2>
              <div className="space-y-4">
                {group?.members?.map((m) => (
                  <div key={m.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-700 border-2 border-emerald-100">{m.user?.name[0]}</div>
                    <p className="font-bold text-slate-800">{m.user?.name}</p>
                  </div>
                ))}
              </div>
              {pendingInvites.length > 0 && (
              <>
                <div className="border-t border-slate-100 my-8"></div>

                <h2 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">
                  Pending Invitations
                </h2>

                <div className="space-y-4">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-2xl border border-amber-100 bg-amber-50 p-4"
                    >
                      <p className="font-semibold text-slate-800">
                        {invite.inviteeEmail}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Invited by {invite.inviter?.name}
                      </p>

                      <div className="mt-3">
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            </div>
          </aside>
        </div>
      </div>
      
      {/* ===================== MODALS ===================== */}

{/* Expense Modal */}
{isExpenseModalOpen && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Add Expense</h2>
        <button
          onClick={() => {
            setIsExpenseModalOpen(false);
            setDesc("");
            setAmount("");
            setFile(null);
          }}
          className="text-2xl text-slate-400 hover:text-slate-700"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleAddExpense}>
        <input
          value={desc}
          placeholder="Description"
          onChange={(e) => setDesc(e.target.value)}
          className="w-full border border-slate-200 p-3 mb-4 rounded-xl"
          required
        />

        <input
          type="number"
          value={amount}
          placeholder="Amount"
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-slate-200 p-3 mb-4 rounded-xl"
          required
        />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border border-slate-200 p-3 mb-6 rounded-xl"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setIsExpenseModalOpen(false);
              setDesc("");
              setAmount("");
              setFile(null);
            }}
            className="flex-1 border border-slate-200 py-3 rounded-xl font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700"
          >
            Save Expense
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* Add Member Modal */}
{isMemberModalOpen && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Invite Member</h2>

        <button
          onClick={() => {
            setIsMemberModalOpen(false);
            setMemberEmail("");
          }}
          className="text-2xl text-slate-400 hover:text-slate-700"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleAddMember}>
        <input
          type="email"
          value={memberEmail}
          placeholder="Enter member email"
          onChange={(e) => setMemberEmail(e.target.value)}
          className="w-full border border-slate-200 p-3 mb-4 rounded-xl"
          required
        />

        <p className="text-sm text-slate-500 mb-6">
          An invitation will be sent. The user must accept before joining this group.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setIsMemberModalOpen(false);
              setMemberEmail("");
            }}
            className="flex-1 border border-slate-200 py-3 rounded-xl font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700"
          >
            Intive Member
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}

/**
 * SETTLEMENT COMPONENT: Handles the three-state settlement machine.
 * 
 */
const SettlementSection = ({ settlements, currentUserId, loadGroupDetails }) => {
  const handleRequest = async (s) => {
  try {
    await settlementService.requestPayment(
      groupId,
      s.settlementId
    );

    alert("Payment request sent.");
    loadGroupDetails();
  } catch (err) {
    console.error(err);
  }
};

const handleConfirm = async (settlementId) => {
  try {
    await settlementService.confirm(settlementId);
    loadGroupDetails();
  } catch (err) {
    console.error(err);
  }
};

const handleSettle = async (s) => {
  try {
    let settlementId = s.settlementId;

    // Create settlement if it doesn't exist
    if (!settlementId) {
      const res =
        await settlementService.create({
          groupId: s.groupId,
          payerId: s.fromUserId,
          payeeId: s.toUserId,
          amount: s.amount,
        });

      settlementId =
        res.data.settlement.id;
    }

    // Mark as paid
    await settlementService.settle(
      settlementId
    );

    loadGroupDetails();
  } catch (err) {
    console.error(err);

    alert(
      err.response?.data?.message ||
      "Failed to settle debt."
    );
  }
};

  return (
  <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
    <h2 className="text-2xl font-bold text-slate-900 mb-8">
      Balance Overview
    </h2>

    {settlements
      .filter(
        (s) => String(s.fromUserId) !== String(s.toUserId)
      )
      .map((s, i) => {
        const isDebtor =
          String(s.fromUserId) === String(currentUserId);

        const isCreditor =
          String(s.toUserId) === String(currentUserId);

        const isPending =
          s.status === "PENDING_CONFIRMATION";
        const isConfirmed =
          s.status === "CONFIRMED";
        return (
          <div
            key={i}
            className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl mb-4 border border-slate-100"
          >
            <p className="text-md text-slate-700">
              <span className="font-bold">
                {isDebtor ? "You" : s.fromName}
              </span>

              {" owe "}

              <span className="font-bold">
                {isCreditor ? "You" : s.toName}
              </span>

              <span className="ml-3 font-bold text-emerald-600 text-lg">
                ${s.amount}
              </span>
            </p>

            {/* Logged-in user owes money */}
            {isDebtor && !isPending && (
              <button
                onClick={() => handleSettle(s.settlementId)}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700"
              >
                Settle Debt
              </button>
            )}

            {/* Logged-in user should confirm payment */}
            {isCreditor && isPending && (
              <button
                onClick={() => handleConfirm(s.settlementId)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700"
              >
                Confirm Receipt
              </button>
            )}

            {/* Logged-in user can request payment */}
            {isCreditor && !isPending && (
              <button
                onClick={() => handleRequest(s)}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-black"
              >
                Request Payment
              </button>
            )}

            {/* Debtor waiting for confirmation */}
            {isDebtor && isPending && (
              <span className="px-4 py-2 rounded-xl bg-yellow-100 text-yellow-700 font-semibold text-sm">
                Waiting for Confirmation
              </span>
            )}
          </div>
        );
      })}
  </div>
)};