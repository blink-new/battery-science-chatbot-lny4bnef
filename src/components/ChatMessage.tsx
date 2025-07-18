import { Message } from '../types/chat'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ExternalLink, FileText, User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex gap-3 max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-amber-500'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <Card className={`p-4 ${
            isUser 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white border-gray-200'
          }`}>
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
              {isUser ? (
                <p className="mb-0 text-white">
                  {message.content}
                </p>
              ) : (
                <ReactMarkdown 
                  className="text-gray-900"
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    h2: ({children}) => <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-900">{children}</h2>,
                    h3: ({children}) => <h3 className="text-base font-medium mt-3 mb-2 text-gray-900">{children}</h3>,
                    p: ({children}) => <p className="mb-2 text-gray-700">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-2 text-gray-700">{children}</ul>,
                    li: ({children}) => <li className="mb-1">{children}</li>,
                    strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({children}) => <em className="italic text-gray-800">{children}</em>,
                    code: ({children, className}) => {
                      const isInline = !className?.includes('language-')
                      return isInline ? (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
                      ) : (
                        <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto my-2">
                          <code className="text-sm font-mono text-gray-800">{children}</code>
                        </pre>
                      )
                    },
                    blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-2">{children}</blockquote>
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
              )}
            </div>
          </Card>

          {/* References */}
          {message.references && message.references.length > 0 && (
            <div className="mt-3 space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                References ({message.references.length})
              </h4>
              <div className="grid gap-2">
                {message.references.map((ref) => (
                  <Card key={ref.id} className="p-3 bg-gray-50 border-gray-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                          {ref.title}
                        </h5>
                        <p className="text-xs text-gray-600 mb-2">
                          {ref.authors.join(', ')} • {ref.journal} ({ref.year})
                        </p>
                        {ref.abstract && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {ref.abstract}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(ref.relevanceScore * 100)}%
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => window.open(ref.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  )
}