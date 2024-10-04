// langchainGraph.ts

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RunnableGraph, GraphNode } from "@langchain/core/runnables";

// Use Vite's environment variables
const openAIApiKey: string = import.meta.env.VITE_OPENAI_API_KEY;
const sbApiKey: string = import.meta.env.VITE_SUPABASE_PRIVATE_KEY;
const sbUrl: string = import.meta.env.VITE_SUPABASE_URL;

// Supabase client setup
const client: SupabaseClient = createClient(sbUrl, sbApiKey);
const embeddings = new OpenAIEmbeddings({ openAIApiKey });
const vectorStore = new SupabaseVectorStore(embeddings, {
  client,
  tableName: 'documents',
  queryName: 'match_documents'
});
const retriever = vectorStore.asRetriever();

// LLM and Prompts
const llm = new ChatOpenAI({ apiKey: openAIApiKey }); // Use LangGraph's OpenAIChat

const standaloneQuestionTemplate =
  "Given a question, convert it to a standalone question. question: {question} standalone question:";
const standaloneQuestionPrompt = new PromptTemplate(standaloneQuestionTemplate);

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question based on the context provided. 
If you don't know the answer, say, "I am sorry, I do not know the answer to that. Please contact at 1234567890." 
context: {context} 
question: {question} 
answer:`;
const answerPrompt = new PromptTemplate(answerTemplate);

// Function to combine documents
async function combineDocuments(docs: { pageContent: string }[]): Promise<string> {
  return docs.map((doc) => doc.pageContent).join('\n\n');
}

// Define the graph
const standaloneQuestionNode: GraphNode = {
  id: 'standaloneQuestion',
  run: async (input: { question: string }) => {
    return await standaloneQuestionPrompt.fill({ question: input.question });
  }
};

const retrieverNode: GraphNode = {
  id: 'retrieverNode',
  run: async (input: { standalone_question: string }) => {
    const docs = await retriever.getDocuments(input.standalone_question);
    console.log('Retrieved Documents:', docs);
    return combineDocuments(docs);
  }
};

const answerNode: GraphNode = {
  id: 'answerNode',
  run: async (input: { context: string; question: string }) => {
    return await answerPrompt.fill({
      context: input.context,
      question: input.question
    });
  }
};

// Create the RunnableGraph
export const chain = new RunnableGraph({
  nodes: [
    standaloneQuestionNode,
    retrieverNode,
    answerNode
  ],
  edges: [
    { from: 'standaloneQuestion', to: 'retrieverNode', inputKey: 'standalone_question' },
    { from: 'retrieverNode', to: 'answerNode', inputKeys: { context: 'context', question: 'question' } }
  ]
});


