import { chain } from './chain';

export async function invokeChain(question: string): Promise<string> {
  try {
    const response: string = await chain.invoke({ question }); 
    return response;
  } catch (err) {
    console.error('Error invoking chain:', err); // More specific error logging
    return "Sorry, something went wrong.";
  }
}
