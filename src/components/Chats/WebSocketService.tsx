import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ChatMessage } from "./ChatMessage";

class WebSocketService {
  private client: Client | null = null;

  connect(onMessageReceived: (message: ChatMessage) => void) {
    this.client = new Client({
      webSocketFactory: () =>
        new SockJS("http://localhost:8080/ws"),

      reconnectDelay: 5000,

      onConnect: () => {
      

        this.client?.subscribe(
          "/topic/public",
          (message) => {
            onMessageReceived(
              JSON.parse(message.body)
            );
          }
        );
      },

      onStompError: (frame) => {
        console.error(frame);
      },
    });

    this.client.activate();
  }

  sendMessage(message: ChatMessage) {
    this.client?.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(message),
    });
  }

  disconnect() {
    this.client?.deactivate();
  }
}

export default new WebSocketService();