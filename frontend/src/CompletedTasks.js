import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './App.css';

/**
 * CompletedTasks
 * Lists archived tasks and allows clearing them.
 */

export default function CompletedTasks() {
  const [completedTasks, setCompletedTasks] = useState([]);
  const navigate = useNavigate();
  const formatDateDisplay = (yyyyMmDd) => {
    if (!yyyyMmDd) return '';
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString();
  };

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem('completedTasks') || '[]');
      setCompletedTasks(existing);
    } catch (e) {}
  }, []);

  const clearCompleted = () => {
    localStorage.removeItem('completedTasks');
    setCompletedTasks([]);
  };

  return (
    <div>
      <h1 className="title">Completed Tasks</h1>
      <div className="task-box">
        {completedTasks.length === 0 ? (
          <div className="empty-state">No completed tasks yet</div>
        ) : (
          <ul className="task-list">
            {completedTasks.map((task, index) => (
              <li key={`${task.id || task.event}-${index}`} className="task-item">
                <div className="task-row">
                  <div className="task-checkbox" />
                  <div className="task-content">
                    <div className="task-title">{task.event}</div>
                    {task.description ? <div className="task-desc">{task.description}</div> : null}
                    <div className="task-meta">
                      <span className="task-time">
                        {formatDateDisplay(task.date)} {task.startTime}
                        {" – "}
                        {formatDateDisplay(task.endDate || task.date)} {task.endTime}
                      </span>
                    </div>
                  </div>
                  <div className="task-actions" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="print-fixed" style={{ display: 'flex', gap: '8px' }}>
        <button type="button" className="my-button" onClick={() => navigate('/')}>Back</button>
        <button type="button" className="submit-button" onClick={clearCompleted}>Clear completed</button>
      </div>
    </div>
  );
}


