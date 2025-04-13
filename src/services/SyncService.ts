import { dailyDietTable, foodsTable, goalsTable, mealTemplatesTable } from '../lib/supabase';

// Define types for the queued operation
interface QueuedOperation {
  id: string;
  timestamp: number;
  type: 'create' | 'update' | 'delete';
  entityType: 'food' | 'dailyDiet' | 'goal' | 'mealTemplate';
  payload: any;
  retryCount: number;
}

// Key for offline queue in localStorage
const OFFLINE_QUEUE_KEY = 'MACRO_TRACKER_OFFLINE_QUEUE';

/**
 * Service for handling offline operations and synchronization
 */
export const SyncService = {
  /**
   * Add an operation to the offline queue
   */
  queueOperation(
    type: 'create' | 'update' | 'delete',
    entityType: 'food' | 'dailyDiet' | 'goal' | 'mealTemplate',
    payload: any
  ): string {
    const operationId = `${type}_${entityType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const operation: QueuedOperation = {
      id: operationId,
      timestamp: Date.now(),
      type,
      entityType,
      payload,
      retryCount: 0
    };
    
    const queue = this.getQueue();
    queue.push(operation);
    this.saveQueue(queue);
    
    // Trigger sync if we're online
    if (navigator.onLine) {
      this.sync();
    }
    
    return operationId;
  },
  
  /**
   * Get the offline operations queue
   */
  getQueue(): QueuedOperation[] {
    try {
      const queueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  },
  
  /**
   * Save the offline operations queue
   */
  saveQueue(queue: QueuedOperation[]): void {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  },
  
  /**
   * Clear the offline operations queue
   */
  clearQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },
  
  /**
   * Process an operation from the queue
   */
  async processOperation(operation: QueuedOperation): Promise<boolean> {
    try {
      const { type, entityType, payload } = operation;
      
      switch (entityType) {
        case 'food':
          if (type === 'create') {
            await foodsTable.add(payload);
          } else if (type === 'update') {
            await foodsTable.update(payload.id, payload.updates);
          } else if (type === 'delete') {
            await foodsTable.delete(payload.name);
          }
          break;
          
        case 'dailyDiet':
          if (type === 'create') {
            await dailyDietTable.add(payload);
          } else if (type === 'update') {
            await dailyDietTable.update(payload.id, payload.updates);
          } else if (type === 'delete') {
            await dailyDietTable.delete(payload.id);
          }
          break;
          
        case 'goal':
          if (type === 'create') {
            await goalsTable.create(payload);
          } else if (type === 'update') {
            await goalsTable.update(payload.id, payload.updates);
          } else if (type === 'delete') {
            await goalsTable.delete(payload.id);
          }
          break;
          
        case 'mealTemplate':
          if (type === 'create') {
            await mealTemplatesTable.add(payload);
          } else if (type === 'update') {
            await mealTemplatesTable.update(payload.id, payload.updates);
          } else if (type === 'delete') {
            await mealTemplatesTable.delete(payload.id);
          }
          break;
          
        default:
          console.error(`Unknown entity type: ${entityType}`);
          return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error processing operation (${operation.id}):`, error);
      return false;
    }
  },
  
  /**
   * Attempt to sync all queued operations with the server
   */
  async sync(): Promise<void> {
    // Don't try to sync if we're offline
    if (!navigator.onLine) {
      return;
    }
    
    const queue = this.getQueue();
    
    if (queue.length === 0) {
      return;
    }
    
    const newQueue: QueuedOperation[] = [];
    
    for (const operation of queue) {
      const success = await this.processOperation(operation);
      
      if (!success) {
        // If failed, increment retry count and keep in queue
        if (operation.retryCount < 5) {
          newQueue.push({
            ...operation,
            retryCount: operation.retryCount + 1
          });
        } else {
          // After 5 retries, log an error but don't keep trying
          console.error(`Operation ${operation.id} failed after 5 attempts and will be dropped`);
        }
      }
    }
    
    // Save the updated queue (only failed operations remain)
    this.saveQueue(newQueue);
    
    // Dispatch an event to notify success
    if (newQueue.length === 0) {
      window.dispatchEvent(new CustomEvent('macro-tracker-sync-complete'));
    }
  },
  
  /**
   * Initialize the sync service
   */
  init(): void {
    // Try to sync when app loads and when we get back online
    window.addEventListener('online', () => {
      console.log('Back online, attempting to sync...');
      this.sync();
    });
    
    // Try to sync every minute when the app is running
    setInterval(() => {
      if (navigator.onLine) {
        this.sync();
      }
    }, 60000);
    
    // Initial sync attempt
    if (navigator.onLine) {
      this.sync();
    }
  }
};

// Export a singleton instance
export default SyncService; 