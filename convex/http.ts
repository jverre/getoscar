import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Initialize OpenRouter
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

function hasDelimiter(response: string) {
  return (
    response.includes("\n") ||
    response.includes(".") ||
    response.includes("?") ||
    response.includes("!") ||
    response.includes(",") ||
    response.length > 100
  );
}

http.route({
  path: "/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    console.log('chat route');
    const body = await request.json();
    const messageId: Id<"messages"> = body.messageId;
    const messages: Doc<"messages">[] = body.messages;
    
    let content = "";    
    try {
      const streamResult = await streamText({
        model: openrouter('openai/gpt-3.5-turbo'),
        messages: [
          {
            role: 'system',
            content: 'You are a really excited bot in a group chat responding to q\'s.'
          },
          ...messages.map(({ content, role }) => ({
            role: role as "system" | "user" | "assistant",
            content: content
          }))
        ],
        onChunk: async (chunk) => {
          if (chunk.chunk.type === 'text-delta') {
            content += chunk.chunk.textDelta;
            if (hasDelimiter(chunk.chunk.textDelta)) {
              await ctx.runMutation(internal.messages.update, {
                messageId,
                content: content,
                completed: false,
              });
            }
          }
        },
        onFinish: async (event) => {
          await ctx.runMutation(internal.messages.update, {
            messageId,
            content: event.text,
            completed: true,
          });
        }
      });

      return streamResult.toTextStreamResponse({
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Vary': 'origin',
          'Content-Type': 'text/plain; charset=utf-8',
        }
      });

    } catch (error) {
      console.error('Streaming error:', error);
      await ctx.runMutation(internal.messages.update, {
        messageId,
        content: "OpenRouter call failed: " + (error as Error).message,
        completed: true,
      });
      
      return new Response(
        JSON.stringify({ error: "Failed to stream response" }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Vary': 'origin',
          }
        }
      );
    }
  }),
});

// CORS handling
http.route({
  path: "/chat",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Digest",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

export default http;