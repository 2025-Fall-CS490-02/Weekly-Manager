import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import './App.css';
import PrintPage from "./PrintPage.js"; 
import CompletedTasks from "./CompletedTasks.js";
// Import the new utilities (make sure these files exist)
import { parseIcsFile } from './utils/icsParser.js';
import { generateWeeklyReport, getWeekStart } from './utils/weeklyReport.js';

/**
 * MainScreen
 * Provides an input form
 * Stores completed tasks in localStorage('completedTasks')
 * Active tasks persist in localStorage('activeTasks').
 */
function MainScreen() {
  const [tasks, setTasks] = useState([]);
  const [fadingIds, setFadingIds] = useState(new Set());
  const [deleteMode, setDeleteMode] = useState(false);
  const [markedForDelete, setMarkedForDelete] = useState(new Set());
  const [form, setForm] = useState({
    event: "",
    description: "",
    date: "",
    startTime: "",
    endDate: "",
    endTime: ""
  });
  const [errors, setErrors] = useState({});
  
  // New states for ICS import
  const fileInputRef = useRef(null);

  const generateId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const parseLocalDate = (yyyyMmDd) => {
    if (!yyyyMmDd) return null;
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  
  const formatDateDisplay = (yyyyMmDd) => {
    const date = parseLocalDate(yyyyMmDd);
    return date ? date.toLocaleDateString() : '';
  };
  
  const parseLocalDateTime = (yyyyMmDd, hhmm) => {
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    const [hh, mm] = (hhmm || '').split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  };

  /**
   * Handles ICS file import
   */
  const handleIcsImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const importedEvents = parseIcsFile(fileContent);
      
      if (importedEvents.length > 0) {
        setTasks(prevTasks => [...prevTasks, ...importedEvents]);
        alert(`Successfully imported ${importedEvents.length} events from ICS file!`);
      } else {
        alert('No valid events found in the ICS file.');
      }
    } catch (error) {
      console.error('Error reading ICS file:', error);
      alert('Error reading ICS file. Please make sure it\'s a valid .ics file.');
    }

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Allows the user to add a new task
   * Invalid inputs set the errors state
   */
  const addTask = () => {
    const eventTitle = form.event.trim();
    const baseErrors = {
      event: !eventTitle,
      date: !form.date,
      startTime: !form.startTime,
      endDate: !form.endDate,
      endTime: !form.endTime,
    };

    let timeOrderInvalid = false;
    if (!baseErrors.date && !baseErrors.startTime && !baseErrors.endDate && !baseErrors.endTime) {
      const start = new Date(`${form.date}T${form.startTime}`);
      const end = new Date(`${form.endDate}T${form.endTime}`);
      timeOrderInvalid = !(start < end);
    }

    const nextErrors = {
      ...baseErrors,
      startTime: baseErrors.startTime || timeOrderInvalid,
      endDate: baseErrors.endDate || timeOrderInvalid,
      endTime: baseErrors.endTime || timeOrderInvalid,
    };

    if (nextErrors.event || nextErrors.date || nextErrors.startTime || nextErrors.endDate || nextErrors.endTime) {
      setErrors(nextErrors);
      return;
    }

    const newTask = {
      id: generateId(),
      event: eventTitle,
      description: form.description.trim(),
      date: form.date,
      startTime: form.startTime,
      endDate: form.endDate,
      endTime: form.endTime,
    };
    setTasks([...tasks, newTask]);
    setForm({ event: "", description: "", date: "", startTime: "", endDate: "", endTime: "" });
    setErrors({});
  };

  /**
   * Allows the user to mark a task as completed. Marked tasks 
   * Go to localStorage('completedTasks') and out of active tasks.
   */
  
  const toggleCompleted = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    if (!task.completed) {
      const id = taskId;
      const next = new Set([...fadingIds]);
      next.add(id);
      setFadingIds(next);
      try {
        const existing = JSON.parse(localStorage.getItem('completedTasks') || '[]');
        localStorage.setItem('completedTasks', JSON.stringify([{ ...task, completed: true }, ...existing]));
      } catch (e) {}
      setTimeout(() => {
        setTasks(curr => curr.filter(t => t.id !== id));
        setFadingIds(curr => {
          const copy = new Set([...curr]);
          copy.delete(id);
          return copy;
        });
      }, 380);
    }
  };

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ event: "", description: "", date: "", startTime: "", endDate: "", endTime: "" });

  const startEdit = (taskId) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    setEditId(taskId);
    setEditForm({
      event: t.event || "",
      description: t.description || "",
      date: t.date || "",
      startTime: t.startTime || "",
      endDate: t.endDate || "",
      endTime: t.endTime || "",
    });
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const saveEdit = () => {
    const title = editForm.event.trim();
    if (!title || !editForm.date || !editForm.startTime || !editForm.endDate || !editForm.endTime) return;
    const start = new Date(`${editForm.date}T${editForm.startTime}`);
    const end = new Date(`${editForm.endDate}T${editForm.endTime}`);
    if (!(start < end)) return;
    setTasks(tasks.map((t) => (
      t.id === editId
        ? {
            ...t,
            event: title,
            description: editForm.description.trim(),
            date: editForm.date,
            startTime: editForm.startTime,
            endDate: editForm.endDate,
            endTime: editForm.endTime,
          }
        : t
    )));
    setEditId(null);
  };

  function formatDurationFromDates(startDateStr, start, endDateStr, end) {
    const startDate = parseLocalDateTime(startDateStr, start);
    const endDate = parseLocalDateTime(endDateStr, end);
    const dateDifference = endDate - startDate;
    const minutesTotal = Math.max(0, Math.floor(dateDifference / 60000));
    const hours = Math.floor(minutesTotal / 60);
    const minutes = minutesTotal % 60;
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    return `${minutes}m`;
  }

  const sortedTasks = useMemo(() => {
    const toTime = (yyyyMmDd, hhmm) => {
      try {
        const [y, m, d] = (yyyyMmDd || '').split('-').map(Number);
        const [hh, mm] = (hhmm || '').split(':').map(Number);
        const dt = new Date(y || 0, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
        const t = dt.getTime();
        return Number.isNaN(t) ? Infinity : t;
      } catch {
        return Infinity;
      }
    };
    return [...tasks].sort((a, b) => toTime(a.date, a.startTime) - toTime(b.date, b.startTime));
  }, [tasks]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('activeTasks') || '[]');
      if (Array.isArray(saved) && saved.length) {
        setTasks(saved.map((t) => ({
          id: t.id || generateId(),
          event: t.event || '',
          description: t.description || '',
          date: t.date || '',
          startTime: t.startTime || '',
          endDate: t.endDate || '',
          endTime: t.endTime || '',
          completed: !!t.completed,
        })));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('activeTasks', JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks]);

  //HTML Elements
  return ( 
    <div> 
      <div className="main-layout">
        <section className="tasks-fixed">
          <h1 className="title">USF Daily Task Manager</h1> 
          <div className="task-box">
            {tasks.length === 0 ? (
              <div className="empty-state">All tasks completed!</div>
            ) : (
              <ul className="task-list">
                {sortedTasks.map((task) => (
                  <li
                    key={task.id || task.event}
                    className={`task-item ${task.completed ? 'completed' : ''} ${fadingIds.has(task.id) ? 'fading' : ''} ${deleteMode ? 'delete-hint' : ''} ${markedForDelete.has(task.id) ? 'marked-delete' : ''}`}
                  >
                    <div className="task-row">
                      <label className="task-checkbox">
                        <input
                          type="checkbox"
                          checked={!!task.completed}
                          onChange={() => toggleCompleted(task.id)}
                          disabled={deleteMode}
                        />
                      </label>
                      <div
                        className="task-content"
                        onClick={() => {
                          if (deleteMode) {
                            const id = task.id;
                            setMarkedForDelete(prev => {
                              const copy = new Set([...prev]);
                              if (copy.has(id)) {
                                copy.delete(id);
                              } else {
                                copy.add(id);
                              }
                              return copy;
                            });
                          }
                        }}
                      >
                        <div className="task-title">{task.event}</div>
                        {task.description ? (
                          <div className="task-desc">{task.description}</div>
                        ) : null}
                        <div className="task-meta">
                          <span className="task-time">
                            {formatDateDisplay(task.date)} {task.startTime}
                            {" — "}
                            {formatDateDisplay(task.endDate)} {task.endTime}
                          </span>
                          <span className="task-duration"> · {formatDurationFromDates(task.date, task.startTime, task.endDate, task.endTime)}</span>
                        </div>
                      </div>
                      <div className="task-actions">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => startEdit(task.id)}
                          disabled={deleteMode}
                        >
                          ✎ Edit
                        </button>
                      </div>
                    </div>

                    {editId === task.id && (
                      <div className="task-edit">
                        <div className="task-edit-row">
                          <input type="text" placeholder="Event *" value={editForm.event} onChange={(e) => setEditForm({ ...editForm, event: e.target.value })} />
                          <input type="text" placeholder="Description (optional)" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                        </div>
                        <div className="task-edit-row">
                          <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                          <input type="time" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} />
                          <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
                          <input type="time" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} />
                          <button type="button" className="save-button" onClick={saveEdit}>Save</button>
                          <button type="button" className="cancel-button" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="helper-text">Use the checkbox to mark complete. Use Edit to modify.</div>
          <div className="helper-text">Enter delete mode to mark tasks for deletion.</div>
          <div>
            <Link className="completed-link" to="/completed">View completed tasks</Link>
          </div>
        </section>

        <section className="input-fixed">
          <div className="input-row">
            <div className="field">
              <input
                type="text"
                placeholder="Event *"
                value={form.event}
                className={(errors.event ? "input-error" : "")}
                onChange={(e) => setForm({ ...form, event: e.target.value })}
              />
              <div className="field-caption field-caption--spacer">&nbsp;</div>
            </div>
            <div className="field">
              <input
                type="text"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="field-caption field-caption--spacer">&nbsp;</div>
            </div>
            <div className="field">
              <input
                type="date"
                value={form.date}
                className={(errors.date ? "input-error" : "")}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <div className="field-caption">Start-date</div>
            </div>
            <div className="field">
              <input
                type="time"
                value={form.startTime}
                className={(errors.startTime ? "input-error" : "")}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
              <div className="field-caption">Start time</div>
            </div>
            <div className="field">
              <input
                type="date"
                value={form.endDate}
                className={(errors.endDate ? "input-error" : "")}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              <div className="field-caption">End date</div>
            </div>
            <div className="field">
              <input
                type="time"
                value={form.endTime}
                className={(errors.endTime ? "input-error" : "")}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTask();
                }}
              />
              <div className="field-caption">End time</div>
            </div>
            <div className="field button-field">
              <button type="button" className="my-button" onClick={addTask}>
                Add Task
              </button>
            </div>
          </div>
        </section>

        <div className="print-fixed" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!deleteMode ? (
            <>
              <button type="button" className="my-button" onClick={() => setDeleteMode(true)}>Delete Mode</button>
              <button type="button" className="my-button" onClick={handleIcsImport}>Import ICS</button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="submit-button"
                onClick={() => {
                  const ids = new Set(markedForDelete);
                  setTasks(curr => curr.filter(t => !ids.has(t.id)));
                  setMarkedForDelete(new Set());
                  setDeleteMode(false);
                }}
              >Save & Exit</button>
              <button
                type="button"
                className="my-button"
                onClick={() => {
                  setMarkedForDelete(new Set());
                  setDeleteMode(false);
                }}
              >Exit without Saving</button>
            </>
          )}
        </div>
        
        {/* Hidden file input for ICS import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".ics,.ical"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <WeeklyReport className="print-fixed-right" tasks={tasks} />
      </div>
    </div> 
  );
}

function WeeklyReport({ className, tasks }) {
  const navigate = useNavigate();
  
  const handleWeeklyReport = () => {
    console.log("Generating weekly report...");
    
    // Get all tasks (active + completed)
    let allTasks = [...tasks];
    try {
      const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
      allTasks = [...allTasks, ...completedTasks];
      console.log("All tasks for report:", allTasks);
    } catch (e) {
      console.error('Error loading completed tasks:', e);
    }
    
    // Get current week start
    const weekStart = getWeekStart();
    console.log("Week start:", weekStart);
    
    try {
      const report = generateWeeklyReport(allTasks, weekStart);
      console.log("Generated report:", report);
      
      // Store the report data for the PrintPage to access
      localStorage.setItem('weeklyReportData', JSON.stringify(report));
      
      // Navigate to print page
      navigate('/printpage');
    } catch (error) {
      console.error("Error generating weekly report:", error);
      alert("Error generating weekly report. Please check the console for details.");
    }
  };
  
  return (
    <button 
      type="button"
      className={`submit-button ${className || ''}`}
      onClick={handleWeeklyReport}
    >
      Weekly Report
    </button>
  );
}

export default function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainScreen />} />
          <Route path="/printpage" element={<PrintPage />} />
          <Route path="/completed" element={<CompletedTasks />} />
        </Routes>
      </div>
    </Router>
  );
}