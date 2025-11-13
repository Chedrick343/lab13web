export default function Message({ sender, text }) {
  const isUser = sender === "user";

  return (
    <div className={`message-row ${isUser ? "message-user" : "message-bot"}`}>
      <div className={`message-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
        {text}
      </div>
    </div>
  );
}
