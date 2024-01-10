import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "@/app/config/server";

import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseCallbackHandler } from "langchain/callbacks";

import { AIMessage, HumanMessage, SystemMessage } from "langchain/schema";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { AgentExecutor } from "langchain/agents";
import { ACCESS_CODE_PREFIX } from "@/app/constant";

import * as langchainTools from "langchain/tools";
import { DuckDuckGo } from "@/app/api/langchain-tools/duckduckgo_search";
import { BaiduSearch } from "@/app/api/langchain-tools/baidu_search";
import { GoogleSearch } from "@/app/api/langchain-tools/google_search";

import { formatToOpenAITool, Tool } from "langchain/tools";
import { formatToOpenAIToolMessages } from "langchain/agents/format_scratchpad/openai_tools";
import {
  OpenAIToolsAgentOutputParser,
  type ToolsAgentStep,
} from "langchain/agents/openai/output_parser";
import { RunnableSequence } from "langchain/schema/runnable";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";

export interface RequestMessage {
  role: string;
  content: string;
}

export interface RequestBody {
  messages: RequestMessage[];
  isAzure: boolean;
  azureApiVersion?: string;
  model: string;
  stream?: boolean;
  temperature: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  top_p?: number;
  baseUrl?: string;
  apiKey?: string;
  maxIterations: number;
  returnIntermediateSteps: boolean;
  useTools: (undefined | string)[];
  searchEngine: undefined | string;
}

export class ResponseBody {
  isSuccess: boolean = true;
  message!: string;
  isToolMessage: boolean = false;
  toolName?: string;
  selectToolNames?: string[];
}

export interface ToolInput {
  input: string;
}

export class AgentApi {
  private encoder: TextEncoder;
  private transformStream: TransformStream;
  private writer: WritableStreamDefaultWriter<any>;

  constructor(
    encoder: TextEncoder,
    transformStream: TransformStream,
    writer: WritableStreamDefaultWriter<any>,
  ) {
    this.encoder = encoder;
    this.transformStream = transformStream;
    this.writer = writer;
  }

  async getHandler(reqBody: any) {
    var writer = this.writer;
    var encoder = this.encoder;
    return BaseCallbackHandler.fromMethods({
      async handleLLMNewToken(token: string) {
        if (token) {
          var response = new ResponseBody();
          response.message = token;
          await writer.ready;
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
          );
        }
      },
      async handleChainError(err, runId, parentRunId, tags) {
        console.log("[handleChainError]", err, "writer error");
        var response = new ResponseBody();
        response.isSuccess = false;
        response.message = err;
        await writer.ready;
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
        );
        await writer.close();
      },
      async handleChainEnd(outputs, runId, parentRunId, tags) {
        // console.log("[handleChainEnd]");
        // await writer.ready;
        // await writer.close();
      },
      async handleLLMEnd() {
        // await writer.ready;
        // await writer.close();
      },
      async handleLLMError(e: Error) {
        console.log("[handleLLMError]", e, "writer error");
        var response = new ResponseBody();
        response.isSuccess = false;
        response.message = e.message;
        await writer.ready;
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
        );
        await writer.close();
      },
      async handleLLMStart(llm, _prompts: string[]) {
        // console.log("handleLLMStart: I'm the second handler!!", { llm });
      },
      async handleChainStart(chain) {
        // console.log("handleChainStart: I'm the second handler!!", { chain });
      },
      async handleAgentAction(action) {
        try {
          // console.log("[handleAgentAction]", { action });
          if (!reqBody.returnIntermediateSteps) return;
          var response = new ResponseBody();
          response.isToolMessage = true;
          response.message = Object.values(action.toolInput).join(" ");
          response.toolName = action.tool;
          response.selectToolNames = [
            "baidu_search",
            "google_search",
            "duckduckgo_search",
          ];

          await writer.ready;
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
          );
        } catch (ex) {
          console.error("[handleAgentAction]", ex);
          var response = new ResponseBody();
          response.isSuccess = false;
          response.message = (ex as Error).message;
          await writer.ready;
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
          );
          await writer.close();
        }
      },
      async handleToolStart(tool, input) {
        // console.log("[handleToolStart]", { tool, input });
      },
      async handleToolEnd(output, runId, parentRunId, tags) {
        // console.log("[handleToolEnd]", { output, runId, parentRunId, tags });
      },
      async handleAgentEnd(action, runId, parentRunId, tags) {
        console.log("[handleAgentEnd]");
        await writer.ready;
        await writer.close();
      },
    });
  }

  async getOpenAIApiKey(token: string) {
    const serverConfig = getServerSideConfig();
    const isApiKey = !token.startsWith(ACCESS_CODE_PREFIX);

    let apiKey = serverConfig.apiKey;
    if (isApiKey && token) {
      apiKey = token;
    }
    return apiKey;
  }

  async getOpenAIBaseUrl(reqBaseUrl: string | undefined) {
    const serverConfig = getServerSideConfig();
    let baseUrl = "https://api.openai.com/v1";
    if (serverConfig.baseUrl) baseUrl = serverConfig.baseUrl;
    if (reqBaseUrl?.startsWith("http://") || reqBaseUrl?.startsWith("https://"))
      baseUrl = reqBaseUrl;
    if (!baseUrl.endsWith("/v1"))
      baseUrl = baseUrl.endsWith("/") ? `${baseUrl}v1` : `${baseUrl}/v1`;
    console.log("[baseUrl]", baseUrl);
    return baseUrl;
  }

  async getApiHandler(
    req: NextRequest,
    reqBody: RequestBody,
    customTools: any[],
  ) {
    try {
      let useTools = reqBody.useTools ?? [];
      const serverConfig = getServerSideConfig();

      // const reqBody: RequestBody = await req.json();
      const isAzure = reqBody.isAzure || serverConfig.isAzure;
      const searchEngine = reqBody.searchEngine;
      const authHeaderName = isAzure ? "api-key" : "Authorization";
      const authToken = req.headers.get(authHeaderName) ?? "";
      const token = authToken.trim().replaceAll("Bearer ", "").trim();

      let apiKey = await this.getOpenAIApiKey(token);
      if (isAzure) apiKey = token;
      let baseUrl = "https://api.openai.com/v1";
      if (serverConfig.baseUrl) baseUrl = serverConfig.baseUrl;
      if (
        reqBody.baseUrl?.startsWith("http://") ||
        reqBody.baseUrl?.startsWith("https://")
      ) {
        baseUrl = reqBody.baseUrl;
      }
      if (!isAzure && !baseUrl.endsWith("/v1")) {
        baseUrl = baseUrl.endsWith("/") ? `${baseUrl}v1` : `${baseUrl}/v1`;
      }
      if (!reqBody.isAzure && serverConfig.isAzure) {
        baseUrl = serverConfig.azureUrl || baseUrl;
      }
      console.log("[baseUrl]", baseUrl);

      var handler = await this.getHandler(reqBody);

      let searchTool: Tool = new DuckDuckGo();
      const tools = [];

      if (searchEngine == "google_search") {
        searchTool = new GoogleSearch();
      } else if (searchEngine == "baidu_search") {
        searchTool = new BaiduSearch();
      }

      if (useTools.includes("web-search")) tools.push(searchTool);
      // console.log(customTools);

      customTools.forEach((customTool) => {
        if (customTool) {
          if (useTools.includes(customTool.name)) {
            tools.push(customTool);
          }
        }
      });

      useTools.forEach((toolName) => {
        if (toolName) {
          var tool = langchainTools[
            toolName as keyof typeof langchainTools
          ] as any;
          if (tool) {
            tools.push(new tool());
          }
        }
      });

      const pastMessages = new Array();

      reqBody.messages
        .slice(0, reqBody.messages.length - 1)
        .forEach((message) => {
          if (message.role === "system")
            pastMessages.push(new SystemMessage(message.content));
          if (message.role === "user")
            pastMessages.push(new HumanMessage(message.content));
          if (message.role === "assistant")
            pastMessages.push(new AIMessage(message.content));
        });

      // const memory = new BufferMemory({
      //   memoryKey: "chat_history",
      //   returnMessages: true,
      //   inputKey: "input",
      //   outputKey: "output",
      //   chatHistory: new ChatMessageHistory(pastMessages),
      // });

      let llm = new ChatOpenAI(
        {
          modelName: reqBody.model,
          openAIApiKey: apiKey,
          temperature: reqBody.temperature,
          streaming: reqBody.stream,
          topP: reqBody.top_p,
          presencePenalty: reqBody.presence_penalty,
          frequencyPenalty: reqBody.frequency_penalty,
        },
        { basePath: baseUrl },
      );

      if (reqBody.isAzure || serverConfig.isAzure) {
        llm = new ChatOpenAI({
          temperature: reqBody.temperature,
          streaming: reqBody.stream,
          topP: reqBody.top_p,
          presencePenalty: reqBody.presence_penalty,
          frequencyPenalty: reqBody.frequency_penalty,
          azureOpenAIApiKey: apiKey,
          azureOpenAIApiVersion: reqBody.isAzure
            ? reqBody.azureApiVersion
            : serverConfig.azureApiVersion,
          azureOpenAIApiDeploymentName: reqBody.model,
          azureOpenAIBasePath: baseUrl,
        });
      }
      const memory = new BufferMemory({
        memoryKey: "history",
        inputKey: "question",
        outputKey: "answer",
        returnMessages: true,
        chatHistory: new ChatMessageHistory(pastMessages),
      });
      const prompt = ChatPromptTemplate.fromMessages([
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
        new MessagesPlaceholder("agent_scratchpad"),
      ]);
      const modelWithTools = llm.bind({ tools: tools.map(formatToOpenAITool) });
      const runnableAgent = RunnableSequence.from([
        {
          input: (i: { input: string; steps: ToolsAgentStep[] }) => i.input,
          agent_scratchpad: (i: { input: string; steps: ToolsAgentStep[] }) =>
            formatToOpenAIToolMessages(i.steps),
          chat_history: async (_: {
            input: string;
            steps: ToolsAgentStep[];
          }) => {
            const { history } = await memory.loadMemoryVariables({});
            return history;
          },
        },
        prompt,
        modelWithTools,
        new OpenAIToolsAgentOutputParser(),
      ]).withConfig({ runName: "OpenAIToolsAgent" });

      const executor = AgentExecutor.fromAgentAndTools({
        agent: runnableAgent,
        tools,
      });

      // const executor = await initializeAgentExecutorWithOptions(tools, llm, {
      //   agentType: "openai-functions",
      //   returnIntermediateSteps: reqBody.returnIntermediateSteps,
      //   maxIterations: reqBody.maxIterations,
      //   memory: memory,
      // });

      executor.call(
        {
          input: reqBody.messages.slice(-1)[0].content,
        },
        [handler],
      );

      return new Response(this.transformStream.readable, {
        headers: { "Content-Type": "text/event-stream" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as any).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}
