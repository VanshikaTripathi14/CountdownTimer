// DOM Elements
const addTimerBtn = document.getElementById('addTimerBtn');
const timersContainer = document.getElementById('timersContainer');
const timerTemplate = document.getElementById('timerTemplate');

// Timer management
let timers = []; // Stores objects for each timer: { id, element, interval }

// Global Audio Object
// It's better to create a single Audio object and reuse it,
// instead of creating a new one every second or on every completion.
const completionAudio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
completionAudio.volume = 0.5; // Adjust volume as needed
completionAudio.preload = 'auto'; // Attempt to preload the audio for smoother playback

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Ensure initial timer is added after DOM is fully loaded
    addNewTimer(); 
});

addTimerBtn.addEventListener('click', addNewTimer);

// --- Functions ---

function addNewTimer() {
    // Clone the timer template
    const newTimer = timerTemplate.cloneNode(true);
    newTimer.id = ''; // Clear the template ID
    newTimer.classList.remove('timer-template'); // Remove the template class
    newTimer.style.display = 'flex'; // Make it visible and use flex for internal layout
    
    // Add to DOM
    timersContainer.appendChild(newTimer);
    
    // Get elements from the new timer (using newTimer directly as timer-item is its immediate child)
    const timerElement = newTimer.querySelector('.timer-item');
    const startBtn = timerElement.querySelector('.start-btn');
    const deleteBtn = timerElement.querySelector('.delete-timer');
    const datetimeInput = timerElement.querySelector('.datetime');
    const messageElement = timerElement.querySelector('.message');
    const timerNameInput = timerElement.querySelector('.timer-name'); // Get the name input
    const errorBox = timerElement.querySelector('.error-box'); // Get the new error box

    // Generate unique ID for the timer
    const timerId = Date.now().toString();
    timerElement.dataset.id = timerId;
    
    // Set default datetime to a sensible future time (e.g., 24 hours from now)
    const now = new Date();
    now.setHours(now.getHours() + 24); 
    datetimeInput.value = now.toISOString().substring(0, 16);

    // Add event listeners for this specific timer
    startBtn.addEventListener('click', () => startCountdown(timerId));
    deleteBtn.addEventListener('click', () => deleteTimer(timerId));
    
    // Allow Enter key to start countdown when focus is on datetime input
    datetimeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission if any
            startCountdown(timerId);
        }
    });

    // Clear error message when input changes
    datetimeInput.addEventListener('input', () => {
        hideError(errorBox);
    });
    
    // Store timer reference in the array
    timers.push({
        id: timerId,
        element: timerElement,
        interval: null // To store the setInterval ID
    });
}

async function deleteTimer(timerId) {
    // Find the index of the timer in the 'timers' array
    const timerIndex = timers.findIndex(t => t.id === timerId);
    if (timerIndex === -1) return; // Timer not found

    const timerName = timers[timerIndex].element.querySelector('.timer-name').value || 'This Timer';

    // SweetAlert2 confirmation
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete "${timerName}". This cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
        // Removed the 'backdrop' property that contained the Nyan Cat animation
    });

    if (result.isConfirmed) {
        // Clear the interval if the countdown is running for this timer
        if (timers[timerIndex].interval) {
            clearInterval(timers[timerIndex].interval);
        }
        
        // Remove the timer's HTML element from the DOM
        timers[timerIndex].element.remove();
        
        // Remove the timer from the 'timers' array
        timers.splice(timerIndex, 1);

        Swal.fire(
            'Deleted!',
            'Your timer has been deleted.',
            'success'
        );
    }
}

function startCountdown(timerId) {
    // Find the timer object in the 'timers' array
    const timer = timers.find(t => t.id === timerId);
    if (!timer) return; // Timer not found
    
    // Get elements specific to this timer
    const timerElement = timer.element;
    const datetimeInput = timerElement.querySelector('.datetime');
    const messageElement = timerElement.querySelector('.message');
    const errorBox = timerElement.querySelector('.error-box'); // Get the error box
    
    // Clear any existing countdown interval for this timer before starting a new one
    if (timer.interval) {
        clearInterval(timer.interval);
    }
    hideMessage(messageElement); // Hide previous completion messages
    hideError(errorBox); // Hide previous validation errors

    // Get the target datetime from the input and current time
    const selectedDatetime = new Date(datetimeInput.value).getTime();
    const currentTime = new Date().getTime();
    
    // Validate the input date and time
    if (!datetimeInput.value) {
        showError(errorBox, 'Please select a date and time.');
        return;
    }
    
    if (isNaN(selectedDatetime)) {
        showError(errorBox, 'Invalid date and time selected. Please use the calendar icon.');
        return;
    }

    if (selectedDatetime <= currentTime) {
        showError(errorBox, 'Please select a future date and time.');
        return;
    }
    
    // Immediately update the countdown display once, then set the interval
    updateCountdown(timer, selectedDatetime);
    timer.interval = setInterval(() => updateCountdown(timer, selectedDatetime), 1000);
}

function updateCountdown(timer, targetTime) {
    // Get elements specific to this timer
    const timerElement = timer.element;
    const daysElement = timerElement.querySelector('.days');
    const hoursElement = timerElement.querySelector('.hours');
    const minutesElement = timerElement.querySelector('.minutes');
    const secondsElement = timerElement.querySelector('.seconds');
    const messageElement = timerElement.querySelector('.message');
    
    const currentTime = new Date().getTime();
    const timeRemaining = targetTime - currentTime;
    
    // If countdown has ended
    if (timeRemaining <= 0) {
        clearInterval(timer.interval); // Stop the countdown
        timer.interval = null; // Clear the interval reference
        resetCountdownDisplay(daysElement, hoursElement, minutesElement, secondsElement); // Reset numbers to 00
        
        const timerName = timerElement.querySelector('.timer-name').value || 'Timer'; // Get the timer name
        showMessage(messageElement, `${timerName} Complete! 🎉`, 'success'); // Show completion message
        playCompletionSound(); // Play sound
        return;
    }
    
    // Calculate time units
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    // Update display with formatted time
    daysElement.textContent = formatTime(days);
    hoursElement.textContent = formatTime(hours);
    minutesElement.textContent = formatTime(minutes);
    secondsElement.textContent = formatTime(seconds);
    
    // Add animation to the seconds element
    // To animate all numbers, call animateNumber for each element:
    animateNumber(secondsElement); 
}

// Helper function to format time (add leading zero)
function formatTime(time) {
    return time < 10 ? `0${time}` : time;
}

// Helper function to reset countdown display to '00'
function resetCountdownDisplay(daysEl, hoursEl, minutesEl, secondsEl) {
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minutesEl.textContent = '00';
    secondsEl.textContent = '00';
}

// Helper function to display messages (for completion messages)
function showMessage(element, text, type) {
    element.textContent = text;
    // Remove previous type classes before adding the new one
    element.classList.remove('success', 'error'); 
    element.classList.add(type); // 'success'
    element.classList.add('show'); // Make the message visible and trigger slide-in animation
}

// Helper function to hide messages
function hideMessage(element) {
    element.classList.remove('show', 'success', 'error');
    element.textContent = '';
}

// Helper function to display error in the new error-box
function showError(element, text) {
    element.textContent = text;
    element.classList.add('show');
}

// Helper function to hide error in the new error-box
function hideError(element) {
    element.classList.remove('show');
    element.textContent = '';
}

// Helper function for number animation (triggering CSS keyframe)
function animateNumber(element) {
    // Remove the 'animated' class to reset the animation
    element.classList.remove('animated');
    // Force a reflow/re-render to restart the CSS animation
    void element.offsetWidth; // This is a common trick for force reflow
    // Add the 'animated' class back to trigger the CSS animation
    element.classList.add('animated');
}

// Function to play a completion sound
// This function is now simplified as the audio object is global and preloaded
function playCompletionSound() {
    completionAudio.currentTime = 0; // Rewind to start in case it was already playing
    completionAudio.play().catch(e => {
        // Catch and log any errors, typically related to browser autoplay policies
        console.error("Audio playback failed:", e);
        // You could also show a user-friendly message here, e.g.:
        // Swal.fire('Sound Blocked', 'Your browser prevented the completion sound from playing automatically. Please enable media autoplay for this site.', 'info');
    });
}