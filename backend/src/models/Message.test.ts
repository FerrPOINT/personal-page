import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Database from '../services/database.js';
import { createMessage, findPendingOrFailed, updateMessageStatus, getMessageById } from './Message.js';

// Mock database
vi.mock('../services/database.js', () => {
  const mockDb = {
    prepare: vi.fn(),
  };
  
  return {
    db: mockDb,
  };
});

describe('Message Model', () => {
  let mockStmt: any;
  let mockRun: any;
  let mockGet: any;
  let mockAll: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRun = vi.fn();
    mockGet = vi.fn();
    mockAll = vi.fn();
    
    mockStmt = {
      run: mockRun,
      get: mockGet,
      all: mockAll,
    };
    
    vi.mocked(Database.db.prepare).mockReturnValue(mockStmt as any);
  });

  describe('createMessage', () => {
    it('should create message with valid input', async () => {
      // Setup
      const input = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
      };

      const createdMessage = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'pending',
        created_at: '2026-01-19T10:00:00Z',
        sent_at: null,
        error_message: null,
      };

      mockRun.mockReturnValue({ lastInsertRowid: 1 });
      mockGet.mockReturnValue(createdMessage);

      // Execute
      const result = await createMessage(input);

      // Assert
      expect(Database.db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO messages')
      );
      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String), // id (UUID)
        'Test User',
        'test@example.com',
        'Test message',
        expect.any(String), // created_at (ISO string)
      );
      expect(result.id).toBe('test-id');
      expect(result.status).toBe('pending');
    });

    it('should throw error if message not found after creation', async () => {
      // Setup
      const input = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
      };

      mockRun.mockReturnValue({ lastInsertRowid: 1 });
      mockGet.mockReturnValue(null);

      // Execute & Assert
      await expect(createMessage(input)).rejects.toThrow('Failed to create message');
    });
  });

  describe('findPendingOrFailed', () => {
    it('should find pending messages', async () => {
      // Setup
      const mockMessages = [
        {
          id: 'msg-1',
          name: 'User 1',
          email: 'user1@example.com',
          message: 'Message 1',
          status: 'pending',
          created_at: '2026-01-19T10:00:00Z',
          sent_at: null,
          error_message: null,
        },
        {
          id: 'msg-2',
          name: 'User 2',
          email: 'user2@example.com',
          message: 'Message 2',
          status: 'failed',
          created_at: '2026-01-19T10:01:00Z',
          sent_at: null,
          error_message: 'Error message',
        },
      ];

      mockAll.mockReturnValue(mockMessages);

      // Execute
      const result = await findPendingOrFailed(10);

      // Assert
      expect(Database.db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
      expect(mockAll).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockMessages);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no messages found', async () => {
      // Setup
      mockAll.mockReturnValue([]);

      // Execute
      const result = await findPendingOrFailed(10);

      // Assert
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should use default limit when not provided', async () => {
      // Setup
      mockAll.mockReturnValue([]);

      // Execute
      await findPendingOrFailed();

      // Assert
      expect(mockAll).toHaveBeenCalledWith(10); // Default limit
    });
  });

  describe('updateMessageStatus', () => {
    it('should update status to sent', async () => {
      // Setup
      const input = {
        id: 'test-id',
        status: 'sent' as const,
        sent_at: new Date('2026-01-19T10:01:00Z'),
      };

      const updatedMessage = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'sent',
        created_at: '2026-01-19T10:00:00Z',
        sent_at: '2026-01-19T10:01:00Z',
        error_message: null,
      };

      mockRun.mockReturnValue({ changes: 1 });
      mockGet.mockReturnValue(updatedMessage);

      // Execute
      const result = await updateMessageStatus(input);

      // Assert
      expect(Database.db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE messages')
      );
      expect(mockRun).toHaveBeenCalledWith('sent', '2026-01-19T10:01:00.000Z', 'test-id');
      expect(result.status).toBe('sent');
      expect(result.sent_at).toBe('2026-01-19T10:01:00Z');
    });

    it('should update status to failed with error message', async () => {
      // Setup
      const input = {
        id: 'test-id',
        status: 'failed' as const,
        error_message: 'Telegram API error',
      };

      const updatedMessage = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'failed',
        created_at: '2026-01-19T10:00:00Z',
        sent_at: null,
        error_message: 'Telegram API error',
      };

      mockRun.mockReturnValue({ changes: 1 });
      mockGet.mockReturnValue(updatedMessage);

      // Execute
      const result = await updateMessageStatus(input);

      // Assert
      expect(mockRun).toHaveBeenCalledWith(
        'failed',
        'Telegram API error',
        'test-id',
      );
      expect(result.status).toBe('failed');
      expect(result.error_message).toBe('Telegram API error');
    });

    it('should update only status when other fields not provided', async () => {
      // Setup
      const input = {
        id: 'test-id',
        status: 'sent' as const,
      };

      const updatedMessage = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'sent',
        created_at: '2026-01-19T10:00:00Z',
        sent_at: null,
        error_message: null,
      };

      mockRun.mockReturnValue({ changes: 1 });
      mockGet.mockReturnValue(updatedMessage);

      // Execute
      const result = await updateMessageStatus(input);

      // Assert
      expect(mockRun).toHaveBeenCalledWith('sent', 'test-id');
      expect(result.status).toBe('sent');
    });

    it('should throw error if message not found', async () => {
      // Setup
      const input = {
        id: 'non-existent-id',
        status: 'sent' as const,
      };

      mockRun.mockReturnValue({ changes: 1 });
      mockGet.mockReturnValue(null);

      // Execute & Assert
      await expect(updateMessageStatus(input)).rejects.toThrow(
        'Message with id non-existent-id not found'
      );
    });
  });

  describe('getMessageById', () => {
    it('should return message when found', async () => {
      // Setup
      const message = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'pending',
        created_at: '2026-01-19T10:00:00Z',
        sent_at: null,
        error_message: null,
      };

      mockGet.mockReturnValue(message);

      // Execute
      const result = await getMessageById('test-id');

      // Assert
      expect(Database.db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
      expect(mockGet).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(message);
    });

    it('should return null when message not found', async () => {
      // Setup
      mockGet.mockReturnValue(undefined);

      // Execute
      const result = await getMessageById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('checkDuplicateMessage', () => {
    it('should detect duplicate message within time window', async () => {
      // Setup
      mockGet.mockReturnValue({ count: 1 });

      const { checkDuplicateMessage } = await import('./Message.js');

      // Execute
      const result = await checkDuplicateMessage('test@example.com', 'Test message', 5);

      // Assert
      expect(result).toBe(true);
      expect(Database.db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)')
      );
    });

    it('should not detect duplicate if outside time window', async () => {
      // Setup
      mockGet.mockReturnValue({ count: 0 });

      const { checkDuplicateMessage } = await import('./Message.js');

      // Execute
      const result = await checkDuplicateMessage('test@example.com', 'Test message', 5);

      // Assert
      expect(result).toBe(false);
    });

    it('should allow same message from different emails', async () => {
      // Setup - first call returns 0 (no duplicate for email1)
      mockGet.mockReturnValueOnce({ count: 0 });
      // Second call also returns 0 (no duplicate for email2)
      mockGet.mockReturnValueOnce({ count: 0 });

      const { checkDuplicateMessage } = await import('./Message.js');

      // Execute
      const result1 = await checkDuplicateMessage('email1@example.com', 'Same message', 5);
      const result2 = await checkDuplicateMessage('email2@example.com', 'Same message', 5);

      // Assert - both should be allowed (different emails)
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should use default time window when not specified', async () => {
      // Setup
      mockGet.mockReturnValue({ count: 0 });

      const { checkDuplicateMessage } = await import('./Message.js');

      // Execute
      await checkDuplicateMessage('test@example.com', 'Test message');

      // Assert
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('createMessage with duplicate check', () => {
    it('should throw error when duplicate message detected', async () => {
      // Setup - mock checkDuplicateMessage to return true
      mockGet.mockReturnValueOnce({ count: 1 }); // Duplicate found

      const { createMessage } = await import('./Message.js');

      const input = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
      };

      // Execute & Assert
      await expect(createMessage(input)).rejects.toThrow('Duplicate message detected');
      
      // Verify checkDuplicateMessage was called
      expect(Database.db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)')
      );
    });

    it('should create message when no duplicate found', async () => {
      // Setup - mock checkDuplicateMessage to return false, then mock message creation
      mockGet
        .mockReturnValueOnce({ count: 0 }) // No duplicate
        .mockReturnValueOnce({
          id: 'test-id',
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message',
          status: 'pending',
          created_at: '2026-01-19T10:00:00Z',
          sent_at: null,
          error_message: null,
        });
      
      mockRun.mockReturnValue({ lastInsertRowid: 1 });

      const { createMessage } = await import('./Message.js');

      // Execute
      const result = await createMessage({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
      });

      // Assert
      expect(result.id).toBe('test-id');
      // Verify checkDuplicateMessage was called first
      expect(Database.db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)')
      );
    });
  });

  describe('deleteOldMessages', () => {
    it('should delete messages older than specified days', async () => {
      // Setup
      const daysOld = 90;
      const mockResult = { changes: 5 };
      mockRun.mockReturnValue(mockResult);

      // Import function
      const { deleteOldMessages } = await import('./Message.js');

      // Execute
      const deletedCount = await deleteOldMessages(daysOld);

      // Assert
      expect(Database.db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM messages')
      );
      expect(mockRun).toHaveBeenCalled();
      expect(deletedCount).toBe(5);
    });

    it('should only delete sent messages', async () => {
      // Setup
      const daysOld = 90;
      mockRun.mockReturnValue({ changes: 3 });

      const { deleteOldMessages } = await import('./Message.js');

      // Execute
      await deleteOldMessages(daysOld);

      // Assert - verify SQL includes status = 'sent'
      const prepareCall = vi.mocked(Database.db.prepare).mock.calls.find(
        call => call[0].includes('DELETE FROM messages')
      );
      expect(prepareCall?.[0]).toContain("status = 'sent'");
    });

    it('should use default retention period when not specified', async () => {
      // Setup
      mockRun.mockReturnValue({ changes: 0 });

      const { deleteOldMessages } = await import('./Message.js');

      // Execute
      await deleteOldMessages();

      // Assert
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('countOldMessages', () => {
    it('should return count of old messages', async () => {
      // Setup
      const daysOld = 90;
      mockGet.mockReturnValue({ count: 10 });

      const { countOldMessages } = await import('./Message.js');

      // Execute
      const count = await countOldMessages(daysOld);

      // Assert
      expect(Database.db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)')
      );
      expect(count).toBe(10);
    });

    it('should return 0 when no old messages found', async () => {
      // Setup
      mockGet.mockReturnValue({ count: 0 });

      const { countOldMessages } = await import('./Message.js');

      // Execute
      const count = await countOldMessages(90);

      // Assert
      expect(count).toBe(0);
    });

    it('should use default retention period when not specified', async () => {
      // Setup
      mockGet.mockReturnValue({ count: 5 });

      const { countOldMessages } = await import('./Message.js');

      // Execute
      await countOldMessages();

      // Assert
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('SQL Injection Protection', () => {
    it('should use parameterized queries for createMessage', async () => {
      // Setup
      const input = {
        name: "'; DROP TABLE messages; --",
        email: "test' OR '1'='1",
        message: "'; DELETE FROM messages; --",
      };

      mockRun.mockReturnValue({ lastInsertRowid: 1 });
      mockGet.mockReturnValue({
        id: 'test-id',
        ...input,
        status: 'pending',
        created_at: '2026-01-19T10:00:00Z',
        sent_at: null,
        error_message: null,
      });

      // Execute
      await createMessage(input);

      // Assert - verify that prepare was called with parameterized query (contains ?)
      const prepareCall = vi.mocked(Database.db.prepare).mock.calls[0][0];
      expect(prepareCall).toContain('?');
      
      // Verify that values are passed as parameters, not concatenated
      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        "'; DROP TABLE messages; --",
        "test' OR '1'='1",
        "'; DELETE FROM messages; --",
        expect.any(String),
      );
    });

    it('should use parameterized queries for updateMessageStatus', async () => {
      // Setup
      const input = {
        id: "'; DROP TABLE messages; --",
        status: 'sent' as const,
        error_message: "'; DELETE FROM messages; --",
      };

      mockRun.mockReturnValue({ changes: 1 });
      mockGet.mockReturnValue({
        id: input.id,
        name: 'Test',
        email: 'test@example.com',
        message: 'Test',
        status: 'sent',
        created_at: '2026-01-19T10:00:00Z',
        sent_at: null,
        error_message: input.error_message,
      });

      // Execute
      await updateMessageStatus(input);

      // Assert - verify parameterized query
      const prepareCall = vi.mocked(Database.db.prepare).mock.calls[0][0];
      expect(prepareCall).toContain('?');
    });
  });
});

