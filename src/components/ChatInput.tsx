import { useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card } from './ui/card'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
}

const SUGGESTED_QUERIES = [
  "Show the equations of the single particle model",
  "What are the Butler-Volmer kinetics equations for battery electrodes?",
  "Derive the Nernst equation for battery cell voltage",
  "What are the latest advances in solid-state battery technology?",
  "How do lithium-ion battery degradation mechanisms work?"
]

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      onSendMessage(suggestion)
    }
  }

  return (
    <div className="space-y-4">
      {/* Suggested Queries */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.map((query, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs h-8 bg-white hover:bg-gray-50 border-gray-200"
            onClick={() => handleSuggestionClick(query)}
            disabled={isLoading}
          >
            {query}
          </Button>
        ))}
      </div>

      {/* Input Form */}
      <Card className="p-4 bg-white border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything about battery science and technology..."
            className="min-h-[80px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </p>
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}