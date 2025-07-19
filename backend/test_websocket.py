#!/usr/bin/env python3
"""
Simple test script to verify WebSocket functionality
"""
import socketio
import time
import json

# Create a Socket.IO client
sio = socketio.Client()

@sio.event
def connect():
    print('Connected to server')

@sio.event
def disconnect():
    print('Disconnected from server')

@sio.event
def connection_confirmed(data):
    print(f'Connection confirmed: {data}')

@sio.event
def new_message(data):
    print(f'New message received: {data}')

@sio.event
def error(data):
    print(f'Error: {data}')

def test_connection():
    try:
        # Connect to the server
        sio.connect('http://localhost:5000')
        print("Successfully connected to WebSocket server!")
        
        # Wait a bit to see if we get any events
        time.sleep(2)
        
        # Disconnect
        sio.disconnect()
        print("Test completed successfully!")
        
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_connection() 