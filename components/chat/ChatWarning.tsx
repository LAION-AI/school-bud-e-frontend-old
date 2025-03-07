export function ChatWarning() {
  return (
    <div className="chat-warning p-4 bg-red-100 border-l-4 border-red-500 text-red-700 mb-4">
      <p>⚠️ Die Mindestanforderung zum Ausführen des Chats fehlt. Du musst die Einstellungen öffnen und entweder einen Universal-API-Schlüssel oder einen benutzerdefinierten API-Schlüssel mit der entsprechender URL und dem Modell eintragen. ⚠️</p>
    </div>
  );
} 