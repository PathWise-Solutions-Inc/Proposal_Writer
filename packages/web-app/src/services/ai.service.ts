import axios from 'axios';
import { SectionType } from '../types/section.types';

// AI Service Types
export interface AIGenerationRequest {
  prompt: string;
  context?: string;
  sectionType?: SectionType;
  tone?: 'formal' | 'conversational' | 'technical' | 'persuasive';
  length?: 'short' | 'medium' | 'long';
  model?: string;
}

export interface AIGenerationResponse {
  content: string;
  confidence: number;
  suggestions?: string[];
  metadata?: {
    model: string;
    tokensUsed: number;
    processingTime: number;
  };
}

export interface AIImprovementRequest {
  content: string;
  sectionType?: SectionType;
  improvements?: ('clarity' | 'grammar' | 'tone' | 'structure' | 'persuasiveness')[];
  tone?: 'formal' | 'conversational' | 'technical' | 'persuasive';
}

export interface AIContentVariation {
  content: string;
  confidence: number;
  type: 'alternative' | 'shorter' | 'longer' | 'different_tone';
  description: string;
}

// Context-aware prompts based on section type
const SECTION_PROMPTS: Record<SectionType, {
  generate: string;
  improve: string;
  context: string;
}> = {
  [SectionType.HEADING]: {
    generate: "Create a compelling and clear heading that captures the main idea of this section. The heading should be professional, engaging, and appropriate for a business proposal.",
    improve: "Improve this heading to be more compelling, clear, and professional. Make it engaging while maintaining accuracy.",
    context: "This is a heading section in a business proposal that needs to grab attention and clearly communicate the section's purpose."
  },
  [SectionType.PARAGRAPH]: {
    generate: "Write a well-structured paragraph with clear, professional language appropriate for a business proposal. Include specific details and maintain a persuasive yet factual tone.",
    improve: "Improve this paragraph by enhancing clarity, flow, and persuasiveness. Fix any grammar issues and ensure professional language throughout.",
    context: "This is a paragraph section in a business proposal that needs to convey information clearly and persuasively to decision-makers."
  },
  [SectionType.LIST]: {
    generate: "Create a clear, well-organized list with specific, actionable items. Each item should be concise yet informative, appropriate for a business proposal.",
    improve: "Improve this list by making items more specific, actionable, and professionally worded. Ensure parallel structure and logical ordering.",
    context: "This is a list section in a business proposal that needs to present information in an organized, scannable format."
  },
  [SectionType.TABLE]: {
    generate: "Create structured data that would be appropriate for a table format. Focus on clear categories and specific, comparable information.",
    improve: "Improve this table content by ensuring clarity, consistency, and professional presentation of data.",
    context: "This is a table section in a business proposal that needs to present data or comparisons in a structured format."
  },
  [SectionType.IMAGE]: {
    generate: "Create a descriptive caption or explanation for an image that supports the proposal's key messages and provides clear context.",
    improve: "Improve this image description or caption to be more descriptive, relevant, and supportive of the proposal's objectives.",
    context: "This is an image section in a business proposal that needs clear, relevant visual communication."
  },
  [SectionType.CUSTOM]: {
    generate: "Create custom content that fits the specific requirements of this section while maintaining professional standards and proposal best practices.",
    improve: "Improve this custom content to better serve its specific purpose while maintaining professional quality and proposal standards.",
    context: "This is a custom section in a business proposal with specific formatting or content requirements."
  },
  [SectionType.GROUP]: {
    generate: "Create an introductory overview or summary for this section group that explains what the following subsections will cover.",
    improve: "Improve this section group introduction to better orient readers and create smooth transitions to the subsections.",
    context: "This is a section group in a business proposal that organizes related content under a common theme."
  }
};

// Tone-specific modifiers
const TONE_MODIFIERS = {
  formal: "Use formal business language, professional terminology, and structured presentation.",
  conversational: "Use approachable, clear language that's professional but not overly formal. Make it engaging and easy to understand.",
  technical: "Use precise technical language, industry-specific terminology, and detailed explanations appropriate for technical audiences.",
  persuasive: "Use compelling language that emphasizes benefits, builds confidence, and motivates action while remaining factual and credible."
};

class AIService {
  private baseURL: string;
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.defaultModel = 'anthropic/claude-3.5-sonnet';
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found. AI features will not work.');
    }
  }

  private buildPrompt(
    basePrompt: string, 
    context: string, 
    options: {
      tone?: string;
      length?: string;
      additionalContext?: string;
    } = {}
  ): string {
    let prompt = `${context}\n\n${basePrompt}`;
    
    if (options.tone) {
      prompt += `\n\nTone: ${TONE_MODIFIERS[options.tone as keyof typeof TONE_MODIFIERS]}`;
    }
    
    if (options.length) {
      const lengthGuide = {
        short: "Keep it concise - aim for 1-2 sentences or 3-5 bullet points.",
        medium: "Provide moderate detail - aim for 1-2 paragraphs or 5-8 bullet points.",
        long: "Provide comprehensive detail - aim for 2-4 paragraphs or 8+ bullet points."
      };
      prompt += `\n\nLength: ${lengthGuide[options.length as keyof typeof lengthGuide]}`;
    }
    
    if (options.additionalContext) {
      prompt += `\n\nAdditional Context: ${options.additionalContext}`;
    }
    
    prompt += "\n\nProvide only the requested content without any meta-commentary or explanations.";
    
    return prompt;
  }

  async generateContent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      const sectionPrompts = request.sectionType ? SECTION_PROMPTS[request.sectionType] : null;
      const basePrompt = request.prompt;
      const context = sectionPrompts?.context || "Create professional content for a business proposal.";
      
      const fullPrompt = this.buildPrompt(basePrompt, context, {
        tone: request.tone,
        length: request.length,
        additionalContext: request.context
      });

      const startTime = Date.now();
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: request.model || this.defaultModel,
          messages: [
            {
              role: "system",
              content: "You are an expert business proposal writer. Create high-quality, professional content that helps win proposals."
            },
            {
              role: "user",
              content: fullPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Proposal Writer'
          }
        }
      );

      const processingTime = Date.now() - startTime;
      const content = response.data.choices[0]?.message?.content || '';
      
      // Generate alternative suggestions by making additional calls with slight variations
      const suggestions = await this.generateAlternatives(fullPrompt, 2);

      return {
        content: content.trim(),
        confidence: this.calculateConfidence(content),
        suggestions,
        metadata: {
          model: request.model || this.defaultModel,
          tokensUsed: response.data.usage?.total_tokens || 0,
          processingTime
        }
      };
    } catch (error) {
      console.error('AI content generation failed:', error);
      throw new Error('Failed to generate AI content. Please try again.');
    }
  }

  async improveContent(request: AIImprovementRequest): Promise<AIGenerationResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const sectionPrompts = request.sectionType ? SECTION_PROMPTS[request.sectionType] : null;
    const improvementAreas = request.improvements?.join(', ') || 'overall quality';
    
    const prompt = `${sectionPrompts?.improve || "Improve this content to be more professional and effective"}\n\nFocus on improving: ${improvementAreas}\n\nOriginal content:\n"${request.content}"\n\nImproved content:`;
    
    const context = sectionPrompts?.context || "Improve this content for a business proposal.";
    
    return this.generateContent({
      prompt,
      context,
      sectionType: request.sectionType,
      tone: request.tone
    });
  }

  async rephraseContent(content: string, sectionType?: SectionType, tone?: string): Promise<AIGenerationResponse> {
    const sectionPrompts = sectionType ? SECTION_PROMPTS[sectionType] : null;
    const prompt = `Rephrase this content while maintaining the same meaning and key information. Make it fresh and engaging while keeping it professional.\n\nOriginal content:\n"${content}"\n\nRephrased content:`;
    
    const context = sectionPrompts?.context || "Rephrase this content for a business proposal.";
    
    return this.generateContent({
      prompt,
      context,
      sectionType,
      tone: tone as any
    });
  }

  async generateVariations(content: string, sectionType?: SectionType): Promise<AIContentVariation[]> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const variations: AIContentVariation[] = [];
    const basePrompt = `Create a variation of this content:\n"${content}"\n\nVariation:`;
    
    const variationTypes = [
      { type: 'shorter' as const, modifier: 'Make it more concise while keeping key information.' },
      { type: 'longer' as const, modifier: 'Expand with more detail and supporting information.' },
      { type: 'different_tone' as const, modifier: 'Change the tone to be more engaging while staying professional.' }
    ];

    for (const variationType of variationTypes) {
      try {
        const result = await this.generateContent({
          prompt: `${variationType.modifier}\n\n${basePrompt}`,
          sectionType,
          length: variationType.type === 'shorter' ? 'short' : variationType.type === 'longer' ? 'long' : 'medium'
        });

        variations.push({
          content: result.content,
          confidence: result.confidence,
          type: variationType.type,
          description: variationType.modifier
        });
      } catch (error) {
        console.error(`Failed to generate ${variationType.type} variation:`, error);
      }
    }

    return variations;
  }

  private async generateAlternatives(prompt: string, count: number): Promise<string[]> {
    const alternatives: string[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const response = await axios.post(
          `${this.baseURL}/chat/completions`,
          {
            model: this.defaultModel,
            messages: [
              {
                role: "system",
                content: "You are an expert business proposal writer. Provide alternative versions of the requested content."
              },
              {
                role: "user",
                content: `${prompt}\n\nProvide an alternative version:`
              }
            ],
            temperature: 0.8 + (i * 0.1), // Increase creativity for each alternative
            max_tokens: 1000
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': window.location.origin,
              'X-Title': 'Proposal Writer'
            }
          }
        );

        const content = response.data.choices[0]?.message?.content?.trim();
        if (content) {
          alternatives.push(content);
        }
      } catch (error) {
        console.error(`Failed to generate alternative ${i + 1}:`, error);
      }
    }

    return alternatives;
  }

  private calculateConfidence(content: string): number {
    // Simple confidence calculation based on content characteristics
    let confidence = 0.5;
    
    // Length factor
    if (content.length > 50) confidence += 0.1;
    if (content.length > 200) confidence += 0.1;
    
    // Structure factor
    if (content.includes('.') || content.includes(':')) confidence += 0.1;
    
    // Professional language indicators
    const professionalWords = ['solution', 'approach', 'deliver', 'ensure', 'optimize', 'enhance'];
    const professionalCount = professionalWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    confidence += Math.min(professionalCount * 0.05, 0.2);
    
    return Math.min(confidence, 1.0);
  }

  // Section-specific generation helpers
  async generateSectionContent(sectionType: SectionType, context: string, options: Partial<AIGenerationRequest> = {}): Promise<AIGenerationResponse> {
    const sectionPrompts = SECTION_PROMPTS[sectionType];
    
    return this.generateContent({
      prompt: sectionPrompts.generate,
      context: `${sectionPrompts.context}\n\nSpecific context: ${context}`,
      sectionType,
      ...options
    });
  }

  // Batch processing for multiple sections
  async processBatch(requests: AIGenerationRequest[]): Promise<AIGenerationResponse[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.generateContent(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Batch request ${index} failed:`, result.reason);
        return {
          content: '',
          confidence: 0,
          suggestions: [],
          metadata: {
            model: this.defaultModel,
            tokensUsed: 0,
            processingTime: 0
          }
        };
      }
    });
  }
}

export const aiService = new AIService();