import { useState, useEffect } from 'react';
import { schedulingAPI } from '../services/api';

/**
 * Recruiter slot creation & management panel.
 * Allows creating interview time slots and viewing/cancelling existing ones.
 *
 * @param {{ jobId: string, jobTitle: string }} props
 */
export default function SlotManager({ jobId, jobTitle }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
    duration: 30,
    meetingLink: '',
    calendlyUrl: '',
  });

  const loadSlots = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await schedulingAPI.getRecruiterSchedule();
      const all = res.data?.slots || res.data || [];
      // Filter slots belonging to the current job
      setSlots(all.filter((s) => s.jobId === jobId || s.jobId?._id === jobId));
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [jobId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!jobId || !newSlot.date || !newSlot.startTime || !newSlot.endTime) return;
    setCreating(true);
    setMessage('');
    try {
      // Compose ISO start/end from date + time inputs
      const startTime = new Date(`${newSlot.date}T${newSlot.startTime}`).toISOString();
      const endTime = new Date(`${newSlot.date}T${newSlot.endTime}`).toISOString();

      await schedulingAPI.createSlots({
        jobId,
        slots: [{ date: newSlot.date, startTime, endTime, duration: newSlot.duration }],
        meetingLink: newSlot.meetingLink,
        calendlyUrl: newSlot.calendlyUrl,
      });

      setMessage('Slot created successfully.');
      setNewSlot({ date: '', startTime: '', endTime: '', duration: 30, meetingLink: '', calendlyUrl: '' });
      setShowCreate(false);
      await loadSlots();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create slot.');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (slotId) => {
    if (!confirm('Cancel this slot?')) return;
    try {
      await schedulingAPI.cancelBooking(slotId);
      setMessage('Slot cancelled.');
      await loadSlots();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to cancel.');
    }
  };

  const statusBadge = (status) => {
    const map = {
      available: 'bg-emerald-100 text-emerald-800',
      booked:    'bg-blue-100 text-blue-800',
      completed: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-rose-100 text-rose-700',
    };
    return map[status] || 'bg-slate-100 text-slate-700';
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  /** Build Google Calendar URL */
  const googleCalUrl = (slot) => {
    const start = new Date(slot.startTime).toISOString().replace(/[-:]/g, '').replace('.000', '');
    const end = new Date(slot.endTime).toISOString().replace(/[-:]/g, '').replace('.000', '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Interview — ${jobTitle}`)}&dates=${start}/${end}`;
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 text-sm">Interview Scheduling</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn btn-primary px-4 py-1.5 text-xs"
        >
          {showCreate ? 'Close' : '+ Add Time Slots'}
        </button>
      </div>

      {message && (
        <div className="p-2.5 bg-brand-50 text-brand-800 rounded-xl text-xs">{message}</div>
      )}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="card p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">New Slot</h4>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                required
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
              <input
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                required
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
              <input
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                required
                className="input-field text-sm"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Meeting Link</label>
              <input
                type="url"
                value={newSlot.meetingLink}
                onChange={(e) => setNewSlot({ ...newSlot, meetingLink: e.target.value })}
                placeholder="https://zoom.us/j/..."
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Calendly URL (optional)</label>
              <input
                type="url"
                value={newSlot.calendlyUrl}
                onChange={(e) => setNewSlot({ ...newSlot, calendlyUrl: e.target.value })}
                placeholder="https://calendly.com/..."
                className="input-field text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="btn btn-primary w-full py-2 text-sm"
          >
            {creating ? 'Creating...' : 'Create Slot'}
          </button>
        </form>
      )}

      {/* Existing slots grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : slots.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No interview slots created for this job yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => (
            <div key={slot._id} className="card p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">{formatDate(slot.date || slot.startTime)}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${statusBadge(slot.status)}`}>
                  {slot.status}
                </span>
              </div>
              <p className="text-slate-600">
                {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
              </p>

              {slot.meetingLink && (
                <a href={slot.meetingLink} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline font-semibold block truncate">
                  Meeting Link ↗
                </a>
              )}

              {/* Booked candidate info */}
              {slot.status === 'booked' && slot.bookedBy && (
                <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="font-semibold text-blue-800">{slot.bookedBy.name || slot.bookedBy.email || 'Candidate'}</p>
                  {slot.bookedBy.email && <p className="text-blue-600">{slot.bookedBy.email}</p>}
                  <a
                    href={googleCalUrl(slot)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-1 text-brand-600 font-semibold hover:underline"
                  >
                    Add to Calendar
                  </a>
                </div>
              )}

              {/* Cancel button */}
              {['available', 'booked'].includes(slot.status) && (
                <button
                  onClick={() => handleCancel(slot._id)}
                  className="w-full py-1.5 border border-rose-200 text-rose-600 rounded-xl text-[11px] font-semibold hover:bg-rose-50 transition"
                >
                  Cancel Slot
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
