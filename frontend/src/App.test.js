import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = mockLocalStorage;

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: jest.fn(() => 'test-id-123')
};

// Helper function to render App with Router
const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('USF Daily Task Manager', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue('[]');
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.clear.mockClear();
  });

  test('renders main title', () => {
    renderApp();
    expect(screen.getByText('USF Daily Task Manager')).toBeInTheDocument();
  });

  test('shows empty state when no tasks', () => {
    renderApp();
    expect(screen.getByText('All tasks completed!')).toBeInTheDocument();
  });

  test('can add a new task', async () => {
    renderApp();
    
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Event *'), {
      target: { value: 'Test Event' }
    });
    fireEvent.change(screen.getByPlaceholderText('Description (optional)'), {
      target: { value: 'Test Description' }
    });
    
    // Set dates and times
    const dateInputs = screen.getAllByDisplayValue('');
    fireEvent.change(dateInputs[0], { target: { value: '2024-12-01' } }); // Start date
    fireEvent.change(dateInputs[1], { target: { value: '10:00' } }); // Start time
    fireEvent.change(dateInputs[2], { target: { value: '2024-12-01' } }); // End date
    fireEvent.change(dateInputs[3], { target: { value: '11:00' } }); // End time
    
    // Click Add Task button
    fireEvent.click(screen.getByText('Add Task'));
    
    // Check if task was added
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });
  });

  test('validates required fields', () => {
    renderApp();
    
    // Try to add task without filling required fields
    fireEvent.click(screen.getByText('Add Task'));
    
    // Form should not submit and inputs should show error styling
    const eventInput = screen.getByPlaceholderText('Event *');
    expect(eventInput).toHaveClass('input-error');
  });

  test('shows Import ICS button', () => {
    renderApp();
    expect(screen.getByText('Import ICS')).toBeInTheDocument();
  });

  test('shows Weekly Report button', () => {
    renderApp();
    expect(screen.getByText('Weekly Report')).toBeInTheDocument();
  });

  test('can enter delete mode', () => {
    renderApp();
    
    const deleteButton = screen.getByText('Delete Mode');
    fireEvent.click(deleteButton);
    
    expect(screen.getByText('Save & Exit')).toBeInTheDocument();
    expect(screen.getByText('Exit without Saving')).toBeInTheDocument();
  });

  test('displays completed tasks link', () => {
    renderApp();
    expect(screen.getByText('View completed tasks')).toBeInTheDocument();
  });
});

describe('Task Management', () => {
  beforeEach(() => {
    // Mock localStorage with some existing tasks
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      {
        id: 'test-1',
        event: 'Existing Task',
        description: 'Test description',
        date: '2024-12-01',
        startTime: '09:00',
        endDate: '2024-12-01',
        endTime: '10:00',
        completed: false
      }
    ]));
  });

  test('loads existing tasks from localStorage', () => {
    renderApp();
    expect(screen.getByText('Existing Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  test('can mark task as completed', async () => {
    renderApp();
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  test('can edit a task', async () => {
    renderApp();
    
    const editButton = screen.getByText('✎ Edit');
    fireEvent.click(editButton);
    
    // Check that edit form appears
    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
    });
  });
});

describe('Form Validation', () => {
  test('prevents invalid time ranges', () => {
    renderApp();
    
    // Fill form with end time before start time
    fireEvent.change(screen.getByPlaceholderText('Event *'), {
      target: { value: 'Invalid Time Test' }
    });
    
    const dateInputs = screen.getAllByDisplayValue('');
    fireEvent.change(dateInputs[0], { target: { value: '2024-12-01' } }); // Start date
    fireEvent.change(dateInputs[1], { target: { value: '11:00' } }); // Start time (later)
    fireEvent.change(dateInputs[2], { target: { value: '2024-12-01' } }); // End date
    fireEvent.change(dateInputs[3], { target: { value: '10:00' } }); // End time (earlier)
    
    fireEvent.click(screen.getByText('Add Task'));
    
    // Should show validation errors
    expect(dateInputs[1]).toHaveClass('input-error');
    expect(dateInputs[3]).toHaveClass('input-error');
  });
});