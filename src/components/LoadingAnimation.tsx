import { Loader2, Zap, Search, FileText } from 'lucide-react'

export function LoadingAnimation() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-3 text-blue-600">
        <div className="relative">
          <Loader2 className="w-6 h-6 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Search className="w-4 h-4 animate-pulse" />
          <span>Searching papers</span>
          <FileText className="w-4 h-4 animate-pulse" />
          <span>Analyzing</span>
          <Zap className="w-4 h-4 animate-pulse" />
          <span>Generating response</span>
        </div>
      </div>
    </div>
  )
}