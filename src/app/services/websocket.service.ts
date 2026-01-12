import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export enum SocketEvent {
    IMPORT_SUCCESS = 'import_success',
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    ERROR = 'error',
    RECONNECT = 'reconnect',
    RECONNECT_ATTEMPT = 'reconnect_attempt',
    RECONNECT_ERROR = 'reconnect_error',
    RECONNECT_FAILED = 'reconnect_failed',
}

export interface SocketMessage<T = any> {
    event: string;
    data: T;
    timestamp?: number;
}

@Injectable({
    providedIn: 'root',
})
export class WebsocketService {
    private socket: Socket | null = null;
    private connectionStatus$ = new BehaviorSubject<boolean>(false);
    private messageSubject$ = new Subject<SocketMessage>();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private currentToken: string | null = null;
    private initialized = false;

    get disconnected(): boolean {
        return !(this.socket?.connected || false);
    }

    // Configuration
    private socketUrl: string = `${environment.apiBase}/apple_health/`;
    private readonly socketOptions = {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        autoConnect: true,
        withCredentials: false,
    };

    constructor() {
        // Use environment variable for WebSocket URL
    }

    /**
     * Initialize socket connection on app startup if user is logged in
     * This should be called once from the App component
     * @param token - Authentication token from storage
     */
    initialize(token: string | null): void {
        if (this.initialized) return;
        this.initialized = true;

        if (token) {
            this.connect(token);
        }
    }

    /**
     * Update token and reconnect if necessary (e.g., after token refresh)
     * @param newToken - New authentication token
     */
    updateToken(newToken: string): void {
        if (this.currentToken === newToken) return;

        this.currentToken = newToken;
        if (this.socket && this.socket.connected) {
            // Reconnect with new token
            this.disconnect();
            this.connect(newToken);
        }
    }

    /**
     * Connect to WebSocket server
     * @param token - Optional authentication token
     */
    connect(token?: string): void {
        if (this.socket && this.socket.connected) {
            return;
        }

        this.currentToken = token || null;
        const options: any = { ...this.socketOptions, query: { token: token } };

        this.socket = io(this.socketUrl, options);
        this.setupEventListeners();
        this.socket.connect();
    }

    /**
     * Disconnect from WebSocket server
     * @param clearAuth - If true, clears the token and allows re-initialization (use on logout)
     */
    disconnect(clearAuth: boolean = false): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connectionStatus$.next(false);
        }
        if (clearAuth) {
            this.currentToken = null;
            this.initialized = false;
        }
    }

    /**
     * Check if socket is connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Get connection status as observable
     */
    getConnectionStatus(): Observable<boolean> {
        return this.connectionStatus$.asObservable();
    }

    /**
     * Emit an event to the server
     * @param event - Event name
     * @param data - Data to send
     */
    emit<T = any>(event: string, data?: T): void {
        if (!this.socket) {
            console.error('Socket not initialized. Call connect() first.');
            return;
        }

        if (!this.socket.connected) {
            console.warn('Socket not connected. Message queued.');
        }

        this.socket.emit(event, data);
    }

    /**
     * Emit event and wait for acknowledgment
     * @param event - Event name
     * @param data - Data to send
     * @returns Promise with server response
     */
    emitWithAck<T = any, R = any>(event: string, data?: T): Promise<R> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not initialized'));
                return;
            }

            if (!this.socket.connected) {
                reject(new Error('Socket not connected'));
                return;
            }

            this.socket.timeout(5000).emit(event, data, (error: Error, response: R) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * Listen to a specific event
     * @param event - Event name to listen for
     * @returns Observable of event data
     */
    on<T = any>(event: string): Observable<T> {
        return new Observable((observer) => {
            if (!this.socket) {
                observer.error('Socket not initialized');
                return;
            }

            const handler = (data: T) => {
                observer.next(data);
            };

            this.socket.on(event, handler);

            // Cleanup function
            return () => {
                if (this.socket) {
                    this.socket.off(event, handler);
                }
            };
        });
    }

    /**
     * Listen to event once
     * @param event - Event name
     * @returns Promise with event data
     */
    once<T = any>(event: string): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not initialized'));
                return;
            }

            this.socket.once(event, (data: T) => {
                resolve(data);
            });
        });
    }

    /**
     * Stop listening to a specific event
     * @param event - Event name
     */
    off(event: string): void {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    /**
     * Get all messages as observable
     */
    getMessages(): Observable<SocketMessage> {
        return this.messageSubject$.asObservable();
    }

    /**
     * Join a room
     * @param room - Room name
     */
    joinRoom(room: string): void {
        this.emit('join-room', { room });
    }

    /**
     * Leave a room
     * @param room - Room name
     */
    leaveRoom(room: string): void {
        this.emit('leave-room', { room });
    }

    /**
     * Send message to a specific room
     * @param room - Room name
     * @param event - Event name
     * @param data - Data to send
     */
    emitToRoom<T = any>(room: string, event: string, data?: T): void {
        this.emit('room-message', { room, event, data });
    }

    /**
     * Setup internal event listeners
     */
    private setupEventListeners(): void {
        if (!this.socket) return;

        // Connection established
        this.socket.on(SocketEvent.CONNECT, () => {
            console.log('✓ WebSocket connected');
            this.connectionStatus$.next(true);
            this.reconnectAttempts = 0;
        });

        // Connection lost
        this.socket.on(SocketEvent.DISCONNECT, (reason: string) => {
            console.log('✗ WebSocket disconnected:', reason);
            this.connectionStatus$.next(false);

            // Auto-reconnect if not manual disconnect
            if (reason === 'io server disconnect') {
                this.socket?.connect();
            }
        });

        // Connection error
        this.socket.on(SocketEvent.ERROR, (error: Error) => {
            console.error('✗ WebSocket error:', error);
            this.messageSubject$.next({
                event: 'error',
                data: error,
                timestamp: Date.now(),
            });
        });

        // Reconnection attempt
        this.socket.on(SocketEvent.RECONNECT_ATTEMPT, (attempt: number) => {
            this.reconnectAttempts = attempt;
            console.log(`→ Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
        });

        // Reconnection successful
        this.socket.on(SocketEvent.RECONNECT, (attempt: number) => {
            console.log(`✓ Reconnected after ${attempt} attempts`);
            this.reconnectAttempts = 0;
        });

        // Reconnection error
        this.socket.on(SocketEvent.RECONNECT_ERROR, (error: Error) => {
            console.error('✗ Reconnection error:', error);
        });

        // Reconnection failed
        this.socket.on(SocketEvent.RECONNECT_FAILED, () => {
            console.error('✗ Reconnection failed after maximum attempts');
            this.messageSubject$.next({
                event: 'reconnect-failed',
                data: { attempts: this.reconnectAttempts },
                timestamp: Date.now(),
            });
        });

        // Catch-all for other events
        this.socket.onAny((event: string, data: any) => {
            this.messageSubject$.next({
                event,
                data,
                timestamp: Date.now(),
            });
        });
    }

    /**
     * Get current socket instance (use with caution)
     */
    getSocket(): Socket | null {
        return this.socket;
    }

    /**
     * Check socket health
     */
    checkHealth(): { connected: boolean; reconnectAttempts: number } {
        return {
            connected: this.isConnected(),
            reconnectAttempts: this.reconnectAttempts,
        };
    }

    onMessage<T>(message: string, callback: (data: T) => void): void {
        this.on<T>(message).subscribe((data) => {
            console.log(`Received message on ${message}:`, data);
            callback(data);
        });
    }
}
