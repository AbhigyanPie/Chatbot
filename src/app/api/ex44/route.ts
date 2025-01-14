import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import {
    Message as VercelChatMessage,
    StreamingTextResponse,
    createStreamDataTransformer
} from 'ai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { HttpResponseOutputParser } from 'langchain/output_parsers';

import { JSONLoader } from "langchain/document_loaders/fs/json";
import { RunnableSequence,RunnablePassthrough } from '@langchain/core/runnables'
// import { formatDocumentsAsString } from 'langchain/util/document';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import {Document} from 'langchain/document';
import { flatten } from 'lodash';
import { Readable } from 'node:stream';
import { TextLoader } from "langchain/document_loaders/fs/text"; // Import TextLoader


// const loader = new JSONLoader(
//     "src/data/states.json",
//     ["/state", "/code", "/nickname", "/website", "/admission_date", "/admission_number", "/capital_city", "/capital_url", "/population", "/population_rank", "/constitution_url", "/twitter_url"],
// );
// const loader = new TextLoader("src/data/data1.txt");
const loader = new TextLoader("src/data/data123.txt");

export const dynamic = 'force-dynamic'

/**
 * Basic memory formatter that stringifies and passes
 * message history directly into the model.
 */
const formatMessage = (message: VercelChatMessage) => {
    return `${message.role}: ${message.content}`;
};

const formatDocumentsAsString = (docs: Document[]): string => {
    return docs.map(doc => doc.pageContent).join('\n');
};



const TEMPLATE = `Answer the user's questions based only on the following context. If the answer is not in the context, reply politely that you do not have that information available. The chatbot is designed to assist users by providing accurate instructions and guidance on performing specific tasks or using features within various Customer Data Platforms (CDPs).It should be not more than 60 words. It is equipped to answer user questions like "How do I set up a new source in Segment?" or "How can I create a user profile in mParticle?" by retrieving relevant information from provided documentation. The chatbot should efficiently navigate through this documentation to identify relevant sections and extract necessary steps or instructions. Furthermore, it should handle questions of varying lengths without breaking them down and politely inform users when a question is irrelevant to CDPs or if the information is not available in the provided context.

==============================
Context: {context}
==============================
Current conversation: {chat_history}

user: {question}
assistant:`;


export async function POST(req: Request) {
    try {
        // Initialize the web scrapers (This section remains unchanged)
        // const loaders = [
        //     new CheerioWebBaseLoader('https://segment.com/docs/?ref=nav'),
        //     new CheerioWebBaseLoader('https://docs.mparticle.com/'),
        //     new CheerioWebBaseLoader('https://docs.lytics.com/'),
        //     new CheerioWebBaseLoader('https://docs.zeotap.com/home/en-us/'),
        // ];

        // const webDocsPromise = Promise.all(loaders.map(loader => loader.load())).catch(error => {
        //     console.error("Error loading web documents:", error);
        //     return []; //Return empty array if web scraping fails
        // });

        // const jsonDocsPromise = loader.load().catch(error => {
        //     console.error("Error loading JSON data:", error);
        //     return []; //Return empty array if JSON loading fails
        // });

        // const [webDocs, jsonDoc] = await Promise.all([webDocsPromise, jsonDocsPromise]);
        // const [webDocs] = await Promise.all([webDocsPromise]);

        // const textDocs = await loader.load();
        // // const allDocs = flatten([...webDocs, ...jsonDoc]);
        // // const allDocs = flatten([...webDocs]);
        // const allDocs = flatten([...textDocs]);

        // const textSplitter = new CharacterTextSplitter({chunkSize: 250, chunkOverlap: 0}); // Adjust chunk size as needed

        // const docs = await textSplitter.splitDocuments(allDocs);
        // const context1 = formatDocumentsAsString(docs);


        const textDocs = await loader.load();
        const allDocs = flatten([...textDocs]);

        const textSplitter = new CharacterTextSplitter({ chunkSize: 250, chunkOverlap: 0 });
        const docs = await textSplitter.splitDocuments(allDocs);

        // *** LOGGING ADDED HERE ***
        console.log(`Number of chunks created: ${docs.length}`);
        console.log(`Chunk sizes (first 5):`, docs.slice(0, 5).map(doc => doc.pageContent.length));
        console.log(`Total characters in all chunks:`, docs.reduce((sum, doc) => sum + doc.pageContent.length, 0));
        //Estimate of tokens (rough estimate, 1 character ~ 0.75 tokens)
        const estimatedTokens = docs.reduce((sum, doc) => sum + doc.pageContent.length * 0.75, 0);
        console.log(`Estimated total tokens in chunks: ${estimatedTokens}`);

        const context1 = formatDocumentsAsString(docs);


        // Extract the `messages` from the body of the request
        const { messages } = await req.json();

        const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);

        const currentMessageContent = messages[messages.length - 1].content;

        // const jsonDocs = await loader.load();

        // load a JSON object
        // const textSplitter = new CharacterTextSplitter();
        // const docs = await textSplitter.createDocuments([JSON.stringify({
        //     "state": "Kansas",
        //     "slug": "kansas",
        //     "code": "KS",
        //     "nickname": "Sunflower State",
        //     "website": "https://www.kansas.gov",
        //     "admission_date": "1861-01-29",
        //     "admission_number": 34,
        //     "capital_city": "Topeka",
        //     "capital_url": "http://www.topeka.org",
        //     "population": 2893957,
        //     "population_rank": 34,
        //     "constitution_url": "https://kslib.info/405/Kansas-Constitution",
        //     "twitter_url": "http://www.twitter.com/ksgovernment",
        // })]);

        const prompt = PromptTemplate.fromTemplate(TEMPLATE);

        const model = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
            // model: 'gpt-3.5-turbo',
            // model:'chatgpt-4o-latest',
            model:'gpt-4o-mini',
            // model: 'text-embedding-3-large',
            temperature: 0,
            streaming: true,
            verbose: true,
        });

        /**
       * Chat models stream message chunks rather than bytes, so this
       * output parser handles serialization and encoding.
       */
        const parser = new HttpResponseOutputParser();

        type ChainInput = {
            question: string;
            chat_history: string;
            context: string;
        };
            // context: async () => formatDocumentsAsString(docs),
        const chain = RunnableSequence.from([
            {
                question: (input: ChainInput) => input.question,
                chat_history: (input: ChainInput) => input.chat_history,
                context: (input: ChainInput) => input.context,
            },
            prompt,
            model,
            parser,
        ]);

        // Convert the response into a friendly text-stream
        const stream = await chain.stream({
            chat_history: formattedPreviousMessages.join('\n'),
            question: currentMessageContent,
            // context:formatDocumentsAsString(docs),
            context:context1,
        });
 
        // Create a readable stream from the chain's output
        // const readableStream = new ReadableStream({
        //     async start(controller) {
        //         for await (const chunk of stream) {
        //             controller.enqueue(chunk);
        //         }
        //     controller.close();
        //     },
        // });

        // return new Response(readableStream, {
        //     status: 200,
        //     headers: {  
        //       'Content-Type': 'text/plain',
        //     },
        // });

        console.log('stream',stream);
        // console.log('readableStream',readableStream);

        // Respond with the stream
        return new StreamingTextResponse(
            stream.pipeThrough(createStreamDataTransformer()),
        );
    } catch (e: any) {
        return Response.json({ error: e.message }, { status: e.status ?? 500 });
    }
}


// import {
//     Message as VercelChatMessage,
//     StreamingTextResponse,
//     createStreamDataTransformer
// } from 'ai';
// import { ChatOpenAI } from '@langchain/openai';
// import { PromptTemplate } from '@langchain/core/prompts';
// import { HttpResponseOutputParser } from 'langchain/output_parsers';

// import { JSONLoader } from "langchain/document_loaders/fs/json";
// import { RunnableSequence } from '@langchain/core/runnables'
// import { formatDocumentsAsString } from 'langchain/util/document';
// import { CharacterTextSplitter } from 'langchain/text_splitter';

// const loader = new JSONLoader(
//     "src/data/states.json",
//     ["/state", "/code", "/nickname", "/website", "/admission_date", "/admission_number", "/capital_city", "/capital_url", "/population", "/population_rank", "/constitution_url", "/twitter_url"],
// );

// export const dynamic = 'force-dynamic'

// /**
//  * Basic memory formatter that stringifies and passes
//  * message history directly into the model.
//  */
// const formatMessage = (message: VercelChatMessage) => {
//     return `${message.role}: ${message.content}`;
// };

// const TEMPLATE = `Answer the user's questions based only on the following context. If the answer is not in the context, reply politely that you do not have that information available.:
// ==============================
// Context: {context}
// ==============================
// Current conversation: {chat_history}

// user: {question}
// assistant:`;


// export async function POST(req: Request) {
//     try {
//         // Extract the `messages` from the body of the request
//         const { messages } = await req.json();

//         const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);

//         const currentMessageContent = messages[messages.length - 1].content;

//         const docs = await loader.load();

//         // load a JSON object
//         // const textSplitter = new CharacterTextSplitter();
//         // const docs = await textSplitter.createDocuments([JSON.stringify({
//         //     "state": "Kansas",
//         //     "slug": "kansas",
//         //     "code": "KS",
//         //     "nickname": "Sunflower State",
//         //     "website": "https://www.kansas.gov",
//         //     "admission_date": "1861-01-29",
//         //     "admission_number": 34,
//         //     "capital_city": "Topeka",
//         //     "capital_url": "http://www.topeka.org",
//         //     "population": 2893957,
//         //     "population_rank": 34,
//         //     "constitution_url": "https://kslib.info/405/Kansas-Constitution",
//         //     "twitter_url": "http://www.twitter.com/ksgovernment",
//         // })]);

//         const prompt = PromptTemplate.fromTemplate(TEMPLATE);

//         const model = new ChatOpenAI({
//             apiKey: process.env.OPENAI_API_KEY!,
//             model: 'gpt-3.5-turbo',
//             temperature: 0,
//             streaming: true,
//             verbose: true,
//         });

//         /**
//        * Chat models stream message chunks rather than bytes, so this
//        * output parser handles serialization and encoding.
//        */
//         const parser = new HttpResponseOutputParser();

//         const chain = RunnableSequence.from([
//             {
//                 question: (input) => input.question,
//                 chat_history: (input) => input.chat_history,
//                 context: () => formatDocumentsAsString(docs),
//             },
//             prompt,
//             model,
//             parser,
//         ]);

//         // Convert the response into a friendly text-stream
//         const stream = await chain.stream({
//             chat_history: formattedPreviousMessages.join('\n'),
//             question: currentMessageContent,
//         });

//         // Respond with the stream
//         return new StreamingTextResponse(
//             stream.pipeThrough(createStreamDataTransformer()),
//         );
//     } catch (e: any) {
//         return Response.json({ error: e.message }, { status: e.status ?? 500 });
//     }
// }