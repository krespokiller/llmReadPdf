import { useState, useRef } from 'react'

import { Metadata } from '@redwoodjs/web'
import { useMutation, useQuery } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

const UPLOAD_PDF = gql`
  mutation UploadPDFMutation($file: File!) {
    uploadPDF(file: $file) {
      success
      message
      chunksCount
    }
  }
`

const CHAT_QUERY = gql`
  query ChatQuery($question: String!) {
    chat(question: $question) {
      answer
      sources {
        source
        chunkIndex
      }
    }
  }
`

const CLEAR_DOCS = gql`
  mutation ClearDocumentsMutation {
    clearDocuments
  }
`

const ChatPage = () => {
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string; sources?: any[] }>
  >([])
  const [question, setQuestion] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState('')
  const [hasDocuments, setHasDocuments] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadPDF] = useMutation(UPLOAD_PDF, {
    onCompleted: (data) => {
      if (data.uploadPDF.success) {
        toast.success(`${data.uploadPDF.message}`)
        setHasDocuments(true)
        setIsProcessing(false)
        setProcessingStage('')
      } else {
        toast.error(data.uploadPDF.message)
        setIsProcessing(false)
        setProcessingStage('')
      }
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`)
      setIsProcessing(false)
      setProcessingStage('')
    },
  })

  const [clearDocuments] = useMutation(CLEAR_DOCS, {
    onCompleted: () => {
      toast.success('Documents cleared')
      setHasDocuments(false)
      setMessages([])
    },
  })

  const { refetch: askQuestion, loading: isAsking } = useQuery(CHAT_QUERY, {
    skip: true,
    onCompleted: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.chat.answer,
          sources: data.chat.sources,
        },
      ])
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`)
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    setIsProcessing(true)
    setProcessingStage('📄 Extracting text from PDF...')

    try {
      // Small delay to show the first stage
      await new Promise((resolve) => setTimeout(resolve, 500))
      setProcessingStage('✂️ Splitting into chunks...')

      await new Promise((resolve) => setTimeout(resolve, 500))
      setProcessingStage('🧠 Generating embeddings (this may take a while)...')

      await uploadPDF({ variables: { file } })
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    if (!hasDocuments) {
      toast.error('Please upload a PDF first')
      return
    }
    if (isAsking) {
      // Prevent submitting while already asking
      return
    }

    setMessages((prev) => [...prev, { role: 'user', content: question }])
    const currentQuestion = question
    setQuestion('')

    await askQuestion({ question: currentQuestion })
  }

  return (
    <>
      <Metadata title="RAG Chat" description="Chat with your PDF documents" />
      <Toaster />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    RAG Assistant
                  </h1>
                  <p className="text-xs text-gray-500">Powered by Local AI</p>
                </div>
              </div>
              {hasDocuments && !isProcessing && (
                <button
                  onClick={() => clearDocuments()}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  Clear Documents
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Upload Section */}
          <div className="mb-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">📄</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Upload Document
                </h2>
              </div>

              <div className="flex gap-3 items-center">
                <label className="flex-1 cursor-pointer group">
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                      className="hidden"
                    />
                    <div
                      className={`px-6 py-4 bg-gray-50 hover:bg-gray-100 border-2 border-dashed rounded-2xl transition-all duration-200 text-center ${
                        isProcessing
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-700">
                        {isProcessing
                          ? processingStage
                          : hasDocuments
                            ? '✅ Document loaded - Upload another'
                            : '📤 Click to upload PDF'}
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {isProcessing && (
                <div className="mt-4 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        Processing your PDF...
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        This may take a few moments depending on document size
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {hasDocuments && !isProcessing && (
                <div className="mt-4 px-4 py-3 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Ready to answer questions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="mb-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-4">
                    <span className="text-4xl">💬</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Welcome to RAG Assistant
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Upload a PDF document and start asking questions. The AI
                    will find relevant information and provide accurate answers.
                  </p>
                  <div className="mt-6 text-xs text-gray-400 space-y-1">
                    <p>📄 Step 1: Upload your PDF</p>
                    <p>
                      ⏳ Step 2: Wait for processing (text extraction +
                      embeddings)
                    </p>
                    <p>💬 Step 3: Ask questions about your document</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        msg.role === 'user' ? 'order-2' : 'order-1'
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-6 py-4 shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold">
                            {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
                          </span>
                        </div>
                        <div
                          className={`text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user' ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 font-medium mb-1">
                              📚 Sources:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {msg.sources.map((s, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600"
                                >
                                  {s.source} (chunk {s.chunkIndex})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isAsking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="rounded-2xl px-6 py-4 shadow-sm bg-white border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">
                          Pensando...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question Input */}
          <form onSubmit={handleAskQuestion} className="relative">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden">
              <div className="flex gap-3 p-4">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={
                    hasDocuments
                      ? 'Ask a question about your document...'
                      : 'Upload a PDF first...'
                  }
                  disabled={!hasDocuments || isAsking || isProcessing}
                  className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
                <button
                  type="submit"
                  disabled={
                    !hasDocuments ||
                    isAsking ||
                    !question.trim() ||
                    isProcessing
                  }
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isAsking ? '⏳ Thinking...' : '➤ Send'}
                </button>
              </div>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              🔧 Running locally:{' '}
              <span className="font-medium">ai/embeddinggemma:latest</span> &{' '}
              <span className="font-medium">
                ai/deepseek-r1-distill-llama:latest
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChatPage
