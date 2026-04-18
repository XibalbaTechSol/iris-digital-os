/**
 * IRIS Digital OS - Client Event Bus
 * Goal: Decouple module updates for a snappier, "OS-like" experience.
 */

type Callback = (data: any) => void;

class EventBus {
    private subscribers: { [key: string]: Callback[] } = {};

    publish(event: string, data: any) {
        console.log(`[CLIENT_BUS] EVENT_PUBLISHED: ${event}`, data);
        if (this.subscribers[event]) {
            this.subscribers[event].forEach(callback => callback(data));
        }
    }

    subscribe(event: string, callback: Callback) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }
        this.subscribers[event].push(callback);
        
        // Return unsubscribe function
        return () => {
            this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
        };
    }
}

export default new EventBus();
