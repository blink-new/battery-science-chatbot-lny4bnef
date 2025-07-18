import { useState, useEffect, useRef } from 'react'
import { blink } from './blink/client'
import { Message, Reference } from './types/chat'
import { ChatMessage } from './components/ChatMessage'
import { ChatInput } from './components/ChatInput'
import { LoadingAnimation } from './components/LoadingAnimation'
import { Card } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu'
import { Battery, Zap, BookOpen, User, LogOut, ChevronDown } from 'lucide-react'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLogout = () => {
    blink.auth.logout()
  }

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsGenerating(true)

    try {
      // Create assistant message with streaming
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      }

      setMessages(prev => [...prev, assistantMessage])

      // Search for relevant papers from multiple academic sources
      const paperSearchQueries = [
        `battery science research ${content} site:arxiv.org`,
        `battery technology ${content} site:nature.com OR site:science.org`,
        `electrochemistry ${content} site:acs.org OR site:rsc.org`,
        `energy storage ${content} site:springer.com OR site:sciencedirect.com`
      ]
      
      let references: Reference[] = []
      
      // Search multiple sources in parallel
      try {
        const searchPromises = paperSearchQueries.map(query => 
          blink.data.search(query, { type: 'web', limit: 5 })
        )
        
        const searchResults = await Promise.allSettled(searchPromises)
        
        // Process all search results
        searchResults.forEach((result, queryIndex) => {
          if (result.status === 'fulfilled' && result.value?.organic_results) {
            const papers = result.value.organic_results
              .filter(item => 
                item.title && 
                item.link && 
                (item.link.includes('arxiv.org') || 
                 item.link.includes('nature.com') || 
                 item.link.includes('science.org') ||
                 item.link.includes('acs.org') ||
                 item.link.includes('rsc.org') ||
                 item.link.includes('springer.com') ||
                 item.link.includes('sciencedirect.com') ||
                 item.link.includes('doi.org')) &&
                !references.some(ref => ref.title === item.title) // Avoid duplicates
              )
              .slice(0, 2) // Limit per source
              .map((item, index) => {
                // Extract year from title or snippet
                const yearMatch = item.snippet?.match(/\b(20[0-2][0-9])\b/) || 
                                 item.title?.match(/\b(20[0-2][0-9])\b/)
                const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()
                
                // Extract authors from snippet
                const authorPatterns = [
                  /([A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+)/g,
                  /([A-Z][a-z]+ et al\.)/g,
                  /([A-Z][a-z]+, [A-Z]\.[A-Z]\.)/g
                ]
                
                let authors = ['Various Authors']
                for (const pattern of authorPatterns) {
                  const matches = item.snippet?.match(pattern)
                  if (matches && matches.length > 0) {
                    authors = matches.slice(0, 3)
                    break
                  }
                }
                
                // Determine journal from URL
                let journal = 'Academic Journal'
                if (item.link.includes('nature.com')) journal = 'Nature'
                else if (item.link.includes('science.org')) journal = 'Science'
                else if (item.link.includes('acs.org')) journal = 'ACS Publications'
                else if (item.link.includes('rsc.org')) journal = 'Royal Society of Chemistry'
                else if (item.link.includes('springer.com')) journal = 'Springer'
                else if (item.link.includes('sciencedirect.com')) journal = 'ScienceDirect'
                else if (item.link.includes('arxiv.org')) journal = 'arXiv'
                
                // Calculate relevance score based on source and content match
                let relevanceScore = 0.7
                if (item.link.includes('nature.com') || item.link.includes('science.org')) relevanceScore += 0.2
                if (item.title.toLowerCase().includes(content.toLowerCase().split(' ')[0])) relevanceScore += 0.1
                relevanceScore = Math.min(0.99, relevanceScore)
                
                return {
                  id: `${queryIndex}-${index}`,
                  title: item.title,
                  authors,
                  journal,
                  year,
                  url: item.link,
                  relevanceScore,
                  abstract: item.snippet || 'Abstract not available'
                }
              })
            
            references.push(...papers)
          }
        })
        
        // Sort by relevance and limit total results
        references = references
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 6)
          
      } catch (searchError) {
        console.error('Paper search failed:', searchError)
      }

      // Generate AI response with web search enabled
      let streamingContent = ''
      
      await blink.ai.streamText(
        {
          prompt: `You are a battery science research expert with deep knowledge of electrochemistry, materials science, and battery technology. 

User's question: "${content}"

Please answer the user's EXACT question directly and specifically. Do not restructure or reinterpret their question.

Guidelines:
- For mathematical equations, use LaTeX notation with proper delimiters:
  * For inline math: $equation$
  * For display math (centered): $equation$
  * Example inline: The current density is $j = j_0 \\left( \\exp\\left(\\frac{\\alpha_a n F \\eta}{RT}\\right) - \\exp\\left(-\\frac{\\alpha_c n F \\eta}{RT}\\right) \\right)$
  * Example display: $\\text{LiCoO}_2 + \\text{C} \\rightleftharpoons \\text{Li}_x\\text{CoO}_2 + \\text{Li}_y\\text{C}$
- Chemical formulas should use LaTeX subscripts: $\\text{LiCoO}_2$, $\\text{Li}^+$
- Use $...$ for centered display equations
- Use $...$ for inline equations
- For chemical reactions, use \\rightleftharpoons for reversible reactions
- Use \\text{} for text within equations
- If they ask for specific technical details, provide those exact details
- If they ask about a specific model or theory, focus on that specific topic
- Use markdown formatting for clarity
- Include relevant chemical formulas, mathematical expressions, and technical specifications
- Be precise and technical when appropriate
- Use **bold** for key terms and \`code\` for simple formulas

Answer their question directly and comprehensively with the level of technical detail they're requesting.`,
          search: true,
          maxTokens: 1500
        },
        (chunk) => {
          streamingContent += chunk
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: streamingContent }
              : msg
          ))
        }
      )

      // Finalize message with references
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: streamingContent,
              references: references.length > 0 ? references : undefined,
              isStreaming: false 
            }
          : msg
      ))

    } catch (error) {
      console.error('Error generating response:', error)
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id
          ? { 
              ...msg, 
              content: 'I apologize, but I encountered an error while processing your request. Please try again.',
              isStreaming: false 
            }
          : msg
      ))
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Battery className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading Battery Science Chatbot...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4 text-center">
          <Battery className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Battery Science Research Chatbot
          </h1>
          <p className="text-gray-600 mb-6">
            Get expert analysis on the latest battery research with academic references
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Sign In to Continue
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Battery className="w-8 h-8 text-blue-600" />
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Battery Science Research Chatbot
                </h1>
                <p className="text-sm text-gray-600">
                  AI-powered analysis with academic references
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Latest Papers
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  <User className="w-4 h-4" />
                  <span className="max-w-[150px] truncate">{user.email}</span>
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)] flex flex-col bg-white">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Battery className="w-16 h-16 text-blue-600 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Welcome to Battery Science Research
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Ask me anything about battery technology, materials, research trends, 
                      and I'll provide expert analysis with references to the latest papers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    {isGenerating && <LoadingAnimation />}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-6">
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  isLoading={isGenerating} 
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-4 bg-white">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Real-time paper scraping</li>
                <li>• Academic reference formatting</li>
                <li>• Expert scientific analysis</li>
                <li>• Source credibility scoring</li>
                <li>• Research trend insights</li>
              </ul>
            </Card>

            <Card className="p-4 bg-white">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Research Areas
              </h3>
              <div className="flex flex-wrap gap-1">
                {[
                  'Solid-state',
                  'Li-ion',
                  'Cathodes',
                  'Anodes',
                  'Electrolytes',
                  'Degradation',
                  'Safety',
                  'Recycling'
                ].map((topic) => (
                  <Badge key={topic} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App