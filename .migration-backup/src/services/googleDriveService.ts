/**
 * Google Drive Service for storing and retrieving popover content
 */
import { getGoogleAccessToken } from '@/utils/googleAuth';
import { createLogger } from '@/utils/logger';

const logger = createLogger('googleDriveService');

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const UPLOAD_API_BASE = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_NAME = "Physique57_Analytics_Popovers";
const FILE_NAME = "popover_content.json";

interface PopoverContent {
  [key: string]: {
    [locationId: string]: string; // HTML or markdown content
  };
}

class GoogleDriveService {
  private folderId: string | null = null;
  private fileId: string | null = null;

  /**
   * Get a fresh access token using the centralized auth
   */
  private async getAccessToken(): Promise<string> {
    return getGoogleAccessToken();
  }

  /**
   * Find or create the folder for storing popover data
   */
  private async ensureFolder(): Promise<string> {
    if (this.folderId) {
      return this.folderId;
    }

    const token = await this.getAccessToken();

    // Search for existing folder
    const searchUrl = `${DRIVE_API_BASE}/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      this.folderId = searchData.files[0].id;
      return this.folderId;
    }

    // Create new folder
    const createResponse = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    const folderData = await createResponse.json();
    this.folderId = folderData.id;
    return this.folderId;
  }

  /**
   * Find the popover content file in the folder
   */
  private async findFile(): Promise<string | null> {
    if (this.fileId) {
      return this.fileId;
    }

    const token = await this.getAccessToken();
    const folderId = await this.ensureFolder();

    const searchUrl = `${DRIVE_API_BASE}/files?q=name='${FILE_NAME}' and '${folderId}' in parents and trashed=false&fields=files(id,name)`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.files && data.files.length > 0) {
      this.fileId = data.files[0].id;
      return this.fileId;
    }

    return null;
  }

  /**
   * Load all popover content from Google Drive
   */
  async loadContent(): Promise<PopoverContent> {
    try {
      const fileId = await this.findFile();
      
      if (!fileId) {
        // No file exists yet, return empty content
        return {};
      }

      const token = await this.getAccessToken();
      const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load content from Drive');
      }

      const content = await response.json();
      return content;
    } catch (error) {
      logger.error('Error loading content from Drive:', error);
      return {};
    }
  }

  /**
   * Save popover content to Google Drive
   */
  async saveContent(content: PopoverContent): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const folderId = await this.ensureFolder();
      const fileId = await this.findFile();

      const metadata = {
        name: FILE_NAME,
        mimeType: 'application/json',
        ...(fileId ? {} : { parents: [folderId] }),
      };

      const body = new FormData();
      body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      body.append('file', new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));

      const url = fileId 
        ? `${UPLOAD_API_BASE}/files/${fileId}?uploadType=multipart`
        : `${UPLOAD_API_BASE}/files?uploadType=multipart`;

      const response = await fetch(url, {
        method: fileId ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body,
      });

      if (!response.ok) {
        throw new Error('Failed to save content to Drive');
      }

      const result = await response.json();
      this.fileId = result.id;
      
      return true;
    } catch (error) {
      logger.error('Error saving content to Drive:', error);
      return false;
    }
  }

  /**
   * Get content for a specific context and location
   */
  async getPopoverContent(context: string, locationId: string): Promise<string | null> {
    const allContent = await this.loadContent();
    return allContent[context]?.[locationId] || null;
  }

  /**
   * Update content for a specific context and location
   */
  async updatePopoverContent(context: string, locationId: string, content: string): Promise<boolean> {
    const allContent = await this.loadContent();
    
    if (!allContent[context]) {
      allContent[context] = {};
    }
    
    allContent[context][locationId] = content;
    
    return await this.saveContent(allContent);
  }

  /**
   * Delete content for a specific context and location
   */
  async deletePopoverContent(context: string, locationId: string): Promise<boolean> {
    const allContent = await this.loadContent();
    
    if (allContent[context]?.[locationId]) {
      delete allContent[context][locationId];
      
      // Clean up empty contexts
      if (Object.keys(allContent[context]).length === 0) {
        delete allContent[context];
      }
      
      return await this.saveContent(allContent);
    }
    
    return true;
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
