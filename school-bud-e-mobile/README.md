# School Bud-E Mobile

A React Native mobile application for School Bud-E, your AI learning companion. This app provides the same functionality as the web version, optimized for mobile devices.

## Features

- **AI Chat**: Interactive conversations with your AI learning companion
- **Learning Games**: Create and manage educational games with progress tracking
- **Multi-language Support**: Available in English and German
- **Text-to-Speech**: Listen to AI responses with built-in speech synthesis
- **Server Configuration**: Connect to your own School Bud-E server instance
- **Offline Settings**: Local storage of preferences and configuration

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd school-bud-e-mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Configuration

### Server Setup

1. Open the app and navigate to the Settings tab
2. Configure your server URL (default: `https://next.bud-e.ai`)
3. Enter your API key if required
4. Test the connection using the "Test Connection" button

### Language Settings

The app supports both English and German. You can switch languages in the Settings tab.

## API Integration

The app connects to the same School Bud-E backend as the web version, supporting:

- `/api/chat` - AI chat conversations with streaming responses
- `/api/game` - Game management (create, read, update, delete)
- `/api/tts` - Text-to-speech conversion
- `/api/bildungsplan` - Educational content search
- `/api/wikipedia` - Wikipedia search integration
- `/api/transcribe-pdf` - PDF transcription services

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React Context for global state
├── screens/            # Main application screens
│   ├── HomeScreen.tsx  # Welcome and feature overview
│   ├── ChatScreen.tsx  # AI chat interface
│   ├── GamesScreen.tsx # Game management
│   └── SettingsScreen.tsx # App configuration
├── services/           # API service layer
└── types/             # TypeScript type definitions
```

## Key Components

### Chat Screen
- Real-time streaming chat with AI
- Message history with timestamps
- Text-to-speech for AI responses
- Keyboard-aware interface

### Games Screen
- View saved learning games
- Create new games with custom codes
- Delete existing games
- Points tracking

### Settings Screen
- Server URL configuration
- API key management
- Language selection
- Connection testing
- Reset to defaults

## Development

### Adding New Features

1. Create new components in `src/components/`
2. Add new screens to `src/screens/` and update navigation
3. Extend the API service in `src/services/apiService.ts`
4. Update types in `src/types/` as needed

### Styling

The app uses React Native StyleSheet with a consistent design system:
- Primary color: `#3B82F6` (blue)
- Text colors: `#1F2937` (dark), `#6B7280` (medium), `#9CA3AF` (light)
- Background: `#FFFFFF` (white) with `#F9FAFB` for cards

## Building for Production

### iOS

1. Configure your Apple Developer account in Expo
2. Build the app:
```bash
expo build:ios
```

### Android

1. Configure your Android keystore
2. Build the app:
```bash
expo build:android
```

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check your server URL and ensure the server is running
2. **API Key Invalid**: Verify your API key in the Settings screen
3. **Audio Not Playing**: Ensure device volume is up and audio permissions are granted

### Debug Mode

Run the app in debug mode to see console logs:
```bash
npm start --dev-client
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on both iOS and Android
5. Submit a pull request

## License

This project is licensed under the same terms as the main School Bud-E project.

## Support

For support and questions:
- Check the main School Bud-E documentation
- Open an issue in the repository
- Contact the development team

---

Built with ❤️ using React Native and Expo 