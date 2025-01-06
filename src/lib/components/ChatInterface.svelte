<!-- ChatInterface.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { ChatAnthropic } from "@langchain/anthropic";
  import { apiKey, advancedMode } from "$lib/stores";
  import { createFaissRag, searchRag } from "$lib/utils/ragUtils";
  import { Button, Spinner, Toggle } from "flowbite-svelte";
  import { fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import type { NDKEvent } from "@nostr-dev-kit/ndk";

  // Props
  export let events: NDKEvent[] = [];
  export let vectorStore = null;
  // State Management
  let isVisible = false;
  let messages: Array<{ role: string; content: string }> = [];
  let userInput = "";
  let isLoading = false;
  let chatAnthropic: ChatAnthropic | null = null;
  let initializationError = null;

  // Hide chat when advanced mode is disabled
  $: if (!$advancedMode) {
    isVisible = false;
  }

  // Initialize chat when API key is available
  $: if ($apiKey && !chatAnthropic) {
    chatAnthropic = new ChatAnthropic({
      anthropicApiKey: $apiKey,
      modelName: "claude-3-sonnet-20240229",
    });
  }

  // Initialize RAG when visibility changes
  $: if (isVisible && !vectorStore && !initializationError) {
    initializeRag();
  }

  async function initializeRag() {
    try {
      isLoading = true;
      const { store, diagnostics } = await createFaissRag(events);
      vectorStore = store;

      console.debug("RAG Initialization Diagnostics:", diagnostics);

      messages = [
        ...messages,
        {
          role: "assistant",
          content: `I'm ready to help you with questions about this article. I've processed ${diagnostics.processedEvents} sections of content.`,
        },
      ];
    } catch (error) {
      console.error("RAG Initialization Error:", error);
      initializationError = error;

      let errorMessage = "I'm having trouble accessing the article content. ";

      // Provide context-specific error messages
      switch (error.type) {
        case "INPUT_VALIDATION":
          errorMessage += "The article content appears to be empty or invalid.";
          break;
        case "EMBEDDER_INITIALIZATION":
          errorMessage +=
            "There's a technical issue with the content processing system.";
          break;
        case "DOCUMENT_PROCESSING":
          errorMessage +=
            "I'm having trouble processing some sections of the article.";
          break;
        case "EMBEDDING_GENERATION":
          errorMessage +=
            "I'm experiencing issues analyzing the article content.";
          break;
        default:
          errorMessage +=
            "I'll try to help with general questions, but may not have access to specific article details.";
      }

      messages = [
        ...messages,
        {
          role: "assistant",
          content: errorMessage,
        },
      ];
    } finally {
      isLoading = false;
    }
  }

  async function sendMessage() {
    if (!userInput.trim() || !chatAnthropic) return;

    try {
      isLoading = true;
      messages = [...messages, { role: "user", content: userInput }];
      const currentInput = userInput;
      userInput = "";

      // Build context from RAG search
      let systemMessage = "You are a helpful assistant.";
      let searchDiagnostics = null;

      if (vectorStore) {
        try {
          const { results, diagnostics } = await searchRag(
            vectorStore,
            currentInput,
          );
          searchDiagnostics = diagnostics;

          if (results && results.length > 0) {
            // Structure context hierarchically
            const contextSections = results.map((doc, index) => {
              const relevanceMarker = index === 0 ? "MOST RELEVANT" : "RELATED";
              return `${relevanceMarker} SECTION
Title: ${doc.metadata.title}
Content: ${doc.pageContent}`;
            });

            const context = contextSections.join("\n\n");

            // Build systematic prompt
            systemMessage = `ROLE AND OBJECTIVE
You are a knowledgeable assistant helping users understand a Nostr article.

AVAILABLE CONTENT SECTIONS
${context}

RESPONSE GUIDELINES
1. Base your responses on the provided content sections
2. Focus on the most relevant section first
3. Draw connections between related sections when appropriate
4. If asked about topics not covered in these sections:
   - Clearly indicate the topic isn't covered in the current article
   - Suggest focusing on the available content instead

COMMUNICATION STYLE
- Maintain technical precision
- Present information systematically
- Use clear, educational explanations
- Avoid directly quoting or mentioning the source content`;
          } else {
            systemMessage = `You are a knowledgeable assistant helping with questions about a Nostr article.
            However, I couldn't find specific content related to this question.
            Please indicate that this topic isn't covered in the current article.`;
          }

          console.debug("Search Diagnostics:", searchDiagnostics);
        } catch (error) {
          console.error("RAG search error:", error);
          if (error.type === "STORE_NOT_READY") {
            systemMessage = `You are a helpful assistant. The article content is currently unavailable.
            Please inform the user that you're experiencing technical difficulties accessing the article content.`;
          }
        }
      }

      const response = await chatAnthropic.call([
        { role: "system", content: systemMessage },
        { role: "user", content: currentInput },
      ]);

      const responseContent =
        response?.content || response?.value || "No response content";

      messages = [
        ...messages,
        {
          role: "assistant",
          content:
            typeof responseContent === "string"
              ? responseContent
              : responseContent.toString(),
        },
      ];
    } catch (error) {
      console.error("Chat error:", error);

      let errorMessage = "I encountered an error processing your request. ";

      if (error.type === "SEARCH_ERROR") {
        errorMessage +=
          "I'm having trouble searching through the article content right now.";
      } else if (error.message?.includes("rate_limit")) {
        errorMessage +=
          "I'm receiving too many requests at the moment. Please try again in a moment.";
      } else {
        errorMessage += "Please try asking your question again or rephrase it.";
      }

      messages = [
        ...messages,
        {
          role: "assistant",
          content: errorMessage,
        },
      ];
    } finally {
      isLoading = false;
    }
  }
</script>

{#if $advancedMode}
  <!-- Chat Controls -->
  <div class="fixed bottom-4 right-4 flex flex-col items-end space-y-4 z-50">
    <!-- Toggle Button -->
    <Toggle bind:checked={isVisible} class="toggle-leather">
      {isVisible ? "Hide Article Assistant" : "Show Article Assistant"}
    </Toggle>
  </div>

  <!-- Chat Drawer -->
  {#if isVisible}
    <div
      class="fixed right-0 top-[64px] h-[calc(100vh-64px)] w-96 bg-white dark:bg-gray-800 shadow-lg z-40 border-l border-gray-200 dark:border-gray-700"
      transition:fly={{ duration: 300, x: 384, opacity: 1, easing: quintOut }}
    >
      <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="p-4 border-b dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">
            Article Assistant
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Using article context for intelligent responses
          </p>
        </div>

        <!-- Messages -->
        <div class="flex-grow overflow-y-auto p-4 space-y-4">
          {#each messages as message (message.content)}
            <div
              class="message {message.role} p-3 rounded-lg w-fit max-w-[85%] {message.role ===
              'user'
                ? 'bg-blue-100 dark:bg-blue-900 ml-auto text-gray-800 dark:text-gray-200'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}"
            >
              <pre class="whitespace-pre-wrap font-sans">{message.content}</pre>
            </div>
          {/each}

          {#if isLoading}
            <div class="flex justify-center">
              <Spinner />
            </div>
          {/if}
        </div>

        <!-- Input -->
        <div class="p-4 border-t dark:border-gray-700">
          <form class="flex space-x-2" on:submit|preventDefault={sendMessage}>
            <input
              type="text"
              bind:value={userInput}
              placeholder="Ask about this article..."
              class="flex-grow p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !userInput.trim()}>
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .message {
    max-width: 85%;
    word-wrap: break-word;
  }

  .user {
    margin-left: auto;
  }

  .assistant {
    margin-right: auto;
  }

  /* Scrollbar styling */
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }

  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }

  /* Toggle button styling */
  :global(.toggle-leather) {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg;
  }
</style>
