
import { Status, Priority, Task, StatusChange, DbTask, DbStatusHistory } from '@/types/task';

/**
 * Maps a database task record to a frontend Task model
 */
export const mapDbTaskToTask = (dbTask: DbTask, statusHistory: DbStatusHistory[] = []): Task => {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    status: dbTask.status as Status,
    priority: dbTask.priority as Priority,
    assignedTo: dbTask.assigned_to,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
    userId: dbTask.user_id,
    statusHistory: statusHistory.map(mapDbStatusHistoryToStatusChange)
  };
};

/**
 * Maps a database status history record to a frontend StatusChange model
 */
export const mapDbStatusHistoryToStatusChange = (dbStatusHistory: DbStatusHistory): StatusChange => {
  return {
    id: dbStatusHistory.id,
    taskId: dbStatusHistory.task_id,
    previousStatus: dbStatusHistory.previous_status as Status,
    newStatus: dbStatusHistory.new_status as Status,
    changedBy: dbStatusHistory.user_name,
    remarks: dbStatusHistory.remarks,
    timestamp: dbStatusHistory.created_at
  };
};
