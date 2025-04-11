
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
}
