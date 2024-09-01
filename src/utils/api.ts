import { chain } from './chain';

export async function invokeChain(question: string): Promise<string> {
  try {
    const response: string = await chain.invoke({ question }); 
    return response;
  } catch (err) {
    console.error(err);
    return "Sorry, something went wrong.";
  }
}
