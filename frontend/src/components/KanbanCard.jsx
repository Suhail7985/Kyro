import { Draggable } from '@hello-pangea/dnd';

/** Compute human-readable relative time string from a date */
function timeAgo(date) {
  if (!date) return '';
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** Color-coded score badge classes */
function scoreBadgeClasses(score) {
  if (score >= 70) return 'bg-emerald-100 text-emerald-800';
  if (score >= 40) return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-800';
}

/**
 * Individual candidate card rendered inside a Kanban column.
 * @param {{ app: object, index: number, columnColor: string, onClick: (app: object) => void }} props
 */
export default function KanbanCard({ app, index, columnColor, onClick }) {
  const name = app.extractedName || app.userId?.name || 'Unknown';
  const email = app.extractedEmail || app.userId?.email || '';
  const score = app.score ?? app.matchScore ?? 0;
  const skills = (app.matchedSkills || []).slice(0, 3);
  const hasVideo = app.interviewVideos && app.interviewVideos.length > 0;

  // Map color token to Tailwind classes (only the subset used by the board)
  const avatarStyles = {
    slate:   'bg-slate-100 text-slate-700',
    blue:    'bg-blue-100 text-blue-700',
    violet:  'bg-violet-100 text-violet-700',
    amber:   'bg-amber-100 text-amber-700',
    orange:  'bg-orange-100 text-orange-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose:    'bg-rose-100 text-rose-700',
  };

  return (
    <Draggable draggableId={app._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick?.(app)}
          className={`group bg-white rounded-2xl shadow-sm p-4 cursor-pointer transition-all duration-200 ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-brand-300 rotate-1' : 'hover:shadow-md'
          }`}
        >
          {/* Drag grip dots — visible on hover */}
          <div className="flex justify-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 text-slate-300" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="4" cy="3" r="1.5" />
              <circle cx="12" cy="3" r="1.5" />
              <circle cx="4" cy="8" r="1.5" />
              <circle cx="12" cy="8" r="1.5" />
              <circle cx="4" cy="13" r="1.5" />
              <circle cx="12" cy="13" r="1.5" />
            </svg>
          </div>

          <div className="flex items-start gap-3">
            {/* Avatar circle */}
            <div
              className={`w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center text-sm font-bold ${
                avatarStyles[columnColor] || avatarStyles.slate
              }`}
            >
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                {/* Score pill */}
                <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${scoreBadgeClasses(score)}`}>
                  {score}%
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{email}</p>
            </div>
          </div>

          {/* Skills row */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {skills.map((sk, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded-full text-[10px] font-medium text-slate-600">
                  {sk}
                </span>
              ))}
            </div>
          )}

          {/* Footer: time + video indicator */}
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[10px] text-slate-300">{timeAgo(app.createdAt || app.appliedAt)}</span>
            {hasVideo && (
              <span className="text-slate-400" title={`${app.interviewVideos.length} video(s)`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
