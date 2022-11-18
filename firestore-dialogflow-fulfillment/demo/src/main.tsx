import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  newConversation,
  newMessage,
  signIn,
  streamMessages,
} from "./firebase";

signIn().then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

function App() {
  const input = React.useRef<HTMLInputElement>(null);
  const [conversation, setConversation] = React.useState("");

  if (conversation) {
    return <Conversation id={conversation} />;
  }

  return (
    <>
      <input type="text" ref={input} />
      <button
        onClick={async () => {
          const message = input.current!.value;
          const conversaionId = await newConversation(message);
          setConversation(conversaionId);
        }}
      >
        Start Chat
      </button>
    </>
  );
}

function Conversation(props: { id: string }) {
  const id = props.id;
  const input = React.useRef<HTMLInputElement>(null);
  const [messages, setMessages] = React.useState<string[]>([]);

  useEffect(() => {
    return streamMessages(id, (snapshot) => {
      const out: any[] = [];
      snapshot.docs.forEach((doc) =>
        out.push({
          ...doc.data(),
          id: doc.id,
        })
      );
      setMessages(out);
    });
  }, [id]);

  return (
    <>
      <h1>Conversation:</h1>
      <ul>
        {messages.map(({ id, message }: any) => (
          <li key={id}>{message}</li>
        ))}
      </ul>
      <input type="text" ref={input} />
      <button
        onClick={async () => {
          const message = input.current!.value;
          await newMessage(id, message);
          input.current!.value = '';
        }}
      >
        Send Message
      </button>
    </>
  );
}
