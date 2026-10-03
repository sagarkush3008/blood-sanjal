import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { BloodGroupBadge } from '../common/BloodGroupBadge';
import { BloodRequest, DonationRecord } from '../../types';
import {
  Shield,
  AlertTriangle,
  Users,
  CreditCard,
  Settings,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  FileText,
  Eye,
  Share2,
  Camera,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { SocialPostCardModal } from '../common/SocialPostCardModal';
import { activeStatusApi } from '../../services/activeStatusApi';
import { StatusAuditEntry } from '../../server/types/activeStatus';
import { Activity, RefreshCw, Server, Zap } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    bloodRequests,
    verifyBloodRequest,
    donations,
    toggleDonationSocialPosted,
    allUsers,
    verifyUser,
    payments,
    settings,
    updateSystemSettings,
    sendBroadcastNotification,
    activeStatusSummary,
    refreshActiveStatusSummary
  } = useApp();

  const [activeTab, setActiveTab] = useState<'requests' | 'activeStatus' | 'social' | 'users' | 'payments' | 'broadcast' | 'settings'>('requests');
  const [auditLogs, setAuditLogs] = useState<StatusAuditEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [healthData, setHealthData] = useState<{ status: string; uptimeSeconds: number; activeDonorsTotal: number } | null>(null);
  const [testResult, setTestResult] = useState<string>('');

  const fetchActiveStatusData = async () => {
    setIsLoadingLogs(true);
    try {
      const [health, history] = await Promise.all([
        activeStatusApi.checkHealth(),
        activeStatusApi.getAuditHistory(30)
      ]);
      setHealthData(health);
      setAuditLogs(history.logs);
      await refreshActiveStatusSummary();
    } catch (err: any) {
      console.warn('Failed to load active status logs', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'activeStatus') {
      fetchActiveStatusData();
    }
  }, [activeTab]);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Settings local state
  const [feeInput, setFeeInput] = useState(settings.searchFeeNpr);

  // Document Viewer state
  const [selectedReqForDoc, setSelectedReqForDoc] = useState<BloodRequest | null>(null);

  // Social Post Modal state
  const [selectedDonationForSocial, setSelectedDonationForSocial] = useState<DonationRecord | null>(null);
  const [copiedDonationId, setCopiedDonationId] = useState<string | null>(null);

  const pendingEmergencyRequests = bloodRequests.filter(
    (r) => r.isEmergency && r.verificationStatus === 'pending'
  );

  const socialDonations = donations.filter(
    (d) => d.allowSocialMediaShare && Boolean(d.photoUrl)
  );

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    sendBroadcastNotification({
      title: broadcastTitle,
      message: broadcastMessage,
      type: 'system'
    });

    setBroadcastSuccess(true);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Admin Title Card */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white rounded-3xl p-5 shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-black tracking-tight">Admin Operations</h2>
          </div>
          <span className="bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
            Blood Sanjal Portal
          </span>
        </div>
        <p className="text-xs text-amber-100 font-medium">
          Verify emergency blood requests, configure NPR {settings.searchFeeNpr} maintenance fee, manage donors & broadcasts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl text-[11px] font-extrabold text-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 min-w-[75px] py-2 px-1 rounded-xl transition text-center whitespace-nowrap ${
            activeTab === 'requests' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Emergency ({pendingEmergencyRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('activeStatus')}
          className={`flex-1 min-w-[95px] py-2 px-1 rounded-xl transition text-center whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'activeStatus'
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'hover:text-slate-900 text-emerald-700 bg-emerald-50/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Active Status
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`flex-1 min-w-[85px] py-2 px-1 rounded-xl transition text-center whitespace-nowrap ${
            activeTab === 'social' ? 'bg-white text-rose-700 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Social Media ({socialDonations.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[55px] py-2 px-1 rounded-xl transition text-center whitespace-nowrap ${
            activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 min-w-[65px] py-2 px-1 rounded-xl transition text-center whitespace-nowrap ${
            activeTab === 'payments' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Payments
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 min-w-[65px] py-2 px-1 rounded-xl transition text-center whitespace-nowrap ${
            activeTab === 'broadcast' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Broadcast
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[55px] py-2 px-1 rounded-xl transition text-center whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          Settings
        </button>
      </div>

      {/* TAB 1: EMERGENCY REQUEST VERIFICATION */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
            Pending Emergency Request Approvals ({pendingEmergencyRequests.length})
          </h3>

          {pendingEmergencyRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center space-y-1 border border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700">All emergency requests reviewed!</p>
              <p className="text-[11px] text-slate-500">No urgent emergency requests awaiting verification right now.</p>
            </div>
          ) : (
            pendingEmergencyRequests.map((req) => {
              const hasReport = Boolean(req.hospitalReportUrl || req.documentUrl);

              return (
                <div key={req.id} className="bg-white rounded-3xl p-4 border border-rose-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BloodGroupBadge group={req.bloodGroup} size="md" />
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{req.hospital}</h4>
                        <p className="text-xs text-slate-500">{req.hospitalLocation.city}, {req.hospitalLocation.district}</p>
                      </div>
                    </div>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      🚨 Emergency
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl text-xs space-y-1 text-slate-700">
                    <p><strong>Contact Person:</strong> {req.contactPerson} ({req.contactPhone})</p>
                    <p><strong>Units Needed:</strong> {req.unitsRequired} Units</p>
                    <p><strong>Description:</strong> {req.description}</p>
                  </div>

                  {/* Doctor Hospital Requisition Paper Inspection Box */}
                  {hasReport ? (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          onClick={() => setSelectedReqForDoc(req)}
                          className="w-10 h-10 rounded-lg bg-white border border-emerald-200 overflow-hidden cursor-pointer shrink-0"
                          title="Click to view full screen"
                        >
                          <img
                            src={req.hospitalReportUrl || req.documentUrl}
                            alt="Requisition Paper"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-[11px] text-emerald-950 truncate">
                            📄 {req.hospitalReportName || 'Doctor_Requisition_Slip.jpg'}
                          </p>
                          <p className="text-[10px] text-emerald-700">
                            Hospital doctor slip uploaded by family
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedReqForDoc(req)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center gap-1 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>No hospital slip uploaded yet. Contact family before approving.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => verifyBloodRequest(req.id, true)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Broadcast
                    </button>
                    <button
                      onClick={() => verifyBloodRequest(req.id, false)}
                      className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB: SOCIAL MEDIA SPOTLIGHT */}
      {activeTab === 'social' && (
        <div className="space-y-3">
          <div className="bg-white rounded-3xl p-4 border border-rose-200 shadow-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-rose-600" />
              <h3 className="font-black text-sm text-slate-900">
                Donor Social Media Showcase ({socialDonations.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Donors who uploaded their donation picture and ticked consent to share on Blood Sanjal social media (Facebook, Instagram, Twitter).
            </p>
          </div>

          {socialDonations.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-slate-200">
              <Camera className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-xs text-slate-700">No donor social posts yet</p>
              <p className="text-[11px] text-slate-500">
                When donors log donations and opt in to social posting, they will appear here ready to publish.
              </p>
            </div>
          ) : (
            socialDonations.map((don) => (
              <div
                key={don.id}
                className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={don.photoUrl}
                        alt={don.donorName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {don.bloodGroup}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {don.donorName}
                      </h4>
                      {don.socialMediaHandle && (
                        <p className="text-xs font-bold text-rose-600">
                          {don.socialMediaHandle}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        {don.location} • {don.donationDate}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      don.socialPosted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {don.socialPosted ? '✓ Posted' : 'Pending'}
                  </span>
                </div>

                {don.socialStoryMessage && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl italic">
                    "{don.socialStoryMessage}"
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedDonationForSocial(don)}
                    className="flex-1 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Social Card & Caption
                  </button>

                  <button
                    onClick={() => toggleDonationSocialPosted(don.id)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition ${
                      don.socialPosted
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {don.socialPosted ? 'Mark Pending' : 'Mark Posted'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Registered Users ({allUsers.length})</h3>
          <div className="space-y-2">
            {allUsers.map((u) => (
              <div key={u.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-extrabold text-slate-900">{u.name} ({u.bloodGroup})</p>
                  <p className="text-slate-500">{u.location.city} • {u.phone}</p>
                </div>
                <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                  u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS LOG */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
            Maintenance Fee Payments ({payments.length})
          </h3>
          {payments.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-extrabold text-slate-900">{p.userName}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{p.transactionId} • {p.gateway}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600">NPR {p.amount}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SYSTEM BROADCAST */}
      {activeTab === 'broadcast' && (
        <form onSubmit={handleSendBroadcast} className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-red-600" /> Send Broadcast Announcement
          </h3>

          {broadcastSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-2xl">
              ✓ Broadcast notification sent to all registered users!
            </div>
          )}

          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1">Title</label>
            <input
              type="text"
              placeholder="e.g. 📢 Emergency Blood Drive in Pokhara"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1">Message</label>
            <textarea
              rows={3}
              placeholder="Write broadcast announcement message..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Broadcast Notification
          </button>
        </form>
      )}

      {/* TAB 5: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">System Parameters</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-extrabold text-slate-800 block mb-1">
                Donor Search Maintenance Fee (NPR)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={feeInput}
                  onChange={(e) => setFeeInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
                <button
                  onClick={() => updateSystemSettings({ searchFeeNpr: feeInput })}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl transition"
                >
                  Save
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Configures the small NPR 15 maintenance contribution required prior to unlocking full donor phone directories.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ACTIVE STATUS ENGINE & REAL-TIME AUDIT */}
      {activeTab === 'activeStatus' && (
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Active Status Backend Engine</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Real-time presence, heartbeat & auto-restoration daemon</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchActiveStatusData}
                disabled={isLoadingLogs}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin text-emerald-600' : ''}`} />
                Sync
              </button>
            </div>

            {/* Health & Engine State */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Engine Health</span>
                <span className="text-sm font-black text-emerald-900 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {healthData?.status ? healthData.status.toUpperCase() : 'ONLINE'}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                  Uptime: {healthData?.uptimeSeconds ? `${healthData.uptimeSeconds}s` : 'Active'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">SSE Real-Time Stream</span>
                <span className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Server className="w-3.5 h-3.5 text-blue-600" />
                  /api/active-status/stream
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                  Auto-expiration worker: 10s interval
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
                <span>Active & Ready Donors</span>
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {activeStatusSummary?.activeDonorsCount ?? 0}
                <span className="text-xs text-slate-400 font-semibold ml-1.5">
                  / {activeStatusSummary?.totalDonors ?? 0}
                </span>
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Available for emergency calls</p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
                <span>Live Online Now</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {activeStatusSummary?.onlineDonorsCount ?? 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Pinged in last 90 seconds</p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
                <span>Paused / Snoozed</span>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-800 mt-1">
                {activeStatusSummary?.inactiveDonorsCount ?? 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Auto-restores when timer ends</p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
                <span>Active Blood Requests</span>
                <Radio className="w-3.5 h-3.5 text-red-600" />
              </div>
              <p className="text-2xl font-black text-red-600 mt-1">
                {activeStatusSummary?.totalActiveRequestsCount ?? 0}
              </p>
              <p className="text-[10px] text-red-500 font-bold mt-0.5">
                {activeStatusSummary?.activeEmergencyRequestsCount ?? 0} Emergency ICU
              </p>
            </div>
          </div>

          {/* Blood Group Breakdown */}
          {activeStatusSummary?.bloodGroupBreakdown && (
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                Blood Group Availability Pulse
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(activeStatusSummary.bloodGroupBreakdown) as unknown as [string, { total: number; active: number; online: number }][]).map(([group, counts]) => (
                  <div key={group} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="font-black text-xs text-red-700 block">{group}</span>
                    <span className="text-[11px] font-extrabold text-slate-900 block mt-0.5">
                      {counts.active} Active
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      {counts.online} Online
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Engine Actions */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">
              Backend API Diagnostics & Quick Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await activeStatusApi.sendHeartbeat('user_admin', '/admin');
                    setTestResult(`✓ Heartbeat registered: isOnline=${res.isOnline} at ${new Date().toLocaleTimeString()}`);
                    fetchActiveStatusData();
                  } catch (err: any) {
                    setTestResult(`✕ Heartbeat error: ${err.message}`);
                  }
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1 transition active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Ping Admin Heartbeat
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const donors = await activeStatusApi.getDonors({ onlineOnly: true });
                    setTestResult(`✓ Queried /api/active-status/donors?onlineOnly=true -> Found ${donors.count} donors online`);
                  } catch (err: any) {
                    setTestResult(`✕ Query error: ${err.message}`);
                  }
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1 transition active:scale-95"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Query Online Donors
              </button>
            </div>

            {testResult && (
              <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] break-all">
                {testResult}
              </div>
            )}
          </div>

          {/* Real-time Status Audit Trail */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                Status Change Audit Log ({auditLogs.length})
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No status transitions recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs flex flex-col gap-1 hover:border-slate-200 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        {log.entityName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[10px]">
                        {log.previousStatus}
                      </span>
                      <span className="text-slate-400 font-bold">→</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-extrabold text-[10px] ${
                          log.newStatus === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.newStatus === 'inactive'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.newStatus.toUpperCase()}
                      </span>
                      <span className="text-slate-500 text-[10px] ml-auto">
                        by: <strong className="text-slate-700">{log.changedBy}</strong>
                      </span>
                    </div>

                    {log.reason && (
                      <p className="text-[10px] text-slate-600 bg-white/70 px-2 py-1 rounded border border-slate-100 italic">
                        "{log.reason}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Viewer Modal for Requisition Paper Inspection */}
      <DocumentViewerModal
        isOpen={Boolean(selectedReqForDoc)}
        onClose={() => setSelectedReqForDoc(null)}
        documentUrl={selectedReqForDoc?.hospitalReportUrl || selectedReqForDoc?.documentUrl}
        documentName={selectedReqForDoc?.hospitalReportName || 'Doctor_Requisition_Slip.jpg'}
        patientName={selectedReqForDoc?.requesterName}
        hospitalName={selectedReqForDoc?.hospital}
        bloodGroup={selectedReqForDoc?.bloodGroup}
      />

      {/* Social Post Card Modal */}
      <SocialPostCardModal
        isOpen={Boolean(selectedDonationForSocial)}
        onClose={() => setSelectedDonationForSocial(null)}
        donation={selectedDonationForSocial}
      />
    </div>
  );
};
