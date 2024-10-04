import { chain } from './chain';  // Importing the LangGraph chain

export async function invokeChain(question: string): Promise<string> {
  try {
    const response: string = await chain.run({ question }); 
    return response;
  } catch (err) {
    console.error('Error invoking chain:', err);
    return "Sorry, something went wrong.";
  }
}
