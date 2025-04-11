
export type Status = 'Pending' | 'In Progress' | 'Closed';
export type Priority = 'Low' | 'Medium' | 'High';

export interface StatusChange {
  id: string;
  taskId: string;
  previousStatus: Status;
  newStatus: Status;
  changedBy: string;
  remarks: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusChange[];
  remarks?: string;
  userId?: string;
}

// Supabase database models
export interface DbTask {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  assigned_to: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbStatusHistory {
  id: string;
  task_id: string;
  previous_status: Status;
  new_status: Status;
  user_id: string;
  user_name: string;
  remarks: string;
  created_at: string;
}

// Mapping functions to convert between database and frontend models
export const mapDbTaskToTask = (dbTask: DbTask, statusHistory: DbStatusHistory[] = []): Task => {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    status: dbTask.status,
    priority: dbTask.priority,
    assignedTo: dbTask.assigned_to,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
    userId: dbTask.user_id,
    statusHistory: statusHistory.map(mapDbStatusHistoryToStatusChange)
  };
};

export const mapDbStatusHistoryToStatusChange = (dbStatusHistory: DbStatusHistory): StatusChange => {
  return {
    id: dbStatusHistory.id,
    taskId: dbStatusHistory.task_id,
    previousStatus: dbStatusHistory.previous_status,
    newStatus: dbStatusHistory.new_status,
    changedBy: dbStatusHistory.user_name,
    remarks: dbStatusHistory.remarks,
    timestamp: dbStatusHistory.created_at
  };
};
