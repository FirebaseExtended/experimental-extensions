import Status from "./status";

interface Conversation {
  message_count: number;
  started_at: Date;
  updated_at: Date;
  status: Status;
  users: string[];
}

export default Conversation;
