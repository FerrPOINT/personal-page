import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as BotSettings from '../models/BotSettings.js';

// Mock dependencies BEFORE importing telegram module
vi.mock('../models/BotSettings.js');
vi.mock('../utils/logger.js', () => ({
  telegramLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock dotenv
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

// Mock node-telegram-bot-api
const mockBotInstance = {
  sendMessage: vi.fn(),
  getMe: vi.fn(),
  getChat: vi.fn(),
  on: vi.fn(),
};

const TelegramBotMock = vi.fn(() => mockBotInstance);

vi.mock('node-telegram-bot-api', () => ({
  default: TelegramBotMock,
}));

describe('Telegram Service - Format and Escape Functions', () => {
  // Test formatMessage and escapeMarkdown indirectly through sendTelegramMessage
  // when bot is properly configured
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(BotSettings, 'getTelegramChatId').mockReturnValue('123456789');
    vi.spyOn(BotSettings, 'getTelegramUsername').mockReturnValue(null);
    
    // Reset env
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_USER_ID;
    delete process.env.TELEGRAM_USERNAME;
  });

  describe('escapeMarkdown function', () => {
    it('should escape all Markdown special characters', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      mockBotInstance.sendMessage.mockResolvedValue({ message_id: 1 });

      // Import module (will initialize bot)
      const { sendTelegramMessage } = await import('./telegram.js');

      const messageData = {
        name: 'Test_User*',
        email: 'test@example.com',
        message: 'Message with [brackets] and (parentheses) and `code` and #hashtag',
        createdAt: new Date('2026-01-19T10:00:00Z'),
      };

      // Execute
      await sendTelegramMessage(messageData);

      // Assert - check that Markdown characters are escaped
      const callArgs = mockBotInstance.sendMessage.mock.calls[0];
      const messageText = callArgs[1];
      
      expect(messageText).toContain('Test\\_User\\*');
      expect(messageText).toContain('\\[brackets\\]');
      expect(messageText).toContain('\\(parentheses\\)');
      expect(messageText).toContain('\\`code\\`');
      expect(messageText).toContain('\\#hashtag');
    });

    it('should escape asterisks and underscores', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      mockBotInstance.sendMessage.mockResolvedValue({ message_id: 1 });

      const { sendTelegramMessage } = await import('./telegram.js');

      const messageData = {
        name: '*Bold* and _italic_',
        email: 'test@example.com',
        message: 'Normal text',
        createdAt: new Date(),
      };

      // Execute
      await sendTelegramMessage(messageData);

      // Assert
      const callArgs = mockBotInstance.sendMessage.mock.calls[0];
      const messageText = callArgs[1];
      
      expect(messageText).toContain('\\*Bold\\*');
      expect(messageText).toContain('\\_italic\\_');
    });
  });

  describe('formatMessage function', () => {
    it('should format message with correct structure', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      mockBotInstance.sendMessage.mockResolvedValue({ message_id: 1 });

      const { sendTelegramMessage } = await import('./telegram.js');

      const messageData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        createdAt: new Date('2026-01-19T10:00:00Z'),
      };

      // Execute
      await sendTelegramMessage(messageData);

      // Assert - check message structure
      const callArgs = mockBotInstance.sendMessage.mock.calls[0];
      const messageText = callArgs[1];
      
      expect(messageText).toContain('📧 *Новое сообщение из формы контактов*');
      expect(messageText).toContain('👤 *Имя:*');
      expect(messageText).toContain('📮 *Email:*');
      expect(messageText).toContain('📅 *Дата:*');
      expect(messageText).toContain('💬 *Сообщение:*');
      expect(messageText).toContain('Test User');
      expect(messageText).toContain('test@example.com');
      expect(messageText).toContain('Test message');
    });

    it('should handle Date objects correctly', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      mockBotInstance.sendMessage.mockResolvedValue({ message_id: 1 });

      const { sendTelegramMessage } = await import('./telegram.js');

      const dateObj = new Date('2026-01-19T10:00:00Z');
      const messageData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        createdAt: dateObj,
      };

      // Execute
      await sendTelegramMessage(messageData);

      // Assert - check date formatting (Russian locale)
      const callArgs = mockBotInstance.sendMessage.mock.calls[0];
      const messageText = callArgs[1];
      
      expect(messageText).toContain('2026');
      expect(messageText).toContain('января'); // Russian month name
    });
  });

  describe('sendTelegramMessage', () => {
    it('should send message successfully when bot and chat ID are configured', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      mockBotInstance.sendMessage.mockResolvedValue({ message_id: 1 });

      const { sendTelegramMessage } = await import('./telegram.js');

      const messageData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        createdAt: new Date('2026-01-19T10:00:00Z'),
      };

      // Execute
      const result = await sendTelegramMessage(messageData);

      // Assert
      expect(result).toBe(true);
      expect(mockBotInstance.sendMessage).toHaveBeenCalledWith(
        '123456789',
        expect.stringContaining('Test User'),
        expect.objectContaining({
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        })
      );
    });

    it('should throw error when bot is not initialized', async () => {
      // Setup - no token
      process.env.TELEGRAM_BOT_TOKEN = undefined;

      // Import fresh module
      const { sendTelegramMessage } = await import('./telegram.js');

      const messageData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        createdAt: new Date(),
      };

      // Execute & Assert
      await expect(sendTelegramMessage(messageData)).rejects.toThrow(
        'Telegram bot is not initialized'
      );
    });

    it('should throw error when chat ID is not set', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      vi.spyOn(BotSettings, 'getTelegramChatId').mockReturnValue(null);

      // Import fresh module
      const { sendTelegramMessage } = await import('./telegram.js');

      const messageData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        createdAt: new Date(),
      };

      // Execute & Assert
      await expect(sendTelegramMessage(messageData)).rejects.toThrow(
        'User ID is not set'
      );
    });

    it('should handle Telegram API errors', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      const apiError = new Error('Telegram API error');
      mockBotInstance.sendMessage.mockRejectedValue(apiError);

      const { sendTelegramMessage } = await import('./telegram.js');

      const messageData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        createdAt: new Date(),
      };

      // Execute & Assert
      await expect(sendTelegramMessage(messageData)).rejects.toThrow('Telegram API error');
    });
  });

  describe('testTelegramConnection', () => {
    it('should return true when bot is connected', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      mockBotInstance.getMe.mockResolvedValue({ id: 123, username: 'test_bot' });

      const { testTelegramConnection } = await import('./telegram.js');

      // Execute
      const result = await testTelegramConnection();

      // Assert
      expect(result).toBe(true);
      expect(mockBotInstance.getMe).toHaveBeenCalled();
    });

    it('should return false when bot is not initialized', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = undefined;

      const { testTelegramConnection } = await import('./telegram.js');

      // Execute
      const result = await testTelegramConnection();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when connection fails', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      mockBotInstance.getMe.mockRejectedValue(new Error('Connection failed'));

      const { testTelegramConnection } = await import('./telegram.js');

      // Execute
      const result = await testTelegramConnection();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getTelegramUsernameByUserId', () => {
    it('should return saved username from settings', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      vi.spyOn(BotSettings, 'getTelegramUsername').mockReturnValue('saved_username');

      const { getTelegramUsernameByUserId } = await import('./telegram.js');

      // Execute
      const result = await getTelegramUsernameByUserId('123456789');

      // Assert
      expect(result).toBe('saved_username');
    });

    it('should return username from environment variable', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_USERNAME = 'env_username';
      vi.spyOn(BotSettings, 'getTelegramUsername').mockReturnValue(null);

      const { getTelegramUsernameByUserId } = await import('./telegram.js');

      // Execute
      const result = await getTelegramUsernameByUserId('123456789');

      // Assert
      expect(result).toBe('env_username');
    });

    it('should return default username when nothing is configured', async () => {
      // Setup
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_USERNAME = undefined;
      vi.spyOn(BotSettings, 'getTelegramUsername').mockReturnValue(null);
      mockBotInstance.getChat.mockRejectedValue(new Error('Not found'));

      const { getTelegramUsernameByUserId } = await import('./telegram.js');

      // Execute
      const result = await getTelegramUsernameByUserId('123456789');

      // Assert
      expect(result).toBe('azhukov7');
    });
  });
});
