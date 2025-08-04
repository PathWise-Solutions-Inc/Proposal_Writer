import { api } from '../utils/api';

export interface RFPUploadData {
  title?: string;
  clientName: string;
  dueDate?: string;
  description?: string;
}

export interface RFPStatus {
  rfpId: string;
  title: string;
  status: 'uploaded' | 'processing' | 'analyzed' | 'error';
  uploadedAt: string;
  analysisResults?: any;
  extractedText?: boolean;
}

export interface UploadResponse {
  message: string;
  data: {
    rfpId: string;
    originalFileName: string;
    fileSize: number;
    fileHash: string;
    status: string;
    message: string;
  };
}

export interface AnalysisResult {
  rfpId: string;
  title: string;
  clientName: string;
  status: string;
  progress: number;
  analysisResults?: {
    evaluationCriteria: Array<{
      criterion: string;
      weight: number;
      description: string;
      maxPoints: number;
      scoringCriteria: string[];
    }>;
    requirements: Array<{
      id: string;
      text: string;
      category: string;
      mandatory: boolean;
    }>;
    summary: string;
    keywords: string[];
    totalPoints: number;
    confidenceScore: number;
  };
  error?: string;
}

export interface EvaluationRubric {
  rfpId: string;
  title: string;
  evaluationCriteria: Array<{
    criterion: string;
    weight: number;
    description: string;
    maxPoints: number;
    scoringCriteria: string[];
  }>;
  totalPoints: number;
  confidenceScore: number;
  generatedAt: string;
}

class RFPService {
  private baseURL = '/api/rfp';

  async uploadRFP(file: File, data: RFPUploadData): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('rfpDocument', file);
    
    // Append other fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async getRFPStatus(rfpId: string): Promise<RFPStatus> {
    const response = await api.get(`${this.baseURL}/${rfpId}/status`);
    return response.data;
  }

  async triggerAnalysis(rfpId: string, priority: number = 1): Promise<void> {
    await api.post(`${this.baseURL}/${rfpId}/analyze`, { priority });
  }

  async getAnalysisResults(rfpId: string): Promise<AnalysisResult> {
    const response = await api.get(`${this.baseURL}/${rfpId}/analysis`);
    return response.data;
  }

  async getEvaluationRubric(rfpId: string): Promise<EvaluationRubric> {
    const response = await api.get(`${this.baseURL}/${rfpId}/rubric`);
    return response.data;
  }

  async getQueueStats(): Promise<any> {
    const response = await api.get(`${this.baseURL}/queue/stats`);
    return response.data;
  }
}

export const rfpService = new RFPService();