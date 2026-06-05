import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { mediaUrl } from '../services/api';
import { io } from 'socket.io-client';

const PIPELINE_STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'screening', label: 'Resume Screening' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interviewing' },
  { id: 'recruiter_review', label: 'Recruiter Review' },
  { id: 'manager_review', label: 'Manager Review' },
  { id: 'selected', label: 'Selected' },
];

export default function ApplicantKanbanBoard({ applications, onStatusChange, onPlayVideo }) {
  const [localApps, setLocalApps] = useState(applications);
  const socketRef = useRef(null);

  useEffect(() => {
    setLocalApps(applications);
  }, [applications]);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(backendUrl, { withCredentials: true });

    // Join all jobs' rooms that are currently in the applications list
    const jobIds = [...new Set(applications.map(app => app.jobId?._id || app.jobId))].filter(Boolean);
    jobIds.forEach(jobId => {
      socketRef.current.emit('join_job_room', jobId);
    });

    socketRef.current.on('job_application_updated', (data) => {
      const { applicationId, status } = data;
      setLocalApps(prevApps => {
        const newApps = [...prevApps];
        const index = newApps.findIndex(a => a._id === applicationId);
        if (index !== -1 && newApps[index].status !== status) {
          newApps[index].status = status;
          return newApps;
        }
        return prevApps;
      });
    });

    return () => {
      jobIds.forEach(jobId => {
        socketRef.current.emit('leave_job_room', jobId);
      });
      socketRef.current.disconnect();
    };
  }, [applications]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistically update local state
    const newApps = Array.from(localApps);
    const appIndex = newApps.findIndex(a => a._id === draggableId);
    if (appIndex === -1) return;

    newApps[appIndex].status = destination.droppableId;
    setLocalApps(newApps);

    // Call API to update backend
    onStatusChange(draggableId, destination.droppableId);
  };

  const getStageApps = (stageId) => localApps.filter(a => a.status === stageId || (stageId === 'selected' && a.status === 'hired'));

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 snap-x min-h-[600px] items-start">
        {PIPELINE_STAGES.map((stage) => {
          const stageApps = getStageApps(stage.id);
          return (
            <div key={stage.id} className="min-w-[320px] w-[320px] bg-slate-100/50 rounded-2xl p-4 flex flex-col snap-start border border-slate-200/50">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-slate-700">{stage.label}</h3>
                <span className="bg-white text-slate-500 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {stageApps.length}
                </span>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 flex flex-col gap-3 min-h-[150px] transition-colors rounded-xl p-1 ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
                  >
                    {stageApps.length === 0 && !snapshot.isDraggingOver ? (
                      <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
                        Drop candidate here
                      </div>
                    ) : null}

                    {stageApps.map((app, index) => (
                      <Draggable key={app._id} draggableId={app._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3 cursor-grab active:cursor-grabbing transition-shadow ${snapshot.isDragging ? 'shadow-lg border-brand-300 ring-2 ring-brand-500/20' : 'hover:border-slate-300'}`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                                  {(app.extractedName || app.userId?.name || 'C').charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-900 text-sm">
                                    {app.extractedName || app.userId?.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-500">{app.extractedEmail || app.userId?.email}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                app.score >= 70 ? 'bg-emerald-50 text-emerald-700' :
                                app.score >= 40 ? 'bg-amber-50 text-amber-700' :
                                'bg-rose-50 text-rose-700'
                              }`}>
                                {app.score}%
                              </span>
                            </div>

                            {app.aiFeedback && (
                              <p className="text-xs text-slate-600 line-clamp-2" title={app.aiFeedback}>
                                {app.aiFeedback}
                              </p>
                            )}

                            <div className="pt-2 flex flex-wrap gap-2 items-center justify-between border-t border-slate-100">
                              {app.resumeUrl && (
                                <a
                                  href={mediaUrl(app.resumeUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                                  onMouseDown={e => e.stopPropagation()}
                                >
                                  Resume
                                </a>
                              )}
                              
                              {app.interviewVideos?.length > 0 && (
                                <button
                                  onMouseDown={e => e.stopPropagation()}
                                  onClick={() => onPlayVideo(app.interviewVideos[0].videoUrl, `${app.extractedName || app.userId?.name} — Answer 1`)}
                                  className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-1 rounded hover:bg-violet-100"
                                >
                                  🎥 Play Video
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
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
