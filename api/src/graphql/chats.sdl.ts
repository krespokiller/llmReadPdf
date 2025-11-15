export const schema = gql`
  type ChatResponse {
    answer: String!
    sources: [Source!]!
  }

  type Source {
    source: String!
    chunkIndex: Int!
  }

  type UploadResponse {
    success: Boolean!
    message: String!
    chunksCount: Int!
  }

  type Query {
    chat(question: String!): ChatResponse! @skipAuth
  }

  type Mutation {
    uploadPDF(file: File!): UploadResponse! @skipAuth
    clearDocuments: Boolean! @skipAuth
  }

  scalar File
`
