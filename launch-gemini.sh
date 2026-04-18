#!/bin/bash

SESSION_NAME="gemini-cli"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "Error: tmux is not installed. Please install it with 'sudo apt install tmux'."
    exit 1
fi

# Check if we are already inside the target tmux session
if [ "$TMUX_PANE" ] && [ "$(tmux display-message -p '#S')" = "$SESSION_NAME" ]; then
    echo "You are already inside the '$SESSION_NAME' session."
    # Just run gemini directly
    gemini
    exit 0
fi

# Create the session in the background if it doesn't exist
tmux has-session -t "$SESSION_NAME" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Creating new tmux session: $SESSION_NAME"
    tmux new-session -d -s "$SESSION_NAME"
fi

# Clear the current pane and prepare to launch gemini
# We send the command and then attach so you see the launch
tmux send-keys -t "$SESSION_NAME" "clear && gemini" C-m

echo "Attaching to tmux session '$SESSION_NAME'..."
tmux attach-session -t "$SESSION_NAME"
