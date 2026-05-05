# MindGraph AI

MindGraph AI is an AI-powered, non-linear reasoning and note-taking tool that helps you connect fragmented information into a cohesive knowledge graph. It allows you to select text from a paragraph, ask an AI model (like Google Gemini or OpenAI), and automatically connect the generated response directly to the specific paragraph you selected. 

By mapping thoughts spatially, MindGraph AI provides a completely new way to research, brainstorm, and build knowledge visually.

## Features

- **Text-to-Node Contextual Linking:** Highlight any thought in a text block to chat with the AI. The resulting answer is automatically wired back to the exact paragraph you highlighted.
- **AI Smart Suggestions:** The built-in logic connector can analyze all existing nodes and suggest previously unseen semantic connections between them.
- **Dual AI Engine Support:** Supports natively connecting to Google Gemini and OpenAI-compatible endpoints directly from your browser.
- **Infinite Canvas:** Build out your knowledge tree with zooming, panning, and seamless navigation. 

## Getting Started

1. Clone the repository and install dependencies `npm i`.
2. Start the dev server: `npm run dev`.
3. Open `http://localhost:3000` to start using MindGraph AI.

## Security Warning

> **⚠️ API Key Storage Notice:**
> 
> This application is currently a client-only architecture. Any AI API Keys you provide are stored in your browser's **`localStorage`**. 
> Please be aware that you should only use this app in trusted, non-public environments and only with API keys you are comfortable keeping in your local browser state.

## Tech Stack

- **React 19**
- **Vite**
- **ReactFlow** (Canvas interactions)
- **Zustand** (State management)
- **Tailwind CSS** (Styling)
- **Google Gen AI SDK & fetch** (AI communication)

## License

MIT
