# School Bud-E 🎓🤖

![School Bud-E Banner](banner.png)

Welcome to School Bud-E, your AI-powered educational assistant! 🚀

[![Join us on Discord](https://img.shields.io/discord/823813159592001537?color=5865F2&logo=discord&logoColor=white)](https://discord.gg/xBPBXfcFHd)

## 🌟 Overview

School Bud-E is an intelligent and empathetic learning assistant designed to revolutionize the educational experience. Developed by [LAION](https://laion.ai) in collaboration with the ELLIS Institute Tübingen, Collabora, the Tübingen AI Center and the German Research Center for Artificial Intelligence (DFKI), and Intel, School Bud-E focuses on empathy, natural interaction, and personalized learning. A working demo of the application is available at [school.bud-e.ai](https://school.bud-e.ai).

## 🚀 Features (WIP)

- 💬 Real-time responses to student queries
- 🧠 Emotionally intelligent interactions
- 🔄 Continuous conversation context
- 👥 Multi-speaker and multi-language support
- 🖥️ Local operation on consumer-grade hardware
- 🔒 Privacy-focused design

## 🛠️ Technology Stack

- **Frontend**: Fresh framework (Preact-based)
- **Styling**: Tailwind CSS
- **Language Support**: Internationalization for English and German
- **AI Models**:
  - Speech-to-Text: Whisper Large V3 (via Groq API)
  - Large Language Model: GPT-4o or equivalent

## 🏗️ Project Structure

- `routes/`: Application routes
- `components/`: Reusable UI components
- `islands/`: Interactive components (Fresh islands)
- `internalization/`: Language-specific content
- `static/`: Static assets

## 🚀 Getting Started: Development

1. Clone the repository:

   ```bash
   git clone https://github.com/LAION-AI/school-bud-e-frontend.git
   ```

2. Set up environment variables:
   - Copy `.example.env` to `.env`
   - Fill in the required API keys and endpoints

3. Run the development server:

   ```bash
   cd school-bud-e-frontend
   deno task start
   ```

4. Open `http://localhost:8000` in your browser

## 🚀 Getting Started: Production

1. Without docker

   ```bash
   deno task build
   deno task preview
   ```

2. With docker

   ```bash
   git clone https://github.com/LAION-AI/school-bud-e-frontend.git
   cd school-bud-e-frontend
   cd docker-compose
   nano .env # Adjust environment variables accordingly
   docker-compose up
   ```

Then log into localhost:8000 in your browser.

## Interaction Between API Routes and Chat Components

This section describes how the various API routes and chat components interact within the application.

### API Routes

- **`tts.ts`**:
  - **Description**: Handles Text-to-Speech (TTS) requests. It receives text input and returns an audio response.
  - **Endpoint**: `/api/tts`
  - **Example Usage**: Fetching audio data for a given text input.

- **`chat.ts`**:
  - **Description**: Manages chat messages. It processes incoming chat messages and returns appropriate responses.
  - **Endpoint**: `/api/chat`
  - **Example Usage**: Sending and receiving chat messages.

- **`getClientId.ts`**:
  - **Description**: Provides a unique client ID for each user session.
  - **Endpoint**: `/api/getClientId`
  - **Example Usage**: Generating a unique identifier for a new chat session.

### Chat Components

- **`ChatIsland.tsx`**:
  - **Description**: Responsible for rendering the chat interface. It interacts with the chat API to send and receive messages.
  - **Usage**: Uses the client ID obtained from the `getClientId` API to manage user sessions.
  - **Example Usage**: Displaying the chat UI and handling user interactions.

- **`ChatTemplate.tsx`**:
  - **Description**: Serves as a template for the chat interface. It defines the layout and structure of the chat UI.
  - **Usage**: Used by `ChatIsland.tsx` to render the chat interface consistently.
  - **Example Usage**: Providing a consistent layout for the chat interface.

### Interaction Flow

1. When a user opens the chat interface, `ChatIsland.tsx` requests a unique client ID from the `getClientId` API.
2. The user sends a chat message through the chat interface rendered by `ChatIsland.tsx`.
3. `ChatIsland.tsx` sends the message to the chat API endpoint.
4. The chat API processes the message and returns a **streaming** response.
5. `ChatIsland.tsx` updates the chat interface with the response reflected in `ChatTemplate.tsx`.
6. If the user requests a TTS response, `ChatIsland.tsx` sends the text to the `tts` API endpoint.
7. The `tts` API returns the audio data, which is then played back to the user.

By following this interaction flow, the application ensures a seamless chat experience for users.

For more details, refer to the following files:

- `routes/api/tts.ts`
- `routes/api/chat.ts`
- `routes/api/getClientId.ts`
- `islands/ChatIsland.tsx`
- `components/ChatTemplate.tsx`

## Organizing Components in Deno Fresh

In Deno Fresh projects, organizing components effectively is crucial for maintainability and clarity. Components are categorized based on their interactivity and usage scope. Here's a structured approach to guide you:

### 1. Structuring the `islands/` Folder

- **Purpose:** The `islands/` directory is designated for components that require client-side interactivity. These components are rendered on the server and then hydrated on the client, enabling dynamic behavior.
- **Organization:** Fresh allows organizing the `islands/` folder with subdirectories to group related components, enhancing maintainability.

  ```
  islands/
  ├── user/
  │   ├── ProfileEditor.tsx
  │   └── AvatarUploader.tsx
  └── dashboard/
      ├── StatsChart.tsx
      └── Notifications.tsx
  ```

### 2. Determining Component Placement

To decide whether a component belongs in `components/` or `islands/`, and whether it should be shared or route-specific, consider the following criteria:

- **Interactivity Needs:**
  - *Non-interactive Components:* Purely presentational components that don't require client-side JavaScript should be placed in `components/`.
  - *Interactive Components:* Components involving client-side interactions should reside in `islands/`.

- **Usage Scope:**
  - *Shared Components:* Components used across multiple routes should be placed in the global `components/` or `islands/` directory, depending on their interactivity.
  - *Route-specific Components:* Components specific to a particular route can be colocated within that route's directory using private route groups.

    ```
    routes/
    ├── blog/
    │   ├── (_components)/
    │   │   └── Comment.tsx
    │   ├── (_islands)/
    │   │   └── CommentForm.tsx
    │   └── [id].tsx
    ```

### 3. Component Placement Decision Matrix

| Interactivity Level | Usage Scope     | Parent Component | Child Component | Placement Recommendation                                   |
|---------------------|-----------------|------------------|-----------------|-----------------------------------------------------------|
| Non-interactive     | Shared          | N/A              | N/A             | Place in `components/`                                     |
| Non-interactive     | Route-specific  | N/A              | N/A             | Colocate in route's `(_components)/` folder               |
| Interactive         | Shared          | N/A              | N/A             | Place in `islands/`                                        |
| Interactive         | Route-specific  | N/A              | N/A             | Colocate in route's `(_islands)/` folder                  |
| Non-interactive     | Shared          | Interactive      | Non-interactive | Parent in `islands/`, Child in `components/`              |
| Non-interactive     | Route-specific  | Interactive      | Non-interactive | Parent in route's `(_islands)/`, Child in `(_components)/`|
| Interactive         | Shared          | Non-interactive  | Interactive     | Parent in `components/`, Child in `islands/`              |
| Interactive         | Route-specific  | Non-interactive  | Interactive     | Parent in `(_components)/`, Child in `(_islands)/`        |

### 4. Additional Considerations

- **Colocation:**
  For components specific to certain routes, consider colocating them using private route groups. Fresh allows the use of route groups by enclosing folder names in parentheses. If the folder name starts with an underscore, Fresh will ignore that folder when generating routes.

  ```
  routes/
  ├── shop/
  │   ├── (_components)/
  │   │   └── ProductCard.tsx
  │   ├── (_islands)/
  │   │   └── AddToCartButton.tsx
  │   └── index.tsx
  ```

- **Shared Components:**
  If an interactive component (island) is used across multiple routes, place it in the global `islands/` directory to promote reusability.

By thoughtfully organizing your components based on their interactivity and usage context, you can maintain a clean and efficient codebase in your Deno Fresh project.

## 🤝 Contributing

We welcome contributions to School Bud-E! Please join our [Discord server](https://discord.com/invite/eq3cAMZtCC) or contact us at <contact@laion.ai> to get involved.

## 🚧 Experimental Demo Version

Please note that this is an early prototype application that may provide inaccurate answers or generate content that is not suitable for all audiences. We advise caution and encourage you to report any issues you encounter to us.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

Special thanks to LAION, ELLIS Institute Tübingen, Collabora, the Tübingen AI Center and the German Research Center for Artificial Intelligence (DFKI), and Intel for their contributions and support to this project.

---

Built with ❤️ for the future of education.
