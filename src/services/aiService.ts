import { Mistral } from '@mistralai/mistralai'
import { memoryService } from './memoryService'

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
})

export class AIService {
  async chatWithMemories(
    userId: string,
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<{
    response: string;
    references: Array<{ id: string; title: string; score: number }>;
  }> {
    try {
      // Perform semantic search on user's memories
      const { memories, context } = await memoryService.semanticSearch(userId, message, 8)
      
      // Build system prompt with context
      const systemPrompt = `You are a helpful AI assistant that helps users interact with their personal knowledge base. 

Context from user's memories:
${context}

Instructions:
- Use the provided context to answer the user's question
- Be specific and reference relevant information from their memories
- If the context doesn't contain enough information, say so clearly
- Keep responses concise but comprehensive
- When referencing memories, be specific about which information you're using`

      // Build conversation for Mistral
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ]

      // Get response from Mistral
      const completion = await mistral.chat.complete({
        model: 'mistral-large-latest',
        messages: messages as any,
        temperature: 0.7,
        maxTokens: 1000,
      })

      const response = Array.isArray(completion.choices[0]?.message?.content)
        ? completion.choices[0]?.message?.content.join(' ') // Convert array to string
        : completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.'

      // Format references
      const references = memories
        .filter(m => m.score > 0.7) // Only include highly relevant memories
        .slice(0, 5)
        .map(m => ({
          id: m.id,
          title: m.title,
          score: m.score,
        }))

      return { response, references }
    } catch (error) {
      console.error('AI chat error:', error)
      return {
        response: 'I apologize, but I encountered an error while processing your request. Please try again.',
        references: []
      }
    }
  }

  async summarizeMemories(userId: string, query?: string): Promise<string> {
    try {
      const { context } = query 
        ? await memoryService.semanticSearch(userId, query, 10)
        : { context: await this.getAllMemoriesContext(userId) }

      const prompt = `Please provide a comprehensive summary of the following personal knowledge base entries${query ? ` related to "${query}"` : ''}:

${context}

Create a well-organized summary that:
- Groups related information together
- Highlights key insights and patterns
- Identifies important themes
- Is easy to scan and reference`

      const completion = await mistral.chat.complete({
        model: 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        maxTokens: 1500,
      })

      const content = Array.isArray(completion.choices[0]?.message?.content)
        ? completion.choices[0]?.message?.content.join(' ') // Convert array to string
        : completion.choices[0]?.message?.content;

      return content || 'Unable to generate summary.';
    } catch (error) {
      console.error('Summarization error:', error)
      return 'Error generating summary. Please try again.'
    }
  }

  private async getAllMemoriesContext(userId: string): Promise<string> {
    const { memories } = await memoryService.getMemories(userId, { limit: 50 })
    return memories
      .map(m => `Title: ${m.title}\nContent: ${m.content}\nTags: ${m.tags.join(', ')}\n`)
      .join('\n---\n')
  }
}

export const aiService = new AIService()