import { useState, useEffect, useMemo } from 'react';
import { schedulingAPI } from '../services/api';

/**
 * Candidate interview slot booking modal.
 * Fetches available slots for a job and allows the candidate to book one.
 *
 * @param {{
 *   jobId: string,
 *   applicationId: string,
 *   onBooked: (booking: object) => void,
 *   onClose: () => void
 * }} props
 */
export default function SlotPicker({ jobId, applicationId, onBooked, onClose }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(null); // success booking object
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    schedulingAPI
      .getAvailableSlots(jobId)
      .then((res) => setSlots(res.data?.slots || res.data || []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [jobId]);

  /** Group slots by date string for section headers */
  const groupedSlots = useMemo(() => {
    const groups = {};
    slots.forEach((slot) => {
      const d = new Date(slot.date || slot.startTime);
      const key = d.toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(slot);
    });
    return groups;
  }, [slots]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    setError('');
    try {
      const res = await schedulingAPI.bookSlot(selectedSlot._id, { applicationId });
      setBooked(res.data);
      onBooked?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book the slot. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  /** Build a Google Calendar add-event URL */
  const googleCalendarUrl = (slot) => {
    if (!slot) return '#';
    const start = new Date(slot.startTime || slot.date).toISOString().replace(/[-:]/g, '').replace('.000', '');
    const end = new Date(slot.endTime || slot.date).toISOString().replace(/[-:]/g, '').replace('.000', '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Interview — Kyro')}&dates=${start}/${end}&details=${encodeURIComponent('Scheduled via Kyro platform')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[28px] shadow-2xl max-w-lg w-full p-8 relative max-h-[85vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Success state */}
        {booked ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Interview Booked!</h2>
            {selectedSlot && (
              <p className="text-sm text-slate-600">
                {formatDate(selectedSlot.date || selectedSlot.startTime)}<br />
                {formatTime(selectedSlot.startTime)} — {formatTime(selectedSlot.endTime)}
              </p>
            )}
            <a
              href={googleCalendarUrl(selectedSlot)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-2xl transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add to Google Calendar
            </a>
            <button onClick={onClose} className="block mx-auto text-sm text-slate-500 hover:text-slate-700 mt-2">
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Schedule Your Interview</h2>
            <p className="text-xs text-slate-500 mb-5">Pick a convenient time slot below</p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-2xl border border-rose-100">{error}</div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              </div>
            ) : Object.keys(groupedSlots).length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-500">No available slots</p>
                <p className="text-xs text-slate-400">The recruiter hasn't published interview slots for this position yet.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(groupedSlots).map(([dateKey, dateSlots]) => (
                  <div key={dateKey}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      {formatDate(dateKey)}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {dateSlots.map((slot) => {
                        const isSelected = selectedSlot?._id === slot._id;
                        return (
                          <button
                            key={slot._id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-4 py-2 rounded-2xl border text-sm font-medium transition-all ${
                              isSelected
                                ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer actions */}
            {!loading && Object.keys(groupedSlots).length > 0 && (
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button onClick={onClose} className="btn btn-secondary flex-1 py-2.5 text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedSlot || booking}
                  className="btn btn-primary flex-1 py-2.5 text-sm disabled:opacity-50"
                >
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
