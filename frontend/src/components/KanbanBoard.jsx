import { useMemo } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';

/** Column configuration — order, labels, and color tokens */
const COLUMNS = [
  { id: 'screening',        label: 'Screening',        color: 'slate'   },
  { id: 'shortlisted',      label: 'Shortlisted',      color: 'blue'    },
  { id: 'interview',        label: 'Interview',         color: 'violet'  },
  { id: 'recruiter_review', label: 'Recruiter Review',  color: 'amber'   },
  { id: 'manager_review',   label: 'Manager Review',    color: 'orange'  },
  { id: 'selected',         label: 'Selected',          color: 'emerald' },
  { id: 'rejected',         label: 'Rejected',          color: 'rose'    },
];

/** Tailwind background tints per column */
const columnBg = {
  slate:   'bg-slate-50',
  blue:    'bg-blue-50/60',
  violet:  'bg-violet-50/60',
  amber:   'bg-amber-50/60',
  orange:  'bg-orange-50/60',
  emerald: 'bg-emerald-50/60',
  rose:    'bg-rose-50/60',
};

/** Count badge accent per column */
const countBadge = {
  slate:   'bg-slate-200 text-slate-700',
  blue:    'bg-blue-200 text-blue-800',
  violet:  'bg-violet-200 text-violet-800',
  amber:   'bg-amber-200 text-amber-800',
  orange:  'bg-orange-200 text-orange-800',
  emerald: 'bg-emerald-200 text-emerald-800',
  rose:    'bg-rose-200 text-rose-800',
};

/**
 * Kanban board for the recruiter applicant pipeline.
 *
 * @param {{
 *   applications: object[],
 *   onStatusChange: (appId: string, newStatus: string) => void,
 *   onCardClick: (app: object) => void
 * }} props
 */
export default function KanbanBoard({ applications = [], onStatusChange, onCardClick }) {
  // Group applications by their pipeline status into column buckets
  const columnData = useMemo(() => {
    const map = {};
    COLUMNS.forEach((col) => { map[col.id] = []; });
    applications.forEach((app) => {
      const status = app.pipelineStatus || app.status || 'screening';
      if (map[status]) {
        map[status].push(app);
      }
      // Applications with unrecognized statuses (e.g. 'applied') fall into screening
      else {
        map['screening'].push(app);
      }
    });
    return map;
  }, [applications]);

  const handleDragEnd = (result) => {
    const { draggableId, destination } = result;
    if (!destination) return; // dropped outside
    const newStatus = destination.droppableId;
    onStatusChange?.(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {COLUMNS.map((col) => {
          const cards = columnData[col.id] || [];
          return (
            <div
              key={col.id}
              className={`min-w-[280px] max-w-[300px] flex-shrink-0 rounded-[20px] p-3 ${columnBg[col.color] || 'bg-slate-50'}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {col.label}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${countBadge[col.color]}`}>
                  {cards.length}
                </span>
              </div>

              {/* Droppable area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2.5 min-h-[120px] rounded-2xl p-1 transition-colors duration-200 ${
                      snapshot.isDraggingOver
                        ? 'bg-white/50 border-2 border-dashed border-brand-300'
                        : ''
                    }`}
                  >
                    {cards.map((app, idx) => (
                      <KanbanCard
                        key={app._id}
                        app={app}
                        index={idx}
                        columnColor={col.color}
                        onClick={onCardClick}
                      />
                    ))}
                    {provided.placeholder}

                    {/* Empty state */}
                    {cards.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-2xl">
                        <p className="text-[10px] text-slate-400">Drop here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
