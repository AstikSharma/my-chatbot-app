import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";

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
const llm = new ChatOpenAI({ openAIApiKey });

const standaloneQuestionTemplate =
  "Given a question, convert it to a standalone question. question: {question} standalone question:";
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate);

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Scrimba based on the context
 provided. Try to find the answer in the context. If you really do not know the answer, say I am sorry, I do not know the answer to that. 
 And direct the questioner to contact at 1234567890. Dont try to make up an answer. Always speak as if you were chatting to a friend. 
 context:{context} 
 question:{question} 
 answer:`;
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

async function combineDocuments(docs: { pageContent: string }[]): Promise<string> {
  return docs.map((doc) => doc.pageContent).join('\n\n');
}

// Chains
const standaloneQuestionChain = standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser());
const retrieverChain = RunnableSequence.from([
  (prevResult: { standalone_question: string }) => prevResult.standalone_question,
  retriever,
  combineDocuments
]);
const answerChain = answerPrompt
  .pipe(llm)
  .pipe(new StringOutputParser());

export const chain = RunnableSequence.from([
  {
    standalone_question: standaloneQuestionChain,
    original_input: new RunnablePassthrough()
  },
  {
    context: retrieverChain,
    question: ({ original_input }: { original_input: { question: string } }) => original_input.question
  },
  answerChain
]);
